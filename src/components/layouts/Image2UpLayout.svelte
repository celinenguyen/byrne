<script lang="ts">
  import type { SlideData } from '../../lib/types';
  import BaseLayout from './BaseLayout.svelte';
  import { marked } from 'marked';

  interface Props {
    data: SlideData;
  }
  let { data }: Props = $props();

  let imgLeft = $derived(data.images?.[0] || '');
  let imgRight = $derived(data.images?.[1] || '');
  let capLeft = $derived(data.text?.[0] || '');
  let capRight = $derived(data.text?.[1] || '');
  let capLeftHtml = $derived(marked.parse(capLeft, { async: false }) as string);
  let capRightHtml = $derived(marked.parse(capRight, { async: false }) as string);
</script>

<BaseLayout>
  <div class="grid grid-cols-2 gap-4 h-full p-6">
    <div class="flex flex-col">
      <div data-slot="image:left" class="flex-1 min-h-0 flex items-center justify-center bg-muted rounded">
        {#if imgLeft}
          <img src={imgLeft} alt="" class="max-w-full max-h-full object-contain" />
        {:else}
          <div class="text-stone-300 text-sm">Image 1</div>
        {/if}
      </div>
      {#if capLeft}
        <div data-slot="text:leftCaption" class="mt-2 text-xs text-muted-foreground prose prose-sm max-w-none">{@html capLeftHtml}</div>
      {/if}
    </div>
    <div class="flex flex-col">
      <div data-slot="image:right" class="flex-1 min-h-0 flex items-center justify-center bg-muted rounded">
        {#if imgRight}
          <img src={imgRight} alt="" class="max-w-full max-h-full object-contain" />
        {:else}
          <div class="text-stone-300 text-sm">Image 2</div>
        {/if}
      </div>
      {#if capRight}
        <div data-slot="text:rightCaption" class="mt-2 text-xs text-muted-foreground prose prose-sm max-w-none">{@html capRightHtml}</div>
      {/if}
    </div>
  </div>
</BaseLayout>
