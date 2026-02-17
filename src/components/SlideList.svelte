<script lang="ts">
  import { tick } from 'svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import Plus from '@lucide/svelte/icons/plus';
  import Copy from '@lucide/svelte/icons/copy';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import Trash from '@lucide/svelte/icons/trash';
  import SlideThumbnail from './SlideThumbnail.svelte';
  import SlideListDropSlot from './SlideListDropSlot.svelte';
  import SidebarStickyHeader from './SidebarStickyHeader.svelte';
  import DeleteSlideButton from './DeleteSlideButton.svelte';
  import DeckItemContent from './DeckItemContent.svelte';
  import DeckList from './DeckList.svelte';
  import { ContextMenu } from 'bits-ui';
  import {
    slides,
    currentSlideIndex,
    addSlide,
    softDeleteSlide,
    duplicateSlide,
    reorderSlide,
    moveSlideToDeck,
    deckList,
    currentDeckFile,
  } from '../lib';
  import { keyboardClick } from '../lib/keyboard';

  const cmContent = 'z-50 min-w-[140px] rounded-md border border-border bg-popover shadow-md';
  const cmItem = 'flex items-center gap-2 rounded-sm m-1 px-2 py-1.5 text-sm cursor-pointer outline-none hover:bg-accent data-[highlighted]:bg-accent';
  const cmSeparator = 'my-1 h-px bg-border';

  let hasOtherDecks = $derived(
    $deckList.some((d) => d.filename !== $currentDeckFile)
  );

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

<SidebarStickyHeader>
  {#snippet children()}
    <Button class="mx-2 shadow-s text-foreground border-border hover:bg-muted transition-colors w-full" variant="ghost" size="sm" onclick={() => addSlide()}>
      {#snippet children()}
        <Plus class="size-4" />
        Add slide
      {/snippet}
    </Button>
  {/snippet}
</SidebarStickyHeader>

<div class="px-3 py-4 flex flex-col gap-6 bg-muted/15 inset-shadow-sm">
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="bg-muted/5 space-y-0 flex flex-col gap-2" data-slide-list bind:this={listContainer} ondrop={handleDrop} ondragover={(e) => e.preventDefault()}>
    {#each allSlides as slide, i}
      <!-- Drop indicator before this item -->
      {#if dropSlot === i}
        <SlideListDropSlot />
      {/if}

      <ContextMenu.Root>
        <ContextMenu.Trigger>
          {#snippet child({ props })}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              {...props}
              data-slide-thumb={i}
              class="w-full text-left px-2 py-2 rounded-md text-sm transition-colors cursor-grab group relative select-none
                {i === idx ? 'ring-1 ring-border bg-muted' : 'hover:bg-muted'}
                {dragIndex === i ? 'opacity-30' : ''}"
              onclick={() => selectSlide(i)}
              onkeydown={keyboardClick(() => selectSlide(i))}
              role="button"
              tabindex="0"
              draggable="true"
              ondragstart={(e) => handleDragStart(e, i)}
              ondragover={(e) => handleDragOver(e, i)}
              ondragleave={handleDragLeave}
              ondragend={handleDragEnd}
            >
              <!-- to delete the slide -->            
              <div class="relative">
                <SlideThumbnail {slide} class="rounded-xs {i === idx ? 'shadow-md' : 'shadow-sm'}" />
                <DeleteSlideButton slideId={slide.id} class="-top-1 -right-1" />
              </div>
            </div>
          {/snippet}
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Content class={cmContent}>
            <ContextMenu.Item
              class={cmItem}
              onSelect={() => duplicateSlide(i)}
            >
              <Copy class="size-4 text-muted-foreground" />
              Duplicate
            </ContextMenu.Item>
            {#if hasOtherDecks}
              <ContextMenu.Sub>
                <ContextMenu.SubTrigger class={cmItem}>
                  <ArrowRight class="size-4 text-muted-foreground" />
                  Move to…
                </ContextMenu.SubTrigger>
                <ContextMenu.SubContent class={cmContent}>
                  <DeckList
                    decks={$deckList}
                    includeCurrentDeck={false}
                    currentDeckFile={$currentDeckFile}
                  >
                    {#snippet children({ deck })}
                      <ContextMenu.Item
                        class="{cmItem} flex flex-col items-stretch gap-0.5"
                        onSelect={() => moveSlideToDeck(slide.id, deck.filename)}
                      >
                        <DeckItemContent deck={deck} />
                      </ContextMenu.Item>
                    {/snippet}
                  </DeckList>
                </ContextMenu.SubContent>
              </ContextMenu.Sub>
            {/if}
            <ContextMenu.Separator class={cmSeparator} />
            <ContextMenu.Item
              class="{cmItem} group hover:text-destructive hover:bg-destructive/10 data-[highlighted]:bg-destructive/10"
              onSelect={() => softDeleteSlide(slide.id)}
            >
              <Trash class="size-4 text-muted-foreground group-hover:text-destructive" />
              Delete
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu.Root>
    {/each}

    <!-- Drop indicator after the last item -->
    {#if dropSlot === allSlides.length}
      <SlideListDropSlot />
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
