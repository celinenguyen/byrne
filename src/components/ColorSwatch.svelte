<script lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements';

  interface Props extends HTMLButtonAttributes {
    color: string;
    selected?: boolean;
    size?: 'sm' | 'md';
  }
  let { color, selected = false, size = 'md', class: className, ...rest }: Props = $props();

  const sizes = { sm: 'size-5', md: 'size-6' };
</script>

<button
  class="{sizes[size]} shrink-0 rounded-full border-[0.5px] transition-shadow cursor-pointer {selected ? 'ring-[1.5px] ring-stone-400' : 'hover:ring-2 hover:ring-stone-300'} {className ?? ''}"
  style="background-color: {color}"
  {...rest}
></button>
