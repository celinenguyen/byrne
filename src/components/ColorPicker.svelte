<script lang="ts">
  import * as Tooltip from '$lib/components/ui/tooltip';

  interface Props {
    options: { id: string; label: string; value: string }[];
    value: string;
    onchange: (id: string) => void;
  }
  let { options, value, onchange }: Props = $props();
</script>

<Tooltip.Provider>
  <div class="flex flex-wrap gap-2">
    {#each options as opt}
      <Tooltip.Root>
        <Tooltip.Trigger
          class="size-6 rounded-full border-2 transition-shadow cursor-pointer {value === opt.id ? 'ring-2 ring-stone-400 ring-offset-1' : 'border-border hover:ring-1 hover:ring-stone-300'}"
          style="background-color: {opt.value}"
          onclick={() => onchange(opt.id)}
        ></Tooltip.Trigger>
        <Tooltip.Content side="bottom" align="center">
          {opt.label}
        </Tooltip.Content>
      </Tooltip.Root>
    {/each}
  </div>
</Tooltip.Provider>
