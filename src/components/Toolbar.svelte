<script lang="ts">
  import { get } from 'svelte/store';
  import { Button } from '$lib/components/ui/button/index.js';
  import PanelLeft from '@lucide/svelte/icons/panel-left';
  import PanelRight from '@lucide/svelte/icons/panel-right';
  import Eye from '@lucide/svelte/icons/eye';
  import Presentation from '@lucide/svelte/icons/presentation';
  import DeckPicker from './DeckPicker.svelte';
  import {
    viewMode,
    detailsOpen,
    slideListOpen,
  } from '../lib/store';

  let savedDetailsOpen: boolean | null = null;
  let savedSlideListOpen: boolean | null = null;
  let wasPreview = false;

  // Restore panel state when leaving preview mode (handles both toggle click and Escape key)
  $effect(() => {
    const mode = $viewMode;
    if (mode === 'preview' && !wasPreview) {
      // Entering preview — save panel state
      savedDetailsOpen = get(detailsOpen);
      savedSlideListOpen = get(slideListOpen);
      detailsOpen.set(false);
      slideListOpen.set(false);
      wasPreview = true;
    } else if (mode !== 'preview' && wasPreview) {
      // Leaving preview — restore panel state
      if (savedDetailsOpen !== null) detailsOpen.set(savedDetailsOpen);
      if (savedSlideListOpen !== null) slideListOpen.set(savedSlideListOpen);
      savedDetailsOpen = null;
      savedSlideListOpen = null;
      wasPreview = false;
    }
  });

  function togglePreview() {
    if ($viewMode === 'edit') {
      viewMode.set('preview');
    } else if ($viewMode === 'preview') {
      viewMode.set('edit');
    }
  }
</script>

<div class="flex items-center justify-between px-4 py-2 border-b border-border bg-background shrink-0">
  <!-- Toggle slide list -->
  <button
    class="p-1.5 rounded-md transition-colors cursor-pointer {$slideListOpen ? 'text-foreground bg-muted' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
    title="{$slideListOpen ? 'Hide' : 'Show'} slide list"
    onclick={() => slideListOpen.update((v) => !v)}
  >
    <PanelLeft class="size-4" />
  </button>

  <!-- Deck picker + preview/present buttons -->
  <div class="flex flex-row items-center gap-2">
    <DeckPicker />
    <button
      class="p-1.5 rounded-md transition-colors cursor-pointer {$viewMode === 'preview' ? 'text-foreground bg-muted' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
      title="{$viewMode === 'preview' ? 'Exit preview' : 'Preview'}"
      onclick={togglePreview}
    >
      <Eye class="size-4" />
    </button>
    <Button variant="ghost" size="icon" onclick={() => viewMode.set('present')}>
      {#snippet children()}
        <Presentation class="size-4" />
      {/snippet}
    </Button>
  </div>

  <!-- Toggle details panel -->
  <button
    class="p-1.5 rounded-md transition-colors cursor-pointer {$detailsOpen ? 'text-foreground bg-muted' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
    title="{$detailsOpen ? 'Hide' : 'Show'} details panel"
    onclick={() => detailsOpen.update((v) => !v)}
  >
    <PanelRight class="size-4" />
  </button>
</div>
