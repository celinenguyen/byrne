<script lang="ts">
  import type { SlideData } from '../../lib/types';
  import BaseLayout from './BaseLayout.svelte';
  import SlideLayoutImageSlot from './SlideLayoutImageSlot.svelte';
  import MarkdownText from './MarkdownText.svelte';

  interface Props {
    data: SlideData;
  }
  let { data }: Props = $props();

  let imageSrc = $derived(data.images?.[0] || '');
  let caption = $derived(data.text?.[0] || '');

</script>

<BaseLayout>
  <div class="flex flex-col h-full">
    <SlideLayoutImageSlot src={imageSrc} slotName="image" class="flex-1 min-h-0" />
    {#if caption}
      <div data-slot="text:caption" class="px-6 py-3 text-sm text-muted-foreground prose prose-sm max-w-none text-center">
        <MarkdownText text={caption} />
      </div>
    {/if}
  </div>
</BaseLayout>
