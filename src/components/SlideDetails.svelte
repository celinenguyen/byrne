<script lang="ts">
  import type { Slide } from '../lib/types';
  import { updateSlide, focusSlot } from '../lib/store';
  import { layouts, layoutList, formatSlotSummary } from './layouts/registry';
  import AddImagePopover from './AddImagePopover.svelte';
  import Icon from './ui/Icon.svelte';

  interface Props {
    slide: Slide | null;
    collapsed?: boolean;
    onClose?: () => void;
    onExpand?: () => void;
  }
  let { slide, collapsed = false, onClose, onExpand }: Props = $props();

  let layoutDef = $derived(slide ? layouts[slide.layout] : null);

  // Collapsible sections
  let dataOpen = $state(true);
  let layoutOpen = $state(true);

  // Watch focusSlot store to focus the matching field
  $effect(() => {
    const slot = $focusSlot;
    if (!slot) return;
    // Ensure data section is open
    dataOpen = true;
    // Use tick to wait for DOM update
    queueMicrotask(() => {
      const el = document.querySelector<HTMLElement>(
        `[data-slot-type="${slot.type}"][data-slot-index="${slot.index}"]`
      );
      if (el) {
        el.focus();
        el.scrollIntoView({ block: 'nearest' });
      }
      focusSlot.set(null);
    });
  });

  type SlotMeta = { index: number; isUsed: boolean; displayName: string; type: string; hasContent: boolean };

  function buildSlots(
    schema: Record<string, { displayName: string; type: string }> | undefined,
    dataArray: string[] | undefined,
    padTo: number = 2,
  ): SlotMeta[] {
    const used: SlotMeta[] = schema
      ? Object.values(schema).map((def, index) => ({
          index,
          isUsed: true,
          displayName: def.displayName,
          type: def.type,
          hasContent: !!dataArray?.[index],
        }))
      : [];
    for (let i = used.length; i < padTo; i++) {
      used.push({ index: i, isUsed: false, displayName: 'not used', type: 'optional', hasContent: false });
    }
    return used;
  }

  let imageSlots = $derived(buildSlots(layoutDef?.schema.images, slide?.data.images));
  let textSlots = $derived(buildSlots(layoutDef?.schema.text, slide?.data.text));

  function updateImage(index: number, value: string) {
    if (!slide) return;
    const images = [...slide.data.images];
    images[index] = value;
    updateSlide(slide.id, { data: { ...slide.data, images } });
  }

  function updateText(index: number, value: string) {
    if (!slide) return;
    const text = [...slide.data.text];
    text[index] = value;
    updateSlide(slide.id, { data: { ...slide.data, text } });
  }

  function changeLayout(layoutId: string) {
    if (!slide) return;
    updateSlide(slide.id, { layout: layoutId });
  }
</script>

{#if collapsed && onExpand}
  <!-- Collapsed: thin strip with expand button -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="group h-full shrink-0 flex flex-col items-center border-l border-border bg-muted/20 hover:bg-muted/40 px-1 pt-2 cursor-pointer transition-colors"
    onclick={onExpand}
    role="button"
    tabindex="0"
    title="Expand panel"
    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') onExpand(); }}
  >
    <Icon name="chevron-left" size={14} class="text-muted-foreground group-hover:text-foreground transition-colors" />
    <span class="text-sm uppercase tracking-wider font-medium text-muted-foreground group-hover:text-foreground mt-2 [writing-mode:vertical-lr] transition-colors">Edit slide</span>
  </div>
{:else}
<div class="inset-shadow-sm flex flex-col bg-muted/5">
  {#if onClose}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class="group flex items-center justify-between sticky top-0 z-10 bg-white/40 px-3 py-4 border-b border-border backdrop-blur-sm cursor-pointer hover:bg-muted/50 transition-colors"
      onclick={onClose}
      role="button"
      tabindex="0"
      title="Collapse panel"
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClose(); }}
    >
      <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Edit slide</span>
      <Icon name="chevron-right" size={14} class="text-muted-foreground group-hover:text-foreground transition-colors" />
    </div>
  {/if}
  {#if slide}
  <!-- Data Section -->
  <div>
    <button
      class="w-full px-4 py-3 flex items-center gap-1 font-semibold text-xs uppercase tracking-widest text-muted-foreground w-full cursor-pointer"
      onclick={() => { dataOpen = !dataOpen; }}
    >
      Data
      <Icon name="chevron-right" size={15} class="transition-transform {dataOpen ? 'rotate-90' : ''}" />
    </button>
    {#if dataOpen}
      <div class="px-4">
        <!-- Image slots -->
        <div class="flex flex-col gap-6">
          <div class="text-sm text-muted-foreground -mb-2">Images</div>
          <div class="flex flex-row gap-2 w-full mb-6">
            {#each imageSlots as slot}
              <div
                class="flex flex-col items-center gap-1 rounded-md -m-2 p-2 transition-colors
                  {slot.isUsed ? 'bg-stone-50' : 'border-l-2 border-l-transparent opacity-50'}"
                data-slot-type="image"
                data-slot-index={slot.index}
              >
                <!-- Thumbnail area -->
                {#if slot.isUsed}
                  {#if slot.hasContent}
                    <AddImagePopover slotIndex={slot.index} onimage={updateImage}>
                      {#snippet trigger()}
                        <div class="flex-shrink-0 w-[60px] h-[45px] rounded overflow-hidden bg-muted/30 cursor-pointer border border-border hover:border-primary/50 transition-colors" title="Replace image">
                          <img
                            src={slide.data.images[slot.index]}
                            alt=""
                            class="w-full h-full object-cover"
                          />
                        </div>
                      {/snippet}
                    </AddImagePopover>
                  {:else}
                    <AddImagePopover slotIndex={slot.index} onimage={updateImage} />
                  {/if}
                {:else}
                  <div class="flex-shrink-0 w-[60px] h-[45px] rounded bg-muted/20 border border-dashed border-border/50"></div>
                {/if}

                <!-- Label area -->
                <div class="flex-1 min-w-0">
                  {#if slot.isUsed}
                    <span class="text-xs font-medium">{slot.displayName}</span>
                    {#if slot.type === 'optional'}
                      <span class="ml-1 text-[9px] rounded px-1 py-0.5 bg-muted text-muted-foreground">optional</span>
                    {/if}
                  {:else}
                    <span class="text-xs text-muted-foreground/60 italic">not used</span>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Text slots -->
        <div class="space-y-2">
          <div class="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Text</div>
          {#each textSlots as slot}
            {@const wrapperClass = slot.isUsed
              ? (slot.hasContent ? 'used-in-layout has-content' : 'used-in-layout no-content-yet')
              : 'not-used-in-layout'}
            <div
              class="rounded-md px-1.5 py-1 transition-colors
                {slot.isUsed ? 'border-l-2 border-l-primary' : 'border-l-2 border-l-transparent opacity-50'}"
              data-slot-state={wrapperClass}
            >
              <!-- Header line -->
              <div class="flex items-center justify-between mb-1">
                <div>
                  {#if slot.isUsed}
                    <span class="text-xs font-medium">{slot.displayName}</span>
                    {#if slot.type === 'optional'}
                      <span class="text-xs text-muted-foreground">(optional)</span>
                    {/if}
                  {:else}
                    <span class="text-xs text-muted-foreground/60 italic">not used</span>
                  {/if}
                </div>
              </div>

              <!-- Textarea -->
              <textarea
                  class="w-full px-2 py-1.5 border border-border rounded-md text-xs bg-background resize-y min-h-[60px] font-mono
                    {slot.isUsed ? '' : 'opacity-50 bg-muted cursor-not-allowed'}"
                  placeholder={slot.isUsed ? 'Markdown supported...' : ''}
                  value={slot.isUsed ? (slide.data.text?.[slot.index] || '') : ''}
                  disabled={!slot.isUsed}
                  data-slot-type="text"
                  data-slot-index={slot.index}
                  oninput={(e) => updateText(slot.index, e.currentTarget.value)}
                ></textarea>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <hr class="border-border" />

  <!-- Layout Section -->
  <div>
    <button
      class="flex items-center gap-1 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-full cursor-pointer"
      onclick={() => { layoutOpen = !layoutOpen; }}
    >
      <Icon name="chevron-right" size={12} class="transition-transform {layoutOpen ? 'rotate-90' : ''}" />
      Layout
    </button>
    {#if layoutOpen}
      <div class="mt-2 space-y-1">
        {#each layoutList as l}
          <button
            class="w-full px-3 py-2 rounded-md text-left transition-colors cursor-pointer
              {slide.layout === l.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-foreground'}"
            onclick={() => changeLayout(l.id)}
          >
            <div class="font-medium text-xs">{l.displayName}</div>
            {#if l.description}
              <div class="{slide.layout === l.id ? 'opacity-70' : 'text-muted-foreground'} text-[10px] mt-0.5">{l.description}</div>
            {/if}
            <div class="{slide.layout === l.id ? 'opacity-60' : 'text-muted-foreground/60'} text-[9px] mt-0.5">{formatSlotSummary(l.schema)}</div>
          </button>
        {/each}
      </div>
    {/if}
  </div>

  {:else}
    <div class="px-4 py-6 text-sm text-muted-foreground">No slide selected</div>
  {/if}
</div>
{/if}
