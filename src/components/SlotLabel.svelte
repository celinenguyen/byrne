<script lang="ts">
  interface Props {
    displayName?: string;
    isRequired?: boolean;
    isUsed?: boolean;
  }
  let { displayName = '', isRequired = true, isUsed = true }: Props = $props();
</script>

<div>
  {#if isUsed}
    <span class="font-medium tracking-[2.5%]">{displayName}</span>
    {#if !isRequired}
      <span class="text-muted-foreground tracking-[1.5%]">(optional)</span>
    {/if}
  {:else}
    <span class="text-muted-foreground">not used</span>
  {/if}
</div>
