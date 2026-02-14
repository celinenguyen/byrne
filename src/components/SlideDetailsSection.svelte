<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Button } from '$lib/components/ui/button/index.js';
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

<div class=" {className ?? ''}">
  <SidebarStickyHeader>
    {#snippet children()}
      <Button class="mx-2 shadow-s text-foreground hover:bg-stone-200/50 transition-colors w-full justify-start" variant="ghost" size="sm" onclick={toggle}>
        {#snippet children()}
          {name}
          <Icon name="chevron-right" class="size-3.5 text-muted-foreground transition-transform {isOpen ? 'rotate-90' : ''}" />
        {/snippet}
      </Button>
    {/snippet}
  </SidebarStickyHeader>
  {#if isOpen}
    <div class="p-4 flex flex-col gap-4">
      {@render children()}
    </div>
  {/if}
</div>
