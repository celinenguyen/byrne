<script lang="ts">
  import type { SlideData } from '../../lib/types';
  import BaseLayout from './BaseLayout.svelte';
  import settings from './ArenaBlockLayout.settings.json';

  interface Props {
    data: SlideData;
  }
  let { data }: Props = $props();

  let image = $derived(data.images?.['blockImage'] || '');
  let title = $derived(data.text?.['title'] || '');
  let channel = $derived(data.text?.['channel'] || '');
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
        <p class="text-sm font-medium text-gray-800 truncate">{title || settings.text.title.placeholder}</p>
        {#if channel}
          <p class="text-xs text-gray-400 mt-1">{channel}</p>
        {/if}
      </div>
    </div>
  </div>
</BaseLayout>
