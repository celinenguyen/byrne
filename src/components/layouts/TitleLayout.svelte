<script lang="ts">
  import type { SlideContent } from '../../lib/types';
  import BaseLayout from './BaseLayout.svelte';
  import MarkdownText from './MarkdownText.svelte';
  import settings from './TitleLayout.json';

  interface Props {
    content: SlideContent;
  }
  let { content }: Props = $props();

  let title = $derived(content.text?.[0] || '');
  let subtitle = $derived(content.text?.[1] || '');

  let textWrapper: HTMLDivElement | undefined = $state();
  let titleScale = $state(1);
  let showScroll = $state(false);

  $effect(() => {
    if (!textWrapper) return;

    const el = textWrapper;

    function checkOverflow() {
      // Reset scale to measure natural size
      titleScale = 1;
      showScroll = false;

      // Wait a frame for the reset to apply before measuring
      requestAnimationFrame(() => {
        if (!el) return;
        const { scrollHeight, clientHeight } = el;
        if (scrollHeight > clientHeight && clientHeight > 0) {
          const scale = Math.max(0.5, clientHeight / scrollHeight);
          titleScale = scale;
          // If still overflowing at minimum scale, enable scroll
          if (scale <= 0.5) {
            requestAnimationFrame(() => {
              if (el.scrollHeight > el.clientHeight) {
                showScroll = true;
              }
            });
          }
        }
      });
    }

    const ro = new ResizeObserver(checkOverflow);
    ro.observe(el);

    // Also re-check when content changes
    checkOverflow();

    return () => ro.disconnect();
  });
</script>

<BaseLayout>
  <div class="@container flex flex-col items-center justify-center h-full px-16 text-center">
    <div
      bind:this={textWrapper}
      class="flex flex-col items-center justify-center max-h-full"
      style:--title-scale={titleScale}
      style:overflow-y={showScroll ? 'auto' : 'hidden'}
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
          class="subtitle-text mt-4 [&_p+p]:mt-[0.5em]"
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
    font-size: calc(clamp(1.5rem, 5cqi, 3rem) * var(--title-scale, 1));
    line-height: 1.2;
  }
  .subtitle-text {
    font-size: calc(clamp(0.875rem, 2.5cqi, 1.25rem) * var(--title-scale, 1));
    line-height: 1.4;
  }
</style>
