<script lang="ts">
  import X from '@lucide/svelte/icons/x';

  let dismissed = $state(false);
</script>

{#if !dismissed}
  <div class="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border text-sm text-muted-foreground">
    <span>try editing the deck below. your changes won't be saved for anyone else—it's just for you to try out :)</span>
    <button
      class="p-1 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer shrink-0 ml-2"
      onclick={() => { dismissed = true; }}
      title="Dismiss"
    >
      <X class="size-3.5" />
    </button>
  </div>
{/if}
