import type { Component } from 'svelte';
import type { LayoutSettings } from '../../lib/types';
import TitleLayout from './TitleLayout.svelte';
import ImageLayout from './ImageLayout.svelte';
import TextLayout from './TextLayout.svelte';
import Image2UpLayout from './Image2UpLayout.svelte';

import TweetLayout from './TweetLayout.svelte';
import SubstackLayout from './SubstackLayout.svelte';
import QuoteLayout from './QuoteLayout.svelte';
import ArenaBlockLayout from './ArenaBlockLayout.svelte';
import ArticleLayout from './ArticleLayout.svelte';

import titleSettings from './TitleLayout.settings.json';
import imageSettings from './ImageLayout.settings.json';
import textSettings from './TextLayout.settings.json';
import image2UpSettings from './Image2UpLayout.settings.json';

import tweetSettings from './TweetLayout.settings.json';
import substackSettings from './SubstackLayout.settings.json';
import quoteSettings from './QuoteLayout.settings.json';
import arenaBlockSettings from './ArenaBlockLayout.settings.json';
import articleSettings from './ArticleLayout.settings.json';

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
  Tweet: {
    id: 'Tweet',
    displayName: 'Tweet',
    description: 'Tweet screenshot with attribution',
    component: TweetLayout as unknown as Component,
    schema: tweetSettings,
  },
  Substack: {
    id: 'Substack',
    displayName: 'Substack',
    description: 'Article preview card',
    component: SubstackLayout as unknown as Component,
    schema: substackSettings,
  },
  Quote: {
    id: 'Quote',
    displayName: 'Quote',
    description: 'Large pull-quote with attribution',
    component: QuoteLayout as unknown as Component,
    schema: quoteSettings,
  },
  ArenaBlock: {
    id: 'ArenaBlock',
    displayName: 'Are.na Block',
    description: 'Are.na-style block display',
    component: ArenaBlockLayout as unknown as Component,
    schema: arenaBlockSettings,
  },
  Article: {
    id: 'Article',
    displayName: 'Article',
    description: 'Article screenshot + commentary',
    component: ArticleLayout as unknown as Component,
    schema: articleSettings,
  },
};

export const layoutList = Object.values(layouts);

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