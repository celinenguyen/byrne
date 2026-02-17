<script lang="ts">
  import type { SlideData } from '../../lib/types';
  import BaseLayout from './BaseLayout.svelte';
  import MarkdownText from './MarkdownText.svelte';
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
    <h1 data-slot="text:title" class="text-5xl leading-tight" style="font-family: var(--slide-font-heading); font-weight: var(--slide-heading-weight); letter-spacing: var(--slide-heading-tracking); color: var(--slide-color-primary)">
      <MarkdownText text={title || settings.text.title.placeholder} inline />
    </h1>
    {#if subtitle}
      <p data-slot="text:subtitle" class="mt-4 text-xl text-muted-foreground" style="font-family: var(--slide-font-body)"><MarkdownText text={subtitle} inline /></p>
    {/if}
  </div>
</BaseLayout>
