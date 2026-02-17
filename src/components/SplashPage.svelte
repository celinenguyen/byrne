<script lang="ts">
  import { deckList, createDeck, switchDeck, staticMode } from '../lib/store';
  import { formatRelativeDate } from '../lib/format-date';
  import type { DeckSummary } from '../lib/types';
  import AppHeader from '@celinenguyen/software-as-leisure-activity/svelte/AppHeader.svelte';
  import AppFooter from '@celinenguyen/software-as-leisure-activity/svelte/AppFooter.svelte';

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

<AppHeader quote={headerQuote} attribution={headerAttribution} url={headerUrl || undefined} />

<div class="flex-1 flex flex-col items-center justify-center bg-background px-4">
  <div class="w-full max-w-md">
    <div class="mb-8">
      <h1 class="text-lg font-medium text-foreground">byrne</h1>
      <p class="text-sm text-muted-foreground mt-1">
        a slide deck tool by <a href="https://www.celinenguyen.com" class="underline hover:text-foreground transition-colors">Celine Nguyen</a>
      </p>
    </div>

    {#if decks.length > 0}
      <div class="flex flex-col gap-1">
        {#each decks as d}
          <button
            class="flex flex-col gap-0.5 w-full rounded-md px-3 py-2 cursor-pointer
              text-left transition-colors outline-none
              hover:bg-accent hover:text-accent-foreground"
            onclick={() => openDeck(d.filename)}
          >
            <span class="text-sm">{d.title}</span>
            <span class="text-xs text-muted-foreground flex items-center gap-1">
              <span>{formatRelativeDate(d.updatedAt)}</span>
              &middot;
              <span>{d.slideCount} {d.slideCount === 1 ? 'slide' : 'slides'}</span>
            </span>
          </button>
        {/each}
      </div>
    {:else}
      <p class="text-sm text-muted-foreground">No published decks yet.</p>
    {/if}

    <div class="mt-4">
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
        <button
          class="flex items-center gap-2 rounded-md px-3 py-2 text-sm cursor-pointer
            text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          onclick={() => { creating = true; }}
        >
          + New deck
        </button>
      {/if}
    </div>
  </div>
</div>

<AppFooter epigrams={epigrams} />
