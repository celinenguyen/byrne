<script lang="ts">
  import Button from './ui/Button.svelte';
  import Icon from './ui/Icon.svelte';
  import * as Tabs from './ui/tabs/index';
  import {
    viewMode,
    currentSlideIndex,
    slideCount,
    slides,
    navigateSlide,
    deck,
  } from '../lib/store';

  let mode = $derived($viewMode);
  let count = $derived($slideCount);
  let idx = $derived($currentSlideIndex);
  let meta = $derived($deck?.meta);
  let allSlides = $derived($slides);

  let showJumpMenu = $state(false);

  function jumpToSlide(i: number) {
    currentSlideIndex.set(i);
    showJumpMenu = false;
  }
</script>

<div class="flex justify-center px-4 py-2 border-b border-border bg-background shrink-0">
  <!-- view mode tabs -->
  <Tabs.Root value={mode} onValueChange={(v) => viewMode.set(v as 'edit' | 'present')}>
    <Tabs.List>
      <Tabs.Trigger value="edit">Edit</Tabs.Trigger>
      <Tabs.Trigger value="present">Present</Tabs.Trigger>
    </Tabs.List>
  </Tabs.Root>
</div>
