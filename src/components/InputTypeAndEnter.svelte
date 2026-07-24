<script lang="ts">
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import * as InputGroup from '$lib/components/ui/input-group/index.js';
  import * as ButtonGroup from '$lib/components/ui/button-group/index.js';

  interface Props {
    placeholder?: string;
    value?: string;
    onsubmit: () => void;
    class?: string;
    ariaLabel?: string;
    autofocus?: boolean;
  }
  let { placeholder = '', value = $bindable(''), onsubmit, class: className = '', ariaLabel = 'Submit', autofocus = false }: Props = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') onsubmit();
  }
</script>

<!-- svelte-ignore a11y_label_has_associated_control -->
<ButtonGroup.Root class="w-full {className}">
  <InputGroup.Root class="group relative flex-1 overflow-hidden">
    <InputGroup.Input
      {placeholder}
      bind:value
      onkeydown={handleKeydown}
      {autofocus}
    />
    <button
      type="button"
      onclick={onsubmit}
      aria-label={ariaLabel}
      class="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded p-0.5 opacity-0 shadow-[0_0_8px_6px_white] transition-opacity group-focus-within:opacity-95 bg-white"
    >
      <ArrowRight class="size-4" />
    </button>
  </InputGroup.Root>
</ButtonGroup.Root>
