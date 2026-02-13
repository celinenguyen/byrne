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
    view: (view === 'edit' || view === 'preview' || view === 'present') ? view : 'edit' as const,
    slide: slide ? Math.max(0, parseInt(slide, 10) - 1) : 0,
  };
}

const initial = getInitialParams();

export const deck = writable<Deck | null>(null);
export const currentSlideIndex = writable<number>(initial.slide);
export const viewMode = writable<'edit' | 'preview' | 'present'>(initial.view);

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

export function addSlide(layout: string = 'Title') {
  deck.update((d) => {
    if (!d) return d;
    const newSlide: Slide = {
      id: nanoid(),
      order: d.slides.length,
      layout,
      data: { images: {}, text: {} },
      notes: '',
    };
    d.slides = [...d.slides, newSlide];
    return { ...d };
  });
  currentSlideIndex.set(get(slides).length - 1);
  debouncedSave();
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

export function updateSlideData(id: string, data: SlideData) {
  updateSlide(id, { data });
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
