<script lang="ts">
  interface Props {
    src: string;
    slotName: string;
    class?: string;
  }
  let { src, slotName, class: className = '' }: Props = $props();
</script>

<div data-slot="image:{slotName}" class="{src ? '' : 'bg-muted flex items-center justify-center '} {className}">
  {#if src}
    <img {src} alt="" class="max-w-full max-h-full object-contain" />
  {:else}
    <div class="text-stone-400/80 text-md tracking-[2%]">image</div>
  {/if}
</div>
