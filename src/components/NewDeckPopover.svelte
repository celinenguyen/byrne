<script lang="ts">
  import type { Snippet } from 'svelte';
  import * as Popover from '$lib/components/ui/popover/index.js';
  import InputTypeAndEnter from './InputTypeAndEnter.svelte';
  import { createDeck } from '../lib/store';

  interface Props {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger: Snippet;
  }
  let { open = $bindable(false), onOpenChange, trigger }: Props = $props();

  let newDeckTitle = $state('');

  function handleOpenChange(v: boolean) {
    onOpenChange?.(v);
    if (v) newDeckTitle = '';
  }

  function handleSubmit() {
    const trimmed = newDeckTitle.trim();
    if (!trimmed) return;
    createDeck(trimmed);
    newDeckTitle = '';
    open = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      newDeckTitle = '';
      open = false;
    }
  }
</script>

<Popover.Root bind:open onOpenChange={handleOpenChange}>
  <Popover.Trigger>
    {#snippet child({ props })}
      {@const { onClick, ...rest } = props}
      <div {...rest} class="inline-block">
        {@render trigger()}
      </div>
    {/snippet}
  </Popover.Trigger>

  <Popover.Content
    class="w-64 p-3 flex flex-col gap-2"
    sideOffset={6}
    align="center"
  >
    <!-- svelte-ignore a11y_autofocus -->
    <div onkeydown={handleKeydown}>
      <InputTypeAndEnter
        placeholder="Deck name"
        bind:value={newDeckTitle}
        onsubmit={handleSubmit}
        ariaLabel="Create deck"
        autofocus
      />
    </div>
  </Popover.Content>
</Popover.Root>
