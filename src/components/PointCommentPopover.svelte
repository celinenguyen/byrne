<script lang="ts">
  import { fade } from 'svelte/transition';
  import MarkdownText from './layouts/MarkdownText.svelte';

  interface Props {
    text: string;
    editable: boolean;
    x: number;
    y: number;
    editText: string;
    onEditTextChange: (value: string) => void;
    onDelete: () => void;
    onKeydown: (e: KeyboardEvent) => void;
    textareaEl?: HTMLTextAreaElement;
    popoverEl?: HTMLDivElement;
  }
  let {
    text,
    editable,
    x,
    y,
    editText,
    onEditTextChange,
    onDelete,
    onKeydown,
    textareaEl = $bindable(),
    popoverEl = $bindable(),
  }: Props = $props();
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={popoverEl}
  class="absolute z-30 min-w-[200px] max-w-[280px] bg-white border border-stone-200 rounded-md shadow-lg text-xs pointer-events-auto -translate-x-1/2"
  style:left="{x * 100}%"
  style:top="calc({y * 100}% + 1em)"
  onclick={(e) => e.stopPropagation()}
  onkeydown={onKeydown}
  transition:fade={{ duration: 120 }}
>
  {#if editable}
    <div class="p-2">
      <textarea
        bind:this={textareaEl}
        value={editText}
        oninput={(e) => onEditTextChange(e.currentTarget.value)}
        class="w-full min-h-[60px] text-xs border border-stone-200 rounded p-1.5 resize-y focus:outline-none focus:border-stone-400"
        placeholder="Write a comment..."
      ></textarea>
      <div class="flex justify-end mt-1">
        <button
          class="text-[10px] text-red-500 hover:text-red-700 px-1.5 py-0.5"
          onclick={(e) => { e.stopPropagation(); onDelete(); }}
        >Delete</button>
      </div>
    </div>
  {:else}
    <div class="p-2 prose prose-xs max-w-none text-stone-700">
      <MarkdownText text={text} inline />
    </div>
  {/if}
</div>
