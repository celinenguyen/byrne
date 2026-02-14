<script lang="ts">
  import { onMount, tick } from 'svelte';
  import Toolbar from './Toolbar.svelte';
  import SlideList from './SlideList.svelte';
  import SlideView from './SlideView.svelte';
  import SlideDetails from './SlideDetails.svelte';
  import PresentView from './PresentView.svelte';
  import {
    loadDeck,
    viewMode,
    currentSlide,
    slides,
    currentSlideIndex,
    navigateSlide,
    duplicateSlide,
    softDeleteSlide,
    undoDelete,
    pendingDelete,
    detailsOpen,
    slideListOpen,
  } from '../lib/store';

  let mode = $derived($viewMode);
  let slide = $derived($currentSlide);
  let allSlides = $derived($slides);
  let pending = $derived($pendingDelete);

  // Pane widths (percentages)
  let leftWidth = $state(15);
  let rightWidth = $state(25);

  // Collapsible details panel
  let isDetailsOpen = $derived($detailsOpen);

  // Resizing state
  let resizing = $state<'left' | 'right' | null>(null);

  function startResize(pane: 'left' | 'right') {
    resizing = pane;
  }

  function onMouseMove(e: MouseEvent) {
    if (!resizing) return;
    const pct = (e.clientX / window.innerWidth) * 100;
    if (resizing === 'left') {
      leftWidth = Math.max(15, Math.min(40, pct));
    } else {
      rightWidth = Math.max(20, Math.min(45, 100 - pct));
    }
  }

  function onMouseUp() {
    resizing = null;
  }

  // Scroll-to-advance: IntersectionObserver (only reacts to real user scrolls)
  let scrollContainer: HTMLDivElement | undefined = $state();
  let suppressObserver = false;
  let userIsScrolling = false;
  let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

  function onContainerScroll() {
    if (suppressObserver) return;
    userIsScrolling = true;
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => { userIsScrolling = false; }, 150);
  }

  // Track per-slide visibility ratios so we can pick the most-visible one
  let visibilityMap = new Map<number, number>();

  function setupObserver() {
    if (!scrollContainer) return;
    const targets = scrollContainer.querySelectorAll('[data-slide-index]');
    visibilityMap.clear();
    const observer = new IntersectionObserver(
      (entries) => {
        if (suppressObserver || !userIsScrolling) return;
        // Update visibility ratios for each reported entry
        for (const entry of entries) {
          const idx = Number((entry.target as HTMLElement).dataset.slideIndex);
          if (!isNaN(idx)) {
            visibilityMap.set(idx, entry.intersectionRatio);
          }
        }
        // Pick the slide with the highest visibility ratio
        let bestIdx = -1;
        let bestRatio = 0;
        for (const [idx, ratio] of visibilityMap) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestIdx = idx;
          }
        }
        if (bestIdx >= 0 && bestRatio >= 0.5 && bestIdx !== $currentSlideIndex) {
          observerDriven = true;
          currentSlideIndex.set(bestIdx);
        }
      },
      { root: scrollContainer, threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    targets.forEach((t) => observer.observe(t));
    return observer;
  }

  let observer: IntersectionObserver | undefined;

  // Re-setup observer when slides change
  $effect(() => {
    // Track dependencies
    allSlides;
    scrollContainer;
    // Cleanup previous
    if (observer) observer.disconnect();
    // Wait for DOM
    tick().then(() => {
      observer = setupObserver();
    });
  });

  // Scroll to slide — only called for explicit user actions (sidebar click, keyboard nav)
  // NOT called when the observer advances the index via scrolling.
  let observerDriven = false;

  function scrollToSlide(index: number) {
    if (!scrollContainer) return;
    const target = scrollContainer.querySelector(`[data-slide-index="${index}"]`);
    if (!target) return;
    suppressObserver = true;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      suppressObserver = false;
    }, 600);
  }

  // Watch for currentSlideIndex changes to scroll into view (skip observer-driven ones)
  let prevIndex = $state(-1);
  $effect(() => {
    const idx = $currentSlideIndex;
    if (idx !== prevIndex && mode === 'edit') {
      prevIndex = idx;
      if (observerDriven) {
        // Observer already scrolled here — don't fight it
        observerDriven = false;
      } else {
        tick().then(() => scrollToSlide(idx));
      }
    }
  });

  // Slide clipboard for Cmd+C / Cmd+V
  let copiedSlideIndex: number | null = null;

  function isInsideDetailsPanel(el: EventTarget | null): boolean {
    if (!el || !(el instanceof HTMLElement)) return false;
    return !!el.closest('[data-details-panel]');
  }

  function onKeyDown(e: KeyboardEvent) {
    const mode = $viewMode;

    // In edit: arrow keys navigate slides unless in a form field
    if (mode === 'edit') {
      if (isInsideDetailsPanel(e.target)) return;

      // Delete / Backspace: soft-delete current slide
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const s = $currentSlide;
        if (s) {
          e.preventDefault();
          softDeleteSlide(s.id);
        }
        return;
      }
      // Cmd+Z: undo pending delete (otherwise let browser handle for text undo)
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (pending) {
          e.preventDefault();
          undoDelete();
          return;
        }
      }
      // Cmd+C: copy current slide
      if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        copiedSlideIndex = $currentSlideIndex;
        return;
      }
      // Cmd+V: paste (duplicate) copied slide after current
      if ((e.metaKey || e.ctrlKey) && e.key === 'v' && copiedSlideIndex !== null) {
        e.preventDefault();
        duplicateSlide(copiedSlideIndex);
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        navigateSlide('next');
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        navigateSlide('prev');
      }
    }

    // In present: always handle nav + escape
    if (mode === 'present') {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        navigateSlide('next');
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        navigateSlide('prev');
      } else if (e.key === 'Escape') {
        viewMode.set('edit');
      }
    }
  }

  onMount(() => {
    loadDeck();
  });
</script>

<svelte:window onkeydown={onKeyDown} onmousemove={onMouseMove} onmouseup={onMouseUp} />

<div class="h-screen flex flex-col">
  {#if mode !== 'present'}
    <Toolbar />
  {/if}

  <div class="flex-1 min-h-0 flex">
    {#if mode === 'edit'}
      <!-- Left: Slide thumbnails -->
      {#if $slideListOpen}
        <div class="h-full overflow-y-auto border-r border-border bg-muted/30" style="width: {leftWidth}%">
          <SlideList />
        </div>
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="w-1 cursor-col-resize hover:bg-primary/20 active:bg-primary/30 shrink-0"
          onmousedown={() => startResize('left')}
        ></div>
      {/if}

      <!-- Center: Scrollable slide list -->
      <div class="h-full flex-1 min-w-0 overflow-y-auto m-4 p-1 space-y-6" bind:this={scrollContainer} onscroll={onContainerScroll}>
        {#each allSlides as s, i}
          <div
            role="button"
            tabindex="0"
            data-slide-index={i}
            class="w-full max-w-4xl mx-auto block cursor-pointer rounded-md transition-shadow
              {i === $currentSlideIndex ? 'bg-stone-100' : 'hover:bg-stone-100/50'}"
            onclick={() => currentSlideIndex.set(i)}
            onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); currentSlideIndex.set(i); } }}
          >
            <SlideView slide={s} interactive={i === $currentSlideIndex} />
          </div>
        {/each}
        {#if allSlides.length === 0}
          <div class="text-muted-foreground text-sm text-center mt-20">No slides yet. Add a slide to get started.</div>
        {/if}
      </div>

      <!-- Right: Collapsible SlideDetails -->
      {#if isDetailsOpen}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="w-1 cursor-col-resize hover:bg-primary/20 active:bg-primary/30 shrink-0"
          onmousedown={() => startResize('right')}
        ></div>
        <div class="h-full overflow-y-auto border-l border-border" style="width: {rightWidth}%" data-details-panel>
          <SlideDetails slide={slide} onClose={() => { detailsOpen.set(false); }} />
        </div>
      {/if}

    {:else if mode === 'present'}
      <PresentView
        slide={slide}
        currentIndex={$currentSlideIndex}
        slideCount={allSlides.length}
      />
    {/if}
  </div>
</div>
