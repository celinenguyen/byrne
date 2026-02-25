<script lang="ts">
  import type { Slide, SlotMeta } from '../lib/types';
  import ImageSlotThumbnail from './ImageSlotThumbnail.svelte';
  import SlotLabel from './SlotLabel.svelte';
  import ColorSwatch from './ColorSwatch.svelte';
  import * as Popover from '$lib/components/ui/popover/index.js';

  interface Props {
    slots: SlotMeta[];
    slide: Slide;
    onUpdate: (index: number, url: string) => void;
    openPopoverIndex: number | null;
    onPopoverClose: () => void;
    onColorAssign?: (slotIndex: number, colorIndex: number, role: 'primary' | 'background' | 'accent') => void;
  }
  let { slots, slide, onUpdate, openPopoverIndex, onPopoverClose, onColorAssign }: Props = $props();

  let activeColorPopover = $state<{ slotIndex: number; colorIndex: number } | null>(null);

  function handleRoleSelect(role: 'primary' | 'background' | 'accent') {
    if (!activeColorPopover || !onColorAssign) return;
    onColorAssign(activeColorPopover.slotIndex, activeColorPopover.colorIndex, role);
    activeColorPopover = null;
  }

  const roleItems = [
    { role: 'primary' as const, label: 'Primary color', styleKey: 'customPrimaryColor' as const },
    { role: 'background' as const, label: 'Background', styleKey: 'customBackgroundColor' as const },
    { role: 'accent' as const, label: 'Accent color', styleKey: 'customAccentColor' as const },
  ];

  function isAssigned(slotIndex: number, colorIndex: number, styleKey: 'customPrimaryColor' | 'customBackgroundColor' | 'customAccentColor'): boolean {
    return slide.style?.[styleKey] === `imageColors[${slotIndex}][${colorIndex}]`;
  }

  function isAssignedToAnyRole(slotIndex: number, colorIndex: number): boolean {
    const ref = `imageColors[${slotIndex}][${colorIndex}]`;
    const s = slide.style;
    if (!s) return false;
    return s.customPrimaryColor === ref || s.customBackgroundColor === ref || s.customAccentColor === ref;
  }
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
      <!-- Color palette for this image slot -->
      {#if slot.isUsed && slot.hasContent && slide.style?.imageColors?.[slot.index]}
        {@const palette = slide.style.imageColors[slot.index]}
        {#if palette && palette.length > 0}
          <div class="flex flex-wrap gap-1.5 mt-0.5">
            {#each palette as color, colorIdx}
              <Popover.Root
                open={activeColorPopover?.slotIndex === slot.index && activeColorPopover?.colorIndex === colorIdx}
                onOpenChange={(open) => {
                  if (open) {
                    activeColorPopover = { slotIndex: slot.index, colorIndex: colorIdx };
                  } else {
                    activeColorPopover = null;
                  }
                }}
              >
                <Popover.Trigger>
                  {#snippet child({ props })}
                    <ColorSwatch
                      {...props}
                      color={color}
                      selected={isAssignedToAnyRole(slot.index, colorIdx)}
                      size="sm"
                      title="Use for..."
                    />
                  {/snippet}
                </Popover.Trigger>
                <Popover.Content
                  class="w-auto min-w-[140px] p-1"
                  sideOffset={4}
                  align="start"
                >
                  <p class="px-2 py-1 text-xs text-muted-foreground">Use for</p>
                  {#each roleItems as item}
                    {@const selected = activeColorPopover && isAssigned(activeColorPopover.slotIndex, activeColorPopover.colorIndex, item.styleKey)}
                    <button
                      class="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent {selected ? 'bg-muted font-medium' : ''}"
                      onclick={() => handleRoleSelect(item.role)}
                    >
                      {item.label}
                    </button>
                  {/each}
                </Popover.Content>
              </Popover.Root>
            {/each}
          </div>
        {/if}
      {/if}
    </div>
  {/each}
</div>
