<script lang="ts">
  import { onMount, tick } from 'svelte';
  import Toolbar from './Toolbar.svelte';
  import SlideList from './SlideList.svelte';
  import SlideView from './SlideView.svelte';
  import SlideDetails from './SlideDetails.svelte';
  import PresentView from './PresentView.svelte';
  import PreviewPresentToolbar from './PreviewPresentToolbar.svelte';
  import {
    loadDeck,
    loadDeckList,
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
  import { keyboardClick, matchBinding, type KeyBinding } from '../lib/keyboard';

  let mode = $derived($viewMode);
  let slide = $derived($currentSlide);
  let allSlides = $derived($slides);
  let pending = $derived($pendingDelete);

  // Pane widths (percentages)
  let leftWidth = $state(15);
  let rightWidth = $state(25);

  // Collapsible details panel
  let isDetailsOpen = $derived($detailsOpen);

  // When both panels are closed, let slides use full viewport width
  let bothPanelsClosed = $derived(!$slideListOpen && !isDetailsOpen);

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
    if (idx !== prevIndex && (mode === 'edit' || mode === 'preview')) {
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

  // Check whether the focused element is a text input. Used to bail out of
  // global keyboard shortcuts so that typing in inputs, textareas, and
  // contenteditable fields (e.g. popover inputs, details panel) doesn't
  // accidentally trigger slide actions like delete or navigation.
  function isTextInput(el: EventTarget | null): boolean {
    if (!el || !(el instanceof HTMLElement)) return false;
    const tag = el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return true;
    if (el.isContentEditable) return true;
    return false;
  }

  // Declarative keybinding map — each entry matches a key (+ optional
  // modifiers) to an action in a specific view mode. The first matching
  // binding wins. Returning `false` from an action skips preventDefault,
  // which lets the browser handle the event normally (e.g. Cmd+C still
  // copies text, Escape doesn't prevent default browser behaviour).
  const bindings: KeyBinding[] = [
    // --- Edit mode ---
    { key: 'Delete',     mode: 'edit', action: () => { const s = $currentSlide; if (s) softDeleteSlide(s.id); } },
    { key: 'Backspace',  mode: 'edit', action: () => { const s = $currentSlide; if (s) softDeleteSlide(s.id); } },
    { key: 'z', meta: true, mode: 'edit', action: () => { if (!pending) return false; undoDelete(); } },
    { key: 'c', meta: true, mode: 'edit', action: () => { copiedSlideIndex = $currentSlideIndex; return false; } },
    { key: 'v', meta: true, mode: 'edit', action: () => { if (copiedSlideIndex === null) return false; duplicateSlide(copiedSlideIndex); } },
    { key: 'ArrowRight', mode: 'edit', action: () => navigateSlide('next') },
    { key: 'ArrowDown',  mode: 'edit', action: () => navigateSlide('next') },
    { key: 'ArrowLeft',  mode: 'edit', action: () => navigateSlide('prev') },
    { key: 'ArrowUp',    mode: 'edit', action: () => navigateSlide('prev') },
    // --- Preview mode ---
    { key: 'ArrowRight', mode: 'preview', action: () => navigateSlide('next') },
    { key: 'ArrowDown',  mode: 'preview', action: () => navigateSlide('next') },
    { key: 'ArrowLeft',  mode: 'preview', action: () => navigateSlide('prev') },
    { key: 'ArrowUp',    mode: 'preview', action: () => navigateSlide('prev') },
    { key: 'Escape',     mode: 'preview', action: () => { viewMode.set('edit'); return false; } },
    // --- Present mode ---
    { key: 'ArrowRight', mode: 'present', action: () => navigateSlide('next') },
    { key: 'ArrowDown',  mode: 'present', action: () => navigateSlide('next') },
    { key: ' ',          mode: 'present', action: () => navigateSlide('next') },
    { key: 'ArrowLeft',  mode: 'present', action: () => navigateSlide('prev') },
    { key: 'ArrowUp',    mode: 'present', action: () => navigateSlide('prev') },
    { key: 'r',          mode: 'present', action: () => currentSlideIndex.set(0) },
    { key: 'Escape',     mode: 'present', action: () => { viewMode.set('edit'); return false; } },
  ];

  // Global keyboard handler attached to <svelte:window>. Skips all
  // bindings when focus is inside a text input so that normal typing
  // (including Backspace, arrow keys, etc.) isn't intercepted.
  function onKeyDown(e: KeyboardEvent) {
    if ($viewMode === 'edit' && isTextInput(e.target)) return;
    matchBinding(e, $viewMode, bindings);
  }


  onMount(() => {
    loadDeck();
    loadDeckList();
  });
</script>

<svelte:window onkeydown={onKeyDown} onmousemove={onMouseMove} onmouseup={onMouseUp} />

<div class="h-screen flex flex-col">
  {#if mode !== 'present'}
    <Toolbar />
  {/if}

  <div class="flex-1 min-h-0 flex bg-muted/30">
    {#if mode === 'edit' || mode === 'preview'}
      <!-- left: SlideList panel -->
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

      <!-- center: scrollable slide list, collapsible from toolbar button -->
      <div class="h-full flex-1 min-w-0 overflow-y-auto mt-1 p-4" bind:this={scrollContainer} onscroll={onContainerScroll}>
        {#each allSlides as s, i}
          <div
            role={mode === 'edit' ? 'button' : undefined}
            tabindex={mode === 'edit' ? 0 : undefined}
            data-slide-index={i}
            class="p-0 w-full {bothPanelsClosed ? 'max-w-full' : 'max-w-4xl'} mx-auto block rounded-md transition-shadow {mode === 'edit' ? 'cursor-pointer' : ''}"
            onclick={mode === 'edit' ? () => currentSlideIndex.set(i) : undefined}
            onkeydown={mode === 'edit' ? keyboardClick(() => currentSlideIndex.set(i)) : undefined}
          >
            <SlideView
              slide={s}
              current={i === $currentSlideIndex}
              interactive={mode === 'edit' && i === $currentSlideIndex}
              mode={mode === 'preview' ? 'preview' : undefined}
            />
          </div>
        {/each}
        {#if allSlides.length === 0}
          <div class="text-muted-foreground text-sm text-center mt-20">No slides yet. Add a slide to get started.</div>
        {/if}
      </div>

      {#if mode === 'preview'}
        <PreviewPresentToolbar currentIndex={$currentSlideIndex} slideCount={allSlides.length} variant="light" />
      {/if}

      <!-- right: SlideDetails panel, collapsible from toolbar button -->
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
