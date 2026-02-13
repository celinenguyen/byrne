<script lang="ts">
  import type { SlideData } from '../../lib/types';
  import BaseLayout from './BaseLayout.svelte';
  import settings from './QuoteLayout.settings.json';

  interface Props {
    data: SlideData;
  }
  let { data }: Props = $props();

  let quote = $derived(data.text?.['quote'] || '');
  let attribution = $derived(data.text?.['attribution'] || '');
</script>

<BaseLayout>
  <div class="flex flex-col items-center justify-center h-full px-16 py-12">
    <blockquote class="layout-text-quote text-2xl font-light text-gray-800 text-center leading-relaxed max-w-2xl italic">
      &ldquo;{quote || settings.text.quote.placeholder}&rdquo;
    </blockquote>
    {#if attribution}
      <p class="layout-text-attribution mt-6 text-sm text-gray-400 tracking-wide uppercase">&mdash; {attribution}</p>
    {/if}
  </div>
</BaseLayout>

<style>
  .layout-text-quote {
  }
  .layout-text-attribution {
  }
</style>
