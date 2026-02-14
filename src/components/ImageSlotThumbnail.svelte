<script lang="ts">
  import type { Slide } from '../lib/types';
  import AddImagePopover from './AddImagePopover.svelte';
  import Icon from './ui/Icon.svelte';

  interface Props {
    slot: { index: number; isUsed: boolean; hasContent: boolean };
    slide: Slide;
    onUpdate: (index: number, url: string) => void;
  }
  let { slot, slide, onUpdate }: Props = $props();

  const defaultClasses = 'rounded-sm w-full overflow-hidden transition-colors';
  const classesIfUsed = 'cursor-pointer hover:ring-2 hover:ring-stone-200 rounded border border-border';
  const classesIfNotUsed = 'cursor-not-allowed opacity-70';
  const classesHasContent = 'w-full max-h-[100px] border border-border';
</script>

{#if slot.hasContent}
  <!-- Branch 1: Slot has an image → always display it -->
  {#if slot.isUsed}
    <!-- 1a: Used slot with content → clickable, opens AddImagePopover to replace image -->
    <AddImagePopover slotIndex={slot.index} onimage={onUpdate}>
      {#snippet trigger()}
        <div class="{defaultClasses} {classesIfUsed} {classesHasContent}">
          <img src={slide.data.images[slot.index]} alt="" class="object-cover" />
        </div>
      {/snippet}
    </AddImagePopover>
  {:else}
    <!-- 1b: Unused slot with content → image shown dimmed, not clickable (data exists but layout doesn't use this slot) -->
    <div class="{defaultClasses} {classesIfNotUsed} {classesHasContent}">
      <img src={slide.data.images[slot.index]} alt="" class="object-cover" />
    </div>
  {/if}
{:else}
  <!-- Branch 2: Slot has no image → show placeholder -->
  {#if slot.isUsed}
    <!-- 2a: Used slot, no content → clickable placeholder with plus icon, opens AddImagePopover to add image -->
    <AddImagePopover slotIndex={slot.index} onimage={onUpdate}>
      {#snippet trigger()}
        <div class="{defaultClasses} {classesIfUsed} min-h-[100px] flex items-center justify-center">
          <Icon name="plus" class="size-5" />
        </div>
      {/snippet}
    </AddImagePopover>
  {:else}
    <!-- 2b: Unused slot, no content → empty placeholder, not interactive (layout doesn't use this slot) -->
    <div class="{defaultClasses} w-1/2 rounded-sm min-h-[100px] bg-stone-200/50"></div>
  {/if}
{/if}
