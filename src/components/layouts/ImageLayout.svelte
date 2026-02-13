<script lang="ts">
  import type { SlideData } from '../../lib/types';
  import BaseLayout from './BaseLayout.svelte';
  import { marked } from 'marked';

  interface Props {
    data: SlideData;
  }
  let { data }: Props = $props();

  let imageSrc = $derived(data.images?.[0] || '');
  let caption = $derived(data.text?.[0] || '');
  let captionHtml = $derived(marked.parse(caption, { async: false }) as string);
</script>

<BaseLayout>
  <div class="flex flex-col h-full">
    <div class="layout-image-image flex-1 min-h-0 flex items-center justify-center bg-gray-50 p-4">
      {#if imageSrc}
        <img src={imageSrc} alt="" class="max-w-full max-h-full object-contain" />
      {:else}
        <div class="text-gray-300 text-sm">No image</div>
      {/if}
    </div>
    {#if caption}
      <div class="layout-text-caption px-6 py-3 text-sm text-gray-600 prose prose-sm max-w-none">
        {@html captionHtml}
      </div>
    {/if}
  </div>
</BaseLayout>

<style>
  .layout-image-image {
  }
  .layout-text-caption {
  }
</style>
