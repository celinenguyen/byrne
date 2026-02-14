<script lang="ts">
  import { softDeleteSlide } from '../lib/store';
  import Icon from './ui/Icon.svelte';

  interface Props {
    slideId: string;
    class?: string;
  }
  let { slideId, class: className = '' }: Props = $props();
</script>

<button
  class="absolute opacity-0 group-hover:opacity-100 p-[0.3rem] rounded-full bg-muted-foreground text-white hover:bg-foreground cursor-pointer transition-colors {className}"
  onclick={(e) => { e.stopPropagation(); softDeleteSlide(slideId); }}
>
  <Icon name="x" class="size-3.5" />
</button>
