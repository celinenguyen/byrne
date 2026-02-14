<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import Icon from './ui/Icon.svelte';
  import NewDeckPopover from './NewDeckPopover.svelte';
  import {
    viewMode,
    currentSlideIndex,
    detailsOpen,
    slideListOpen,
    deckList,
    currentDeckFile,
    switchDeck,
  } from '../lib/store';

  let mode = $derived($viewMode);
  let decks = $derived($deckList);
  let activeDeckFile = $derived($currentDeckFile);

  let newDeckOpen = $state(false);
  // Mutable so we can force-reset it when the "New deck" popover is
  // dismissed without creating a deck (see onPopoverChange below).
  let selectValue = $state(activeDeckFile);
  $effect(() => { selectValue = activeDeckFile; });

  function onSelectChange(value: string | undefined) {
    if (!value) return;
    if (value === '__new__') {
      newDeckOpen = true;
      return;
    }
    switchDeck(value);
  }

  // When the "New deck" popover closes (Escape, click-outside, or after
  // creating a deck), revert the select back to the actual active deck file
  // so it doesn't stay stuck on "New deck...".
  $effect(() => {
    if (!newDeckOpen) {
      selectValue = activeDeckFile;
    }
  });
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

  <!-- select deck and present it -->
  <div class="flex flex-row items-center gap-2">
    <!-- deck selection and creation -->
    <NewDeckPopover bind:open={newDeckOpen}>
      {#snippet trigger()}
        <Select.Root
          type="single"
          value={selectValue}
          onValueChange={onSelectChange}
        >
          <Select.Trigger size="sm" class="min-w-[200px] max-w-[360px]">
            {#snippet children()}
              <span class="truncate">
                {decks.find((d) => d.filename === activeDeckFile)?.title ?? activeDeckFile}
              </span>
            {/snippet}
          </Select.Trigger>
          <Select.Content>
            {#each decks as d}
              <Select.Item value={d.filename} label={d.title} />
            {/each}
            <Select.Separator />
            <Select.Item value="__new__" label="New deck..." />
          </Select.Content>
        </Select.Root>
      {/snippet}
    </NewDeckPopover>
    <!-- present button -->
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
