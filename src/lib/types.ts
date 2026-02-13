export interface DeckMeta {
  title: string;
  author: string;
  startDate: string;
  endDate: string;
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

export interface SlotDefinition {
  displayName: string;
  type: 'required' | 'optional';
  placeholder?: string;
}

export interface LayoutSettings {
  images?: Record<string, SlotDefinition>;
  text?: Record<string, SlotDefinition>;
  url?: Record<string, SlotDefinition>;
}
