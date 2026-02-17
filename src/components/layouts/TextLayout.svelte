<script lang="ts">
  import type { SlideData } from '../../lib/types';
  import BaseLayout from './BaseLayout.svelte';
  import MarkdownText from './MarkdownText.svelte';

  interface Props {
    data: SlideData;
  }
  let { data }: Props = $props();

  let body = $derived(data.text?.[0] || '');
</script>

<BaseLayout>
  <div class="flex items-center justify-center h-full px-16 py-12">
    <div data-slot="text:body" class="prose prose-lg max-w-3xl" style="font-family: var(--slide-font-body); color: var(--slide-color-primary)">
      <MarkdownText text={body} />
    </div>
  </div>
</BaseLayout>
