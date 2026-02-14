<script lang="ts">
  import type { Slide } from '../lib/types';
  import { updateSlide, focusSlot, activeSlot } from '../lib/store';
  import { layouts, layoutList } from './layouts/registry';
  import ImageSlotThumbnail from './ImageSlotThumbnail.svelte';
  import SlideDetailsSection from './SlideDetailsSection.svelte';
  import SlotLabel from './SlotLabel.svelte';
  import * as Item from './ui/item';

  interface Props {
    slide: Slide | null;
    onClose?: () => void;
  }
  let { slide, onClose }: Props = $props();

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

  type SlotMeta = { index: number; isUsed: boolean; displayName: string; isRequired: boolean; hasContent: boolean };

  function buildSlots(
    schema: Record<string, { displayName: string; isRequired: boolean }> | undefined,
    dataArray: string[] | undefined,
    padTo: number = 2,
  ): SlotMeta[] {
    const used: SlotMeta[] = schema
      ? Object.values(schema).map((def, index) => ({
          index,
          isUsed: true,
          displayName: def.displayName,
          isRequired: def.isRequired,
          hasContent: !!dataArray?.[index],
        }))
      : [];
    for (let i = used.length; i < padTo; i++) {
      used.push({ index: i, isUsed: false, displayName: 'not used', isRequired: false, hasContent: !!dataArray?.[i] });
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

<div class="inset-shadow-sm flex flex-col bg-muted/5">
  {#if slide}
    <SlideDetailsSection name="Data" open={dataOpen} onToggle={() => { dataOpen = !dataOpen; }}>
      {#snippet children()}
        <!-- Image slots -->
        <div class="flex flex-row flex-wrap gap-4 w-full">
          {#each imageSlots as slot}
            <div
              class="flex flex-col gap-2 min-w-0 flex-1 max-w-[50%]"
              data-slot-type="image"
              data-slot-index={slot.index}
            >
              <!-- Label -->
              <div class="text-xs">
                <SlotLabel displayName={slot.displayName} isRequired={slot.isRequired} isUsed={slot.isUsed} />
              </div>
              <!-- Thumbnail area: max 50% container width, max-height 100px, clickable to open AddImagePopover -->
              <ImageSlotThumbnail slot={slot} slide={slide} onUpdate={updateImage} />
              </div>
          {/each}
        </div>
        <!-- Text slots -->
        {#each textSlots as slot}
          {@const wrapperClass = slot.isUsed
            ? (slot.hasContent ? 'used-in-layout has-content' : 'used-in-layout no-content-yet')
            : 'not-used-in-layout'}
          <div
            class="rounded-md transition-colors"
            data-slot-state={wrapperClass}
          >
            <!-- Header line -->
            <div class="flex items-center justify-between mb-1.5 gap-1 text-xs">
              <div>
                <SlotLabel displayName={slot.displayName} isRequired={slot.isRequired} isUsed={slot.isUsed} />
              </div>
            </div>

            <!-- Textarea: always shows slot data from slide.data.text.
                Used slot   + empty    → placeholder "Write with Markdown"
                Used slot   + has data → editable
                Unused slot + empty    → placeholder "Not used in this layout"
                            + has data → shows data as read-only -->
            <textarea
                class="w-full px-2 py-1.5 border border-border rounded-md text-xs bg-background resize-y min-h-[60px]
                  {slot.isUsed ? '' : 'opacity-50 bg-muted cursor-not-allowed'}"
                placeholder={slot.isUsed ? 'Write with Markdown' : slot.hasContent ? 'Not used in this layout' : ''}
                value={slide.data.text?.[slot.index] || ''}
                disabled={!slot.isUsed}
                data-slot-type="text"
                data-slot-index={slot.index}
                oninput={(e) => updateText(slot.index, e.currentTarget.value)}
                onfocus={() => activeSlot.set({ type: 'text', index: slot.index })}
                onblur={() => activeSlot.set(null)}
              ></textarea>
          </div>
        {/each}
      {/snippet}
    </SlideDetailsSection>

    <SlideDetailsSection name="Layout" class="border-t" open={layoutOpen} onToggle={() => { layoutOpen = !layoutOpen; }}>
      {#snippet children()}
        <div class="mt-2 grid grid-cols-2 gap-4">
          {#each layoutList as l}
            <Item.Root
              variant="outline"
              size="sm"
              class="border-border px-4 py-3 cursor-pointer {slide.layout === l.id ? 'border-stone-400 ring-3 ring-stone-200 bg-white' : 'hover:bg-accent opacity-80'}"
              onclick={() => changeLayout(l.id)}
            >
              <Item.Content>
                <Item.Title class="tracking-wide">{l.displayName}</Item.Title>
                {#if l.description}
                  <Item.Description class="text-xs leading-relaxed">{l.description}</Item.Description>
                {/if}
              </Item.Content>
            </Item.Root>
          {/each}
        </div>
      {/snippet}
    </SlideDetailsSection>
  {:else}
    <div class="px-4 py-6 text-sm text-muted-foreground">No slide selected</div>
  {/if}
</div>
