<script lang="ts">
  import * as Tooltip from '$lib/components/ui/tooltip';
  import ColorSwatch from './ColorSwatch.svelte';

  interface Props {
    options: { id: string; label: string; value: string }[];
    value: string;
    onchange: (id: string) => void;
    dividerBefore?: number;
  }
  let { options, value, onchange, dividerBefore }: Props = $props();
</script>

<Tooltip.Provider>
  <div class="flex flex-wrap gap-2 items-center">
    {#each options as opt, i}
      {#if dividerBefore !== undefined && i === dividerBefore}
        <div class="w-px h-4 bg-border mx-0.5"></div>
      {/if}
      <Tooltip.Root>
        <Tooltip.Trigger>
          {#snippet child({ props })}
            <ColorSwatch
              {...props}
              color={opt.value}
              selected={value === opt.id}
              onclick={() => onchange(opt.id)}
            />
          {/snippet}
        </Tooltip.Trigger>
        <Tooltip.Content side="bottom" align="center">
          {opt.label}
        </Tooltip.Content>
      </Tooltip.Root>
    {/each}
  </div>
</Tooltip.Provider>
