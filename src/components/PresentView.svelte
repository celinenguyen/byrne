<script lang="ts">
  import type { Slide } from '../lib/types';
  import SlideView from './SlideView.svelte';
  import PreviewPresentToolbar from './PreviewPresentToolbar.svelte';

  interface Props {
    slide: Slide | null;
    currentIndex: number;
    slideCount: number;
  }
  let { slide, currentIndex, slideCount }: Props = $props();
</script>

<!-- Present: full viewport single slide -->
<div class="w-full h-full flex items-center justify-center bg-black px-2">
  {#if slide}
    <div
      style="width: min(100%, calc((100vh - 20px) * 16 / 9)); height: min(100%, calc((100vw - 20px) * 9 / 16));"
    >
      <SlideView {slide} mode="present" />
    </div>
  {:else}
    <div class="text-white/50 text-sm">No slides. Press Escape to exit.</div>
  {/if}
</div>
<PreviewPresentToolbar {currentIndex} {slideCount} />
