<script lang="ts">
  import { deckList, createDeck, switchDeck, staticMode } from '../lib/store';
  import { formatRelativeDate } from '../lib/format-date';
  import type { DeckSummary } from '../lib/types';
  import AppHeader from '@celinenguyen/software-as-leisure-activity/svelte/AppHeader.svelte';
  import AppFooter from '@celinenguyen/software-as-leisure-activity/svelte/AppFooter.svelte';
  import speakingInTongues from '../assets/speaking-in-tongues.png';

  let decks = $derived($deckList);

  let creating = $state(false);
  let newTitle = $state('');

  // ─── Header quote ─────────────────────────────────────────────────
  const headerQuote = "If business is poetry…presentations…are the salons and literary collaborations of our time.";
  const headerAttribution = "David Byrne";
  const headerUrl = "https://www.jstor.org/stable/27092893";
  // ───────────────────────────────────────────────────────────────────

  // ─── Footer epigrams ──────────────────────────────────────────────
  const epigrams = [
    { text: "Software as leisure activity", url: "https://github.com/celinenguyen/byrne"},
    { text: "Slide decks as social activity", url: "https://www.washingtonpost.com/style/of-interest/2024/07/28/powerpoint-night-parties/" }
  ];
  // ───────────────────────────────────────────────────────────────────

  function openDeck(filename: string) {
    switchDeck(filename);
  }

  async function handleCreate() {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    creating = false;
    newTitle = '';
    await createDeck(trimmed);
  }

  function handleCreateKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleCreate();
    if (e.key === 'Escape') { creating = false; newTitle = ''; }
  }
</script>

<div class="h-screen flex flex-col bg-slate-50/50">
<AppHeader quote={headerQuote} attribution={headerAttribution} url={headerUrl || undefined} />

<div class="overflow-y-auto md:flex md:flex-col md:gap-4 md:flex-row md:min-h-0 md:h-full md:px-2 md:justify-center">
  <!-- Left: image -->
  <div class="md:px-4">
    <img
      src={speakingInTongues.src}
      alt=""
      class="grayscale md:py-4 md:max-h-full md:object-contain"
    />
  </div>

  <!-- Right: page content -->
  <div class="mt-8 mb-6 mx-2 md:mx-0 flex flex-col md:overflow-y-auto md:justify-center">
    <div class="w-full">
      <div class="mb-8 px-4 mb-6">
        <h1 class="app-name text-6xl font-medium text-foreground mb-2">byrne</h1>
        <p class="app-description text-lg text-muted-foreground">
          an idiosyncratic slide deck app by <a href="https://www.celinenguyen.com" class="text-primary hover:underline hover:text-foreground transition-colors">Celine Nguyen</a>
        </p>
      </div>

      {#if decks.length > 0}
        <div class="flex flex-col gap-1">
          {#each decks as d}
            <button
              class="flex flex-col gap-0.5 w-full rounded-md px-4 py-2 cursor-pointer
                text-left transition-colors outline-none
                hover:bg-accent hover:text-accent-foreground"
              onclick={() => openDeck(d.filename)}
            >
              <span class="text-md font-medium mb-0.5 tracking-[1%]">{d.title}</span>
              <span class="text-sm text-muted-foreground flex items-center gap-1">
                <span>{formatRelativeDate(d.updatedAt)}</span>
                <span class="px-0.5">✴︎</span>
                <span>{d.slideCount} {d.slideCount === 1 ? 'slide' : 'slides'}</span>
              </span>
            </button>
          {/each}
        </div>
      {:else}
        <p class="text-sm text-muted-foreground">No published decks yet.</p>
      {/if}

      <div class="">
        {#if creating}
          <!-- svelte-ignore a11y_autofocus -->
          <input
            class="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Deck name"
            bind:value={newTitle}
            onkeydown={handleCreateKeydown}
            autofocus
          />
        {:else}
        {/if}
      </div>
    </div>
  </div>
</div>

<AppFooter epigrams={epigrams} />
</div>

<style>
  .app-name {
    font-family: "Newsreader", Georgia, serif;
    letter-spacing: -0.02em;
  }
  .app-description {
    line-height: 1.6;
  }
</style>
