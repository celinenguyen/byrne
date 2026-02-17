<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { DeckSummary } from '../lib/types';

  interface Props {
    decks: DeckSummary[];
    includeCurrentDeck?: boolean;
    currentDeckFile?: string;
    children: Snippet<[{ deck: DeckSummary }]>;
  }

  let {
    decks,
    includeCurrentDeck = true,
    currentDeckFile = '',
    children,
  }: Props = $props();

  let filteredDecks = $derived(
    includeCurrentDeck
      ? decks
      : decks.filter((d) => d.filename !== currentDeckFile)
  );
</script>

{#each filteredDecks as deck}
  {@render children({ deck })}
{/each}
