<script lang="ts">
  import { onMount, tick } from 'svelte';
  import Toolbar from './Toolbar.svelte';
  import SlideList from './SlideList.svelte';
  import SlideView from './SlideView.svelte';
  import SlideDetails from './SlideDetails.svelte';
  import {
    loadDeck,
    viewMode,
    currentSlide,
    slides,
    currentSlideIndex,
    navigateSlide,
    duplicateSlide,
  } from '../lib/store';

  let mode = $derived($viewMode);
  let slide = $derived($currentSlide);
  let allSlides = $derived($slides);

  // Pane widths (percentages)
  let leftWidth = $state(20);
  let rightWidth = $state(30);

  // Collapsible details panel
  let detailsOpen = $state(true);

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

  // Scroll-to-advance: IntersectionObserver
  let scrollContainer: HTMLDivElement | undefined = $state();
  let suppressObserver = false;

  // Track per-slide visibility ratios so we can pick the most-visible one
  let visibilityMap = new Map<number, number>();

  function setupObserver() {
    if (!scrollContainer) return;
    const targets = scrollContainer.querySelectorAll('[data-slide-index]');
    visibilityMap.clear();
    const observer = new IntersectionObserver(
      (entries) => {
        if (suppressObserver) return;
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

  function isFormElement(el: EventTarget | null): boolean {
    if (!el || !(el instanceof HTMLElement)) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }

  function onKeyDown(e: KeyboardEvent) {
    const mode = $viewMode;

    // In edit: arrow keys navigate slides unless in a form field
    if (mode === 'edit') {
      if (isFormElement(e.target)) return;

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
      <div class="h-full overflow-y-auto border-r border-border bg-muted/30" style="width: {leftWidth}%">
        <SlideList />
      </div>
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="w-1 cursor-col-resize hover:bg-primary/20 active:bg-primary/30 shrink-0"
        onmousedown={() => startResize('left')}
      ></div>

      <!-- Center: Scrollable slide list -->
      <div class="h-full flex-1 min-w-0 overflow-y-auto p-6 space-y-6" bind:this={scrollContainer}>
        {#each allSlides as s, i}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            data-slide-index={i}
            class="w-full max-w-4xl mx-auto block cursor-pointer rounded-sm transition-shadow
              {i === $currentSlideIndex ? 'ring-2 ring-primary' : 'ring-1 ring-transparent hover:ring-border'}"
            onclick={() => currentSlideIndex.set(i)}
          >
            <SlideView slide={s} interactive={i === $currentSlideIndex} />
          </div>
        {/each}
        {#if allSlides.length === 0}
          <div class="text-muted-foreground text-sm text-center mt-20">No slides yet. Add a slide to get started.</div>
        {/if}
      </div>

      <!-- Right: Collapsible SlideDetails -->
      {#if detailsOpen}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="w-1 cursor-col-resize hover:bg-primary/20 active:bg-primary/30 shrink-0"
          onmousedown={() => startResize('right')}
        ></div>
        <div class="h-full overflow-y-auto border-l border-border" style="width: {rightWidth}%">
          <div class="flex items-center justify-between px-3 py-2 border-b border-border">
            <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Edit slide</span>
            <button
              class="p-1 rounded hover:bg-accent cursor-pointer text-muted-foreground"
              onclick={() => { detailsOpen = false; }}
              title="Collapse panel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
          {#if slide}
            <SlideDetails {slide} />
          {/if}
        </div>
      {:else}
        <!-- Collapsed: thin strip with expand button -->
        <div class="h-full flex flex-col items-center border-l border-border bg-muted/20 px-1 pt-2">
          <button
            class="p-1 rounded hover:bg-accent cursor-pointer text-muted-foreground"
            onclick={() => { detailsOpen = true; }}
            title="Expand panel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <span class="text-[9px] text-muted-foreground mt-1 [writing-mode:vertical-lr]">Edit slide</span>
        </div>
      {/if}

    {:else if mode === 'present'}
      <!-- Present: full viewport single slide -->
      <div class="w-full h-full flex items-center justify-center bg-black">
        {#if slide}
          <div class="w-full h-full max-h-screen flex items-center justify-center">
            <div class="w-full" style="max-height: 100vh;">
              <SlideView {slide} />
            </div>
          </div>
        {:else}
          <div class="text-white/50 text-sm">No slides. Press Escape to exit.</div>
        {/if}
      </div>
      <!-- Minimal nav overlay -->
      <div class="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white/70 text-xs px-3 py-1.5 rounded-full">
        {$currentSlideIndex + 1} / {allSlides.length} &middot; Esc to exit
      </div>
    {/if}
  </div>
</div>
