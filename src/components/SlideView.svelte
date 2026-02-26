<script lang="ts">
  import { onDestroy, tick } from 'svelte';
  import type { Slide, PointComment } from '../lib/types';
  import { layouts, getSlotInfo } from './layouts/registry';
  import { focusSlot, activeSlot, detailsOpen, resolvedTheme, updateSlide } from '../lib/store';
  import { slideColorOverrideStyle } from '../lib/theme';
  import DeleteSlideButton from './DeleteSlideButton.svelte';
  import PointCommentOverlay from './PointCommentOverlay.svelte';

  interface Props {
    slide: Slide;
    current?: boolean;      // visual "current slide" indicator (border + shadow)
    interactive?: boolean;  // edit-only: slot highlights, delete button, click-to-focus
    mode?: 'edit' | 'preview' | 'present';
    class?: string;
  }
  let { slide, current = false, interactive = false, mode = 'edit', class: className }: Props = $props();

  // Only dim (opacity-50) non-current slides in edit mode; never in present mode
  let dimmed = $derived(!current && mode === 'edit');

  let layoutDef = $derived(layouts[slide.layout]);

  let deckThemeStyle = $derived(
    Object.entries($resolvedTheme)
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ')
  );

  let slideOverrideStyle = $derived(slideColorOverrideStyle(
    slide.style,
    $resolvedTheme['--slide-color-primary'],
    $resolvedTheme['--slide-color-bg'],
  ));

  let themeStyle = $derived(
    slideOverrideStyle ? `${deckThemeStyle}; ${slideOverrideStyle}` : deckThemeStyle
  );

  // --- Slot highlight overlay ---
  //
  // The orange overlay border + label (e.g. "title", "left caption") highlights
  // whichever layout slot the user is interacting with. Three sources drive it,
  // checked in priority order:
  //
  //   1. hoveredEl/hoveredSlotInfo  – mouse is over a slot in the slide preview
  //   2. activeSlotResult           – a textarea in SlideDetails has focus (via
  //                                   the activeSlot store, set on textarea focus)
  //   3. pinnedEl/pinnedSlotInfo    – bridges the gap when the user clicks a slot
  //                                   and focus is transitioning to the textarea
  //
  // The "pinned" state exists because clicking a slot triggers this sequence:
  //   click → focusSlot.set() → (microtask) textarea.focus() → focusout on
  //   SlideView clears hoveredEl → textarea onfocus sets activeSlot
  // Without pinning, the overlay would briefly disappear in that gap.

  let hoveredEl = $state<HTMLElement | null>(null);
  let hoveredSlotInfo = $state<{ type: 'image' | 'text'; index: number; displayName: string } | null>(null);
  let containerEl = $state<HTMLElement | null>(null);

  let pinnedEl = $state<HTMLElement | null>(null);
  let pinnedSlotInfo = $state<{ type: 'image' | 'text'; index: number; displayName: string } | null>(null);

  // Once the textarea is focused and activeSlot takes over, pinned is no longer needed
  $effect(() => {
    if ($activeSlot) {
      pinnedEl = null;
      pinnedSlotInfo = null;
    }
  });

  // Look up a slot's DOM element inside the rendered layout by type and index
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

  // Reactively resolve the slot element for whichever textarea is focused in SlideDetails
  let activeSlotResult = $derived.by(() => {
    const slot = $activeSlot;
    if (!slot || !interactive || !containerEl) return null;
    return findSlotByTypeIndex(slot.type, slot.index);
  });

  let highlightEl = $derived(hoveredEl ?? activeSlotResult?.el ?? pinnedEl ?? null);
  let highlightInfo = $derived(hoveredSlotInfo ?? activeSlotResult?.info ?? pinnedSlotInfo ?? null);

  // Track size changes on the highlighted element (e.g. text reflow as user types)
  // so the overlay repositions correctly without waiting for slide.content to change
  let resizeTick = $state(0);
  let resizeObserver: ResizeObserver | null = null;

  $effect(() => {
    resizeObserver?.disconnect();
    if (!highlightEl) return;
    resizeObserver = new ResizeObserver(() => { resizeTick++; });
    resizeObserver.observe(highlightEl);
  });

  onDestroy(() => resizeObserver?.disconnect());

  // Compute overlay position relative to the slide container.
  // Re-runs when slide content changes, the element resizes, or the highlight target changes.
  let overlayStyle = $derived.by(() => {
    slide.content;
    resizeTick;
    if (!highlightEl || !containerEl || !highlightInfo) return '';
    const elRect = highlightEl.getBoundingClientRect();
    const cRect = containerEl.getBoundingClientRect();
    // the -1 and +1 offsets here make the overlay line up exactly with the edges of the slides
    const top = elRect.top - cRect.top - 1;
    const left = elRect.left - cRect.left - 1;
    return `top:${top}px;left:${left}px;width:${elRect.width + 1}px;height:${elRect.height + 1}px`;
  });

  // Walk up from an event target to find the nearest layout slot element
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

  // --- Mouse/focus event handlers ---
  // These manage hoveredEl, which is the highest-priority highlight source.

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
    // Only clear if the mouse left the container entirely or moved to a different slot
    if (!related || !containerEl?.contains(related)) {
      hoveredEl = null;
      hoveredSlotInfo = null;
    } else {
      const result = findSlotElement(related);
      if (!result || result.el !== hoveredEl) {
        hoveredEl = null;
        hoveredSlotInfo = null;
      }
    }
  }

  // Focus events mirror mouse events so keyboard navigation also highlights slots
  function handleFocusIn(e: FocusEvent) {
    if (!interactive) return;
    const result = findSlotElement(e.target);
    if (result) {
      hoveredEl = result.el;
      hoveredSlotInfo = result.info;
    }
  }

  function handleFocusOut(e: FocusEvent) {
    if (!interactive) return;
    const related = e.relatedTarget as HTMLElement | null;
    if (!related || !containerEl?.contains(related)) {
      hoveredEl = null;
      hoveredSlotInfo = null;
    } else {
      const result = findSlotElement(related);
      if (!result || result.el !== hoveredEl) {
        hoveredEl = null;
        hoveredSlotInfo = null;
      }
    }
  }

  // Click a slot → open the details panel and focus the corresponding textarea.
  // Pin the highlight so it doesn't flash off during the async focus transition.
  function handleClick(e: MouseEvent) {
    if (!interactive) return;
    if (e.metaKey || e.ctrlKey) return; // Cmd+Click is for comment placement
    const result = findSlotElement(e.target);
    if (result) {
      pinnedEl = result.el;
      pinnedSlotInfo = result.info;
      detailsOpen.set(true);
      focusSlot.set({ type: result.info.type, index: result.info.index });
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!interactive || (e.key !== 'Enter' && e.key !== ' ')) return;
    // Don't intercept when typing in a text field (e.g. comment textarea)
    const el = e.target;
    if (el instanceof HTMLElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
    e.preventDefault();
    const result = findSlotElement(e.target);
    if (result) {
      focusSlot.set({ type: result.info.type, index: result.info.index });
    }
  }

  // --- Point comment overlays for image slots ---
  let imageSlots = $state<{ el: HTMLElement; index: number }[]>([]);

  // Discover image slot elements inside the layout
  $effect(() => {
    // Re-run when content or layout changes
    slide.content;
    slide.layout;
    containerEl;
    tick().then(() => {
      if (!containerEl) { imageSlots = []; return; }
      const els = containerEl.querySelectorAll<HTMLElement>('[data-slot^="image:"]');
      imageSlots = Array.from(els).map((el) => {
        const info = getSlotInfo(slide.layout, el);
        return { el, index: info?.index ?? 0 };
      });
    });
  });

  let slideComments = $derived(slide.content.comments ?? []);

  function handleCommentsChange(newComments: PointComment[]) {
    updateSlide(slide.id, {
      content: { ...slide.content, comments: newComments },
    });
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="p-4 rounded-md group relative h-full {className ?? ''}">
  <!-- svelte-ignore a11y_mouse_events_have_key_events -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div
    tabindex={interactive ? 0 : undefined}
    class="w-full h-full rounded-xs relative shadow-sm {mode === 'present' ? 'border-0' : 'border border-border'} {current ? 'border-1 border-stone-300 shadow-md' : dimmed ? 'opacity-50' : ''}"
    style={themeStyle}
    bind:this={containerEl}
    onmouseover={handleMouseOver}
    onmouseout={handleMouseOut}
    onfocusin={handleFocusIn}
    onfocusout={handleFocusOut}
    onclick={handleClick}
    onkeydown={handleKeyDown}
  >
    {#if layoutDef}
      {@const Component = layoutDef.component}
      <Component content={slide.content} />
    {:else}
      <div class="aspect-video w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-sm">
        Unknown layout: {slide.layout}
      </div>
    {/if}

    {#if interactive && highlightEl && highlightInfo && overlayStyle}
      <div
        class="absolute pointer-events-none rounded-xs outline-1 -outline-offset-1 z-10"
        style="{overlayStyle}; outline-color: color-mix(in oklch, var(--slide-color-accent), transparent 50%)"
      >
        <div class="absolute -top-[0.6rem] -right-[0.4rem] rounded-[0.8rem] text-white text-xs px-2 py-1 leading-tight" style="background-color: var(--slide-color-accent)">
          {highlightInfo.displayName}
        </div>
      </div>
    {/if}

    {#each imageSlots as slot (slot.index)}
      {#if containerEl}
        <PointCommentOverlay
          comments={slideComments}
          slotIndex={slot.index}
          slideId={slide.id}
          {mode}
          slotEl={slot.el}
          {containerEl}
          onCommentsChange={handleCommentsChange}
        />
      {/if}
    {/each}
  </div>
  {#if interactive}
    <DeleteSlideButton slideId={slide.id} class="top-1 right-1" />
  {/if}
</div>