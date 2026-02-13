# Year in Review 2026

A slide-based presentation builder built with Astro, Svelte 5, and Tailwind CSS.

## Creating a new layout

Layouts live in `src/components/layouts/`. Each layout needs two files:

### 1. Settings file (`YourLayout.settings.json`)

Defines the named slots (images and text) the layout accepts. Each slot has a `displayName`, a `type` (`"required"` or `"optional"`), and an optional `placeholder`.

```json
{
  "images": {
    "photo": { "displayName": "Photo", "type": "required" }
  },
  "text": {
    "heading": { "displayName": "Heading", "type": "required", "placeholder": "Untitled" },
    "description": { "displayName": "Description", "type": "optional" }
  }
}
```

Omit the `"images"` or `"text"` key entirely if the layout has none of that type.

### 2. Svelte component (`YourLayout.svelte`)

The component receives `data: SlideData` as a prop and reads slot values from `data.images` and `data.text` using the same keys defined in the settings file.

```svelte
<script lang="ts">
  import type { SlideData } from '../../lib/types';
  import BaseLayout from './BaseLayout.svelte';
  import settings from './YourLayout.settings.json';

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
import yourSettings from './YourLayout.settings.json';

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

The `{name}` matches the key used in the settings JSON file.

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

| Layout | Image slots | Text slots |
|--------|------------|------------|
| **Title** | — | `title`, `subtitle` |
| **Text** | — | `body` |
| **Image** | `image` | `caption` |
| **Image2Up** | `left`, `right` | `leftCaption`, `rightCaption` |
| **Image3Up** | `image1`, `image2`, `image3` | `caption1`, `caption2`, `caption3` |
| **Article** | `screenshot` | `commentary` |
| **Tweet** | `screenshot` | `attribution`, `commentary` |
| **Substack** | `thumbnail` | `title`, `excerpt` |
| **Quote** | — | `quote`, `attribution` |
| **ArenaBlock** | `blockImage` | `title`, `channel` |
