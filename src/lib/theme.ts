import { parse, converter, useMode, modeOklch } from 'culori/fn';

const toOklch = converter('oklch');
useMode(modeOklch);

// -- Types --
export interface DeckTheme {
  headingFont: string;
  bodyFont: string;
  captionFont: string;
  primaryColor: string;
  backgroundColor: string;
  accentColor: string;
}

// -- Font presets --
// usableFor controls which dropdowns each font appears in
export type FontRole = 'heading' | 'body' | 'caption';

export const fontOptions = [
  { id: 'inter', 
    label: 'Inter', 
    value: '"Inter", system-ui, sans-serif', 
    headingWeight: '600', 
    headingTracking: '-0.01em', 
    headingLineHeight: '1',
    uiSize: '1em', 
    uiTracking: 'inherit', 
    usableFor: ['heading', 'body', 'caption'] as FontRole[] 
  },
  { id: 'newsreader',
    label: 'Newsreader',
    value: '"Newsreader", "Georgia", serif',
    headingWeight: '425',
    headingTracking: '0.01em',
    headingLineHeight: '1.3',
    uiSize: '1.1em',
    uiTracking: '0.01em',
    usableFor: ['heading', 'body', 'caption'] as FontRole[]
  },
  { id: 'reforma-1969',
    label: 'Reforma 1969',
    value: '"Reforma 1969 Blanca", "Georgia", serif',
    headingWeight: '400',
    headingTracking: '0.01em',
    headingLineHeight: '1.2',
    uiSize: '1.1em',
    uiTracking: '0.01em',
    usableFor: ['heading', 'body', 'caption'] as FontRole[]
  },
] as const;

export function fontsForRole(role: FontRole) {
  return fontOptions.filter((f) => f.usableFor.includes(role));
}

// -- Primary color presets --
export const primaryColorOptions = [
  { id: 'black', label: 'Soft black', value: 'oklch(0.0949 0 0)' },
  { id: 'navy', label: 'Navy', value: 'oklch(0.3265 0.0789 260)' },
  { id: 'almond', label: 'Almond', value: 'oklch(0.3706 0.0444 55)' },
  { id: 'olive', label: 'Olive', value: 'oklch(0.3912 0.0345 130)' },
  { id: 'rust', label: 'Rust', value: 'oklch(0.3147 0.074 33.8)' },
  { id: 'white', label: 'White', value: 'oklch(1.0 0 0)' },
] as const;

// -- Background color presets --
export const backgroundColorOptions = [
  { id: 'white', label: 'White', value: 'oklch(1.0 0 0)' },
  { id: 'soy-milk', label: 'Soy milk', value: 'oklch(0.9769 0.0074 82.06)' },
  { id: 'pale-green', label: 'Pale green', value: 'oklch(0.9397 0.0123 145)' },
  { id: 'taupe', label: 'Taupe', value: 'oklch(0.9574 0.0076 55)' },
  { id: 'satin', label: 'Satin pink', value: 'oklch(0.94 0.0154 350)' },
  { id: 'black', label: 'Soft black', value: 'oklch(0.0949 0 0)' },
] as const;

// -- Accent color presets --
export const accentColorOptions = [
  { id: 'persimmon', label: 'Persimmon', value: 'oklch(0.6324 0.2126 36)' },
  { id: 'orchid', label: 'Orchid', value: 'oklch(0.6176 0.1643 334.02)' },
  { id: 'lavender', label: 'Lavender', value: 'oklch(0.7323 0.1398 289.06)' },
  { id: 'marine', label: 'Marine', value: 'oklch(0.5059 0.1381 260)' },
  { id: 'brat', label: 'Brat', value: 'oklch(0.7882 0.1455 130)' },
] as const;

// -- Defaults --
export const defaultTheme: DeckTheme = {
  headingFont: 'inter',
  bodyFont: 'inter',
  captionFont: 'inter',
  primaryColor: 'black',
  backgroundColor: 'white',
  accentColor: 'persimmon',
};

/* optical offset for light-on-dark slides, since the accent color
 * will be brighter and therefore perceived as 'higher' than the primary text */
export function computeLinkOffset(primaryColor: string, bgColor: string): string {
  const p = parse(primaryColor);
  const b = parse(bgColor);
  if (!p || !b) return '0px';
  const pL = toOklch(p)?.l ?? 0;
  const bL = toOklch(b)?.l ?? 0;
  return pL - bL > 0.3 ? '-0.027em' : '0px';
}

// -- Resolver: theme keys → CSS values --
export function resolveTheme(theme: DeckTheme) {
  const font = (id: string) => fontOptions.find((f) => f.id === id) ?? fontOptions[0];
  const primary = (id: string) => primaryColorOptions.find((c) => c.id === id)?.value ?? primaryColorOptions[0].value;
  const bg = (id: string) => backgroundColorOptions.find((c) => c.id === id)?.value ?? backgroundColorOptions[0].value;
  const accent = (id: string) => accentColorOptions.find((c) => c.id === id)?.value ?? accentColorOptions[0].value;

  const headingFont = font(theme.headingFont);
  const primaryVal = primary(theme.primaryColor);
  const bgVal = bg(theme.backgroundColor);

  return {
    '--slide-font-heading': headingFont.value,
    '--slide-heading-weight': headingFont.headingWeight,
    '--slide-heading-tracking': headingFont.headingTracking,
    '--slide-heading-line-height': headingFont.headingLineHeight,
    '--slide-font-body': font(theme.bodyFont).value,
    '--slide-font-caption': font(theme.captionFont).value,
    '--slide-color-primary': primaryVal,
    '--slide-color-bg': bgVal,
    '--slide-color-accent': accent(theme.accentColor),
    '--slide-link-offset': computeLinkOffset(primaryVal, bgVal),
  };
}

/** Compute per-slide color overrides as a CSS vars string (only the vars that differ). */
export function slideColorOverrideStyle(
  style: import('./types').SlideStyle | undefined,
  deckPrimary?: string,
  deckBg?: string,
): string {
  if (!style) return '';
  // Inline the ref resolution to avoid circular imports with imageColors.ts
  function resolve(ref: string): string | null {
    if (!ref || !style!.imageColors) return null;
    const match = ref.match(/^imageColors\[(\d+)]\[(\d+)]$/);
    if (!match) return null;
    const palette = style!.imageColors[parseInt(match[1], 10)];
    if (!palette) return null;
    return palette[parseInt(match[2], 10)] ?? null;
  }
  const parts: string[] = [];
  let resolvedPrimary: string | null = null;
  let resolvedBg: string | null = null;
  if (style.customPrimaryColor) {
    resolvedPrimary = resolve(style.customPrimaryColor);
    if (resolvedPrimary) parts.push(`--slide-color-primary: ${resolvedPrimary}`);
  }
  if (style.customBackgroundColor) {
    resolvedBg = resolve(style.customBackgroundColor);
    if (resolvedBg) parts.push(`--slide-color-bg: ${resolvedBg}`);
  }
  if (style.customAccentColor) {
    const v = resolve(style.customAccentColor);
    if (v) parts.push(`--slide-color-accent: ${v}`);
  }
  // Recompute link offset if either color was overridden
  if ((resolvedPrimary || resolvedBg) && (deckPrimary || deckBg)) {
    const finalPrimary = resolvedPrimary ?? deckPrimary!;
    const finalBg = resolvedBg ?? deckBg!;
    parts.push(`--slide-link-offset: ${computeLinkOffset(finalPrimary, finalBg)}`);
  }
  return parts.join('; ');
}
