<script lang="ts">
  import type { Slide } from '../lib/types';
  import { layouts } from './layouts/registry';

  interface Props {
    slide: Slide;
    context?: 'desktop' | 'mobile';
  }
  let { slide, context = 'desktop' }: Props = $props();

  let layoutDef = $derived(layouts[slide.layout]);
</script>

<div class="w-full shadow-sm rounded-sm overflow-hidden border border-border/50">
  {#if layoutDef}
    <svelte:component this={layoutDef.component} data={slide.data} {context} />
  {:else}
    <div class="aspect-video flex items-center justify-center bg-gray-100 text-gray-400 text-sm">
      Unknown layout: {slide.layout}
    </div>
  {/if}
</div>
