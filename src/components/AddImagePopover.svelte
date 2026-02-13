<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Popover } from 'bits-ui';
  import Icon from './ui/Icon.svelte';

  interface Props {
    slotIndex: number;
    onimage: (index: number, url: string) => void;
    trigger?: Snippet;
  }
  let { slotIndex, onimage, trigger }: Props = $props();

  let open = $state(false);
  let urlValue = $state('');
  let dragging = $state(false);

  function handleOpenChange(v: boolean) {
    open = v;
    if (v) urlValue = '';
  }

  function submitUrl() {
    const trimmed = urlValue.trim();
    if (!trimmed) return;
    onimage(slotIndex, trimmed);
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
      onimage(slotIndex, path);
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

<Popover.Root {open} onOpenChange={handleOpenChange}>
  {#if trigger}
    <Popover.Trigger>
      {#snippet child({ props })}
        <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
        <div {...props}>
          {@render trigger()}
        </div>
      {/snippet}
    </Popover.Trigger>
  {:else}
    <Popover.Trigger
      class="w-[60px] h-[45px] rounded border border-dashed border-border bg-muted/30 flex items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors cursor-pointer"
      title="Add image"
    >
      <Icon name="plus" />
    </Popover.Trigger>
  {/if}

  <Popover.Portal>
    <Popover.Content
      class="z-50 w-64 rounded-lg border border-border bg-popover p-3 shadow-lg space-y-3"
      sideOffset={5}
      align="start"
    >
      <!-- URL input -->
      <div>
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label class="block text-[10px] font-medium text-muted-foreground mb-1">Image URL</label>
        <div class="flex gap-1">
          <input
            type="text"
            class="flex-1 px-2 py-1 border border-border rounded text-xs bg-background"
            placeholder="https://..."
            bind:value={urlValue}
            onkeydown={handleKeydown}
          />
          <button
            class="px-2 py-1 rounded text-xs bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
            onclick={submitUrl}
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
          onclick={() => fileInput?.click()}
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
      >
        Drop image here
      </div>
    </Popover.Content>
  </Popover.Portal>
</Popover.Root>
