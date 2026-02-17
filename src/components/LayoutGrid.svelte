<script lang="ts">
  import { layoutList } from './layouts/registry';
  import * as Item from './ui/item';

  interface Props {
    cols?: 1 | 2 | 3 | 4;
    selectedLayout?: string | null;
    onSelect: (layoutId: string) => void;
  }
  let { cols = 2, selectedLayout = null, onSelect }: Props = $props();

  const gridClass = $derived(
    cols === 1 ? 'grid-cols-1' : cols === 2 ? 'grid-cols-2' : cols === 3 ? 'grid-cols-3' : 'grid-cols-4'
  );
</script>

<div class="grid gap-4 {gridClass}">
  {#each layoutList as l}
    <Item.Root
      variant="outline"
      size="sm"
      class="border-border px-4 py-3 cursor-pointer {selectedLayout === l.id ? 'border-stone-400 ring-3 ring-stone-200 bg-white' : 'hover:bg-accent opacity-80'}"
      onclick={() => onSelect(l.id)}
    >
      <Item.Content>
        <Item.Title class="tracking-wide">{l.displayName}</Item.Title>
        {#if l.description}
          <Item.Description class="text-xs leading-relaxed">{l.description}</Item.Description>
        {/if}
      </Item.Content>
    </Item.Root>
  {/each}
</div>
