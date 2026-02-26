import type { Component } from 'svelte';
import type { LayoutSettings } from '../../lib/types';
import TitleLayout from './TitleLayout.svelte';
import ImageLayout from './ImageLayout.svelte';
import Image2UpLayout from './Image2UpLayout.svelte';
import ArenaLayout from './ArenaLayout.svelte';

import titleSettings from './TitleLayout.json';
import imageSettings from './ImageLayout.json';
import image2UpSettings from './Image2UpLayout.json';
import arenaSettings from './ArenaLayout.json';

export interface LayoutDefinition {
  id: string;
  displayName: string;
  description?: string;
  component: Component;
  schema: LayoutSettings;
  requiresServer?: boolean;
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
  Image2Up: {
    id: 'Image2Up',
    displayName: '2-Up Image',
    description: 'Two images side by side',
    component: Image2UpLayout as unknown as Component,
    schema: image2UpSettings,
  },
  Arena: {
    id: 'Arena',
    displayName: 'Are.na',
    description: 'Add an image from Are.na',
    component: ArenaLayout as unknown as Component,
    schema: arenaSettings,
    requiresServer: true,
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