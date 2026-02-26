<script lang="ts">
  import type { SlideContent } from '../../lib/types';
  import BaseLayout from './BaseLayout.svelte';
  import MarkdownText from './MarkdownText.svelte';
  import settings from './TitleLayout.json';
  import { autoScale } from '../../lib/actions/autoScale';

  interface Props {
    content: SlideContent;
  }
  let { content }: Props = $props();

  let title = $derived(content.text?.[0] || '');
  let subtitle = $derived(content.text?.[1] || '');
</script>

<BaseLayout>
  <div class="@container flex flex-col items-center justify-center h-full px-16 text-center">
    <div
      use:autoScale
      class="flex flex-col items-center justify-center max-h-full"
    >
      <div
        data-slot="text:title"
        class="title-text [&_p+p]:mt-[0.6em]"
        style="font-family: var(--slide-font-heading); font-weight: var(--slide-heading-weight); line-height: var(--slide-heading-line-height); letter-spacing: var(--slide-heading-tracking); color: var(--slide-color-primary); text-wrap: balance;"
      > <!-- the [&_p+p]: adds a top margin for consecutive paragraphs -->
        <MarkdownText text={title || settings.text.title.placeholder} />
      </div>
      {#if subtitle}
        <div
          data-slot="text:subtitle"
          class="subtitle-text mt-6 [&_p+p]:mt-[0.5em]"
          style="font-family: var(--slide-font-body); color: var(--slide-color-primary);"
        >
          <MarkdownText text={subtitle} />
        </div>
      {/if}
    </div>
  </div>
</BaseLayout>

<style>
  .title-text {
    font-size: calc(clamp(1.5rem, 5cqi, 3rem) * var(--auto-scale, 1));
    line-height: 1.2;
  }
  .subtitle-text {
    font-size: calc(clamp(1.2rem, 2.5cqi, 1.5rem) * var(--auto-scale, 1));
    line-height: 1.4;
  }
</style>
