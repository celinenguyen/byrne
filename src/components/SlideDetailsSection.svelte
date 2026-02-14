<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from './ui/Icon.svelte';
  import SidebarStickyHeader from './SidebarStickyHeader.svelte';

  interface Props {
    name: string;
    children: Snippet;
    /** Controlled: when provided, parent controls open state */
    open?: boolean;
    onToggle?: () => void;
    class?: string;
  }
  let { name, children, open: openProp, onToggle, class: className }: Props = $props();

  let openInternal = $state(true);
  let isOpen = $derived(openProp !== undefined ? openProp : openInternal);

  function toggle() {
    if (onToggle) {
      onToggle();
    } else {
      openInternal = !openInternal;
    }
  }
</script>

<div class={className}>
  <SidebarStickyHeader>
    {#snippet children()}
      <button
        class="w-full px-1 py-2 flex items-center gap-1 font-semibold text-xs cursor-pointer"
        onclick={toggle}
      >
        {name}
        <Icon name="chevron-right" size={15} class="text-muted-foreground transition-transform {isOpen ? 'rotate-90' : ''}" />
      </button>
    {/snippet}
  </SidebarStickyHeader>
  {#if isOpen}
    <div class="p-4 flex flex-col gap-4">
      {@render children()}
    </div>
  {/if}
</div>
