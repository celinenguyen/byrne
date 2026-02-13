<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    slotKey: string;
    onimage: (key: string, url: string) => void;
    trigger?: Snippet;
  }
  let { slotKey, onimage, trigger }: Props = $props();

  let open = $state(false);
  let urlValue = $state('');
  let dragging = $state(false);
  let popoverEl: HTMLDivElement | undefined = $state();

  function toggle() {
    open = !open;
    if (open) urlValue = '';
  }

  function handleWindowClick(e: MouseEvent) {
    if (open && popoverEl && !popoverEl.contains(e.target as Node)) {
      open = false;
    }
  }

  function submitUrl() {
    const trimmed = urlValue.trim();
    if (!trimmed) return;
    onimage(slotKey, trimmed);
    open = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') submitUrl();
  }

  async function uploadFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (res.ok) {
      const { path } = await res.json();
      onimage(slotKey, path);
      open = false;
    }
  }

  function handleFileInput(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (file) uploadFile(file);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    dragging = true;
  }

  function handleDragLeave() {
    dragging = false;
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragging = false;
    const file = e.dataTransfer?.files?.[0];
    if (file) uploadFile(file);
  }

  let fileInput: HTMLInputElement | undefined = $state();
</script>

<svelte:window onclick={handleWindowClick} />

<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
<div class="relative inline-block" bind:this={popoverEl} onclick={toggle}>
  {#if trigger}
    {@render trigger()}
  {:else}
    <button
      class="w-[60px] h-[45px] rounded border border-dashed border-border bg-muted/30 flex items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors cursor-pointer"
      title="Add image"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
    </button>
  {/if}

  {#if open}
    <div class="absolute left-0 top-[50px] z-50 w-64 rounded-lg border border-border bg-popover p-3 shadow-lg space-y-3">
      <!-- URL input -->
      <div>
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label class="block text-[10px] font-medium text-muted-foreground mb-1">Image URL</label>
        <div class="flex gap-1">
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <input
            type="text"
            class="flex-1 px-2 py-1 border border-border rounded text-xs bg-background"
            placeholder="https://..."
            bind:value={urlValue}
            onkeydown={handleKeydown}
            onclick={(e) => e.stopPropagation()}
          />
          <button
            class="px-2 py-1 rounded text-xs bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
            onclick={(e) => { e.stopPropagation(); submitUrl(); }}
          >Add</button>
        </div>
      </div>

      <!-- Upload button -->
      <div>
        <input
          type="file"
          accept="image/*"
          class="hidden"
          bind:this={fileInput}
          onchange={handleFileInput}
        />
        <button
          class="w-full px-2 py-1.5 rounded text-xs border border-border hover:bg-accent transition-colors cursor-pointer"
          onclick={(e) => { e.stopPropagation(); fileInput?.click(); }}
        >
          Upload from computer
        </button>
      </div>

      <!-- Drop zone -->
      <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
      <div
        class="border-2 border-dashed rounded-md p-3 text-center text-xs text-muted-foreground transition-colors
          {dragging ? 'border-primary bg-primary/5' : 'border-border'}"
        ondragover={handleDragOver}
        ondragleave={handleDragLeave}
        ondrop={handleDrop}
        onclick={(e) => e.stopPropagation()}
      >
        Drop image here
      </div>
    </div>
  {/if}
</div>
