<script lang="ts">
  import type { Slide } from '../lib/types';
  import { layouts, getSlotInfo } from './layouts/registry';
  import { focusSlot } from '../lib/store';

  interface Props {
    slide: Slide;
    interactive?: boolean;
  }
  let { slide, interactive = false }: Props = $props();

  let layoutDef = $derived(layouts[slide.layout]);

  // Hover state
  let hoveredEl = $state<HTMLElement | null>(null);
  let hoveredSlotInfo = $state<{ type: 'image' | 'text'; index: number; displayName: string } | null>(null);
  let containerEl = $state<HTMLElement | null>(null);

  // Overlay position (relative to container)
  let overlayStyle = $derived.by(() => {
    if (!hoveredEl || !containerEl || !hoveredSlotInfo) return '';
    const elRect = hoveredEl.getBoundingClientRect();
    const cRect = containerEl.getBoundingClientRect();
    const top = elRect.top - cRect.top;
    const left = elRect.left - cRect.left;
    return `top:${top}px;left:${left}px;width:${elRect.width}px;height:${elRect.height}px`;
  });

  function findSlotElement(target: EventTarget | null): { el: HTMLElement; info: { type: 'image' | 'text'; index: number; displayName: string } } | null {
    if (!target || !(target instanceof HTMLElement)) return null;
    let el: HTMLElement | null = target;
    while (el && el !== containerEl) {
      const info = getSlotInfo(slide.layout, el);
      if (info) return { el, info };
      el = el.parentElement;
    }
    return null;
  }

  function handleMouseOver(e: MouseEvent) {
    if (!interactive) return;
    const result = findSlotElement(e.target);
    if (result) {
      hoveredEl = result.el;
      hoveredSlotInfo = result.info;
    }
  }

  function handleMouseOut(e: MouseEvent) {
    if (!interactive) return;
    const related = e.relatedTarget as HTMLElement | null;
    if (!related || !containerEl?.contains(related)) {
      hoveredEl = null;
      hoveredSlotInfo = null;
    } else {
      // Check if the related target is still within the same slot
      const result = findSlotElement(related);
      if (!result || result.el !== hoveredEl) {
        hoveredEl = null;
        hoveredSlotInfo = null;
      }
    }
  }

  function handleClick(e: MouseEvent) {
    if (!interactive) return;
    const result = findSlotElement(e.target);
    if (result) {
      focusSlot.set({ type: result.info.type, index: result.info.index });
    }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="w-full shadow-sm rounded-sm overflow-hidden border border-border/50 relative"
  bind:this={containerEl}
  onmouseover={handleMouseOver}
  onmouseout={handleMouseOut}
  onclick={handleClick}
>
  {#if layoutDef}
    <svelte:component this={layoutDef.component} data={slide.data} />
  {:else}
    <div class="aspect-video flex items-center justify-center bg-gray-100 text-gray-400 text-sm">
      Unknown layout: {slide.layout}
    </div>
  {/if}

  {#if interactive && hoveredEl && hoveredSlotInfo && overlayStyle}
    <div
      class="absolute pointer-events-none"
      style="{overlayStyle};outline:2px solid #E8630A;outline-offset:-1px;z-index:10"
    >
      <div class="absolute top-0 right-0 bg-[#E8630A] text-white text-[10px] font-medium px-1.5 py-0.5 leading-tight">
        {hoveredSlotInfo.displayName}
      </div>
    </div>
  {/if}
</div>
