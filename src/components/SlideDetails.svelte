<script lang="ts">
  import type { Slide, SlotMeta, SlideStyle } from '../lib/types';
  import { updateSlide, focusSlot, activeSlot, deck, renameDeck, updateTheme, deleteDeck, currentDeckFile, staticMode } from '../lib/store';
  import { layouts } from './layouts/registry';
  import LayoutGrid from './LayoutGrid.svelte';
  import { fontOptions, fontsForRole, primaryColorOptions, backgroundColorOptions, accentColorOptions, defaultTheme } from '../lib/theme';
  import SlideDetailsSection from './SlideDetailsSection.svelte';
  import InputTypeAndEnter from './InputTypeAndEnter.svelte';
  import SlotLabel from './SlotLabel.svelte';
  import ColorPicker from './ColorPicker.svelte';
  import ImagePicker from './ImagePicker.svelte';
  import Ellipsis from '@lucide/svelte/icons/ellipsis';
  import Trash from '@lucide/svelte/icons/trash';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Field from '$lib/components/ui/field';
  import { DropdownMenu } from 'bits-ui';
  import * as Select from '$lib/components/ui/select/index.js';
  import { extractPalette, resolveColorRef, findClosestColorIndex } from '../lib/imageColors';

  function fontStyle(f: typeof fontOptions[number]) {
    return `font-family: ${f.value}; letter-spacing: ${f.uiTracking}; font-size: ${f.uiSize};`;
  }

  const dmContent = 'z-50 min-w-[140px] rounded-md border border-border bg-popover shadow-md';
  const dmItem = 'flex items-center gap-2 rounded-sm m-1 px-2 py-1.5 text-sm cursor-pointer outline-none hover:bg-accent data-[highlighted]:bg-accent';

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
  let deckOpen = $state(true);
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
    deckOpen = false;
    layoutOpen = false;
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

  let imageSlots = $derived(buildSlots(layoutDef?.schema.images, slide?.content.images));
  let textSlots = $derived(buildSlots(layoutDef?.schema.text, slide?.content.text));

  // URL slots — derived from schema, stored as single string in slide.content.url
  let urlSlots = $derived(
    layoutDef?.schema.url
      ? Object.values(layoutDef.schema.url).map((def, index) => ({
          index,
          displayName: def.displayName,
          placeholder: def.placeholder || '',
        }))
      : []
  );

  let urlValue = $state('');
  let arenaMessage = $state('');

  // Keep urlValue in sync with slide content
  $effect(() => {
    urlValue = slide?.content.url || '';
    arenaMessage = '';
  });

  function updateImage(index: number, value: string) {
    if (!slide) return;
    const images = [...slide.content.images];
    images[index] = value;
    updateSlide(slide.id, { content: { ...slide.content, images } });
  }

  function updateText(index: number, value: string) {
    if (!slide) return;
    const text = [...slide.content.text];
    text[index] = value;
    updateSlide(slide.id, { content: { ...slide.content, text } });
  }

  function changeLayout(layoutId: string) {
    if (!slide) return;
    updateSlide(slide.id, { layout: layoutId });
  }

  async function handleUrlSubmit() {
    if (!slide || !urlValue.trim()) return;

    const url = urlValue.trim();

    // Validate Are.na URL
    if (!url.match(/are\.na\/block\/\d+/)) {
      arenaMessage = 'This isn\'t a valid Are.na block URL! It should look like this https://www.are.na/block/12345)';
      return;
    }

    arenaMessage = '';

    try {
      const res = await fetch('/api/fetch-arena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const data = await res.json();
        arenaMessage = data.error || 'Couldn\'t fetch the Are.na block :(';
        return;
      }

      const data = await res.json();
      const blockClass: string = data.class || '';
      const isUnsupported = blockClass === 'Media' || blockClass === 'Attachment';

      if (isUnsupported) {
        arenaMessage = `Sorry, ${blockClass} aren't fully supported yet. The title and description hae been added, but nothing else`;
      }

      // Map response to slide content based on block class
      const images = [...slide.content.images];
      const text = [...slide.content.text];

      // Ensure arrays are long enough
      while (images.length < 1) images.push('');
      while (text.length < 2) text.push('');

      if (blockClass === 'Text') {
        text[0] = data.title || '';
        text[1] = data.content || data.description || '';
        images[0] = '';
      } else {
        images[0] = data.image || '';
        text[0] = data.title || '';
        text[1] = data.description || '';
      }

      updateSlide(slide.id, {
        content: { ...slide.content, images, text, url },
      });
    } catch (err) {
      arenaMessage = 'Couldn\'t fetch the Are.na block :(';
    }
  }

  async function handleDeleteDeck() {
    const file = $currentDeckFile;
    if (!file) return;
    await deleteDeck(file);
  }

  // --- Image color palette extraction ---

  const IMAGE_LAYOUTS = ['Image', 'Image2Up', 'Arena'];
  let hasImageSlots = $derived(slide ? IMAGE_LAYOUTS.includes(slide.layout) : false);

  // Track which (slideId, slotIndex, url) combos we've already extracted
  let extractedKeys = new Set<string>();

  $effect(() => {
    if (!slide || !hasImageSlots) return;
    const slideId = slide.id;
    const images = slide.content.images;

    for (let i = 0; i < images.length; i++) {
      const url = images[i];
      if (!url) continue;
      const key = `${slideId}:${i}:${url}`;
      if (extractedKeys.has(key)) continue;
      extractedKeys.add(key);
      triggerExtraction(slideId, i, url);
    }
  });

  async function triggerExtraction(slideId: string, slotIndex: number, imageUrl: string) {
    try {
      const palette = await extractPalette(imageUrl);
      // Get current slide state (may have changed during async)
      const currentDeck = $deck;
      const currentSlide = currentDeck?.slides.find(s => s.id === slideId);
      if (!currentSlide) return;

      const style: SlideStyle = { ...(currentSlide.style ?? {}) };
      const imageColors = [...(style.imageColors ?? [])];

      // Remap existing color references if palette changed
      const oldPalette = imageColors[slotIndex];
      if (oldPalette && oldPalette.length > 0) {
        remapColorRefs(style, slotIndex, oldPalette, palette);
      }

      // Pad array to slotIndex
      while (imageColors.length <= slotIndex) imageColors.push(null);
      imageColors[slotIndex] = palette;
      style.imageColors = imageColors;

      updateSlide(slideId, { style });
    } catch (e) {
      console.warn('Couldn\'t extract the palette :(', e);
    }
  }

  function remapColorRefs(style: SlideStyle, slotIndex: number, oldPalette: string[], newPalette: string[]) {
    const refs: (keyof Pick<SlideStyle, 'customPrimaryColor' | 'customBackgroundColor' | 'customAccentColor'>)[] =
      ['customPrimaryColor', 'customBackgroundColor', 'customAccentColor'];

    for (const ref of refs) {
      const val = style[ref];
      if (!val) continue;
      const match = val.match(/^imageColors\[(\d+)]\[(\d+)]$/);
      if (!match) continue;
      const refSlot = parseInt(match[1], 10);
      const refColor = parseInt(match[2], 10);
      if (refSlot !== slotIndex) continue;
      // Get old color value and find closest in new palette
      const oldColor = oldPalette[refColor];
      if (!oldColor || newPalette.length === 0) continue;
      const newIndex = findClosestColorIndex(oldColor, newPalette);
      if (newIndex >= 0) {
        (style as any)[ref] = `imageColors[${slotIndex}][${newIndex}]`;
      }
    }
  }

  function handleColorAssign(slotIndex: number, colorIndex: number, role: 'primary' | 'background' | 'accent') {
    if (!slide) return;
    const ref = `imageColors[${slotIndex}][${colorIndex}]`;
    const style: SlideStyle = { ...(slide.style ?? {}) };

    if (role === 'primary') style.customPrimaryColor = ref;
    else if (role === 'background') style.customBackgroundColor = ref;
    else if (role === 'accent') style.customAccentColor = ref;

    updateSlide(slide.id, { style });
  }

  // Build augmented color options for deck pickers (with custom slide overrides)
  let primaryOptions = $derived.by(() => {
    const base = [...primaryColorOptions];
    const ref = slide?.style?.customPrimaryColor;
    if (ref) {
      const resolved = resolveColorRef(ref, slide?.style?.imageColors);
      if (resolved) {
        base.push({ id: '__custom_primary', label: 'Custom color', value: resolved } as any);
      }
    }
    return base;
  });

  let backgroundOptions = $derived.by(() => {
    const base = [...backgroundColorOptions];
    const ref = slide?.style?.customBackgroundColor;
    if (ref) {
      const resolved = resolveColorRef(ref, slide?.style?.imageColors);
      if (resolved) {
        base.push({ id: '__custom_background', label: 'Custom color', value: resolved } as any);
      }
    }
    return base;
  });

  let accentOptions = $derived.by(() => {
    const base = [...accentColorOptions];
    const ref = slide?.style?.customAccentColor;
    if (ref) {
      const resolved = resolveColorRef(ref, slide?.style?.imageColors);
      if (resolved) {
        base.push({ id: '__custom_accent', label: 'Custom color', value: resolved } as any);
      }
    }
    return base;
  });
</script>

<div class="inset-shadow-sm flex flex-col bg-muted/15">
  {#if slide}
    <SlideDetailsSection name="Deck" open={deckOpen} onToggle={() => { deckOpen = !deckOpen; }}>
      {#snippet children()}
        <div class="flex items-center gap-2">
          <div class="flex-1 min-w-0">
            <InputTypeAndEnter
              placeholder="Deck name"
              bind:value={deckTitle}
              onsubmit={handleRenameDeck}
              ariaLabel="Rename deck"
            />
          </div>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              {#snippet child({ props })}
                <Button variant="outline" size="icon" class="shrink-0" {...props} aria-label="Deck options">
                  <Ellipsis class="size-4 text-muted-foreground" />
                </Button>
              {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content class={dmContent}>
                <DropdownMenu.Item
                  class="{dmItem} group hover:text-destructive hover:bg-destructive/10 data-[highlighted]:bg-destructive/10"
                  onSelect={handleDeleteDeck}
                >
                  <Trash class="size-4 text-muted-foreground group-hover:text-destructive" />
                  Delete deck
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
        <div class="flex flex-col gap-3">
          <Field.Root>
            <Field.Label class="lowercase">Headings</Field.Label>
            <Field.Content>
              <Select.Root
                type="single"
                value={currentTheme.headingFont}
                onValueChange={(v) => updateTheme({ headingFont: v })}
              >
                <Select.Trigger class="w-full">
                  {@const f = fontOptions.find((o) => o.id === currentTheme.headingFont) ?? fontOptions[0]}
                  <span style={fontStyle(f)}>{f.label}</span>
                </Select.Trigger>
                <Select.Content>
                  {#each fontsForRole('heading') as opt}
                    <Select.Item value={opt.id} label={opt.label}>
                      {#snippet children()}
                        <span style={fontStyle(opt)}>{opt.label}</span>
                      {/snippet}
                    </Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>
            </Field.Content>
          </Field.Root>
          <Field.Root>
            <Field.Label class="lowercase">Body</Field.Label>
            <Field.Content>
              <Select.Root
                type="single"
                value={currentTheme.bodyFont}
                onValueChange={(v) => updateTheme({ bodyFont: v })}
              >
                <Select.Trigger class="w-full">
                  {@const f = fontOptions.find((o) => o.id === currentTheme.bodyFont) ?? fontOptions[0]}
                  <span style={fontStyle(f)}>{f.label}</span>
                </Select.Trigger>
                <Select.Content>
                  {#each fontsForRole('body') as opt}
                    <Select.Item value={opt.id} label={opt.label}>
                      {#snippet children()}
                        <span style={fontStyle(opt)}>{opt.label}</span>
                      {/snippet}
                    </Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>
            </Field.Content>
          </Field.Root>
          <Field.Root>
            <Field.Label class="lowercase">Captions</Field.Label>
            <Field.Content>
              <Select.Root
                type="single"
                value={currentTheme.captionFont}
                onValueChange={(v) => updateTheme({ captionFont: v })}
              >
                <Select.Trigger class="w-full">
                  {@const f = fontOptions.find((o) => o.id === currentTheme.captionFont) ?? fontOptions[0]}
                  <span style={fontStyle(f)}>{f.label}</span>
                </Select.Trigger>
                <Select.Content>
                  {#each fontsForRole('caption') as opt}
                    <Select.Item value={opt.id} label={opt.label}>
                      {#snippet children()}
                        <span style={fontStyle(opt)}>{opt.label}</span>
                      {/snippet}
                    </Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>
            </Field.Content>
          </Field.Root>
          <Field.Root>
            <Field.Label class="lowercase">Primary color</Field.Label>
            <Field.Content>
              <ColorPicker
                options={primaryOptions}
                value={slide?.style?.customPrimaryColor ? '__custom_primary' : currentTheme.primaryColor}
                dividerBefore={slide?.style?.customPrimaryColor ? primaryColorOptions.length : undefined}
                onchange={(id) => {
                  if (id !== '__custom_primary') {
                    // Clear custom override when picking a preset
                    if (slide?.style?.customPrimaryColor) {
                      const style = { ...slide.style };
                      delete style.customPrimaryColor;
                      updateSlide(slide.id, { style });
                    }
                    updateTheme({ primaryColor: id });
                  }
                }}
              />
            </Field.Content>
          </Field.Root>
          <Field.Root>
            <Field.Label class="lowercase">Background</Field.Label>
            <Field.Content>
              <ColorPicker
                options={backgroundOptions}
                value={slide?.style?.customBackgroundColor ? '__custom_background' : currentTheme.backgroundColor}
                dividerBefore={slide?.style?.customBackgroundColor ? backgroundColorOptions.length : undefined}
                onchange={(id) => {
                  if (id !== '__custom_background') {
                    if (slide?.style?.customBackgroundColor) {
                      const style = { ...slide.style };
                      delete style.customBackgroundColor;
                      updateSlide(slide.id, { style });
                    }
                    updateTheme({ backgroundColor: id });
                  }
                }}
              />
            </Field.Content>
          </Field.Root>
          <Field.Root>
            <Field.Label class="lowercase">Accent color</Field.Label>
            <Field.Content>
              <ColorPicker
                options={accentOptions}
                value={slide?.style?.customAccentColor ? '__custom_accent' : currentTheme.accentColor}
                dividerBefore={slide?.style?.customAccentColor ? accentColorOptions.length : undefined}
                onchange={(id) => {
                  if (id !== '__custom_accent') {
                    if (slide?.style?.customAccentColor) {
                      const style = { ...slide.style };
                      delete style.customAccentColor;
                      updateSlide(slide.id, { style });
                    }
                    updateTheme({ accentColor: id });
                  }
                }}
              />
            </Field.Content>
          </Field.Root>
        </div>
      {/snippet}
    </SlideDetailsSection>

    <SlideDetailsSection name="Layout" open={layoutOpen} onToggle={() => { layoutOpen = !layoutOpen; }} class="border-t">
      {#snippet children()}
        <div class="mt-2">
          <LayoutGrid selectedLayout={slide.layout} onSelect={changeLayout} cols={2} />
        </div>
      {/snippet}
    </SlideDetailsSection>

    <SlideDetailsSection name="Content" open={dataOpen} onToggle={() => { dataOpen = !dataOpen; }} class='border-t'>
      {#snippet children()}
        <!-- URL slots -->
        {#each urlSlots as slot}
          <div class="mb-3">
            <div class="flex items-center justify-between mb-2 gap-1 text-xs">
              <SlotLabel displayName={slot.displayName} isRequired={true} isUsed={true} />
            </div>
            <InputTypeAndEnter
              placeholder={slot.placeholder}
              bind:value={urlValue}
              onsubmit={handleUrlSubmit}
              ariaLabel={slot.displayName}
            />
            {#if arenaMessage}
              <p class="text-xs text-muted-foreground mt-1">{arenaMessage}</p>
            {/if}
          </div>
        {/each}
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

            <!-- Textarea: always shows slot content from slide.content.text.
                Used slot   + empty      → placeholder "Write with Markdown"
                Used slot   + has content → editable
                Unused slot + empty      → placeholder "Not used in this layout"
                            + has content → shows content as read-only -->
            <textarea
                class="w-full px-2 py-1.5 border border-border rounded-md text-sm leading-[1.5] bg-transparent focus:bg-white transition-colors resize-y min-h-24
                  {slot.isUsed ? '' : 'opacity-50 bg-muted cursor-not-allowed'}"
                placeholder={slot.isUsed ? 'Write with Markdown' : slot.hasContent ? 'Not used in this layout' : ''}
                value={slide.content.text?.[slot.index] || ''}
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
          onColorAssign={handleColorAssign}
        />
      {/snippet}
    </SlideDetailsSection>
  {:else}
    <!-- no slide selected; leave sidebar blank -->
  {/if}
</div>

