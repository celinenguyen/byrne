// -- Types --
export interface DeckTheme {
  headingFont: string;
  bodyFont: string;
  captionFont: string;
  primaryColor: string;
  accentColor: string;
}

// -- Font presets --
export const fontOptions = [
  { id: 'inter', label: 'Inter', value: '"Inter", system-ui, sans-serif', headingWeight: '700', headingTracking: '-0.03em' },
  { id: 'newsreader', label: 'Newsreader', value: '"Newsreader", "Georgia", serif', headingWeight: '500', headingTracking: '0.01em' },
] as const;

// -- Primary color presets --
export const primaryColorOptions = [
  { id: 'black', label: 'Black', value: 'oklch(0% 0 0)' },
  { id: 'navy', label: 'Navy', value: 'oklch(0.30 0.07 260)' },
  { id: 'charcoal', label: 'Charcoal', value: 'oklch(0.35 0.01 260)' },
  { id: 'copper', label: 'Copper', value: 'oklch(0.45 0.08 55)' },
  { id: 'olive', label: 'Olive', value: 'oklch(0.42 0.06 130)' },
  { id: 'rust', label: 'Rust', value: 'oklch(0.45 0.12 30)' },
] as const;

// -- Accent color presets --
export const accentColorOptions = [
  { id: 'persimmon', label: 'Persimmon', value: 'oklch(0.65 0.2 30)' },
  { id: 'lavender', label: 'Lavender', value: 'oklch(0.65 0.15 290)' },
  { id: 'navy', label: 'Navy', value: 'oklch(0.50 0.10 260)' },
  { id: 'brat', label: 'Brat', value: 'oklch(0.85 0.18 130)' },
] as const;

// -- Defaults --
export const defaultTheme: DeckTheme = {
  headingFont: 'inter',
  bodyFont: 'inter',
  captionFont: 'inter',
  primaryColor: 'black',
  accentColor: 'persimmon',
};

// -- Resolver: theme keys → CSS values --
export function resolveTheme(theme: DeckTheme) {
  const font = (id: string) => fontOptions.find((f) => f.id === id) ?? fontOptions[0];
  const primary = (id: string) => primaryColorOptions.find((c) => c.id === id)?.value ?? primaryColorOptions[0].value;
  const accent = (id: string) => accentColorOptions.find((c) => c.id === id)?.value ?? accentColorOptions[0].value;

  const headingFont = font(theme.headingFont);

  return {
    '--slide-font-heading': headingFont.value,
    '--slide-heading-weight': headingFont.headingWeight,
    '--slide-heading-tracking': headingFont.headingTracking,
    '--slide-font-body': font(theme.bodyFont).value,
    '--slide-font-caption': font(theme.captionFont).value,
    '--slide-color-primary': primary(theme.primaryColor),
    '--slide-color-accent': accent(theme.accentColor),
  };
}
