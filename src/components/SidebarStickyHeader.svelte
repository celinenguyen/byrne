<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }
  let { children }: Props = $props();
</script>

<div class="flex justify-center sticky top-0 z-10 bg-white/40 px-3 py-2 border-b border-border backdrop-blur-sm">
  {@render children()}
</div>
