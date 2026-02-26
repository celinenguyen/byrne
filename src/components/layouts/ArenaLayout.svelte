<script lang="ts">
  import type { SlideContent } from '../../lib/types';
  import BaseLayout from './BaseLayout.svelte';
  import SlideLayoutImageSlot from './SlideLayoutImageSlot.svelte';
  import MarkdownText from './MarkdownText.svelte';
  import settings from './ArenaLayout.json';
  import { autoScale } from '../../lib/actions/autoScale';

  interface Props {
    content: SlideContent;
  }
  let { content }: Props = $props();

  let imageSrc = $derived(content.images?.[0] || '');
  let title = $derived(content.text?.[0] || '');
  let description = $derived(content.text?.[1] || '');
</script>

<BaseLayout>
  <div class="flex flex-col h-full">
    <SlideLayoutImageSlot src={imageSrc} slotName="image" class="flex-1 min-h-0" />
    {#if title || description}
      <div use:autoScale={{ minScale: 0.7 }} class="text-area">
        {#if title}
          <h2 data-slot="text:title" class="px-6 py-2 font-semibold text-center" style="font-family: var(--slide-font-heading); color: var(--slide-color-primary)">
            <MarkdownText text={title} inline />
          </h2>
        {/if}
        {#if description}
          <div data-slot="text:description" class="px-6 pb-3 prose prose-sm max-w-none text-center" style="font-family: var(--slide-font-body); color: var(--slide-color-primary)">
            <MarkdownText text={description} />
          </div>
        {/if}
      </div>
    {/if}
  </div>
</BaseLayout>

<style>
  [data-slot="text:title"] {
    font-size: calc(clamp(0.875rem, 2.5cqi, 1.25rem) * var(--auto-scale, 1));
  }
  [data-slot="text:description"] {
    font-size: calc(clamp(0.75rem, 2cqi, 1rem) * var(--auto-scale, 1));
  }
</style>
