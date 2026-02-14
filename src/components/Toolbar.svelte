<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import Icon from './ui/Icon.svelte';
  import {
    viewMode,
    currentSlideIndex,
    slideCount,
    slides,
    navigateSlide,
    deck,
    detailsOpen,
    slideListOpen,
  } from '../lib/store';

  let mode = $derived($viewMode);
  let count = $derived($slideCount);
  let idx = $derived($currentSlideIndex);
  let meta = $derived($deck?.meta);
  let allSlides = $derived($slides);

  let showJumpMenu = $state(false);

  function jumpToSlide(i: number) {
    currentSlideIndex.set(i);
    showJumpMenu = false;
  }
</script>

<div class="flex items-center justify-between px-4 py-2 border-b border-border bg-background shrink-0">
  <!-- Toggle slide list -->
  <button
    class="p-1.5 rounded-md transition-colors cursor-pointer {$slideListOpen ? 'text-foreground bg-muted' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
    title="{$slideListOpen ? 'Hide' : 'Show'} slide list"
    onclick={() => slideListOpen.update((v) => !v)}
  >
    <Icon name="panel-left" size={16} />
  </button>
  <Button variant="outline" size="sm" onclick={() => viewMode.set('present')}>
    {#snippet children()}
      <Icon name="presentation" size={14} />
      Present
    {/snippet}
  </Button>
  <!-- Toggle details panel -->
  <button
    class="p-1.5 rounded-md transition-colors cursor-pointer {$detailsOpen ? 'text-foreground bg-muted' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
    title="{$detailsOpen ? 'Hide' : 'Show'} details panel"
    onclick={() => detailsOpen.update((v) => !v)}
  >
    <Icon name="panel-right" size={16} />
  </button>
</div>
