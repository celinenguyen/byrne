import { writable, derived, get } from 'svelte/store';
import type { Deck, DeckSummary, Slide, SlideData } from './types';
import type { DeckTheme } from './theme';
import { defaultTheme, resolveTheme } from './theme';
import { nanoid } from 'nanoid';

const LAST_DECK_KEY = 'diana:lastDeck';

// Read initial state from URL params
function getInitialParams() {
  if (typeof window === 'undefined') return { view: 'edit' as const, slide: 0, deck: '' };
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');
  const slide = params.get('slide');
  const deckParam = params.get('deck');
  const lastDeck = localStorage.getItem(LAST_DECK_KEY) ?? '';
  return {
    view: (view === 'edit' || view === 'preview' || view === 'present') ? view as 'edit' | 'preview' | 'present' : 'edit' as const,
    slide: slide ? Math.max(0, parseInt(slide, 10) - 1) : 0,
    deck: deckParam || lastDeck,
  };
}

const initial = getInitialParams();

export const deck = writable<Deck | null>(null);
export const currentSlideIndex = writable<number>(initial.slide);
export const viewMode = writable<'edit' | 'preview' | 'present'>(initial.view);
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

// Sync stores -> URL
function syncURL() {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams();
  const deckFile = get(currentDeckFile);
  if (deckFile) {
    params.set('deck', deckFile);
  }
  params.set('view', get(viewMode));
  params.set('slide', String(get(currentSlideIndex) + 1));
  const newURL = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(null, '', newURL);
}

viewMode.subscribe(() => syncURL());
currentSlideIndex.subscribe(() => syncURL());
currentDeckFile.subscribe((file) => {
  syncURL();
  if (typeof window !== 'undefined' && file) {
    localStorage.setItem(LAST_DECK_KEY, file);
  }
});

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

export async function loadDeckList(): Promise<DeckSummary[]> {
  const res = await fetch('/api/decks');
  if (res.ok) {
    const data: DeckSummary[] = await res.json();
    deckList.set(data);
    return data;
  }
  return [];
}

/** Bootstrap: pick a deck if none specified in URL or localStorage */
export async function initializeDeck() {
  const list = await loadDeckList();
  const current = get(currentDeckFile);
  if (!current && list.length > 0) {
    // Pick the most recently modified deck
    const sorted = [...list].sort((a, b) =>
      (b.updatedAt || '').localeCompare(a.updatedAt || '')
    );
    currentDeckFile.set(sorted[0].filename);
  }
  if (get(currentDeckFile)) {
    await loadDeck();
  }
}

export async function loadDeck() {
  const file = get(currentDeckFile);
  const res = await fetch(`/api/deck?file=${encodeURIComponent(file)}`);
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
  currentSlideIndex.set(index + 1);
  debouncedSave();
}

export function addSlide(layout: string = 'Title') {
  const insertAfter = get(currentSlideIndex);
  insertSlideAfter(insertAfter, {
    id: nanoid(),
    order: insertAfter + 1,
    layout,
    data: { images: [], text: [], url: '' },
  });
}

export function duplicateSlide(index: number) {
  const source = get(slides)[index];
  if (!source) return;
  insertSlideAfter(index, {
    id: nanoid(),
    order: index + 1,
    layout: source.layout,
    data: {
      images: [...source.data.images],
      text: [...source.data.text],
      url: source.data.url,
    },
  });
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
  const slide = { ...d.slides[slideIndex], data: { ...d.slides[slideIndex].data } };

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
  await loadDeck();
}

export async function renameDeck(newTitle: string) {
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

export function updateTheme(updates: Partial<DeckTheme>) {
  deck.update((d) => {
    if (!d) return d;
    const current = d.meta.theme ?? {};
    return { ...d, meta: { ...d.meta, theme: { ...current, ...updates } } };
  });
  debouncedSave();
}

export async function createDeck(title: string) {
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
