export interface DeckMeta {
  title: string;
  author: string;
  startDate: string;
  endDate: string;
}

export interface SlideData {
  images: Record<string, string>;
  text: Record<string, string>;
}

export interface Slide {
  id: string;
  order: number;
  layout: string;
  data: SlideData;
  notes: string;
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
}
