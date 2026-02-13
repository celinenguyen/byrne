<script lang="ts">
  import type { SlideData } from '../../lib/types';
  import BaseLayout from './BaseLayout.svelte';
  import { marked } from 'marked';

  interface Props {
    data: SlideData;
    context?: 'desktop' | 'mobile';
  }
  let { data }: Props = $props();

  let body = $derived(data.text?.['1'] || '');
  let bodyHtml = $derived(marked.parse(body, { async: false }) as string);
</script>

<BaseLayout>
  <div class="flex items-center justify-center h-full px-16 py-12">
    <div class="prose prose-lg max-w-3xl">
      {@html bodyHtml}
    </div>
  </div>
</BaseLayout>
