<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { PointComment } from '../lib/types';
  import { openCommentPopoverId } from '../lib/store';
  import { nanoid } from 'nanoid';
  import PointCommentDot from './PointCommentDot.svelte';

  interface Props {
    comments: PointComment[];
    slotIndex: number;
    slideId: string;
    mode: 'edit' | 'preview' | 'present';
    slotEl: HTMLElement;
    containerEl: HTMLElement;
    onCommentsChange: (comments: PointComment[]) => void;
  }
  let { comments, slotIndex, slideId, mode, slotEl, containerEl, onCommentsChange }: Props = $props();

  let overlayStyle = $state('');
  let resizeTick = $state(0);

  // Mouse tracking for Cmd+C comment placement
  let hovered = false;
  let lastMouseX = 0;
  let lastMouseY = 0;

  function updatePosition() {
    if (!slotEl || !containerEl) return;
    const elRect = slotEl.getBoundingClientRect();
    const cRect = containerEl.getBoundingClientRect();
    const top = elRect.top - cRect.top;
    const left = elRect.left - cRect.left;
    overlayStyle = `top:${top}px;left:${left}px;width:${elRect.width}px;height:${elRect.height}px`;
  }

  let resizeObserver: ResizeObserver | null = null;

  $effect(() => {
    resizeObserver?.disconnect();
    if (!slotEl) return;
    resizeObserver = new ResizeObserver(() => {
      resizeTick++;
      updatePosition();
    });
    resizeObserver.observe(slotEl);
    updatePosition();
  });

  $effect(() => {
    comments;
    resizeTick;
    updatePosition();
  });

  // Mouse tracking + Cmd+C listener on slotEl
  $effect(() => {
    if (!slotEl || mode === 'present') return;

    function handleMouseMove(e: MouseEvent) {
      hovered = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    }
    function handleMouseLeave() {
      hovered = false;
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (!hovered) return;
      if (e.key !== 'c' || !(e.metaKey || e.ctrlKey) || e.shiftKey) return;
      // Don't intercept if typing in a text field
      if (e.target instanceof HTMLElement && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;

      e.preventDefault();
      e.stopPropagation();

      const rect = slotEl.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (lastMouseX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (lastMouseY - rect.top) / rect.height));
      const id = nanoid();

      const allComments = [...comments, { id, slotIndex, x, y, text: '' }];
      onCommentsChange(allComments);
      // Open the new comment's popover
      openCommentPopoverId.set(id);
    }

    slotEl.addEventListener('mousemove', handleMouseMove);
    slotEl.addEventListener('mouseleave', handleMouseLeave);
    // Capture phase so we intercept before App.svelte's Cmd+C handler
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      slotEl.removeEventListener('mousemove', handleMouseMove);
      slotEl.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  });

  onDestroy(() => resizeObserver?.disconnect());

  let slotComments = $derived(comments.filter((c) => c.slotIndex === slotIndex));

  function handleCommentUpdate(commentId: string, text: string) {
    const updated = comments.map((c) => (c.id === commentId ? { ...c, text } : c));
    onCommentsChange(updated);
  }

  function handleCommentMove(commentId: string, x: number, y: number) {
    const updated = comments.map((c) => (c.id === commentId ? { ...c, x, y } : c));
    onCommentsChange(updated);
  }

  function handleCommentDelete(commentId: string) {
    const filtered = comments.filter((c) => c.id !== commentId);
    onCommentsChange(filtered);
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="absolute overflow-visible z-10"
  style="{overlayStyle}; pointer-events: none;"
>
  {#each slotComments as comment, i (comment.id)}
    <PointCommentDot
      {comment}
      number={i + 1}
      {mode}
      {slotEl}
      onUpdate={(text) => handleCommentUpdate(comment.id, text)}
      onDelete={() => handleCommentDelete(comment.id)}
      onMove={(x, y) => handleCommentMove(comment.id, x, y)}
    />
  {/each}
</div>
