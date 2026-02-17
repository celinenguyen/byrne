import type { DeckTheme } from './theme';

export interface DeckMeta {
  id: string;
  title: string;
  author: string;
  updatedAt: string;
  theme?: Partial<DeckTheme>;
}

export interface DeckSummary {
  id: string;
  title: string;
  filename: string;
  updatedAt: string;
  slideCount: number;
}

export interface SlideData {
  images: string[];
  text: string[];
  url?: string;
}

export interface Slide {
  id: string;
  order: number;
  layout: string;
  data: SlideData;
}

export interface Deck {
  meta: DeckMeta;
  slides: Slide[];
}

export interface SlotMeta {
  index: number;
  isUsed: boolean;
  displayName: string;
  isRequired: boolean;
  hasContent: boolean;
}

export interface SlotDefinition {
  displayName: string;
  isRequired: boolean;
  placeholder?: string;
}

export interface LayoutSettings {
  images?: Record<string, SlotDefinition>;
  text?: Record<string, SlotDefinition>;
  url?: Record<string, SlotDefinition>;
}
