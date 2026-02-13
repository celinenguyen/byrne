<script lang="ts">
  import type { SlideData } from '../../lib/types';
  import BaseLayout from './BaseLayout.svelte';
  import { marked } from 'marked';

  interface Props {
    data: SlideData;
    context?: 'desktop' | 'mobile';
  }
  let { data }: Props = $props();

  let img1 = $derived(data.images?.['1'] || '');
  let img2 = $derived(data.images?.['2'] || '');
  let cap1 = $derived(data.text?.['1'] || '');
  let cap2 = $derived(data.text?.['2'] || '');
  let cap1Html = $derived(marked.parse(cap1, { async: false }) as string);
  let cap2Html = $derived(marked.parse(cap2, { async: false }) as string);
</script>

<BaseLayout>
  <div class="grid grid-cols-2 gap-4 h-full p-6">
    <div class="flex flex-col">
      <div class="flex-1 min-h-0 flex items-center justify-center bg-gray-50 rounded">
        {#if img1}
          <img src={img1} alt="" class="max-w-full max-h-full object-contain" />
        {:else}
          <div class="text-gray-300 text-sm">Image 1</div>
        {/if}
      </div>
      {#if cap1}
        <div class="mt-2 text-xs text-gray-500 prose prose-sm max-w-none">{@html cap1Html}</div>
      {/if}
    </div>
    <div class="flex flex-col">
      <div class="flex-1 min-h-0 flex items-center justify-center bg-gray-50 rounded">
        {#if img2}
          <img src={img2} alt="" class="max-w-full max-h-full object-contain" />
        {:else}
          <div class="text-gray-300 text-sm">Image 2</div>
        {/if}
      </div>
      {#if cap2}
        <div class="mt-2 text-xs text-gray-500 prose prose-sm max-w-none">{@html cap2Html}</div>
      {/if}
    </div>
  </div>
</BaseLayout>
