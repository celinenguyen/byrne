<script lang="ts">
  import { tick } from 'svelte';
  import Button from './ui/Button.svelte';
  import SlideThumbnail from './SlideThumbnail.svelte';
  import { ContextMenu } from 'bits-ui';
  import {
    slides,
    currentSlideIndex,
    addSlide,
    deleteSlide,
    duplicateSlide,
    reorderSlide,
  } from '../lib/store';

  let allSlides = $derived($slides);
  let idx = $derived($currentSlideIndex);

  let listContainer: HTMLDivElement | undefined = $state();

  // Scroll the active thumbnail into view when currentSlideIndex changes
  $effect(() => {
    const i = idx;
    if (!listContainer) return;
    tick().then(() => {
      const el = listContainer?.querySelector(`[data-slide-thumb="${i}"]`);
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  });

  function selectSlide(i: number) {
    currentSlideIndex.set(i);
  }

  // Drag-to-reorder state
  // dropSlot represents the gap *before* that index where the item would land.
  // e.g. dropSlot=0 means "insert before item 0", dropSlot=2 means "insert before item 2" (after item 1).
  // dropSlot=allSlides.length means "insert at the end".
  let dragIndex = $state<number | null>(null);
  let dropSlot = $state<number | null>(null);

  function handleDragStart(e: DragEvent, i: number) {
    dragIndex = i;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(i));
    }
  }

  // Determine which gap the cursor is closest to based on vertical position within the item.
  function handleDragOver(e: DragEvent, i: number) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    if (dragIndex === null) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const slot = e.clientY < midY ? i : i + 1;

    // Don't show indicator right before or after the dragged item (no-op positions)
    if (slot === dragIndex || slot === dragIndex + 1) {
      dropSlot = null;
    } else {
      dropSlot = slot;
    }
  }

  function handleDragLeave(e: DragEvent) {
    // Only clear if we're actually leaving the list, not entering a child
    const related = e.relatedTarget as HTMLElement | null;
    const list = (e.currentTarget as HTMLElement).closest('[data-slide-list]');
    if (!related || !list?.contains(related)) {
      dropSlot = null;
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    if (dragIndex !== null && dropSlot !== null) {
      const slide = allSlides[dragIndex];
      if (slide) {
        // Convert gap-slot to the final target index after removal
        const targetIndex = dropSlot > dragIndex ? dropSlot - 1 : dropSlot;
        reorderSlide(slide.id, targetIndex);
        currentSlideIndex.set(targetIndex);
      }
    }
    dragIndex = null;
    dropSlot = null;
  }

  function handleDragEnd() {
    dragIndex = null;
    dropSlot = null;
  }

  // Handle drops on the trailing zone (after last item)
  function handleTailDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    if (dragIndex === null) return;
    const slot = allSlides.length;
    dropSlot = slot === dragIndex + 1 ? null : slot;
  }
</script>

<div class="p-3 space-y-2">
  <Button variant="outline" size="sm" class="w-full" onclick={() => addSlide()}>
    {#snippet children()}
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
      Add Slide
    {/snippet}
  </Button>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="space-y-0" data-slide-list bind:this={listContainer} ondrop={handleDrop} ondragover={(e) => e.preventDefault()}>
    {#each allSlides as slide, i}
      <!-- Drop indicator before this item -->
      {#if dropSlot === i}
        <div class="h-8 mx-1 my-1 rounded-md border-2 border-dashed border-primary/40 bg-primary/5 transition-all"></div>
      {/if}

      <ContextMenu.Root>
        <ContextMenu.Trigger>
          {#snippet child({ props })}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              {...props}
              data-slide-thumb={i}
              class="w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors cursor-grab group relative select-none
                {i === idx ? 'ring-2 ring-primary' : 'hover:bg-accent'}
                {dragIndex === i ? 'opacity-30' : ''}"
              onclick={() => selectSlide(i)}
              onkeydown={(e) => { if (e.key === 'Enter') selectSlide(i); }}
              role="button"
              tabindex="0"
              draggable="true"
              ondragstart={(e) => handleDragStart(e, i)}
              ondragover={(e) => handleDragOver(e, i)}
              ondragleave={handleDragLeave}
              ondragend={handleDragEnd}
            >
              <div class="relative">
                <SlideThumbnail {slide} />
                <div class="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] font-medium px-1 py-0.5 rounded leading-tight">
                  {i + 1}
                </div>
                <button
                  class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 rounded bg-black/50 text-white hover:bg-destructive/80 cursor-pointer transition-opacity"
                  onclick={(e) => { e.stopPropagation(); deleteSlide(slide.id); }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
            </div>
          {/snippet}
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Content class="z-50 min-w-[140px] rounded-md border border-border bg-popover p-1 shadow-md">
            <ContextMenu.Item
              class="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer outline-none hover:bg-accent data-[highlighted]:bg-accent"
              onSelect={() => duplicateSlide(i)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              Duplicate
            </ContextMenu.Item>
            <ContextMenu.Separator class="my-1 h-px bg-border" />
            <ContextMenu.Item
              class="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer outline-none text-destructive hover:bg-destructive/10 data-[highlighted]:bg-destructive/10"
              onSelect={() => deleteSlide(slide.id)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              Delete
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu.Root>
    {/each}

    <!-- Drop indicator after the last item -->
    {#if dropSlot === allSlides.length}
      <div class="h-8 mx-1 my-1 rounded-md border-2 border-dashed border-primary/40 bg-primary/5 transition-all"></div>
    {/if}

    <!-- Trailing drop zone so you can drag to end of list -->
    {#if dragIndex !== null}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="h-8"
        ondragover={handleTailDragOver}
      ></div>
    {/if}
  </div>
</div>
