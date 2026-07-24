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
export const fontOptions = [
  { id: 'inter', label: 'Inter', value: '"Inter", system-ui, sans-serif', headingWeight: '700', headingTracking: '-0.04em' },
  { id: 'newsreader', label: 'Newsreader', value: '"Newsreader", "Georgia", serif', headingWeight: '500', headingTracking: '0.01em' },
] as const;

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
  { id: 'moss-green', label: 'Moss green', value: 'oklch(0.9397 0.0123 145)' },
  { id: 'taupe', label: 'Taupe', value: 'oklch(0.9574 0.0076 55)' },
  { id: 'satin-pink', label: 'Satin pink', value: 'oklch(0.94 0.0154 350)' },
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

// -- Resolver: theme keys → CSS values --
export function resolveTheme(theme: DeckTheme) {
  const font = (id: string) => fontOptions.find((f) => f.id === id) ?? fontOptions[0];
  const primary = (id: string) => primaryColorOptions.find((c) => c.id === id)?.value ?? primaryColorOptions[0].value;
  const bg = (id: string) => backgroundColorOptions.find((c) => c.id === id)?.value ?? backgroundColorOptions[0].value;
  const accent = (id: string) => accentColorOptions.find((c) => c.id === id)?.value ?? accentColorOptions[0].value;

  const headingFont = font(theme.headingFont);

  return {
    '--slide-font-heading': headingFont.value,
    '--slide-heading-weight': headingFont.headingWeight,
    '--slide-heading-tracking': headingFont.headingTracking,
    '--slide-font-body': font(theme.bodyFont).value,
    '--slide-font-caption': font(theme.captionFont).value,
    '--slide-color-primary': primary(theme.primaryColor),
    '--slide-color-bg': bg(theme.backgroundColor),
    '--slide-color-accent': accent(theme.accentColor),
  };
}
