<script lang="ts">
  interface Props {
    class?: string;
  }
  let { class: className = '' }: Props = $props();
</script>

<div class="aspect-video w-full relative overflow-hidden bg-white {className}">
  <slot />
</div>
