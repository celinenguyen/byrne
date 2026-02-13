<script lang="ts">
  import { onMount } from 'svelte';
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
  } from '../lib/store';

  let mode = $derived($viewMode);
  let slide = $derived($currentSlide);
  let allSlides = $derived($slides);

  // Pane widths (percentages)
  let leftWidth = $state(25);
  let rightWidth = $state(30);

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

  function isFormElement(el: EventTarget | null): boolean {
    if (!el || !(el instanceof HTMLElement)) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }

  function onKeyDown(e: KeyboardEvent) {
    const mode = $viewMode;

    // In edit/preview: arrow keys navigate slides unless in a form field
    if (mode === 'edit' || mode === 'preview') {
      if (isFormElement(e.target)) return;
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
      <!-- Edit: 3-pane layout -->
      <div class="h-full overflow-y-auto border-r border-border bg-muted/30" style="width: {leftWidth}%">
        <SlideList />
      </div>
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="w-1 cursor-col-resize hover:bg-primary/20 active:bg-primary/30 shrink-0"
        onmousedown={() => startResize('left')}
      ></div>
      <div class="h-full flex-1 min-w-0 overflow-hidden flex items-center justify-center bg-muted/10 p-6">
        {#if slide}
          <div class="w-full max-w-4xl">
            <SlideView {slide} />
          </div>
        {:else}
          <div class="text-muted-foreground text-sm">No slide selected. Add a slide to get started.</div>
        {/if}
      </div>
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="w-1 cursor-col-resize hover:bg-primary/20 active:bg-primary/30 shrink-0"
        onmousedown={() => startResize('right')}
      ></div>
      <div class="h-full overflow-y-auto border-l border-border" style="width: {rightWidth}%">
        {#if slide}
          <SlideDetails {slide} />
        {/if}
      </div>

    {:else if mode === 'preview'}
      <!-- Preview: 2-pane, slide list + scrollable slides -->
      <div class="h-full overflow-y-auto border-r border-border bg-muted/30" style="width: 20%">
        <SlideList />
      </div>
      <div class="h-full flex-1 overflow-y-auto p-6 space-y-6">
        {#each allSlides as s, i}
          <button
            class="w-full max-w-4xl mx-auto block cursor-pointer focus:outline-none {i === $currentSlideIndex ? 'ring-2 ring-primary rounded-sm' : ''}"
            onclick={() => currentSlideIndex.set(i)}
          >
            <SlideView slide={s} />
          </button>
        {/each}
        {#if allSlides.length === 0}
          <div class="text-muted-foreground text-sm text-center mt-20">No slides yet.</div>
        {/if}
      </div>

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
