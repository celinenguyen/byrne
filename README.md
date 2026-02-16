a frivolous little app for me to make presentations/decks/reports like
- https://squad.metalabel.com/acf2026
- https://khole.net/
- https://x.com/mattstasoff/status/1995531653083517071

# How to use (and edit!) this app

## How to use it

### What this app is for

This is an intentionally simple slide deck editor. The goal is to make it easy to create consistent, good-looking decks without any of the fiddly layout tweaking that apps like PowerPoint or Google Slides encourage. In those tools, you *can* customise the position, colour, font, and placement of every single element on every single slide...but the downside is that it's really hard to keep things consistent across a whole deck. You end up spending more time nudging text boxes around than thinking about what you actually want to say.

This app takes a different approach: **less is more.** By paring away most of those fussy, per-element customisation options, you're free to focus on the *content and ideas* instead. Constraint leads to consistency and clarity.

This app is best for:
- The creator (celine!) -- but also anyone who wants very simple, text-and-image-focused slide decks for sharing moodboards, visual references, quotes, links, and the like.
- People who love storing information in plaintext formats (Markdown! JSON!) as much as possible.
- People who believe that constraint is a feature, not a limitation.

### Key concepts

**Decks** are the top-level object. A deck is simply a list of slides, plus some basic info:
- A **deck name**.
- Optional **style preferences** (fonts and colours) that apply to every slide in the deck.

**Slides** are what make up a deck. Each slide has two things:
1. **Data** -- the actual content. Right now the app supports two types of content:
   - **Text** (written in Markdown)
   - **Images** (pasted as URLs)
   - To keep things simple and presentable -- clarity and concision over excessive content! -- each slide can have at most 2 text slots and 2 image slots.
2. **Layout** -- *how* that content gets displayed. You pick a layout for each slide, and the layout determines what goes where.

**Layouts** available right now:

| Layout | What it shows |
|--------|---------------|
| **Title** | Large heading with optional subtitle |
| **Text** | Full-slide text block (supports Markdown) |
| **Image** | Full-width image with a caption |
| **2-Up Image** | Two images side by side, each with a caption |

The nice thing about separating data from layout is that **you can switch layouts freely.** Say you make a new slide, choose the "Image" layout, and add an image with a caption. Then you realise you actually want two images side by side -- just switch to "2-Up Image." Your existing image and caption become the left column, and you can now add a right image and caption. The content carries over; only the presentation changes.

### Previewing and presenting

When you're ready to share your deck with others, the app has three view modes (switchable from the toolbar):

- **Edit** -- the default. You see all your slides in a scrollable list, with the sidebar open for editing content, switching layouts, and adjusting theme settings.
- **Preview** -- hides the sidebar and shows your slides cleanly, one after another. Good for reviewing how things look before presenting. You can navigate with arrow keys or click/scroll.
- **Present** -- full-screen presentation mode. One slide at a time, just like a traditional slideshow. Arrow keys and spacebar to advance, `Escape` to exit.

### A note on customisability

Because every deck uses the same small set of layouts and the same structured data model (just text, images, and a layout choice), any HTML/CSS customisation you make to a layout will automatically apply to every slide that uses it, across all your decks. This is a feature of the constrained design: you can tweak the look and feel of the whole app by editing a handful of files, and the changes propagate everywhere. More on that below.

## How to edit it

This app is built with [Svelte](https://svelte.dev/) (a JavaScript framework) and [Tailwind CSS](https://tailwindcss.com/). If you're comfortable with HTML and CSS but haven't used a framework like Svelte or React before, here's the short version:

A `.svelte` file is like an HTML file with superpowers. It has three sections:
- A `<script>` block at the top (the logic -- variables, imports, etc.)
- HTML markup in the middle (the template -- what gets rendered)
- A `<style>` block at the bottom (CSS, scoped to this component by default)

You can mostly ignore the `<script>` block and focus on the HTML and `<style>` sections when making visual changes. The HTML uses a few Svelte-specific things like `{#if ...}` for conditionals and `{variable}` for inserting values, but these read pretty naturally.

### Creating a new layout

Layouts live in `src/components/layouts/`. Each layout needs two files:

#### 1. A settings file (`YourLayout.json`)

This defines the named slots (images, text, and optionally a URL) that the layout accepts. Each slot has a `displayName`, an `isRequired` boolean, and an optional `placeholder`.

```json
{
  "images": {
    "photo": { "displayName": "Photo", "isRequired": true }
  },
  "text": {
    "heading": { "displayName": "Heading", "isRequired": true, "placeholder": "Untitled" },
    "description": { "displayName": "Description", "isRequired": false }
  }
}
```

Omit the `"images"`, `"text"`, or `"url"` key entirely if the layout doesn't use that type of content.

#### 2. A Svelte component (`YourLayout.svelte`)

The component receives `data: SlideData` as a prop and reads slot values by index from `data.images` and `data.text` (the order matches the order of keys in your JSON file).

```svelte
<script lang="ts">
  import type { SlideData } from '../../lib/types';
  import BaseLayout from './BaseLayout.svelte';
  import MarkdownText from './MarkdownText.svelte';
  import settings from './YourLayout.json';

  interface Props {
    data: SlideData;
  }
  let { data }: Props = $props();

  let photo = $derived(data.images?.[0] || '');
  let heading = $derived(data.text?.[0] || '');
  let description = $derived(data.text?.[1] || '');
</script>

<BaseLayout>
  {#if photo}
    <img src={photo} alt="" />
  {/if}
  <h2 style="font-family: var(--slide-font-heading); color: var(--slide-color-primary)">
    <MarkdownText text={heading || settings.text.heading.placeholder} inline />
  </h2>
  {#if description}
    <p style="font-family: var(--slide-font-body)">
      <MarkdownText text={description} />
    </p>
  {/if}
</BaseLayout>
```

A few things to note:
- Always wrap your layout in `<BaseLayout>` -- it provides the standard slide aspect ratio, background, and theme CSS variables.
- Use `<MarkdownText>` to render text content (it handles Markdown parsing). Pass `inline` for single-line content like headings.
- Use the `var(--slide-font-heading)`, `var(--slide-font-body)`, `var(--slide-font-caption)`, `var(--slide-color-primary)`, and `var(--slide-color-accent)` CSS variables to pick up the deck's theme settings. Apply these as inline `style` attributes on the relevant elements.
- Add Tailwind classes or a `<style>` block for any additional styling.

#### 3. Register the layout

In `src/components/layouts/registry.ts`, import your component and settings, then add an entry to the `layouts` object:

```ts
import YourLayout from './YourLayout.svelte';
import yourSettings from './YourLayout.json';

// Inside the layouts object:
YourLayoutId: {
  id: 'YourLayoutId',
  displayName: 'Your Layout',
  description: 'Brief description of the layout',
  component: YourLayout as unknown as Component,
  schema: yourSettings,
},
```

That's it -- the new layout will show up in the Layout section of the sidebar.

### Customising the theme

Theme presets (fonts and colours) are defined in `src/lib/theme.ts`. This is the single file to edit if you want to change the defaults or add new options.

**To change the default theme** (what new decks start with), edit the `defaultTheme` object:

```ts
export const defaultTheme: DeckTheme = {
  headingFont: 'inter',      // must match an id in fontOptions
  bodyFont: 'inter',
  captionFont: 'inter',
  primaryColor: 'black',     // must match an id in primaryColorOptions
  accentColor: 'persimmon',  // must match an id in accentColorOptions
};
```

**To add a new font option**, add an entry to the `fontOptions` array. The `value` is the CSS `font-family` string. You'll also need to load the font -- add a `<link>` tag in `src/pages/index.astro` (Google Fonts is the easiest option).

```ts
export const fontOptions = [
  { id: 'inter', label: 'Inter', value: '"Inter", system-ui, sans-serif' },
  { id: 'newsreader', label: 'Newsreader', value: '"Newsreader", "Georgia", serif' },
  // Add your new font here:
  { id: 'jetbrains', label: 'JetBrains Mono', value: '"JetBrains Mono", monospace' },
] as const;
```

**To add or change colour options**, edit the `primaryColorOptions` or `accentColorOptions` arrays. Colours are defined using the `oklch()` format, but any valid CSS colour value will work.

```ts
export const primaryColorOptions = [
  { id: 'black', label: 'Black', value: 'oklch(0% 0 0)' },
  // ...
  { id: 'forest', label: 'Forest', value: 'oklch(0.35 0.10 150)' },
] as const;
```

Primary colours are used for heading and body text. Accent colours are used for links and other highlight elements.

### Existing layouts and their slots

| Layout | Image slots | Text slots |
|--------|------------|------------|
| **Title** | -- | `title`, `subtitle` |
| **Text** | -- | `body` |
| **Image** | `image` | `caption` |
| **2-Up Image** | `left`, `right` | `leftCaption`, `rightCaption` |

## Potential future work

- **Thumbnail image optimization**: If thumbnail image loading in the slide list becomes a performance bottleneck (many slides with large images), a server-side image resizing approach using a sharp-based `/api/thumbnail` endpoint could be layered on to serve pre-scaled images to the SlideThumbnail component.
