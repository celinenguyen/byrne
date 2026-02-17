<script lang="ts">
  import { tick } from 'svelte';
  import * as Popover from '$lib/components/ui/popover/index.js';
  import * as Kbd from '$lib/components/ui/kbd/index.js';
  import * as Field from '$lib/components/ui/field';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
  import Plus from '@lucide/svelte/icons/plus';
  import InputTypeAndEnter from './InputTypeAndEnter.svelte';
  import {
    deckList,
    currentDeckFile,
    switchDeck,
    createDeck,
  } from '../lib/store';
  import DeckItemContent from './DeckItemContent.svelte';
  import DeckList from './DeckList.svelte';

  let decks = $derived($deckList);
  let activeDeckFile = $derived($currentDeckFile);
  let activeTitle = $derived(
    decks.find((d) => d.filename === activeDeckFile)?.title ?? activeDeckFile
  );

  let open = $state(false);

  // The popover shows either the deck list or the "new deck" input form.
  let view = $state<'list' | 'create'>('list');
  let newDeckTitle = $state('');

  // Reset to list view whenever the popover opens or closes
  function handleOpenChange(v: boolean) {
    view = 'list';
    newDeckTitle = '';
  }

  function selectDeck(filename: string) {
    open = false;
    switchDeck(filename);
  }

  function showCreateForm() {
    view = 'create';
    newDeckTitle = '';
  }

  async function handleCreate() {
    const trimmed = newDeckTitle.trim();
    if (!trimmed) return;
    await createDeck(trimmed);
    newDeckTitle = '';
    open = false;
  }
</script>

<Popover.Root bind:open onOpenChange={handleOpenChange}>
  <Popover.Trigger
    class="inline-flex items-center gap-2 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-xs
      hover:bg-muted transition-colors cursor-pointer min-w-[200px] max-w-[360px]"
  >
    <span class="truncate flex-1 text-left">{activeTitle}</span>
    <ChevronsUpDown class="size-3.5 text-muted-foreground shrink-0" />
  </Popover.Trigger>

  <Popover.Content
    class="w-[280px] p-0"
    sideOffset={4}
    align="center"
  >
    {#if view === 'list'}
      <!-- Deck list -->
      <div class="max-h-[300px] overflow-y-auto p-1">
        <DeckList decks={decks} includeCurrentDeck={true} currentDeckFile={activeDeckFile}>
          {#snippet children({ deck })}
            <button
              class="flex flex-col gap-0.5 w-full rounded-sm px-2 py-1.5 cursor-pointer
                text-left transition-colors outline-none
                {deck.filename === activeDeckFile
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'}"
              onclick={() => selectDeck(deck.filename)}
            >
              <DeckItemContent deck={deck} />
            </button>
          {/snippet}
        </DeckList>
      </div>
      <Separator />
      <!-- "New deck" action button — not a selectable item -->
      <div class="p-1">
        <button
          class="flex items-center gap-2 w-full rounded-sm px-2 py-1.5 text-sm cursor-pointer
            text-left transition-colors outline-none text-muted-foreground
            hover:bg-accent hover:text-accent-foreground"
          onclick={showCreateForm}
        >
          <Plus class="size-3.5 shrink-0" />
          <span>New deck</span>
        </button>
      </div>
    {:else}
      <!-- New deck form -->
      <div class="p-3">
        <Field.Root class="gap-2">
          <Field.Content>
            <!-- svelte-ignore a11y_autofocus -->
            <InputTypeAndEnter
              placeholder="Deck name"
              bind:value={newDeckTitle}
              onsubmit={handleCreate}
              ariaLabel="Create deck"
              autofocus
            />
          </Field.Content>
          <Field.Hint><Kbd.Root>Enter</Kbd.Root> to create</Field.Hint>
        </Field.Root>
      </div>
    {/if}
  </Popover.Content>
</Popover.Root>
