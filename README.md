# What am I looking at?

A frivolous little app made by [Celine Nguyen](https://celinenguyen.com/), who initially wanted to make little trend-report-style slide decks, like—

- Metalabel's [Anonymous Creative Futures](https://squad.metalabel.com/acf2026) (2026)
- Matthew Stassoff's [social signals 2025_v5](https://x.com/mattstasoff/status/1995531653083517071) (2025)
- K-HOLE's [reports #1–5](https://khole.net/) (2011–2015)

—but ended up making an idiosyncratic app for making slide decks, instead of the slide deck itself.

# What makes slide decks strange, fascinating, alluring…or boring?

## Against slide decks

Edward Tufte (political scientist and statistician, but most famous as an information design theorist after the publication of *The Visual Display of Quantitative Information*) wrote an article titled ‘[PowerPoint Is Evil](https://archive.ph/QuOtN)’ for *Wired*'s Sep 2003 issue. 

> Imagine a widely used and expensive prescription drug that promised to make us beautiful but didn't. Instead the drug had frequent, serious side effects: It induced stupidity, turned everyone into bores, wasted time, and degraded the quality and credibility of communication…
> Slideware—computer programs for presentations—is everywhere: in corporate America, in government bureaucracies, even in our schools. Several hundred million copies of Microsoft PowerPoint are churning out trillions of slides each year. Slideware may help speakers outline their talks, but convenience for the speaker can be punishing to both content and audience. The standard PowerPoint presentation elevates format over content, betraying an attitude of commercialism that turns everything into a sales pitch.

## In defense of slide decks

In the same issue, David Byrne (artist, singer/guitarist/songwriter of Talking Heads, and Brian Eno collaborator) wrote ‘[Learning to Love PowerPoint](https://archive.ph/QeBLY)’:

> Having never used the program before, I found it limiting, inflexible, and biased, like most software. On top of that, PowerPoint makes hilariously bad-looking visuals. But that's a small price to pay for ease and utility. We live in a world where convenience beats quality every time. It was, for my purposes, perfect…
> I began to see PowerPoint as a metaprogram, one that organizes and presents stuff created in other applications. Initially, I made presentations about presentations; they were almost completely without content. The content, I learned, was in the medium itself…
> Although I began by making fun of the medium, I soon realized I could actually create things that were beautiful. I could bend the program to my own whim and use it as an artistic agent. The pieces became like short films: Some were sweet, some were scary, and some were *mysterioso*. I discovered that even without text, I could make works that were "about" something, something beyond themselves, and that they could even have emotional resonance. 

In Byrne's book *Envisioning Emotional Epistemological Information* (2003), he proposed:

> If business is poetry, then numbers are words and sales presentations, marketing meetings and conferences are the salons and literary collaborations of our time.

# How to use this app

*(If you want to customize it for your own needs, see the next section.)*

## This is not PowerPoint (and that's a good thing!)

I made this app because I *didn't* want all the flexibility of apps like PowerPoint, Keynote, and Google Slides. In those apps, you *can* customize the color, font, and placement of every single element, on every single slide…but it's hard to keep slides consistent across a whole deck! I find myself spending too much time nudging text boxes around, and this gets in the way of focusing on my content.

**byrne** is different. I've intentionally pared away most of those per-element customizations. Instead:

- **Decks** are defined by a **name**, optional **style preferences** (which apply to every slide), and a list of slides. Each deck is represented by a `.json` file.
- Each **slide** has:
  - A **layout** (is it a `Title` slide with a heading and optional subheading? an `Image` slide with just 1 image and an optional caption?).
  - Some **content**, which is used by different layouts in different ways. The content can be:
    - Text: Each slide can have up to 2 blocks of text. You can use Markdown formatting to bold, italicize, and add links to text.
    - Images: Each slide can have up to 2 images.
- Each **layout** uses the slide's **content** in different ways. The `Title` layout takes the 1st text block and displays it as a heading. The `Image` layout takes the 1st text block and displays it as the image caption.

### How do I edit, preview, and present my deck?

**byrne** has 3 modes:

- **Edit** mode has a collapsible left sidebar for viewing all slides, a middle pane for viewing your deck, and a collapsible right sidebar for changing your deck's name and style preferences, as well as editing the content and layout for each slide. the default. You see all your slides in a scrollable list, with the sidebar open for editing content, switching layouts, and adjusting theme settings.
- **Preview** mode hides both sidebars and shows a scrollable list of all your slides. You can use keyboard shortcuts to go forward/back as well.
- **Present** mode opens a full-screen mode where you can see one slide at a time. You can use keyboard shortcuts Arrow keys to go forward (`→` and `↓`) or back (`←` and `↑`), and `Escape` to edit.

### How do I add comments?

One feature I've always wanted in…basically all apps…is the ability to comment on a _specific_ part of an image, not just the image as a whole. Design tools like Figma have this feature, and it's so, so useful for visual interpretation and discussion.

So **byrne** lets you add comments to specific parts of an image. These comments look like small annotation dots (✴︎), and when you hover over them, you can view the comment text.

- To **add a comment**, hover over an image and press `Cmd+C` (or `Ctrl+C` on Windows/Linux). A new dot will appear at your cursor position and a text editor will open.
  - When writing your comment, you can use Markdown to add bolding, italics, lists, and so on
  - To move your comment, press `Cmd` while dragging the dot to a new position on the image
  - Press `Enter` to save your comment
    - If you want to add line breaks within your comment you can press `Shift+Enter`
  - Press `Esc` to close the comment popover, without saving
  - If you delete all the text of a comment, the annotation dot (✴︎) will be tidied away (as in, deleted)

# How to edit this app

**byrne** is built with [Astro](https://astro.build/) and [Svelte](https://svelte.dev/). If you're familiar with HTML and CSS but haven't used a JavaScript framework before, here's a quick explanation:

- Astro is a **static site generator**, or SSG. SSGs are great for building simple websites (like personal webpages, portfolios, and blogs) because they have the following features:
  - They're easy to work with if you're a more experienced software engineer or web programmer, because they make use of new frontend technologies (including JavaScript frameworks like Svelte or React, which can be used to build complex apps—React is used by companies like Meta and Notion)
  - But they're also easy to work with if you're less experienced, since they're often more regular-HTML-and-CSS-shaped in how they function.
  - And they're *really* cheap (often free!) to publish online. Most complex apps require a backend to do things like letting users create accounts, log in, add content…but if you're building a simple website just for yourself, you don't need all of that! And running a backend is more complicated and typically costs more. When you're building something with an SSG on your own laptop, you get something that _feels_ dynamic, as if there's a backend. But the SSG will *em*generate* static files (aka regular `.html` and `.css` and `.js`) that you can upload somewhere to make your website available to others.

So what does it look like to build a website with Astro? I've chosen to set this up using Svelte, so most of the app pages are created using `.svelte` files. I'm not super familiar with JavaScript frameworks, but Svelte is quite easy to understand and work with.

A `.svelte` file is like a more powerful HTML file. It has three sections:

- A `<script>` block at the top (for more complex logic, importing reusable components, &c)
- HTML markup in the middle, which is what shows on the page. The nice thing about using an SSG like Astro is that you can incorporate some more dynamic features (like `{#if ...}` for conditional display logic, or displaying `{variable}` results on a page).
- A `<style>` block at the bottom (CSS, which just applies to the specific Svelte page). If you want to make visual changes, you can mostly focus on this.

**byrne** also uses [Tailwind](https://tailwindcss.com/docs/styling-with-utility-classes) (a popular CSS framework) and [shadcn-svelte(https://shadcn-svelte.com/) (for certain UI components, like form elements). Both have really legible and clear documentation for how to use them.

## A very easy way to customize this app is to change the fonts and colors available 

I've chosen some default fonts and colors, which you can find in `src/lib/theme.ts`. This is the *only* file you need to edit if you want to add more fonts and colors.

### Different fonts!

Add your new font to the `fontOptions` array. The `value` is the CSS `font-family` string. You'll also need to load the font using a `<link>` tag in `src/pages/index.astro`.

```ts
export const fontOptions = [
  { id: 'inter', label: 'Inter', value: '"Inter", system-ui, sans-serif' },
  { id: 'newsreader', label: 'Newsreader', value: '"Newsreader", "Georgia", serif' },
  // Add your new font here!
] as const;
```

### Different colors!

Add your new colors to the `primaryColorOptions` (for headings and body text) or `accentColorOptions` (for links) arrays. You can define colors using [any values that are supported in CSS](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Colors), like hex codes, RGB, and `oklch()`. YColours are defined using the `oklch()` format, but any valid CSS colour value will work.

```ts
export const primaryColorOptions = [
  { id: 'black', label: 'Black', value: 'oklch(0% 0 0)' },
  { id: 'forest', label: 'Forest', value: 'oklch(0.35 0.10 150)' },
] as const;

### A different default!

You can also change the default theme used for all new decks, and existing decks without any custom style preferences. To do so, edit the `defaultTheme`:

```ts
export const defaultTheme: DeckTheme = {
  headingFont: 'newsreader',      // must match an id in fontOptions
  bodyFont: 'inter',
  captionFont: 'inter',
  primaryColor: 'black',     // must match an id in primaryColorOptions
  accentColor: 'persimmon',  // must match an id in accentColorOptions
};
```

## A slightly harder customization is to add new slide layouts

### How are layouts defined?

Each layout is represented by a `.svelte` file. If a layout uses any text or images in it, those will be given useful names (for example, `left image` and `right image`)

| Layout | What it shows |
|--------|---------------|
| `Title` | Heading with optional subtitle |
| `Image` | Full-width image with an optional caption |
| `2-Up Image` | Two images, side by side, with optional captions for each |

**byrne** makes it easy to add new layouts and customize them—as long as you're willing to write a little bit of HTML, CSS, and JS. (Because I made this app for myself, and I ❤️ writing CSS, this is a feature, not a bug.)

### How do can you add a new layout?

Layouts are stored in `src/components/layouts/`. Each layout has 2 files:

- `yournewlayout.json`, which defines how many text blocks and images will be used in the layout. Let's call these ‘slots.’
  - Each slot has a `displayName` that tells you what the slot is used for (is it text for a heading? a blockquote? caption?), an `isRequired` boolean, and an optional `placeholder` to display if the slide doesn't have content to fill the slot yet.
  - Here's an example of a layout that uses 2 text blocks (1 required, 1 optional) and 1 image.
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

- `YourNewLayout.svelte`, which  efines what the slide actually looks like.
  - It takes in a `content: SlideContent` prop
  - It consults the associated `.json` file, and specifically the `content.images` and `content.text` information, to display it in the layout.
  - Here's an example of a layout corresponding to the `.json` example above:
    ```svelte
    <script lang="ts">
      import type { SlideContent } from '../../lib/types';
      import BaseLayout from './BaseLayout.svelte';
      import MarkdownText from './MarkdownText.svelte';
      import settings from './YourLayout.json';

      interface Props {
        content: SlideContent;
      }
      let { content }: Props = $props();

      let photo = $derived(content.images?.[0] || '');
      let heading = $derived(content.text?.[0] || '');
      let description = $derived(content.text?.[1] || '');
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

While creating your layout:

- Always wrap your layout in `<BaseLayout>`, which handles the standard slide aspect ratio, background, and theme CSS variables.
- Use `<MarkdownText>` to render text content (it handles Markdown parsing). 
  - Pass `inline` for single-line content like headings.
- To use the deck's theme, use the following as inline `style` attributes on the relevant elements
  - `var(--slide-font-heading)` to use the heading font
  - `var(--slide-font-body)` to use the body font
  - `var(--slide-font-caption)` to use the caption font
  - `var(--slide-color-primary)` to use the primary color
- You can use Tailwind classes or the `<style>` block (at the bottom of each `.svelte` file) for additional styling.

When you're ready to use your layout:

- Open `src/components/layouts/registry.ts`
- Import your layout files
- Add an entry to the `layouts` object with the name and optional description of your layout

```ts
import YourNewLayout from './yournewlayout.svelte';
import yourNewSettings from './yournewlayout.json';

// Inside the layouts object:
YourNewLayoutId: {
  id: 'yournewlayout',
  displayName: 'Your new layout',
  description: 'Brief description of the layout',
  component: YourNewLayout as unknown as Component,
  schema: yourNewSettings,
},
```
Once you've done all that, your layout will appear in the app!

### When creating layouts, you can make the text size adapt to the viewpoirt, with `use:autoScale`

The `autoScale` Svelte action elegantly handles situations where you've typed a lot of text into a slot. The action will automatically resize the text to fit into its container. Once the text has reached some minimum size, it will then start scrolling vertically. 

### How it works (a rather technical explanation)

`autoScale` attaches a `ResizeObserver` to the element. Whenever the element resizes (or the content changes), it:

1. Resets the `--auto-scale` CSS custom property to `1`
2. Measures `scrollHeight` vs `clientHeight`
3. If the content overflows, sets `--auto-scale` to `clientHeight / scrollHeight` (clamped to a minimum of `0.5`)
4. If the content *still* overflows at the minimum scale, enables `overflow-y: auto` so the user can scroll

### How to use it

To set the font size for a text slot:
- Add a `<style>` tag at the bottom of the layout's `.svelte` file
- For each text element, add a `font-size` property that looks something like this:

```
[data-slot="text:title"] {
  font-size: calc(clamp(0.875rem, 2.5cqi, 1.25rem) * var(--auto-scale, 1));
}
```

But what does this _mean_? 

Let's look at this part first: `calc(clamp(0.875rem, 2.5cqi, 1.25rem)`. This lets the font size scale across different views: in **edit** mode, when the left and right sidebars are open, the slides will be smaller, so the font size should be smaller. In **present** mode, however, there's more space for the slides and they're much larger. The font size should accommodate this!

How it works:

- The CSS `clamp()` function ensures that the font size must stay between the first (minimum) and last (maximum) value
- The middle value is the **default** or preferred value, before any automatic resizing happens.
  - It's measured in `cqi` (container query inline) units, which are basically like percentages relative to the container size. You can learn more about this unit type [here](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries#container_query_length_units).

Now, let's look at the `* var(--auto-scale, 1)`. This part handles the text scaling and makes it smaller if there's too much text.
- The `*` multiples the calculated font size (which is somewhere within the minimum–maximum size range)…
- …by a value calculated by the Svelte `autoScale` action. This is what resizes the text to be smaller (potentially smaller than the minimum size specified above) if there's too much text

### Here's a full example of using `autoScale`

```svelte
<script lang="ts">
  import { autoScale } from '../../lib/actions/autoScale';
</script>

<div use:autoScale class="max-h-full">
  <div data-slot="text:title">My heading</div>
  <div data-slot="text:body">Some body text that might be long...</div>
</div>

<style>
  [data-slot="text:title"] {
    font-size: calc(clamp(1.5rem, 5cqi, 3rem) * var(--auto-scale, 1));
  }
  [data-slot="text:body"] {
    font-size: calc(clamp(0.875rem, 2.5cqi, 1.25rem) * var(--auto-scale, 1));
  }
</style>
```

You can customize the minimum scale and the CSS variable name:

```svelte
<div use:autoScale={{ minScale: 0.3, cssVar: '--my-scale' }}>
  ...
</div>
```