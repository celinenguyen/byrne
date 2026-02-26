<script lang="ts">
  import type { SlideContent } from '../../lib/types';
  import BaseLayout from './BaseLayout.svelte';
  import MarkdownText from './MarkdownText.svelte';
  import { autoScale } from '../../lib/actions/autoScale';

  interface Props {
    content: SlideContent;
  }
  let { content }: Props = $props();

  let body = $derived(content.text?.[0] || '');
</script>

<BaseLayout>
  <div use:autoScale class="flex items-center justify-center h-full px-16 py-12">
    <div data-slot="text:body" class="body-text prose prose-lg max-w-3xl" style="font-family: var(--slide-font-body); color: var(--slide-color-primary)">
      <MarkdownText text={body} />
    </div>
  </div>
</BaseLayout>

<style>
  .body-text {
    font-size: calc(clamp(0.875rem, 2.5cqi, 1.25rem) * var(--auto-scale, 1));
  }
</style>
