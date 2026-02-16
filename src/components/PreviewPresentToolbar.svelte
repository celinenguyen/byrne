<script lang="ts">
  import * as Kbd from '$lib/components/ui/kbd/index.js';

  interface Props {
    currentIndex: number;
    slideCount: number;
    exitLabel?: string;
    variant?: 'dark' | 'light';
  }
  let { currentIndex, slideCount, exitLabel = 'Esc', variant = 'dark' }: Props = $props();

  let dark = $derived(variant === 'dark');
  let pillClass = $derived(dark ? 'bg-black/60' : 'bg-background/80 border border-border backdrop-blur-md');
</script>

<div class="fixed bottom-4 left-1/2 -translate-x-1/2 text-sm flex flex-row gap-4 items-center justify-center tracking-wide {dark ? 'text-white/50' : 'text-muted-foreground'}">
  <div class="px-4 py-2 rounded-full {pillClass}">
    <span class={dark ? 'text-white/80' : 'text-foreground'}> {currentIndex + 1}</span><span class="mx-1">/</span>{slideCount}
  </div>
  <div class="px-4 py-2 rounded-full {pillClass}">
    <Kbd.Root class="px-1 py-0.5 mr-1 {dark ? 'bg-white/20 text-white/60 border border-white/20 backdrop-blur-md' : ''}">{exitLabel}</Kbd.Root> to exit
  </div>
</div>
