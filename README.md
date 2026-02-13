# Year in Review 2026

a frivolous little app for me to make presentations/decks/reports like
- https://squad.metalabel.com/acf2026
- https://khole.net/
- https://x.com/mattstasoff/status/1995531653083517071



## Creating a new layout

Layouts live in `src/components/layouts/`. Each layout needs two files:

### 1. Settings file (`YourLayout.json`)

Defines the named slots (images, text, and optionally url) the layout accepts. Each slot has a `displayName`, an `isRequired` boolean, and an optional `placeholder`.

```json
{
  "url": {
    "url": { "displayName": "Article URL", "isRequired": true }
  },
  "images": {
    "photo": { "displayName": "Photo", "isRequired": true }
  },
  "text": {
    "heading": { "displayName": "Heading", "isRequired": true, "placeholder": "Untitled" },
    "description": { "displayName": "Description", "isRequired": false }
  }
}
```

Omit the `"images"`, `"text"`, or `"url"` key entirely if the layout has none of that type.

Layouts with a `url` slot show a URL input and Fetch button in the editor. For **ArenaBlock**, fetching calls the Are.na API and populates the image/text slots from the block data. For **Article**, fetching reads OG meta tags from the URL and populates the screenshot and title slots.

### 2. Svelte component (`YourLayout.svelte`)

The component receives `data: SlideData` as a prop and reads slot values from `data.images` and `data.text` using the same keys defined in the settings file.

```svelte
<script lang="ts">
  import type { SlideData } from '../../lib/types';
  import BaseLayout from './BaseLayout.svelte';
  import settings from './YourLayout.json';

  interface Props {
    data: SlideData;
  }
  let { data }: Props = $props();

  let photo = $derived(data.images?.['photo'] || '');
  let heading = $derived(data.text?.['heading'] || '');
  let description = $derived(data.text?.['description'] || '');
</script>

<BaseLayout>
  <div class="layout-image-photo ...">
    {#if photo}
      <img src={photo} alt="" />
    {:else}
      <div>No image</div>
    {/if}
  </div>
  <h2 class="layout-text-heading ...">{heading || settings.text.heading.placeholder}</h2>
  {#if description}
    <p class="layout-text-description ...">{description}</p>
  {/if}
</BaseLayout>

<style>
  .layout-image-photo {
  }
  .layout-text-heading {
  }
  .layout-text-description {
  }
</style>
```

### 3. Register the layout

In `src/components/layouts/registry.ts`, import the component and settings, then add an entry to the `layouts` object:

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

## Slot naming conventions

Each slot element gets a CSS class following the pattern `layout-{type}-{slotName}`:

- **Image slots**: `layout-image-{name}` (e.g. `layout-image-screenshot`, `layout-image-left`)
- **Text slots**: `layout-text-{name}` (e.g. `layout-text-title`, `layout-text-commentary`)
- **URL slots**: stored in `data.url` (single string, not rendered in the layout component)

The `{name}` matches the key used in the layout JSON file.

## Styling layouts

### Within a layout component

Each `*Layout.svelte` file has a `<style>` block with empty selectors for every slot class. Add your CSS rules directly:

```svelte
<style>
  .layout-text-title {
    font-family: 'Georgia', serif;
  }
  .layout-image-screenshot {
    border: 2px solid #eee;
  }
</style>
```

These styles are scoped to the component by Svelte, so they won't leak to other layouts.

### From SlideView or globally

To target layout slot classes from outside the component (e.g. in `SlideView.svelte` or `globals.css`), use `:global()` in a Svelte `<style>` block:

```svelte
<!-- In SlideView.svelte -->
<style>
  :global(.layout-text-title) {
    color: navy;
  }
</style>
```

Or add rules directly in `src/styles/globals.css` where they apply without scoping.

## Existing layouts and their slots

| Layout | URL slot | Image slots | Text slots |
|--------|----------|------------|------------|
| **Title** | — | — | `title`, `subtitle` |
| **Text** | — | — | `body` |
| **Image** | — | `image` | `caption` |
| **Image2Up** | — | `left`, `right` | `leftCaption`, `rightCaption` |

## Potential future work

- **Thumbnail image optimization**: If thumbnail image loading in the slide list becomes a performance bottleneck (many slides with large images), a server-side image resizing approach using a sharp-based `/api/thumbnail` endpoint could be layered on to serve pre-scaled images to the SlideThumbnail component.
- **Speaker notes**: Add a `notes` field back to slides for internal notes that aren't rendered in the slide itself. Could include a collapsible "Notes" section in SlideDetails and a presenter view that shows notes alongside the current slide.
