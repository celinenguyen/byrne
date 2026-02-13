<script lang="ts">
  import type { SlideData } from '../../lib/types';
  import BaseLayout from './BaseLayout.svelte';
  import { marked } from 'marked';

  interface Props {
    data: SlideData;
  }
  let { data }: Props = $props();

  let screenshot = $derived(data.images?.['screenshot'] || '');
  let commentary = $derived(data.text?.['commentary'] || '');
  let commentaryHtml = $derived(marked.parse(commentary, { async: false }) as string);
</script>

<BaseLayout>
  <div class="grid grid-cols-2 h-full">
    <div class="layout-image-screenshot flex items-center justify-center bg-gray-50 p-4">
      {#if screenshot}
        <img src={screenshot} alt="" class="max-w-full max-h-full object-contain rounded shadow-sm" />
      {:else}
        <div class="text-gray-300 text-sm">Article screenshot</div>
      {/if}
    </div>
    <div class="flex items-center p-8">
      <div class="layout-text-commentary prose prose-sm max-w-none">
        {@html commentaryHtml}
      </div>
    </div>
  </div>
</BaseLayout>

<style>
  .layout-image-screenshot {
  }
  .layout-text-commentary {
  }
</style>
