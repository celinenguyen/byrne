<script lang="ts">
  import type { DeckSummary } from '../lib/types';
  import { formatRelativeDate } from '../lib/format-date';

  interface Props {
    deck: DeckSummary;
  }

  let { deck }: Props = $props();
</script>

<span class="text-sm truncate w-full min-w-0 block">{deck.title}</span>
<span class="text-xs text-muted-foreground flex items-center gap-1">
  <span>{formatRelativeDate(deck.updatedAt)}</span>
  <span class="px-0.5">✴︎</span>
  <span>{deck.slideCount} {deck.slideCount === 1 ? 'slide' : 'slides'}</span>
</span>
