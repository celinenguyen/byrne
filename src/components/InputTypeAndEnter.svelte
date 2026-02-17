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
  <InputGroup.Root class="group flex-1">
    <InputGroup.Input
      {placeholder}
      bind:value
      onkeydown={handleKeydown}
      {autofocus}
    />
    <InputGroup.Addon align="inline-end">
      <InputGroup.Button size="icon-xs" onclick={onsubmit} aria-label={ariaLabel} class="opacity-0 transition-opacity group-focus-within:opacity-100">
        <ArrowRight class="size-4" />
      </InputGroup.Button>
    </InputGroup.Addon>
  </InputGroup.Root>
</ButtonGroup.Root>
