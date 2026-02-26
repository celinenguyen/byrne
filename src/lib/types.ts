import type { DeckTheme } from './theme';

export interface DeckMeta {
  id: string;
  title: string;
  author: string;
  updatedAt: string;
  theme?: Partial<DeckTheme>;
  status?: 'draft' | 'published';
  publishedAt?: string;
}

export interface DeckSummary {
  id: string;
  title: string;
  filename: string;
  updatedAt: string;
  slideCount: number;
  status?: 'draft' | 'published';
  publishedAt?: string;
}

export interface PointComment {
  id: string;
  slotIndex: number;
  x: number;
  y: number;
  text: string;
}

export interface SlideContent {
  images: string[];
  text: string[];
  url?: string;
  comments?: PointComment[];
}

export interface SlideStyle {
  imageColors?: (string[] | null)[];  // imageColors[slotIndex] = [oklch1, ...oklch5] or null
  customPrimaryColor?: string;        // e.g. "imageColors[0][2]"
  customBackgroundColor?: string;     // e.g. "imageColors[1][0]"
  customAccentColor?: string;         // e.g. "imageColors[0][4]"
}

export interface Slide {
  id: string;
  order: number;
  layout: string;
  content: SlideContent;
  style?: SlideStyle;
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
