<script lang="ts">
  import { marked } from 'marked';

  interface Props {
    text: string;
    inline?: boolean;
    class?: string;
  }
  let { text, inline = false, class: className = '' }: Props = $props();

  // Smart quotes regex from marked-smartypants-lite (proven pattern used by marked for years).
  // Decode HTML entities first, then: opening quotes match after whitespace/punctuation/start-of-line,
  // everything else (including apostrophes in contractions) falls through as closing quotes.
  function smartQuotes(html: string): string {
    return html
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/(^|[-\u2014/(\[{\s])'/g, '$1\u2018')      // opening single
      .replace(/'/g, '\u2019')                              // closing single / apostrophe
      .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c') // opening double
      .replace(/"/g, '\u201d');                              // closing double
  }

  let html = $derived(
    smartQuotes(
      inline
        ? (marked.parseInline(text, { async: false }) as string)
        : (marked.parse(text, { async: false }) as string)
    )
  );
</script>

<span class={className}>{@html html}</span>
