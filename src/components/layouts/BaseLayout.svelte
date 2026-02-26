<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    class?: string;
    children: Snippet;
  }
  let { class: className = '', children }: Props = $props();
</script>

<div class="aspect-video w-full h-full relative overflow-hidden {className}" style="background-color: var(--slide-color-bg, white)">
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
      text-decoration-thickness: 0.06em;
      text-underline-offset: 0.15em;
    }
  }
</style>