<script lang="ts">
  import type { Slide, SlideData } from '../lib/types';
  import { updateSlide } from '../lib/store';
  import { layouts, layoutList } from './layouts/registry';
  import { marked } from 'marked';

  interface Props {
    slide: Slide;
  }
  let { slide }: Props = $props();

  let layoutDef = $derived(layouts[slide.layout]);

  // Collapsible sections
  let dataOpen = $state(true);
  let layoutOpen = $state(true);
  let notesOpen = $state(true);

  // Image fields based on schema
  let imageFields = $derived(() => {
    const schema = layoutDef?.schema.images;
    if (!schema) return [];
    const fields: { key: string; label: string }[] = [];
    for (let i = 1; i <= schema.max; i++) {
      const key = String(i);
      fields.push({ key, label: schema.labels?.[key] || `Image ${i}` });
    }
    return fields;
  });

  // Text fields based on schema
  let textFields = $derived(() => {
    const schema = layoutDef?.schema.text;
    if (!schema) return [];
    const fields: { key: string; label: string }[] = [];
    for (let i = 1; i <= schema.max; i++) {
      const key = String(i);
      fields.push({ key, label: schema.labels?.[key] || `Text ${i}` });
    }
    return fields;
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

  // Drag and drop for images
  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  }

  async function handleDrop(e: DragEvent, key: string) {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) return;

    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (res.ok) {
      const { path } = await res.json();
      updateImage(key, path);
    }
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
      <div class="mt-2 space-y-3">
        <!-- Image fields -->
        {#each imageFields() as field}
          <div>
            <label class="block text-xs font-medium text-muted-foreground mb-1">{field.label}</label>
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="border border-dashed border-border rounded-md p-2 transition-colors hover:border-primary/50"
              ondragover={handleDragOver}
              ondrop={(e) => handleDrop(e, field.key)}
            >
              {#if slide.data.images?.[field.key]}
                <img
                  src={slide.data.images[field.key]}
                  alt=""
                  class="w-full h-24 object-contain rounded bg-gray-50"
                />
              {:else}
                <div class="h-16 flex items-center justify-center text-xs text-muted-foreground">
                  Drop image here
                </div>
              {/if}
            </div>
            <input
              type="text"
              class="mt-1 w-full px-2 py-1 border border-border rounded text-xs bg-background"
              placeholder="Or paste image URL..."
              value={slide.data.images?.[field.key] || ''}
              oninput={(e) => updateImage(field.key, e.currentTarget.value)}
            />
          </div>
        {/each}

        <!-- Text fields -->
        {#each textFields() as field}
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-xs font-medium text-muted-foreground">{field.label}</label>
              <button
                class="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                onclick={() => { previewKey = previewKey === field.key ? null : field.key; }}
              >
                {previewKey === field.key ? 'Edit' : 'Preview'}
              </button>
            </div>
            {#if previewKey === field.key}
              <div class="border border-border rounded-md p-2 prose prose-sm max-w-none min-h-[60px] bg-gray-50/50">
                {@html marked.parse(slide.data.text?.[field.key] || '', { async: false })}
              </div>
            {:else}
              <textarea
                class="w-full px-2 py-1.5 border border-border rounded-md text-xs bg-background resize-y min-h-[60px] font-mono"
                placeholder="Markdown supported..."
                value={slide.data.text?.[field.key] || ''}
                oninput={(e) => updateText(field.key, e.currentTarget.value)}
              ></textarea>
            {/if}
          </div>
        {/each}
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
      <div class="mt-2 grid grid-cols-2 gap-1.5">
        {#each layoutList as l}
          <button
            class="px-2 py-2 rounded-md text-xs text-left transition-colors cursor-pointer
              {slide.layout === l.id ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-accent text-foreground'}"
            onclick={() => changeLayout(l.id)}
          >
            <div class="font-medium">{l.displayName}</div>
            {#if l.description}
              <div class="opacity-60 text-[10px] mt-0.5">{l.description}</div>
            {/if}
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
