<script lang="ts">
  import type { Snippet } from 'svelte';
  import { resolvedTheme } from '../../lib/store';

  interface Props {
    class?: string;
    children: Snippet;
  }
  let { class: className = '', children }: Props = $props();

  let styleString = $derived(
    Object.entries($resolvedTheme)
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ')
  );
</script>

<div class="aspect-video w-full h-full relative overflow-hidden {className}" style="{styleString}; background-color: var(--slide-color-bg, white)">
  {@render children()}
</div>

<style>
  /* selector for all text slots (children/snippet content) */
  :global(div[data-slot^="text:"] a),
  :global(h1[data-slot^="text:"] a),
  :global(p[data-slot^="text:"] a) {
    color: var(--slide-color-accent);
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
</style>