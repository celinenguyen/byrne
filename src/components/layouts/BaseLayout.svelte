<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    class?: string;
    children: Snippet;
  }
  let { class: className = '', children }: Props = $props();
</script>

<div class="aspect-video w-full relative overflow-hidden bg-white {className}">
  {@render children()}
</div>
