<script lang="ts">
  import type { Slide } from '../lib/types';
  import { layouts } from './layouts/registry';

  interface Props {
    slide: Slide;
    class?: string;
  }
  let { slide, class: className = '' }: Props = $props();

  let layoutDef = $derived(layouts[slide.layout]);

  // Reference size the layout renders at
  const REF_WIDTH = 960;
  const REF_HEIGHT = 540;

  // Measure actual container width to compute scale
  let containerWidth = $state(0);
  let scale = $derived(containerWidth > 0 ? containerWidth / REF_WIDTH : 0);
</script>

<div
  class="w-full overflow-hidden relative {className}"
  style="aspect-ratio:16/9"
  bind:clientWidth={containerWidth}
>
  {#if scale > 0 && layoutDef}
    {@const LayoutComponent = layoutDef.component}
    <div
      class="origin-top-left pointer-events-none"
      style="width:{REF_WIDTH}px;height:{REF_HEIGHT}px;transform:scale({scale})"
    >
      <LayoutComponent content={slide.content} />
    </div>
  {:else if !layoutDef}
    <div class="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-[8px]">
      {slide.layout}
    </div>
  {/if}
</div>
