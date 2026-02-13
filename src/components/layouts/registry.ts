import type { Component } from 'svelte';
import type { LayoutFieldSchema } from '../../lib/types';
import TitleLayout from './TitleLayout.svelte';
import ImageLayout from './ImageLayout.svelte';
import TextLayout from './TextLayout.svelte';
import Image2UpLayout from './Image2UpLayout.svelte';
import Image3UpLayout from './Image3UpLayout.svelte';
import TweetLayout from './TweetLayout.svelte';
import SubstackLayout from './SubstackLayout.svelte';
import QuoteLayout from './QuoteLayout.svelte';
import ArenaBlockLayout from './ArenaBlockLayout.svelte';
import ArticleLayout from './ArticleLayout.svelte';

export interface LayoutDefinition {
  id: string;
  displayName: string;
  description?: string;
  component: Component;
  schema: {
    images?: LayoutFieldSchema;
    text?: LayoutFieldSchema;
  };
}

export const layouts: Record<string, LayoutDefinition> = {
  Title: {
    id: 'Title',
    displayName: 'Title',
    description: 'Large heading with optional subtitle',
    component: TitleLayout as unknown as Component,
    schema: {
      text: {
        min: 1,
        max: 2,
        labels: { '1': 'Title', '2': 'Subtitle' },
      },
    },
  },
  Image: {
    id: 'Image',
    displayName: 'Image',
    description: 'Full-width image with caption',
    component: ImageLayout as unknown as Component,
    schema: {
      images: { min: 1, max: 1, labels: { '1': 'Image' } },
      text: { min: 0, max: 1, labels: { '1': 'Caption' } },
    },
  },
  Text: {
    id: 'Text',
    displayName: 'Text',
    description: 'Full-slide text block',
    component: TextLayout as unknown as Component,
    schema: {
      text: { min: 1, max: 1, labels: { '1': 'Body' } },
    },
  },
  Image2Up: {
    id: 'Image2Up',
    displayName: '2-Up Image',
    description: 'Two images side by side',
    component: Image2UpLayout as unknown as Component,
    schema: {
      images: { min: 2, max: 2, labels: { '1': 'Left image', '2': 'Right image' } },
      text: { min: 0, max: 2, labels: { '1': 'Left caption', '2': 'Right caption' } },
    },
  },
  Image3Up: {
    id: 'Image3Up',
    displayName: '3-Up Image',
    description: 'Three images in a row',
    component: Image3UpLayout as unknown as Component,
    schema: {
      images: { min: 3, max: 3, labels: { '1': 'Image 1', '2': 'Image 2', '3': 'Image 3' } },
      text: { min: 0, max: 3, labels: { '1': 'Caption 1', '2': 'Caption 2', '3': 'Caption 3' } },
    },
  },
  Tweet: {
    id: 'Tweet',
    displayName: 'Tweet',
    description: 'Tweet screenshot with attribution',
    component: TweetLayout as unknown as Component,
    schema: {
      images: { min: 1, max: 1, labels: { '1': 'Screenshot' } },
      text: { min: 0, max: 2, labels: { '1': 'Attribution', '2': 'Commentary' } },
    },
  },
  Substack: {
    id: 'Substack',
    displayName: 'Substack',
    description: 'Article preview card',
    component: SubstackLayout as unknown as Component,
    schema: {
      images: { min: 0, max: 1, labels: { '1': 'Thumbnail' } },
      text: { min: 1, max: 2, labels: { '1': 'Title', '2': 'Excerpt' } },
    },
  },
  Quote: {
    id: 'Quote',
    displayName: 'Quote',
    description: 'Large pull-quote with attribution',
    component: QuoteLayout as unknown as Component,
    schema: {
      text: { min: 1, max: 2, labels: { '1': 'Quote', '2': 'Attribution' } },
    },
  },
  ArenaBlock: {
    id: 'ArenaBlock',
    displayName: 'Are.na Block',
    description: 'Are.na-style block display',
    component: ArenaBlockLayout as unknown as Component,
    schema: {
      images: { min: 0, max: 1, labels: { '1': 'Block image' } },
      text: { min: 0, max: 2, labels: { '1': 'Title', '2': 'Channel' } },
    },
  },
  Article: {
    id: 'Article',
    displayName: 'Article',
    description: 'Article screenshot + commentary',
    component: ArticleLayout as unknown as Component,
    schema: {
      images: { min: 1, max: 1, labels: { '1': 'Screenshot' } },
      text: { min: 0, max: 1, labels: { '1': 'Commentary' } },
    },
  },
};

export const layoutList = Object.values(layouts);
