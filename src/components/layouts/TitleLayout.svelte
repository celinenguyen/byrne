<script lang="ts">
  import type { SlideData } from '../../lib/types';
  import BaseLayout from './BaseLayout.svelte';
  import settings from './TitleLayout.settings.json';

  interface Props {
    data: SlideData;
  }
  let { data }: Props = $props();

  let title = $derived(data.text?.['title'] || '');
  let subtitle = $derived(data.text?.['subtitle'] || '');
</script>

<BaseLayout>
  <div class="flex flex-col items-center justify-center h-full px-16 text-center">
    <h1 class="layout-text-title text-5xl font-bold tracking-tight text-gray-900 leading-tight">
      {title || settings.text.title.placeholder}
    </h1>
    {#if subtitle}
      <p class="layout-text-subtitle mt-4 text-xl text-gray-500">{subtitle}</p>
    {/if}
  </div>
</BaseLayout>

<style>
  .layout-text-title {
  }
  .layout-text-subtitle {
  }
</style>
