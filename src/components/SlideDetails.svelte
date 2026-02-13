<script lang="ts">
  import type { Slide, SlideData } from '../lib/types';
  import { updateSlide } from '../lib/store';
  import { layouts, layoutList, formatSlotSummary } from './layouts/registry';
  import { marked } from 'marked';
  import AddImagePopover from './AddImagePopover.svelte';

  interface Props {
    slide: Slide;
  }
  let { slide }: Props = $props();

  let layoutDef = $derived(layouts[slide.layout]);

  // Collapsible sections
  let dataOpen = $state(true);
  let layoutOpen = $state(true);
  let notesOpen = $state(true);

  // Derived slot metadata for images
  let imageSlots = $derived.by(() => {
    const schema = layoutDef?.schema.images;
    const used: { key: string; isUsed: true; displayName: string; type: string; hasContent: boolean }[] = [];
    if (schema) {
      for (const [key, def] of Object.entries(schema)) {
        used.push({
          key,
          isUsed: true,
          displayName: def.displayName,
          type: def.type,
          hasContent: !!slide.data.images?.[key],
        });
      }
    }
    // Pad to 3 with "not used" entries
    const notUsed: { key: string; isUsed: false; displayName: string; type: string; hasContent: boolean }[] = [];
    for (let i = used.length; i < 3; i++) {
      notUsed.push({
        key: `_unused_img_${i}`,
        isUsed: false,
        displayName: 'not used',
        type: 'optional',
        hasContent: false,
      });
    }
    return [...used, ...notUsed];
  });

  // Derived slot metadata for text
  let textSlots = $derived.by(() => {
    const schema = layoutDef?.schema.text;
    const used: { key: string; isUsed: true; displayName: string; type: string; hasContent: boolean }[] = [];
    if (schema) {
      for (const [key, def] of Object.entries(schema)) {
        used.push({
          key,
          isUsed: true,
          displayName: def.displayName,
          type: def.type,
          hasContent: !!slide.data.text?.[key],
        });
      }
    }
    // Pad to 3 with "not used" entries
    const notUsed: { key: string; isUsed: false; displayName: string; type: string; hasContent: boolean }[] = [];
    for (let i = used.length; i < 3; i++) {
      notUsed.push({
        key: `_unused_txt_${i}`,
        isUsed: false,
        displayName: 'not used',
        type: 'optional',
        hasContent: false,
      });
    }
    return [...used, ...notUsed];
  });

  function updateImage(key: string, value: string) {
    const newData: SlideData = {
      ...slide.data,
      images: { ...slide.data.images, [key]: value },
    };
    updateSlide(slide.id, { data: newData });
  }

  function updateText(key: string, value: string) {
    const newData: SlideData = {
      ...slide.data,
      text: { ...slide.data.text, [key]: value },
    };
    updateSlide(slide.id, { data: newData });
  }

  function updateNotes(value: string) {
    updateSlide(slide.id, { notes: value });
  }

  function changeLayout(layoutId: string) {
    updateSlide(slide.id, { layout: layoutId });
  }

  // Preview markdown text
  let previewKey = $state<string | null>(null);
</script>

<div class="p-3 space-y-3 text-sm">
  <!-- Data Section -->
  <div>
    <button
      class="flex items-center gap-1 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-full cursor-pointer"
      onclick={() => { dataOpen = !dataOpen; }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform {dataOpen ? 'rotate-90' : ''}"><path d="m9 18 6-6-6-6"/></svg>
      Data
    </button>
    {#if dataOpen}
      <div class="mt-2 space-y-4">
        <!-- Image slots -->
        <div class="space-y-1.5">
          <div class="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Images</div>
          {#each imageSlots as slot}
            <div
              class="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors
                {slot.isUsed ? 'border-l-2 border-l-primary' : 'border-l-2 border-l-transparent opacity-50'}"
            >
              <!-- Thumbnail area -->
              {#if slot.isUsed}
                {#if slot.hasContent}
                  <AddImagePopover slotKey={slot.key} onimage={updateImage}>
                    {#snippet trigger()}
                      <div class="flex-shrink-0 w-[60px] h-[45px] rounded overflow-hidden bg-muted/30 cursor-pointer border border-border hover:border-primary/50 transition-colors" title="Replace image">
                        <img
                          src={slide.data.images[slot.key]}
                          alt=""
                          class="w-full h-full object-cover"
                        />
                      </div>
                    {/snippet}
                  </AddImagePopover>
                {:else}
                  <AddImagePopover slotKey={slot.key} onimage={updateImage} />
                {/if}
              {:else}
                <div class="flex-shrink-0 w-[60px] h-[45px] rounded bg-muted/20 border border-dashed border-border/50"></div>
              {/if}

              <!-- Label area -->
              <div class="flex-1 min-w-0">
                {#if slot.isUsed}
                  <span class="text-xs font-medium">{slot.displayName}</span>
                  <span class="ml-1 text-[9px] rounded px-1 py-0.5 {slot.type === 'required' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}">{slot.type === 'required' ? 'req' : 'opt'}</span>
                {:else}
                  <span class="text-xs text-muted-foreground/60 italic">not used</span>
                {/if}
              </div>
            </div>
          {/each}
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
                    <span class="ml-1 text-[9px] rounded px-1 py-0.5 {slot.type === 'required' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}">{slot.type === 'required' ? 'req' : 'opt'}</span>
                  {:else}
                    <span class="text-xs text-muted-foreground/60 italic">not used</span>
                  {/if}
                </div>
                {#if slot.isUsed}
                  <button
                    class="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    onclick={() => { previewKey = previewKey === slot.key ? null : slot.key; }}
                  >
                    {previewKey === slot.key ? 'Edit' : 'Preview'}
                  </button>
                {/if}
              </div>

              <!-- Textarea -->
              {#if slot.isUsed && previewKey === slot.key}
                <div class="border border-border rounded-md p-2 prose prose-sm max-w-none min-h-[60px] bg-gray-50/50">
                  {@html marked.parse(slide.data.text?.[slot.key] || '', { async: false })}
                </div>
              {:else}
                <textarea
                  class="w-full px-2 py-1.5 border border-border rounded-md text-xs bg-background resize-y min-h-[60px] font-mono
                    {slot.isUsed ? '' : 'opacity-50 bg-muted cursor-not-allowed'}"
                  placeholder={slot.isUsed ? 'Markdown supported...' : ''}
                  value={slot.isUsed ? (slide.data.text?.[slot.key] || '') : ''}
                  disabled={!slot.isUsed}
                  oninput={(e) => updateText(slot.key, e.currentTarget.value)}
                ></textarea>
              {/if}
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
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform {layoutOpen ? 'rotate-90' : ''}"><path d="m9 18 6-6-6-6"/></svg>
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

  <hr class="border-border" />

  <!-- Notes Section -->
  <div>
    <button
      class="flex items-center gap-1 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-full cursor-pointer"
      onclick={() => { notesOpen = !notesOpen; }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform {notesOpen ? 'rotate-90' : ''}"><path d="m9 18 6-6-6-6"/></svg>
      Notes
    </button>
    {#if notesOpen}
      <div class="mt-2">
        <textarea
          class="w-full px-2 py-1.5 border border-border rounded-md text-xs bg-background resize-y min-h-[80px]"
          placeholder="Internal notes (not rendered in slides)..."
          value={slide.notes || ''}
          oninput={(e) => updateNotes(e.currentTarget.value)}
        ></textarea>
      </div>
    {/if}
  </div>
</div>
