<script lang="ts">
  import type { Slide } from '../lib/types';
  import SlideView from './SlideView.svelte';
  import PreviewPresentToolbar from './PreviewPresentToolbar.svelte';
  import { exitPresent } from '../lib/store';

  interface Props {
    slide: Slide | null;
    currentIndex: number;
    slideCount: number;
  }
  let { slide, currentIndex, slideCount }: Props = $props();
</script>

<!-- Present: full viewport single slide. Click black background to exit. -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  class="w-full h-full flex items-center justify-center bg-black px-2 cursor-pointer"
  onclick={() => exitPresent()}
  role="button"
  tabindex="-1"
>
  {#if slide}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class="cursor-default"
      style="width: min(100%, calc((100vh - 20px) * 16 / 9)); height: min(100%, calc((100vw - 20px) * 9 / 16));"
      onclick={(e) => e.stopPropagation()}
      role="presentation"
    >
      <SlideView {slide} mode="present" />
    </div>
  {:else}
    <div class="text-white/50 text-sm">No slides. Press Escape to exit.</div>
  {/if}
</div>
<PreviewPresentToolbar {currentIndex} {slideCount} />
