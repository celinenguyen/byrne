<script lang="ts">
  import type { SlideData } from '../../lib/types';
  import BaseLayout from './BaseLayout.svelte';
  import settings from './TitleLayout.json';

  interface Props {
    data: SlideData;
  }
  let { data }: Props = $props();

  let title = $derived(data.text?.[0] || '');
  let subtitle = $derived(data.text?.[1] || '');
</script>

<BaseLayout>
  <div class="flex flex-col items-center justify-center h-full px-16 text-center">
    <h1 data-slot="text:title" class="text-5xl font-bold tracking-tight text-foreground leading-tight">
      {title || settings.text.title.placeholder}
    </h1>
    {#if subtitle}
      <p data-slot="text:subtitle" class="mt-4 text-xl text-muted-foreground">{subtitle}</p>
    {/if}
  </div>
</BaseLayout>
