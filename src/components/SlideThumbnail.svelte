<script lang="ts">
  import type { Slide } from '../lib/types';
  import { layouts } from './layouts/registry';

  interface Props {
    slide: Slide;
  }
  let { slide }: Props = $props();

  let layoutDef = $derived(layouts[slide.layout]);

  // Reference size the layout renders at
  const REF_WIDTH = 960;
  const REF_HEIGHT = 540;

  // Measure actual container width to compute scale
  let containerWidth = $state(0);
  let scale = $derived(containerWidth > 0 ? containerWidth / REF_WIDTH : 0);
</script>

<div
  class="w-full overflow-hidden relative rounded-sm border border-border/30"
  style="aspect-ratio:16/9"
  bind:clientWidth={containerWidth}
>
  {#if scale > 0 && layoutDef}
    <div
      class="origin-top-left pointer-events-none"
      style="width:{REF_WIDTH}px;height:{REF_HEIGHT}px;transform:scale({scale})"
    >
      <svelte:component this={layoutDef.component} data={slide.data} />
    </div>
  {:else if !layoutDef}
    <div class="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-[8px]">
      {slide.layout}
    </div>
  {/if}
</div>
