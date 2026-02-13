<script lang="ts">
  import Button from './ui/Button.svelte';
  import {
    viewMode,
    currentSlideIndex,
    slideCount,
    slides,
    navigateSlide,
    deck,
  } from '../lib/store';

  let mode = $derived($viewMode);
  let count = $derived($slideCount);
  let idx = $derived($currentSlideIndex);
  let meta = $derived($deck?.meta);
  let allSlides = $derived($slides);

  function setMode(m: 'edit' | 'preview' | 'present') {
    viewMode.set(m);
  }

  let showJumpMenu = $state(false);

  function jumpToSlide(i: number) {
    currentSlideIndex.set(i);
    showJumpMenu = false;
  }
</script>

<div class="flex items-center justify-between h-11 px-4 border-b border-border bg-background shrink-0">
  <!-- Left: View mode tabs -->
  <div class="flex items-center gap-1">
    {#each ['edit', 'preview', 'present'] as m}
      <button
        class="px-3 py-1 text-sm rounded-md transition-colors cursor-pointer {mode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}"
        onclick={() => setMode(m as 'edit' | 'preview' | 'present')}
      >
        {m.charAt(0).toUpperCase() + m.slice(1)}
      </button>
    {/each}
  </div>

  <!-- Center: Slide navigation (hidden in Preview) -->
  {#if mode !== 'preview'}
    <div class="flex items-center gap-2">
      <Button variant="ghost" size="icon" onclick={() => navigateSlide('prev')} disabled={idx === 0}>
        {#snippet children()}
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        {/snippet}
      </Button>

      <div class="relative">
        <button
          class="text-sm tabular-nums px-2 py-1 rounded hover:bg-accent cursor-pointer"
          onclick={() => { showJumpMenu = !showJumpMenu; }}
        >
          {count > 0 ? `${idx + 1} / ${count}` : '0 / 0'}
        </button>
        {#if showJumpMenu && count > 0}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-popover border border-border rounded-md shadow-md py-1 z-50 max-h-64 overflow-y-auto min-w-[120px]"
            onmouseleave={() => { showJumpMenu = false; }}
          >
            {#each allSlides as slide, i}
              <button
                class="w-full text-left px-3 py-1.5 text-sm hover:bg-accent cursor-pointer {i === idx ? 'bg-accent font-medium' : ''}"
                onclick={() => jumpToSlide(i)}
              >
                {i + 1}. {slide.layout}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <Button variant="ghost" size="icon" onclick={() => navigateSlide('next')} disabled={idx >= count - 1}>
        {#snippet children()}
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        {/snippet}
      </Button>
    </div>
  {:else}
    <div></div>
  {/if}

  <!-- Right: Metadata -->
  <div class="text-xs text-muted-foreground">
    {#if meta}
      <span>by {meta.author || '...'}</span>
      {#if meta.startDate}
        <span class="ml-1">from {meta.startDate}</span>
      {/if}
      {#if meta.endDate}
        <span class="ml-1">to {meta.endDate}</span>
      {/if}
    {/if}
  </div>
</div>
