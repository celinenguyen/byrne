<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }
  let { children }: Props = $props();
</script>

<div class="sticky top-0 z-10">
  <div class="relative flex justify-center pr-4 py-2 pb-2">
    <!-- blurred background layer with fade-out mask -->
    <div
      class="pointer-events-none absolute inset-0 border-border backdrop-blur-md bg-white/40"
      style="mask-image: linear-gradient(to bottom, black 0%, black 50%, transparent 100%); -webkit-mask-image: linear-gradient(to bottom, black 0%, black 50%, transparent 100%);"
    ></div>
    <div class="relative w-full">
      {@render children()}
    </div>
  </div>
</div>
