<script lang="ts">
  interface Props {
    src: string;
    slotName: string;
    class?: string;
  }
  let { src, slotName, class: className = '' }: Props = $props();
</script>

<div data-slot="image:{slotName}" class="flex items-center justify-center {src ? '' : 'bg-muted'} {className}">
  {#if src}
    <img {src} alt="" class="max-w-full max-h-full object-contain" />
  {:else}
    <div class="text-stone-300 text-sm">no image</div>
  {/if}
</div>
