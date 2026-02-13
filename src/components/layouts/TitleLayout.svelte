<script lang="ts">
  import type { SlideData } from '../../lib/types';
  import BaseLayout from './BaseLayout.svelte';

  interface Props {
    data: SlideData;
    context?: 'desktop' | 'mobile';
  }
  let { data }: Props = $props();

  let title = $derived(data.text?.['1'] || '');
  let subtitle = $derived(data.text?.['2'] || '');
</script>

<BaseLayout>
  <div class="flex flex-col items-center justify-center h-full px-16 text-center">
    <h1 class="text-5xl font-bold tracking-tight text-gray-900 leading-tight">
      {title || 'Untitled'}
    </h1>
    {#if subtitle}
      <p class="mt-4 text-xl text-gray-500">{subtitle}</p>
    {/if}
  </div>
</BaseLayout>
