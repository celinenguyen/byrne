<script lang="ts">
  import type { SlideData } from '../../lib/types';
  import BaseLayout from './BaseLayout.svelte';

  interface Props {
    data: SlideData;
    context?: 'desktop' | 'mobile';
  }
  let { data }: Props = $props();

  let image = $derived(data.images?.['1'] || '');
  let title = $derived(data.text?.['1'] || '');
  let channel = $derived(data.text?.['2'] || '');
</script>

<BaseLayout>
  <div class="flex flex-col items-center justify-center h-full p-8 bg-gray-50">
    <div class="border-2 border-gray-200 bg-white max-w-sm w-full">
      {#if image}
        <img src={image} alt="" class="w-full aspect-square object-cover" />
      {:else}
        <div class="w-full aspect-square flex items-center justify-center text-gray-300 text-sm">Block image</div>
      {/if}
      <div class="p-3 border-t border-gray-200">
        <p class="text-sm font-medium text-gray-800 truncate">{title || 'Block title'}</p>
        {#if channel}
          <p class="text-xs text-gray-400 mt-1">{channel}</p>
        {/if}
      </div>
    </div>
  </div>
</BaseLayout>
