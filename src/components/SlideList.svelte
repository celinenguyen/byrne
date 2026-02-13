<script lang="ts">
  import Button from './ui/Button.svelte';
  import {
    slides,
    currentSlideIndex,
    addSlide,
    deleteSlide,
    reorderSlide,
  } from '../lib/store';
  import { getFirstTextKey } from './layouts/registry';

  let allSlides = $derived($slides);
  let idx = $derived($currentSlideIndex);

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
  <div class="space-y-0" data-slide-list ondrop={handleDrop} ondragover={(e) => e.preventDefault()}>
    {#each allSlides as slide, i}
      {@const firstTextKey = getFirstTextKey(slide.layout)}
      <!-- Drop indicator before this item -->
      {#if dropSlot === i}
        <div class="h-8 mx-1 my-1 rounded-md border-2 border-dashed border-primary/40 bg-primary/5 transition-all"></div>
      {/if}

      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="w-full text-left px-3 py-2 rounded-md text-sm transition-colors cursor-grab group relative select-none
          {i === idx ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}
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
        <div class="flex items-center gap-2">
          <span class="text-xs opacity-30 cursor-grab">⠿</span>
          <span class="text-xs opacity-50 tabular-nums w-4">{i + 1}</span>
          <span class="font-medium truncate">{slide.layout}</span>
        </div>
        {#if firstTextKey && slide.data.text?.[firstTextKey]}
          <p class="mt-0.5 text-xs truncate opacity-60 ml-10">
            {slide.data.text[firstTextKey].slice(0, 50)}
          </p>
        {/if}
        <button
          class="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 cursor-pointer"
          onclick={(e) => { e.stopPropagation(); deleteSlide(slide.id); }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
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
