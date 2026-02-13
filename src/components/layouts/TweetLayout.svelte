<script lang="ts">
  import type { SlideData } from '../../lib/types';
  import BaseLayout from './BaseLayout.svelte';

  interface Props {
    data: SlideData;
  }
  let { data }: Props = $props();

  let screenshot = $derived(data.images?.['screenshot'] || '');
  let attribution = $derived(data.text?.['attribution'] || '');
  let commentary = $derived(data.text?.['commentary'] || '');
</script>

<BaseLayout>
  <div class="flex flex-col items-center justify-center h-full p-8 bg-gray-50">
    <div class="max-w-lg w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {#if screenshot}
        <img src={screenshot} alt="" class="w-full" />
      {:else}
        <div class="h-48 flex items-center justify-center text-gray-300 text-sm">Tweet screenshot</div>
      {/if}
    </div>
    {#if attribution}
      <p class="mt-3 text-sm text-gray-400">{attribution}</p>
    {/if}
    {#if commentary}
      <p class="mt-2 text-sm text-gray-600 max-w-lg text-center">{commentary}</p>
    {/if}
  </div>
</BaseLayout>
