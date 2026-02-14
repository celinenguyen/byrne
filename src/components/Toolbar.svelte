<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import Icon from './ui/Icon.svelte';
  import DeckPicker from './DeckPicker.svelte';
  import {
    viewMode,
    detailsOpen,
    slideListOpen,
  } from '../lib/store';
</script>

<div class="flex items-center justify-between px-4 py-2 border-b border-border bg-background shrink-0">
  <!-- Toggle slide list -->
  <button
    class="p-1.5 rounded-md transition-colors cursor-pointer {$slideListOpen ? 'text-foreground bg-muted' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
    title="{$slideListOpen ? 'Hide' : 'Show'} slide list"
    onclick={() => slideListOpen.update((v) => !v)}
  >
    <Icon name="panel-left" class="size-4" />
  </button>

  <!-- Deck picker + present button -->
  <div class="flex flex-row items-center gap-2">
    <DeckPicker />
    <Button variant="ghost" size="icon" onclick={() => viewMode.set('present')}>
      {#snippet children()}
        <Icon name="presentation" class="size-4" />
      {/snippet}
    </Button>
  </div>

  <!-- Toggle details panel -->
  <button
    class="p-1.5 rounded-md transition-colors cursor-pointer {$detailsOpen ? 'text-foreground bg-muted' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}"
    title="{$detailsOpen ? 'Hide' : 'Show'} details panel"
    onclick={() => detailsOpen.update((v) => !v)}
  >
    <Icon name="panel-right" class="size-4" />
  </button>
</div>
