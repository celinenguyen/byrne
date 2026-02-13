import type { Component } from 'svelte';
import type { LayoutSettings } from '../../lib/types';
import TitleLayout from './TitleLayout.svelte';
import ImageLayout from './ImageLayout.svelte';
import TextLayout from './TextLayout.svelte';
import Image2UpLayout from './Image2UpLayout.svelte';

import titleSettings from './TitleLayout.json';
import imageSettings from './ImageLayout.json';
import textSettings from './TextLayout.json';
import image2UpSettings from './Image2UpLayout.json';

export interface LayoutDefinition {
  id: string;
  displayName: string;
  description?: string;
  component: Component;
  schema: LayoutSettings;
}

export const layouts: Record<string, LayoutDefinition> = {
  Title: {
    id: 'Title',
    displayName: 'Title',
    description: 'Large heading with optional subtitle',
    component: TitleLayout as unknown as Component,
    schema: titleSettings,
  },
  Image: {
    id: 'Image',
    displayName: 'Image',
    description: 'Full-width image with caption',
    component: ImageLayout as unknown as Component,
    schema: imageSettings,
  },
  Text: {
    id: 'Text',
    displayName: 'Text',
    description: 'Full-slide text block',
    component: TextLayout as unknown as Component,
    schema: textSettings,
  },
  Image2Up: {
    id: 'Image2Up',
    displayName: '2-Up Image',
    description: 'Two images side by side',
    component: Image2UpLayout as unknown as Component,
    schema: image2UpSettings,
  },
};

export const layoutList = Object.values(layouts);

export function getSlotInfo(
  layoutId: string,
  el: HTMLElement,
): { type: 'image' | 'text'; index: number; displayName: string } | null {
  const slotAttr = el.dataset.slot;
  if (!slotAttr) return null;
  const [slotType, slotName] = slotAttr.split(':');
  if ((slotType !== 'text' && slotType !== 'image') || !slotName) return null;

  const def = layouts[layoutId];
  if (!def) return null;

  const section = slotType === 'image' ? def.schema.images : def.schema.text;
  if (!section) return null;

  const keys = Object.keys(section);
  const index = keys.indexOf(slotName);
  if (index === -1) return null;

  return {
    type: slotType,
    index,
    displayName: section[slotName].displayName,
  };
}

export function formatSlotSummary(schema: LayoutSettings): string {
  const imgCount = schema.images ? Object.keys(schema.images).length : 0;
  const imgReq = schema.images
    ? Object.values(schema.images).filter((s) => s.type === 'required').length
    : 0;
  const txtCount = schema.text ? Object.keys(schema.text).length : 0;
  const txtReq = schema.text
    ? Object.values(schema.text).filter((s) => s.type === 'required').length
    : 0;

  const urlCount = schema.url ? Object.keys(schema.url).length : 0;

  const imgStr = imgCount === 0
    ? '0 images'
    : imgReq === imgCount
      ? `${imgCount} image${imgCount !== 1 ? 's' : ''}`
      : `${imgReq}–${imgCount} images`;
  const txtStr = txtCount === 0
    ? '0 text'
    : txtReq === txtCount
      ? `${txtCount} text`
      : `${txtReq}–${txtCount} text`;
  const urlStr = urlCount > 0 ? ', 1 url' : '';
  return `${imgStr}, ${txtStr}${urlStr}`;
}