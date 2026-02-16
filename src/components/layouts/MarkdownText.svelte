<script lang="ts">
  import { marked } from 'marked';

  interface Props {
    text: string;
    inline?: boolean;
    class?: string;
  }
  let { text, inline = false, class: className = '' }: Props = $props();

  let html = $derived(
    inline
      ? (marked.parseInline(text, { async: false }) as string)
      : (marked.parse(text, { async: false }) as string)
  );
</script>

<span class={className}>{@html html}</span>
