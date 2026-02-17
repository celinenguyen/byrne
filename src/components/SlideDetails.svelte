<script lang="ts">
  import type { Slide, SlotMeta } from '../lib/types';
  import { updateSlide, focusSlot, activeSlot, deck, renameDeck, updateTheme } from '../lib/store';
  import { layouts, layoutList } from './layouts/registry';
  import { fontOptions, primaryColorOptions, accentColorOptions, defaultTheme } from '../lib/theme';
  import SlideDetailsSection from './SlideDetailsSection.svelte';
  import InputTypeAndEnter from './InputTypeAndEnter.svelte';
  import SlotLabel from './SlotLabel.svelte';
  import ColorPicker from './ColorPicker.svelte';
  import ImagePicker from './ImagePicker.svelte';
  import * as Field from '$lib/components/ui/field';
  import * as Item from './ui/item';

  interface Props {
    slide: Slide | null;
    onClose?: () => void;
  }
  let { slide, onClose }: Props = $props();

  let deckTitle = $state('');
  let meta = $derived($deck?.meta);

  // Keep the input in sync with the deck title (when deck changes)
  $effect(() => {
    deckTitle = meta?.title ?? '';
  });

  function handleRenameDeck() {
    const trimmed = deckTitle.trim();
    if (!trimmed || trimmed === meta?.title) return;
    renameDeck(trimmed);
  }

  let layoutDef = $derived(slide ? layouts[slide.layout] : null);

  // Collapsible sections
  let dataOpen = $state(true);
  let layoutOpen = $state(true);
  let themeOpen = $state(true);

  let currentTheme = $derived({ ...defaultTheme, ...($deck?.meta?.theme ?? {}) });

  // Track which image slot's popover should be open (set by focusSlot, cleared by popover close)
  let openImagePopoverIndex = $state<number | null>(null);

  // Watch focusSlot store to focus the matching field or open the image popover
  $effect(() => {
    const slot = $focusSlot;
    if (!slot) return;
    dataOpen = true;
    queueMicrotask(() => {
      if (slot.type === 'text') {
        const el = document.querySelector<HTMLElement>(
          `[data-slot-type="${slot.type}"][data-slot-index="${slot.index}"]`
        );
        if (el) {
          el.focus();
          el.scrollIntoView({ block: 'nearest' });
        }
      } else if (slot.type === 'image') {
        const el = document.querySelector<HTMLElement>(
          `[data-slot-type="image"][data-slot-index="${slot.index}"]`
        );
        if (el) el.scrollIntoView({ block: 'nearest' });
        openImagePopoverIndex = slot.index;
      }
      focusSlot.set(null);
    });
  });


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

<div class="inset-shadow-sm flex flex-col bg-muted/15">
  {#if slide}
    <SlideDetailsSection name="Deck">
      {#snippet children()}
        <InputTypeAndEnter
          placeholder="Deck name"
          bind:value={deckTitle}
          onsubmit={handleRenameDeck}
          ariaLabel="Rename deck"
        />
        <div class="flex flex-col gap-3">
          <Field.Root>
            <Field.Label class="lowercase">Headings</Field.Label>
            <Field.Content>
              <select
                class="w-full px-2 py-1.5 border border-border rounded-md text-sm bg-white"
                value={currentTheme.headingFont}
                onchange={(e) => updateTheme({ headingFont: e.currentTarget.value })}
              >
                {#each fontOptions as opt}
                  <option value={opt.id}>{opt.label}</option>
                {/each}
              </select>
            </Field.Content>
          </Field.Root>
          <Field.Root>
            <Field.Label class="lowercase">Body</Field.Label>
            <Field.Content>
              <select
                class="w-full px-2 py-1.5 border border-border rounded-md text-sm bg-white"
                value={currentTheme.bodyFont}
                onchange={(e) => updateTheme({ bodyFont: e.currentTarget.value })}
              >
                {#each fontOptions as opt}
                  <option value={opt.id}>{opt.label}</option>
                {/each}
              </select>
            </Field.Content>
          </Field.Root>
          <Field.Root>
            <Field.Label class="lowercase">Captions</Field.Label>
            <Field.Content>
              <select
                class="w-full px-2 py-1.5 border border-border rounded-md text-sm bg-white"
                value={currentTheme.captionFont}
                onchange={(e) => updateTheme({ captionFont: e.currentTarget.value })}
              >
                {#each fontOptions as opt}
                  <option value={opt.id}>{opt.label}</option>
                {/each}
              </select>
            </Field.Content>
          </Field.Root>
          <Field.Root>
            <Field.Label class="lowercase">Primary color</Field.Label>
            <Field.Content>
              <ColorPicker
                options={primaryColorOptions}
                value={currentTheme.primaryColor}
                onchange={(id) => updateTheme({ primaryColor: id })}
              />
            </Field.Content>
          </Field.Root>
          <Field.Root>
            <Field.Label class="lowercase">Accent color</Field.Label>
            <Field.Content>
              <ColorPicker
                options={accentColorOptions}
                value={currentTheme.accentColor}
                onchange={(id) => updateTheme({ accentColor: id })}
              />
            </Field.Content>
          </Field.Root>
        </div>
      {/snippet}
    </SlideDetailsSection>

    <SlideDetailsSection name="Content" open={dataOpen} onToggle={() => { dataOpen = !dataOpen; }} class='border-t'>
      {#snippet children()}
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
            <div class="flex items-center justify-between mb-2 gap-1 text-xs">
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
                class="w-full px-2 py-1.5 border border-border rounded-md text-sm leading-[1.5] bg-white resize-y min-h-24
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
        <!-- Image slots -->
        <ImagePicker
          slots={imageSlots}
          {slide}
          onUpdate={updateImage}
          openPopoverIndex={openImagePopoverIndex}
          onPopoverClose={() => { openImagePopoverIndex = null; }}
        />
      {/snippet}
    </SlideDetailsSection>

    <SlideDetailsSection name="Layout" open={layoutOpen} onToggle={() => { layoutOpen = !layoutOpen; }} class="border-t">
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
