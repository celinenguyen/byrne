<script lang="ts">
  import type { SlideContent } from '../../lib/types';
  import BaseLayout from './BaseLayout.svelte';
  import SlideLayoutImageSlot from './SlideLayoutImageSlot.svelte';
  import MarkdownText from './MarkdownText.svelte';
  import { autoScale } from '../../lib/actions/autoScale';

  interface Props {
    content: SlideContent;
  }
  let { content }: Props = $props();

  let imageSrc = $derived(content.images?.[0] || '');
  let caption = $derived(content.text?.[0] || '');

</script>

<BaseLayout>
  <div class="flex flex-col h-full">
    <SlideLayoutImageSlot src={imageSrc} slotName="image" class="flex-1 min-h-0" />
    {#if caption}
      <div use:autoScale={{ minScale: 0.7 }} data-slot="text:caption" class="caption-text px-6 py-2 prose prose-sm max-w-none text-center" style="font-family: var(--slide-font-caption); color: var(--slide-color-primary)">
        <MarkdownText text={caption} />
      </div>
    {/if}
  </div>
</BaseLayout>

<style>
  .caption-text {
    font-size: calc(clamp(0.75rem, 2cqi, 1rem) * var(--auto-scale, 1));
  }
</style>
