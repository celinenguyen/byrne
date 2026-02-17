<script lang="ts">
  import type { SlideContent } from '../../lib/types';
  import BaseLayout from './BaseLayout.svelte';
  import MarkdownText from './MarkdownText.svelte';

  interface Props {
    content: SlideContent;
  }
  let { content }: Props = $props();

  let body = $derived(content.text?.[0] || '');
</script>

<BaseLayout>
  <div class="flex items-center justify-center h-full px-16 py-12">
    <div data-slot="text:body" class="prose prose-lg max-w-3xl" style="font-family: var(--slide-font-body); color: var(--slide-color-primary)">
      <MarkdownText text={body} />
    </div>
  </div>
</BaseLayout>
