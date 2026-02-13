import { writable, derived, get } from 'svelte/store';
import type { Deck, Slide, SlideData } from './types';
import { nanoid } from 'nanoid';

// Read initial state from URL params
function getInitialParams() {
  if (typeof window === 'undefined') return { view: 'edit' as const, slide: 0 };
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');
  const slide = params.get('slide');
  return {
    view: (view === 'edit' || view === 'present') ? view : 'edit' as const,
    slide: slide ? Math.max(0, parseInt(slide, 10) - 1) : 0,
  };
}

const initial = getInitialParams();

export const deck = writable<Deck | null>(null);
export const currentSlideIndex = writable<number>(initial.slide);
export const viewMode = writable<'edit' | 'present'>(initial.view);
export const focusSlot = writable<{ type: 'image' | 'text'; index: number } | null>(null);

// Sync stores -> URL
function syncURL() {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams();
  params.set('view', get(viewMode));
  params.set('slide', String(get(currentSlideIndex) + 1));
  const newURL = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(null, '', newURL);
}

viewMode.subscribe(() => syncURL());
currentSlideIndex.subscribe(() => syncURL());

export const slides = derived(deck, ($deck) => $deck?.slides ?? []);
export const currentSlide = derived(
  [slides, currentSlideIndex],
  ([$slides, $index]) => $slides[$index] ?? null
);
export const slideCount = derived(slides, ($slides) => $slides.length);

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export async function loadDeck() {
  const res = await fetch('/api/deck');
  if (res.ok) {
    const data: Deck = await res.json();
    data.slides.sort((a, b) => a.order - b.order);
    deck.set(data);
  }
}

export async function saveDeck() {
  const d = get(deck);
  if (!d) return;
  await fetch('/api/deck', {
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
    notes: '',
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
    notes: source.notes,
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

