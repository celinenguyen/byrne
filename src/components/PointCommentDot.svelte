<script lang="ts">
  import { tick } from 'svelte';
  import { fade } from 'svelte/transition';
  import type { PointComment } from '../lib/types';
  import { openCommentPopoverId } from '../lib/store';
  import MarkdownText from './layouts/MarkdownText.svelte';

  interface Props {
    comment: PointComment;
    mode: 'edit' | 'preview' | 'present';
    onUpdate: (text: string) => void;
    onDelete: () => void;
    onMove: (x: number, y: number) => void;
    slotEl: HTMLElement;
  }
  let { comment, mode, onUpdate, onDelete, onMove, slotEl }: Props = $props();

  let editText = $state('');
  let dotEl: HTMLDivElement | undefined = $state();
  let popoverEl: HTMLDivElement | undefined = $state();
  let textareaEl: HTMLTextAreaElement | undefined = $state();

  // Popover state: store-driven for edit/preview, local hover for present
  let isOpen = $derived($openCommentPopoverId === comment.id);
  let hoverOpen = $state(false);
  let popoverVisible = $derived(mode === 'present' ? hoverOpen : isOpen);
  let editable = $derived(mode !== 'present');

  // Track open→close transitions to save/delete
  let prevIsOpen = false;
  $effect(() => {
    const open = $openCommentPopoverId === comment.id;
    if (!prevIsOpen && open && mode !== 'present') {
      // Opening — initialize text and focus textarea
      editText = comment.text;
      tick().then(() => textareaEl?.focus());
    }
    if (prevIsOpen && !open && mode !== 'present') {
      // Closing — save or delete empty
      const trimmed = editText.trim();
      if (!trimmed) {
        onDelete();
      } else if (trimmed !== comment.text) {
        onUpdate(trimmed);
      }
    }
    prevIsOpen = open;
  });

  function handleDotClick(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (mode === 'present') return;
    if (isOpen) {
      openCommentPopoverId.set(null);
    } else {
      openCommentPopoverId.set(comment.id);
    }
  }

  function handleMouseEnter() {
    if (mode === 'present' && comment.text) {
      hoverOpen = true;
    }
  }

  function handleMouseLeave() {
    if (mode === 'present') {
      hoverOpen = false;
    }
  }

  // Click-outside: only the dot with open popover responds
  function handleClickOutside(e: MouseEvent) {
    if (!isOpen || mode === 'present') return;
    const target = e.target as Node;
    if (dotEl?.contains(target) || popoverEl?.contains(target)) return;
    openCommentPopoverId.set(null);
  }

  function handlePopoverKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' || e.key === 'Enter') {
      e.stopPropagation();
      e.preventDefault();
      openCommentPopoverId.set(null);
    }
  }

  // --- Cmd+Drag to move ---
  let dragging = $state(false);
  let dragX = $state(comment.x);
  let dragY = $state(comment.y);

  function handleMouseDown(e: MouseEvent) {
    if (mode === 'present') return;
    if (!(e.metaKey || e.ctrlKey)) return; // only drag with Cmd held
    e.stopPropagation();
    e.preventDefault();
    dragging = true;
    dragX = comment.x;
    dragY = comment.y;
    // Close any open popover when starting a drag
    if ($openCommentPopoverId) openCommentPopoverId.set(null);
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
  }

  function handleDragMove(e: MouseEvent) {
    const rect = slotEl.getBoundingClientRect();
    dragX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    dragY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
  }

  function handleDragEnd() {
    window.removeEventListener('mousemove', handleDragMove);
    window.removeEventListener('mouseup', handleDragEnd);
    dragging = false;
    if (dragX !== comment.x || dragY !== comment.y) {
      onMove(dragX, dragY);
    }
  }

  let displayX = $derived(dragging ? dragX : comment.x);
  let displayY = $derived(dragging ? dragY : comment.y);
</script>

<svelte:window onclick={handleClickOutside} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={dotEl}
  class="absolute z-20 flex items-center justify-center w-[1.8em] h-[1.8em] rounded-full select-none pointer-events-auto transition-[backdrop-filter,background-color] duration-150 -translate-x-1/2 -translate-y-1/2 {dragging ? 'cursor-grabbing backdrop-blur-sm' : 'cursor-pointer'}"
  style:left="{displayX * 100}%"
  style:top="{displayY * 100}%"
  style:background={dragging ? 'color-mix(in oklch, var(--slide-color-accent, #c75000), transparent 30%)' : 'var(--slide-color-accent, #c75000)'}
  onclick={handleDotClick}
  onmousedown={handleMouseDown}
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
>
  <span class="text-white text-[0.6em] leading-none">✴︎</span>
</div>

{#if popoverVisible}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    bind:this={popoverEl}
    class="absolute z-30 min-w-[200px] max-w-[280px] bg-white border border-stone-200 rounded-md shadow-lg text-xs pointer-events-auto -translate-x-1/2"
    style:left="{displayX * 100}%"
    style:top="calc({displayY * 100}% + 1em)"
    onclick={(e) => e.stopPropagation()}
    onkeydown={handlePopoverKeydown}
    transition:fade={{ duration: 120 }}
  >
    {#if editable}
      <div class="p-2">
        <textarea
          bind:this={textareaEl}
          bind:value={editText}
          class="w-full min-h-[60px] text-xs border border-stone-200 rounded p-1.5 resize-y focus:outline-none focus:border-stone-400"
          placeholder="Write a comment..."
        ></textarea>
        <div class="flex justify-end mt-1">
          <button
            class="text-[10px] text-red-500 hover:text-red-700 px-1.5 py-0.5"
            onclick={(e) => { e.stopPropagation(); editText = ''; openCommentPopoverId.set(null); }}
          >Delete</button>
        </div>
      </div>
    {:else}
      <div class="p-2 prose prose-xs max-w-none text-stone-700">
        <MarkdownText text={comment.text} inline />
      </div>
    {/if}
  </div>
{/if}
