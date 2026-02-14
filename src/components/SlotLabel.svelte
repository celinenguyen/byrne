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
    <span class="font-medium tracking-wide">{displayName}</span>
    {#if !isRequired}
      <span class="ml-0.5 text-muted-foreground">(optional)</span>
    {/if}
  {:else}
    <span class="text-muted-foreground">not used</span>
  {/if}
</div>
