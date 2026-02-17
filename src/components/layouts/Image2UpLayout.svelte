<script lang="ts">
  import type { SlideContent } from '../../lib/types';
  import BaseLayout from './BaseLayout.svelte';
  import SlideLayoutImageSlot from './SlideLayoutImageSlot.svelte';
  import MarkdownText from './MarkdownText.svelte';

  interface Props {
    content: SlideContent;
  }
  let { content }: Props = $props();

  let imgLeft = $derived(content.images?.[0] || '');
  let imgRight = $derived(content.images?.[1] || '');
  let capLeft = $derived(content.text?.[0] || '');
  let capRight = $derived(content.text?.[1] || '');
</script>

<BaseLayout>
  <div class="grid grid-cols-2 gap-4 h-full p-6">
    <div class="flex flex-col">
      <SlideLayoutImageSlot src={imgLeft} slotName="left" class="flex-1 min-h-0 rounded" />
      {#if capLeft}
        <div data-slot="text:leftCaption" class="mt-2 text-xs prose prose-sm max-w-none" style="font-family: var(--slide-font-caption); color: var(--slide-color-primary)"><MarkdownText text={capLeft} /></div>
      {/if}
    </div>
    <div class="flex flex-col">
      <SlideLayoutImageSlot src={imgRight} slotName="right" class="flex-1 min-h-0 rounded" />
      {#if capRight}
        <div data-slot="text:rightCaption" class="mt-2 text-xs prose prose-sm max-w-none" style="font-family: var(--slide-font-caption); color: var(--slide-color-primary)"><MarkdownText text={capRight} /></div>
      {/if}
    </div>
  </div>
</BaseLayout>
