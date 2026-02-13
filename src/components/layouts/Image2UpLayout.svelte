<script lang="ts">
  import type { SlideData } from '../../lib/types';
  import BaseLayout from './BaseLayout.svelte';
  import { marked } from 'marked';

  interface Props {
    data: SlideData;
  }
  let { data }: Props = $props();

  let imgLeft = $derived(data.images?.['left'] || '');
  let imgRight = $derived(data.images?.['right'] || '');
  let capLeft = $derived(data.text?.['leftCaption'] || '');
  let capRight = $derived(data.text?.['rightCaption'] || '');
  let capLeftHtml = $derived(marked.parse(capLeft, { async: false }) as string);
  let capRightHtml = $derived(marked.parse(capRight, { async: false }) as string);
</script>

<BaseLayout>
  <div class="grid grid-cols-2 gap-4 h-full p-6">
    <div class="flex flex-col">
      <div class="flex-1 min-h-0 flex items-center justify-center bg-gray-50 rounded">
        {#if imgLeft}
          <img src={imgLeft} alt="" class="max-w-full max-h-full object-contain" />
        {:else}
          <div class="text-gray-300 text-sm">Image 1</div>
        {/if}
      </div>
      {#if capLeft}
        <div class="mt-2 text-xs text-gray-500 prose prose-sm max-w-none">{@html capLeftHtml}</div>
      {/if}
    </div>
    <div class="flex flex-col">
      <div class="flex-1 min-h-0 flex items-center justify-center bg-gray-50 rounded">
        {#if imgRight}
          <img src={imgRight} alt="" class="max-w-full max-h-full object-contain" />
        {:else}
          <div class="text-gray-300 text-sm">Image 2</div>
        {/if}
      </div>
      {#if capRight}
        <div class="mt-2 text-xs text-gray-500 prose prose-sm max-w-none">{@html capRightHtml}</div>
      {/if}
    </div>
  </div>
</BaseLayout>
