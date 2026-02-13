<script lang="ts">
  import type { Slide } from '../lib/types';
  import { layouts, getSlotInfo } from './layouts/registry';
  import { focusSlot, activeSlot } from '../lib/store';
  import DeleteSlideButton from './DeleteSlideButton.svelte';

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

  // Find a slot's DOM element and info by type+index
  function findSlotByTypeIndex(type: 'image' | 'text', index: number): { el: HTMLElement; info: { type: 'image' | 'text'; index: number; displayName: string } } | null {
    if (!containerEl) return null;
    const prefix = type === 'image' ? 'layout-image-' : 'layout-text-';
    const schema = type === 'image' ? layoutDef?.schema.images : layoutDef?.schema.text;
    if (!schema) return null;
    const keys = Object.keys(schema);
    const slotName = keys[index];
    if (!slotName) return null;
    const el = containerEl.querySelector<HTMLElement>(`.${prefix}${slotName}`);
    if (!el) return null;
    return { el, info: { type, index, displayName: schema[slotName].displayName } };
  }

  // Active slot from focused input in SlideDetails
  let activeSlotResult = $derived.by(() => {
    const slot = $activeSlot;
    if (!slot || !interactive || !containerEl) return null;
    return findSlotByTypeIndex(slot.type, slot.index);
  });

  // Highlight is hover (priority) or active slot
  let highlightEl = $derived(hoveredEl ?? activeSlotResult?.el ?? null);
  let highlightInfo = $derived(hoveredSlotInfo ?? activeSlotResult?.info ?? null);

  // Overlay position (relative to container)
  let overlayStyle = $derived.by(() => {
    if (!highlightEl || !containerEl || !highlightInfo) return '';
    const elRect = highlightEl.getBoundingClientRect();
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
<div class="p-4 rounded-md group relative h-full">
  <div
    class="w-full h-full shadow-md rounded-xs overflow-hidden relative"
    bind:this={containerEl}
    onmouseover={handleMouseOver}
    onmouseout={handleMouseOut}
    onclick={handleClick}
  >
    {#if layoutDef}
      <svelte:component this={layoutDef.component} data={slide.data} />
    {:else}
      <div class="aspect-video flex items-center justify-center bg-muted text-muted-foreground text-sm">
        Unknown layout: {slide.layout}
      </div>
    {/if}

    {#if interactive && highlightEl && highlightInfo && overlayStyle}
      <div
        class="absolute pointer-events-none rounded-xs outline-1 outline-orange-500/50 -outline-offset-1 z-10"
        style="{overlayStyle}"
      >
        <div class="absolute -top-[0.6rem] -right-[0.4rem] rounded-[0.8rem] bg-orange-600 text-white text-xs px-2 py-1 leading-tight">
          {highlightInfo.displayName}
        </div>
      </div>
    {/if}
  </div>
  {#if interactive}
    <DeleteSlideButton slideId={slide.id} />
  {/if}
</div>