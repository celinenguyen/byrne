<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }
  let { children }: Props = $props();
</script>

<div class="sticky top-0 z-10">
  <div class="flex justify-center px-2 py-2 border-border backdrop-blur-md bg-white/40 pb-2"
    style="mask-image: linear-gradient(to bottom, black 0%, black 50%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 0%, black 50%, transparent 100%);"
  >
    {@render children()}
  </div>
</div>
