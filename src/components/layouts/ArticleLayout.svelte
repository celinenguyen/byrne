<script lang="ts">
  import type { SlideData } from '../../lib/types';
  import BaseLayout from './BaseLayout.svelte';
  import { marked } from 'marked';

  interface Props {
    data: SlideData;
  }
  let { data }: Props = $props();

  let screenshot = $derived(data.images?.[0] || '');
  let title = $derived(data.text?.[0] || '');
  let commentary = $derived(data.text?.[1] || '');
  let commentaryHtml = $derived(marked.parse(commentary, { async: false }) as string);
</script>

<BaseLayout>
  <div class="grid grid-cols-2 h-full">
    <div class="layout-image-screenshot flex items-center justify-center bg-gray-50 p-4">
      {#if screenshot}
        <img src={screenshot} alt="" class="max-w-full max-h-full object-contain rounded shadow-sm" />
      {:else if title}
        <div class="layout-text-title flex items-center justify-center w-full h-full p-8">
          <p class="text-2xl font-semibold text-gray-700 text-center leading-snug">{title}</p>
        </div>
      {:else}
        <div class="text-gray-300 text-sm">Article screenshot</div>
      {/if}
    </div>
    <div class="flex items-center p-8">
      <div class="layout-text-commentary prose prose-sm max-w-none">
        {#if title && screenshot}
          <p class="layout-text-title text-lg font-semibold mb-3">{title}</p>
        {/if}
        {@html commentaryHtml}
      </div>
    </div>
  </div>
</BaseLayout>

<style>
  .layout-image-screenshot {
  }
  .layout-text-title {
  }
  .layout-text-commentary {
  }
</style>
