<script lang="ts">
  import type { SlideData } from '../../lib/types';
  import BaseLayout from './BaseLayout.svelte';
  import SlideLayoutImageSlot from './SlideLayoutImageSlot.svelte';
  import MarkdownText from './MarkdownText.svelte';

  interface Props {
    data: SlideData;
  }
  let { data }: Props = $props();

  let imgLeft = $derived(data.images?.[0] || '');
  let imgRight = $derived(data.images?.[1] || '');
  let capLeft = $derived(data.text?.[0] || '');
  let capRight = $derived(data.text?.[1] || '');
</script>

<BaseLayout>
  <div class="grid grid-cols-2 gap-4 h-full p-6">
    <div class="flex flex-col">
      <SlideLayoutImageSlot src={imgLeft} slotName="left" class="flex-1 min-h-0 rounded" />
      {#if capLeft}
        <div data-slot="text:leftCaption" class="mt-2 text-xs text-muted-foreground prose prose-sm max-w-none"><MarkdownText text={capLeft} /></div>
      {/if}
    </div>
    <div class="flex flex-col">
      <SlideLayoutImageSlot src={imgRight} slotName="right" class="flex-1 min-h-0 rounded" />
      {#if capRight}
        <div data-slot="text:rightCaption" class="mt-2 text-xs text-muted-foreground prose prose-sm max-w-none"><MarkdownText text={capRight} /></div>
      {/if}
    </div>
  </div>
</BaseLayout>
