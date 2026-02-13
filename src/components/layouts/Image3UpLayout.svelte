<script lang="ts">
  import type { SlideData } from '../../lib/types';
  import BaseLayout from './BaseLayout.svelte';
  import { marked } from 'marked';

  interface Props {
    data: SlideData;
    context?: 'desktop' | 'mobile';
  }
  let { data }: Props = $props();

  let images = $derived([
    { src: data.images?.['1'] || '', cap: data.text?.['1'] || '' },
    { src: data.images?.['2'] || '', cap: data.text?.['2'] || '' },
    { src: data.images?.['3'] || '', cap: data.text?.['3'] || '' },
  ]);
</script>

<BaseLayout>
  <div class="grid grid-cols-3 gap-3 h-full p-6">
    {#each images as img, i}
      <div class="flex flex-col">
        <div class="flex-1 min-h-0 flex items-center justify-center bg-gray-50 rounded">
          {#if img.src}
            <img src={img.src} alt="" class="max-w-full max-h-full object-contain" />
          {:else}
            <div class="text-gray-300 text-sm">Image {i + 1}</div>
          {/if}
        </div>
        {#if img.cap}
          <div class="mt-2 text-xs text-gray-500">{@html marked.parse(img.cap, { async: false })}</div>
        {/if}
      </div>
    {/each}
  </div>
</BaseLayout>
