<script lang="ts" module>
  // Svelte action: portals an element to a target container
  function portal(node: HTMLElement, target: HTMLElement) {
    target.appendChild(node);
    return {
      destroy() {
        node.remove();
      }
    };
  }
</script>

<script lang="ts">
  import { fade } from 'svelte/transition';
  import { computePosition, autoUpdate, flip, shift, offset } from '@floating-ui/dom';
  import * as Field from '$lib/components/ui/field';
  import * as Kbd from '$lib/components/ui/kbd';
  import MarkdownText from './layouts/MarkdownText.svelte';

  interface Props {
    text: string;
    editable: boolean;
    x: number;
    y: number;
    slotEl: HTMLElement;
    editText: string;
    onEditTextChange: (value: string) => void;
    onKeydown: (e: KeyboardEvent) => void;
    textareaEl?: HTMLTextAreaElement;
    popoverEl?: HTMLDivElement;
  }
  let {
    text,
    editable,
    x,
    y,
    slotEl,
    editText,
    onEditTextChange,
    onKeydown,
    textareaEl = $bindable(),
    popoverEl = $bindable(),
  }: Props = $props();

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  function handleInput(e: Event) {
    const el = e.currentTarget as HTMLTextAreaElement;
    onEditTextChange(el.value);
    autoResize(el);
  }

  // Use Floating UI with a virtual reference element at the dot position
  $effect(() => {
    if (!slotEl || !popoverEl) return;
    const el = popoverEl;

    const virtualRef = {
      getBoundingClientRect() {
        const rect = slotEl.getBoundingClientRect();
        const px = rect.left + x * rect.width;
        const py = rect.top + y * rect.height;
        return {
          x: px, y: py,
          top: py, left: px, bottom: py, right: px,
          width: 0, height: 0,
        };
      },
    };

    const cleanup = autoUpdate(virtualRef, el, () => {
      computePosition(virtualRef, el, {
        strategy: 'fixed',
        placement: 'bottom',
        middleware: [
          offset(12),
          flip({ padding: 8 }),
          shift({ padding: 8 }),
        ],
      }).then(({ x: fx, y: fy }) => {
        el.style.left = `${fx}px`;
        el.style.top = `${fy}px`;
      });
    });

    return cleanup;
  });

  // Auto-resize when editable opens (handles existing text).
  $effect(() => {
    if (textareaEl && editable) {
      const el = textareaEl;
      requestAnimationFrame(() => autoResize(el));
    }
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div use:portal={document.body}>
  <div
    bind:this={popoverEl}
    class="fixed z-50 w-[min(400px,90vw)] backdrop-blur-sm bg-white/80 rounded-sm border border-border shadow-lg text-xs pointer-events-auto"
    style:left="0"
    style:top="0"
    onclick={(e) => e.stopPropagation()}
    onkeydown={onKeydown}
    transition:fade={{ duration: 120 }}
  >
    <div class="px-2.5 pt-2 pb-0.5 text-stone-800">
    {#if editable}
      <Field.Root>
        <Field.Content>
          <textarea
            bind:this={textareaEl}
            value={editText}
            oninput={handleInput}
            class="w-full border bg-stone-100/50 border-stone-200 rounded p-1.5 resize-none overflow-hidden focus:outline-none focus:ring-4 focus:ring-stone-200 focus:border-stone-400 prose prose-sm"
            placeholder="Write a comment"
            rows={2}
          ></textarea>
        </Field.Content>
        <Field.Hint class="mb-2">
          <Kbd.Root>Enter</Kbd.Root> to save, 
          <Kbd.Root>Esc</Kbd.Root> to close</Field.Hint>
      </Field.Root>
    {:else}
      <div class="border-transparent rounded p-1.5">
        <MarkdownText text={text} class="prose prose-sm" />
      </div>
    {/if}
    </div>
  </div>
</div>

<style>
  :global(.prose) {
    &:first-child {
      margin-top: 0;
    }
    &:last-child {
      margin-bottom: 0;
    }
  }

  :global(.prose p) {
    margin-bottom: 0.4em;
  }
  :global(.prose ul) {
    margin-top: 0.4em;
    padding-inline-start: 0.8em;
  }
  :global(.prose ul li) {
    padding-inline-start: 0.2em;
  }
  :global(.prose ul li::marker),
  :global(.prose ol li::marker) {
    color: var(--color-stone-400);
  }
</style>