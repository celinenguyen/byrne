<script lang="ts">
  import type { Slide, SlotMeta } from '../lib/types';
  import ImageSlotThumbnail from './ImageSlotThumbnail.svelte';
  import SlotLabel from './SlotLabel.svelte';

  interface Props {
    slots: SlotMeta[];
    slide: Slide;
    onUpdate: (index: number, url: string) => void;
    openPopoverIndex: number | null;
    onPopoverClose: () => void;
  }
  let { slots, slide, onUpdate, openPopoverIndex, onPopoverClose }: Props = $props();
</script>

<div class="flex flex-row flex-wrap gap-4 w-full">
  {#each slots as slot}
    <div
      class="flex flex-col gap-2 min-w-0 flex-1 max-w-[50%]"
      data-slot-type="image"
      data-slot-index={slot.index}
    >
      <div class="text-xs">
        <SlotLabel displayName={slot.displayName} isRequired={slot.isRequired} isUsed={slot.isUsed} />
      </div>
      <ImageSlotThumbnail
        slot={slot}
        {slide}
        {onUpdate}
        popoverOpen={openPopoverIndex === slot.index}
        onpopoverOpenChange={(v) => { if (!v) onPopoverClose(); }}
      />
    </div>
  {/each}
</div>
