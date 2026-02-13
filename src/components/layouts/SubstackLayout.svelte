<script lang="ts">
  import type { SlideData } from '../../lib/types';
  import BaseLayout from './BaseLayout.svelte';
  import { marked } from 'marked';
  import settings from './SubstackLayout.json';

  interface Props {
    data: SlideData;
  }
  let { data }: Props = $props();

  let thumbnail = $derived(data.images?.[0] || '');
  let title = $derived(data.text?.[0] || '');
  let excerpt = $derived(data.text?.[1] || '');
  let excerptHtml = $derived(marked.parse(excerpt, { async: false }) as string);
</script>

<BaseLayout>
  <div class="flex items-center justify-center h-full p-8 bg-orange-50/30">
    <div class="max-w-md w-full bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      {#if thumbnail}
        <div class="layout-image-thumbnail">
          <img src={thumbnail} alt="" class="w-full h-40 object-cover" />
        </div>
      {/if}
      <div class="p-5">
        <h3 class="layout-text-title text-lg font-semibold text-gray-900">{title || settings.text.title.placeholder}</h3>
        {#if excerpt}
          <div class="layout-text-excerpt mt-2 text-sm text-gray-500 prose prose-sm max-w-none">{@html excerptHtml}</div>
        {/if}
      </div>
    </div>
  </div>
</BaseLayout>

<style>
  .layout-image-thumbnail {
  }
  .layout-text-title {
  }
  .layout-text-excerpt {
  }
</style>
