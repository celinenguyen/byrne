<script lang="ts">
  import type { Slide } from '../lib/types';
  import SlideView from './SlideView.svelte';

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
<!-- Minimal nav overlay -->
<div class="fixed bottom-4 left-1/2 -translate-x-1/2 text-sm flex flex-row gap-4 items-center justify-center text-white/50 tracking-wide">
  <div class="bg-black/60 px-4 py-2 rounded-full text-white/50">
    <span class="text-white/80"> {currentIndex + 1}</span><span class="mx-1">/</span>{slideCount}
  </div>
  <div class="bg-black/60 px-4 py-2 rounded-full">
    <kbd class="kbd text-xs mr-1 rounded-sm px-1 py-1 text-white/80 bg-white/20 border border-white/20 font-sans backdrop-blur-md">Esc</kbd> to exit
  </div>
</div>
