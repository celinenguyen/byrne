<script lang="ts">
  import { tick } from 'svelte';
  import type { PointComment } from '../lib/types';
  import { openCommentPopoverId } from '../lib/store';
  import PointCommentPopover from './PointCommentPopover.svelte';

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
  let dotEl: HTMLButtonElement | undefined = $state();
  let popoverEl: HTMLDivElement | undefined = $state();
  let textareaEl: HTMLTextAreaElement | undefined = $state();

  // Popover state: click-to-edit (store-driven) in edit mode, hover for read-only in all modes
  let isOpen = $derived($openCommentPopoverId === comment.id);
  let hoverOpen = $state(false);
  let popoverVisible = $derived(isOpen || (hoverOpen && !!comment.text));
  let editable = $derived(mode === 'edit' && isOpen);

  // Track open→close transitions to save/delete
  let prevIsOpen = false;
  $effect(() => {
    const open = $openCommentPopoverId === comment.id;
    if (!prevIsOpen && open && mode === 'edit') {
      // Opening — initialize text and focus textarea
      editText = comment.text;
      tick().then(() => textareaEl?.focus());
    }
    if (prevIsOpen && !open && mode === 'edit') {
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

  function togglePopover() {
    if (isOpen) {
      openCommentPopoverId.set(null);
    } else {
      openCommentPopoverId.set(comment.id);
    }
  }

  function handleDotClick(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    togglePopover();
  }

  function handleMouseEnter() {
    if (!isOpen) hoverOpen = true;
  }

  function handleMouseLeave() {
    // Don't dismiss hover if pinned open via click
    if (!isOpen) hoverOpen = false;
  }

  // Click-outside: close pinned popover in any mode
  function handleClickOutside(e: MouseEvent) {
    if (!isOpen) return;
    const target = e.target as Node;
    if (dotEl?.contains(target) || popoverEl?.contains(target)) return;
    openCommentPopoverId.set(null);
  }

  function handlePopoverKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      e.preventDefault();
      openCommentPopoverId.set(null);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.stopPropagation();
      e.preventDefault();
      openCommentPopoverId.set(null);
    } else if (e.key === 'Delete') {
      e.stopPropagation();
      e.preventDefault();
      editText = '';
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

<button
  type="button"
  bind:this={dotEl}
  class="absolute z-20 flex items-center justify-center w-[1.6em] h-[1.6em] rounded-full select-none pointer-events-auto transition-[backdrop-filter,background-color] duration-150 -translate-x-1/2 -translate-y-1/2 border-0 p-0 {dragging ? 'cursor-grabbing backdrop-blur-sm' : 'cursor-pointer'}"
  style:left="{displayX * 100}%"
  style:top="{displayY * 100}%"
  style:background={dragging ? 'color-mix(in oklch, var(--slide-color-accent, #c75000), transparent 30%)' : 'var(--slide-color-accent, #c75000)'}
  onclick={handleDotClick}
  onmousedown={handleMouseDown}
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
  aria-label={comment.text ? `Comment: ${comment.text.slice(0, 50)}${comment.text.length > 50 ? "…" : ""}` : 'Add comment'}
>
  <span class="text-white text-[1em] leading-none">✴︎</span>
</button>

{#if popoverVisible}
  <PointCommentPopover
    text={comment.text}
    {editable}
    x={displayX}
    y={displayY}
    {slotEl}
    {editText}
    onEditTextChange={(v) => { editText = v; }}
    onKeydown={handlePopoverKeydown}
    bind:textareaEl
    bind:popoverEl
  />
{/if}
