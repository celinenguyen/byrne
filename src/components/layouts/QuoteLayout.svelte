<script lang="ts">
  import type { SlideData } from '../../lib/types';
  import BaseLayout from './BaseLayout.svelte';

  interface Props {
    data: SlideData;
    context?: 'desktop' | 'mobile';
  }
  let { data }: Props = $props();

  let quote = $derived(data.text?.['1'] || '');
  let attribution = $derived(data.text?.['2'] || '');
</script>

<BaseLayout>
  <div class="flex flex-col items-center justify-center h-full px-16 py-12">
    <blockquote class="text-2xl font-light text-gray-800 text-center leading-relaxed max-w-2xl italic">
      &ldquo;{quote || 'Quote text'}&rdquo;
    </blockquote>
    {#if attribution}
      <p class="mt-6 text-sm text-gray-400 tracking-wide uppercase">&mdash; {attribution}</p>
    {/if}
  </div>
</BaseLayout>
