import { writable, derived, get } from 'svelte/store';
import type { Deck, DeckSummary, Slide, SlideContent } from './types';
import type { DeckTheme } from './theme';
import { defaultTheme, resolveTheme } from './theme';
import { nanoid } from 'nanoid';

const staticMode: boolean = import.meta.env.PUBLIC_STATIC_MODE;
const BASE_URL: string = import.meta.env.BASE_URL;

// simulateDeployment URL param: behave like a deployed (static) build at runtime
// — saves go to sessionStorage instead of the server, and the ephemeral banner shows.
const simulateDeployment: boolean =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('simulateDeployment') === 'true';

/** True when edits should be ephemeral (sessionStorage-only). */
const ephemeralMode: boolean = staticMode || simulateDeployment;

// Read initial state from URL params
function getInitialParams() {
  if (typeof window === 'undefined') return { view: 'edit' as const, slide: 0, deck: '' };
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');
  const slide = params.get('slide');
  const deckParam = params.get('deck') ?? '';
  return {
    view: (view === 'edit' || view === 'preview' || view === 'present') ? view as 'edit' | 'preview' | 'present' : 'edit' as const,
    slide: slide ? Math.max(0, parseInt(slide, 10) - 1) : 0,
    deck: deckParam,
  };
}

const initial = getInitialParams();

export const deck = writable<Deck | null>(null);
export const currentSlideIndex = writable<number>(initial.slide);
export const viewMode = writable<'edit' | 'preview' | 'present'>(initial.view);
export const viewModeBeforePresent = writable<'edit' | 'preview'>('edit');

// Keep viewModeBeforePresent in sync so we know where to return when exiting present
viewMode.subscribe((v) => {
  if (v !== 'present') {
    viewModeBeforePresent.set(v as 'edit' | 'preview');
  }
});
export const currentDeckFile = writable<string>(initial.deck);
export const deckList = writable<DeckSummary[]>([]);
export const focusSlot = writable<{ type: 'image' | 'text'; index: number } | null>(null);
export const activeSlot = writable<{ type: 'image' | 'text'; index: number } | null>(null);
export const detailsOpen = writable<boolean>(true);
export const slideListOpen = writable<boolean>(true);
export const pendingDelete = writable<{
  slide: Slide;
  index: number;
  timer: ReturnType<typeof setTimeout>;
} | null>(null);
export const showIntro = writable<boolean>(!initial.deck);
export { staticMode, ephemeralMode };

// Sync stores -> URL
function syncURL() {
  if (typeof window === 'undefined') return;
  const deckFile = get(currentDeckFile);
  if (!deckFile) {
    // On splash page — clean URL
    window.history.replaceState(null, '', window.location.pathname);
    return;
  }
  const params = new URLSearchParams();
  params.set('deck', deckFile);
  params.set('view', get(viewMode));
  params.set('slide', String(get(currentSlideIndex) + 1));
  if (simulateDeployment) params.set('simulateDeployment', 'true');
  const newURL = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(null, '', newURL);
}

export function exitPresent() {
  viewMode.set(get(viewModeBeforePresent));
}

viewMode.subscribe(() => syncURL());
currentSlideIndex.subscribe(() => syncURL());
currentDeckFile.subscribe(() => syncURL());

export const resolvedTheme = derived(deck, ($deck) => {
  const merged: DeckTheme = { ...defaultTheme, ...($deck?.meta?.theme ?? {}) };
  return resolveTheme(merged);
});

export const slides = derived(deck, ($deck) => $deck?.slides ?? []);
export const currentSlide = derived(
  [slides, currentSlideIndex],
  ([$slides, $index]) => $slides[$index] ?? null
);
export const slideCount = derived(slides, ($slides) => $slides.length);

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

// --- I/O functions: branched on staticMode ---

export async function loadDeckList(): Promise<DeckSummary[]> {
  if (staticMode) {
    const res = await fetch(`${BASE_URL}decks/manifest.json`);
    if (res.ok) {
      const data: DeckSummary[] = await res.json();
      deckList.set(data);
      return data;
    }
    return [];
  }
  const res = await fetch('/api/decks');
  if (res.ok) {
    const data: DeckSummary[] = await res.json();
    deckList.set(data);
    return data;
  }
  return [];
}

/** Bootstrap: load deck list; open a deck if one is specified in the URL */
export async function initializeDeck() {
  const list = await loadDeckList();
  const current = get(currentDeckFile);
  if (get(currentDeckFile)) {
    showIntro.set(false);
    await loadDeck();
  }
}

export async function loadDeck() {
  const file = get(currentDeckFile);
  if (!file) return;

  // In ephemeral mode, check sessionStorage first (covers both real static and simulated)
  if (ephemeralMode) {
    const stored = sessionStorage.getItem(`deck:${file}`);
    if (stored) {
      const data: Deck = JSON.parse(stored);
      data.slides.sort((a, b) => a.order - b.order);
      deck.set(data);
      return;
    }
  }

  // Fetch from the appropriate data source (static JSON vs API)
  const url = staticMode
    ? `${BASE_URL}decks/${encodeURIComponent(file)}.json`
    : `/api/deck?file=${encodeURIComponent(file)}`;
  const res = await fetch(url);
  if (res.ok) {
    const data: Deck = await res.json();
    data.slides.sort((a, b) => a.order - b.order);
    deck.set(data);
  }
}

export async function saveDeck() {
  // If a soft-delete is pending, finalize it (slide is already removed from deck)
  const pending = get(pendingDelete);
  if (pending) {
    clearTimeout(pending.timer);
    pendingDelete.set(null);
  }
  const d = get(deck);
  if (!d) return;
  const file = get(currentDeckFile);

  if (ephemeralMode) {
    sessionStorage.setItem(`deck:${file}`, JSON.stringify(d));
    return;
  }

  await fetch(`/api/deck?file=${encodeURIComponent(file)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(d),
  });
}

function debouncedSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => saveDeck(), 500);
}

function insertSlideAfter(index: number, newSlide: Slide) {
  deck.update((d) => {
    if (!d) return d;
    d.slides = [
      ...d.slides.slice(0, index + 1),
      newSlide,
      ...d.slides.slice(index + 1).map((s) => ({ ...s, order: s.order + 1 })),
    ];
    return { ...d };
  });
  // New slide is at index+1, but clamp when deck was empty (new slide ends up at 0)
  const newCount = get(slides).length;
  currentSlideIndex.set(Math.min(index + 1, newCount - 1));
  debouncedSave();
}

export function addSlide(layout: string = 'Title') {
  const insertAfter = get(currentSlideIndex);
  insertSlideAfter(insertAfter, {
    id: nanoid(),
    order: insertAfter + 1,
    layout,
    content: { images: [], text: [], url: '' },
  });
}

export function duplicateSlide(index: number) {
  const source = get(slides)[index];
  if (!source) return;
  const newSlide: Slide = {
    id: nanoid(),
    order: index + 1,
    layout: source.layout,
    content: {
      images: [...source.content.images],
      text: [...source.content.text],
      url: source.content.url,
    },
  };
  if (source.style) {
    newSlide.style = JSON.parse(JSON.stringify(source.style));
  }
  insertSlideAfter(index, newSlide);
}

export function updateSlide(id: string, updates: Partial<Slide>) {
  deck.update((d) => {
    if (!d) return d;
    d.slides = d.slides.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    );
    return { ...d };
  });
  debouncedSave();
}

export function deleteSlide(id: string) {
  deck.update((d) => {
    if (!d) return d;
    d.slides = d.slides
      .filter((s) => s.id !== id)
      .map((s, i) => ({ ...s, order: i }));
    return { ...d };
  });
  const count = get(slides).length;
  const idx = get(currentSlideIndex);
  if (idx >= count && count > 0) {
    currentSlideIndex.set(count - 1);
  } else if (count === 0) {
    currentSlideIndex.set(0);
  }
  debouncedSave();
}

export function commitPendingDelete() {
  const pending = get(pendingDelete);
  if (!pending) return;
  clearTimeout(pending.timer);
  pendingDelete.set(null);
  saveDeck();
}

export function softDeleteSlide(id: string) {
  commitPendingDelete();

  const d = get(deck);
  if (!d) return;
  const slideIndex = d.slides.findIndex((s) => s.id === id);
  if (slideIndex === -1) return;
  const slide = { ...d.slides[slideIndex], content: { ...d.slides[slideIndex].content } };

  // Remove from UI (no save)
  deck.update((d) => {
    if (!d) return d;
    d.slides = d.slides
      .filter((s) => s.id !== id)
      .map((s, i) => ({ ...s, order: i }));
    return { ...d };
  });

  const count = get(slides).length;
  const idx = get(currentSlideIndex);
  if (idx >= count && count > 0) {
    currentSlideIndex.set(count - 1);
  } else if (count === 0) {
    currentSlideIndex.set(0);
  }

  const timer = setTimeout(() => commitPendingDelete(), 5000);
  pendingDelete.set({ slide, index: slideIndex, timer });
}

export function undoDelete() {
  const pending = get(pendingDelete);
  if (!pending) return;
  clearTimeout(pending.timer);

  deck.update((d) => {
    if (!d) return d;
    const { slide, index } = pending;
    const before = d.slides.slice(0, index);
    const after = d.slides.slice(index);
    d.slides = [...before, slide, ...after].map((s, i) => ({ ...s, order: i }));
    return { ...d };
  });

  currentSlideIndex.set(pending.index);
  pendingDelete.set(null);
  debouncedSave();
}

export function reorderSlide(id: string, newOrder: number) {
  deck.update((d) => {
    if (!d) return d;
    const slide = d.slides.find((s) => s.id === id);
    if (!slide) return d;
    const oldOrder = slide.order;
    d.slides = d.slides.map((s) => {
      if (s.id === id) return { ...s, order: newOrder };
      if (oldOrder < newOrder && s.order > oldOrder && s.order <= newOrder)
        return { ...s, order: s.order - 1 };
      if (oldOrder > newOrder && s.order >= newOrder && s.order < oldOrder)
        return { ...s, order: s.order + 1 };
      return s;
    });
    d.slides.sort((a, b) => a.order - b.order);
    return { ...d };
  });
  debouncedSave();
}

export function navigateSlide(direction: 'prev' | 'next') {
  const count = get(slideCount);
  if (count === 0) return;
  currentSlideIndex.update((idx) => {
    if (direction === 'prev') return Math.max(0, idx - 1);
    return Math.min(count - 1, idx + 1);
  });
}

export async function switchDeck(filename: string) {
  commitPendingDelete();
  // Flush any pending save for current deck
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
    await saveDeck();
  }
  currentDeckFile.set(filename);
  currentSlideIndex.set(0);
  showIntro.set(false);
  await loadDeck();
}

export async function renameDeck(newTitle: string) {
  if (ephemeralMode) {
    // In static mode, just update in-memory + sessionStorage
    deck.update((d) => {
      if (!d) return d;
      return { ...d, meta: { ...d.meta, title: newTitle } };
    });
    const file = get(currentDeckFile);
    const d = get(deck);
    if (d) sessionStorage.setItem(`deck:${file}`, JSON.stringify(d));
    // Update deck list in-memory
    deckList.update((list) =>
      list.map((item) =>
        item.filename === file ? { ...item, title: newTitle } : item
      )
    );
    return;
  }

  const currentFile = get(currentDeckFile);
  const res = await fetch('/api/decks', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentFilename: currentFile, newTitle }),
  });
  if (res.ok) {
    const { filename } = await res.json();
    // Update local deck meta
    deck.update((d) => {
      if (!d) return d;
      return { ...d, meta: { ...d.meta, title: newTitle } };
    });
    // If the filename changed, update the URL and store
    if (filename !== currentFile) {
      currentDeckFile.set(filename);
    }
    await loadDeckList();
  }
}

export async function deleteDeck(filename: string) {
  const currentFile = get(currentDeckFile);
  const list = get(deckList);

  if (ephemeralMode) {
    sessionStorage.removeItem(`deck:${filename}`);
    deckList.update((l) => l.filter((d) => d.filename !== filename));
  } else {
    const res = await fetch('/api/decks', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename }),
    });
    if (!res.ok) return;
    await loadDeckList();
  }

  if (currentFile === filename) {
    const remaining = get(deckList);
    const next = remaining.find((d) => d.filename !== filename) ?? remaining[0];
    if (next) {
      await switchDeck(next.filename);
    } else {
      currentDeckFile.set('');
      deck.set(null);
      showIntro.set(true);
    }
  }
}

export function updateTheme(updates: Partial<DeckTheme>) {
  deck.update((d) => {
    if (!d) return d;
    const current = d.meta.theme ?? {};
    return { ...d, meta: { ...d.meta, theme: { ...current, ...updates } } };
  });
  debouncedSave();
}

export async function moveSlideToDeck(slideId: string, targetDeckFile: string) {
  const d = get(deck);
  if (!d) return;
  const slide = d.slides.find((s) => s.id === slideId);
  if (!slide) return;

  // Deep-copy the slide for the target deck
  const slideCopy: Slide = { ...slide, content: { ...slide.content, images: [...slide.content.images], text: [...slide.content.text] } };
  if (slide.style) slideCopy.style = JSON.parse(JSON.stringify(slide.style));

  if (ephemeralMode) {
    // Load target deck from sessionStorage, falling back to API in simulate mode
    let targetDeck: Deck;
    const stored = sessionStorage.getItem(`deck:${targetDeckFile}`);
    if (stored) {
      targetDeck = JSON.parse(stored);
    } else if (!staticMode) {
      const res = await fetch(`/api/deck?file=${encodeURIComponent(targetDeckFile)}`);
      if (!res.ok) return;
      targetDeck = await res.json();
    } else {
      return;
    }
    slideCopy.order = targetDeck.slides.length;
    targetDeck.slides.push(slideCopy);
    targetDeck.meta.updatedAt = new Date().toISOString();
    sessionStorage.setItem(`deck:${targetDeckFile}`, JSON.stringify(targetDeck));
  } else {
    // Fetch target deck, append slide, save it back
    const res = await fetch(`/api/deck?file=${encodeURIComponent(targetDeckFile)}`);
    if (!res.ok) return;
    const targetDeck: Deck = await res.json();
    slideCopy.order = targetDeck.slides.length;
    targetDeck.slides.push(slideCopy);
    const putRes = await fetch(`/api/deck?file=${encodeURIComponent(targetDeckFile)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(targetDeck),
    });
    if (!putRes.ok) return;
  }

  // Remove from current deck
  deleteSlide(slideId);
  await loadDeckList();
}

export async function createDeck(title: string) {
  if (ephemeralMode) {
    const id = nanoid();
    const filename = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newDeck: Deck = {
      meta: {
        id,
        title,
        author: '',
        updatedAt: new Date().toISOString(),
      },
      slides: [{
        id: nanoid(),
        order: 0,
        layout: 'Title',
        content: { images: [], text: [], url: '' },
      }],
    };
    sessionStorage.setItem(`deck:${filename}`, JSON.stringify(newDeck));
    const summary: DeckSummary = {
      id,
      title,
      filename,
      updatedAt: newDeck.meta.updatedAt,
      slideCount: 1,
    };
    deckList.update((list) => [summary, ...list]);
    await switchDeck(filename);
    return;
  }

  const res = await fetch('/api/decks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (res.ok) {
    const summary: DeckSummary = await res.json();
    await loadDeckList();
    await switchDeck(summary.filename);
  }
}
