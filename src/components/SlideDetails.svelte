<script lang="ts">
  import type { Slide, SlotMeta } from '../lib/types';
  import { updateSlide, focusSlot, activeSlot, deck, renameDeck, updateTheme, deleteDeck, currentDeckFile, staticMode } from '../lib/store';
  import { layouts } from './layouts/registry';
  import LayoutGrid from './LayoutGrid.svelte';
  import { fontOptions, primaryColorOptions, backgroundColorOptions, accentColorOptions, defaultTheme } from '../lib/theme';
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
      arenaMessage = 'Please enter a valid Are.na block URL (e.g. https://www.are.na/block/12345)';
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
        arenaMessage = data.error || 'Failed to fetch Are.na block';
        return;
      }

      const data = await res.json();
      const blockClass: string = data.class || '';
      const isUnsupported = blockClass === 'Media' || blockClass === 'Attachment';

      if (isUnsupported) {
        arenaMessage = `${blockClass} blocks are not fully supported. Title and description have been populated.`;
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
      arenaMessage = 'Failed to fetch Are.na block';
    }
  }

  async function handleDeleteDeck() {
    const file = $currentDeckFile;
    if (!file) return;
    await deleteDeck(file);
  }
</script>

<div class="inset-shadow-sm flex flex-col bg-muted/15">
  {#if slide}
    <SlideDetailsSection name="Deck">
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
                  {fontOptions.find((o) => o.id === currentTheme.headingFont)?.label ?? currentTheme.headingFont}
                </Select.Trigger>
                <Select.Content>
                  {#each fontOptions as opt}
                    <Select.Item value={opt.id} label={opt.label} />
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
                  {fontOptions.find((o) => o.id === currentTheme.bodyFont)?.label ?? currentTheme.bodyFont}
                </Select.Trigger>
                <Select.Content>
                  {#each fontOptions as opt}
                    <Select.Item value={opt.id} label={opt.label} />
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
                  {fontOptions.find((o) => o.id === currentTheme.captionFont)?.label ?? currentTheme.captionFont}
                </Select.Trigger>
                <Select.Content>
                  {#each fontOptions as opt}
                    <Select.Item value={opt.id} label={opt.label} />
                  {/each}
                </Select.Content>
              </Select.Root>
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
            <Field.Label class="lowercase">Background</Field.Label>
            <Field.Content>
              <ColorPicker
                options={backgroundColorOptions}
                value={currentTheme.backgroundColor}
                onchange={(id) => updateTheme({ backgroundColor: id })}
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
        />
      {/snippet}
    </SlideDetailsSection>

    <SlideDetailsSection name="Layout" open={layoutOpen} onToggle={() => { layoutOpen = !layoutOpen; }} class="border-t">
      {#snippet children()}
        <div class="mt-2">
          <LayoutGrid selectedLayout={slide.layout} onSelect={changeLayout} cols={2} />
        </div>
      {/snippet}
    </SlideDetailsSection>
  {:else}
    <!-- no slide selected; leave sidebar blank -->
  {/if}
</div>

