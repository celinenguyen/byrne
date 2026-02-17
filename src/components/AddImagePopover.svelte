<script lang="ts">
  import type { Snippet } from 'svelte';
  import * as Popover from '$lib/components/ui/popover/index.js';
  import Plus from '@lucide/svelte/icons/plus';
  import CloudUpload from '@lucide/svelte/icons/cloud-upload';
  import { Button } from '$lib/components/ui/button/index.js';
  import InputTypeAndEnter from './InputTypeAndEnter.svelte';
  import { staticMode } from '../lib/store';

  interface Props {
    slotIndex: number;
    currentUrl?: string;
    onimage: (index: number, url: string) => void;
    trigger?: Snippet;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
  let { slotIndex, currentUrl, onimage, trigger, open = $bindable(false), onOpenChange }: Props = $props();
  let urlValue = $state('');
  let dragging = $state(false);

  function handleOpenChange(v: boolean) {
    onOpenChange?.(v);
  }

  // Sync urlValue whenever the popover is open and currentUrl changes.
  // This handles the async timing when opened via SlideView click where
  // currentUrl prop updates after the popover open event fires.
  $effect(() => {
    if (open) urlValue = currentUrl ?? '';
  });

  function submitUrl() {
    const trimmed = urlValue.trim();
    if (!trimmed) return;
    onimage(slotIndex, trimmed);
    open = false;
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

<Popover.Root bind:open onOpenChange={handleOpenChange}>
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
      class="flex items-center justify-center text-muted-foreground cursor-pointer"
      title="Add image"
    >
      <Plus class="size-4" />
    </Popover.Trigger>
  {/if}

  <Popover.Content
    class="w-72 p-4 flex flex-col gap-4"
    sideOffset={0}
    align="center"
  >
      <!-- input for URL and then hitting enter -->
      <InputTypeAndEnter
        placeholder="Add a URL"
        bind:value={urlValue}
        onsubmit={submitUrl}
        ariaLabel="Add image"
      />

      {#if !staticMode}
        <!-- Drop zone -->
        <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
        <div
          class="flex flex-row items-center justify-center gap-2 border-1 rounded-md px-2 py-4 text-center text-sm bg-muted/50 text-muted-foreground transition-colors
            {dragging ? 'border-stone-300 bg-stone-100' : 'border-border'}"
          ondragover={handleDragOver}
          ondragleave={handleDragLeave}
          ondrop={handleDrop}
        >
          or you can
            <input
              type="file"
              accept="image/*"
              class="hidden"
              bind:this={fileInput}
              onchange={handleFileInput}
            />
            <Button
              variant="outline"
              size="sm"
              onclick={() => fileInput?.click()}
              aria-label="Upload from computer"
            >
              <CloudUpload class="size-4" />Upload
            </Button>
        </div>
      {/if}
  </Popover.Content>
</Popover.Root>
