import { Vibrant } from 'node-vibrant/browser';
import { parse, formatCss, converter, useMode, modeOklch, modeRgb, differenceEuclidean } from 'culori/fn';

// Register color modes
useMode(modeOklch);
useMode(modeRgb);

const toOklch = converter('oklch');
const deltaE = differenceEuclidean('oklch');

/**
 * Extract up to 5 dominant colors from an image as oklch strings.
 */
export async function extractPalette(imageUrl: string): Promise<string[]> {
  const palette = await Vibrant.from(imageUrl).quality(3).getPalette();

  const swatchKeys = [
    'Vibrant', 'DarkVibrant', 'LightVibrant',
    'Muted', 'DarkMuted', 'LightMuted',
  ] as const;

  const colors: string[] = [];
  for (const key of swatchKeys) {
    const swatch = palette[key];
    if (!swatch) continue;
    const [r, g, b] = swatch.rgb;
    const rgbStr = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    const parsed = parse(rgbStr);
    if (!parsed) continue;
    const oklch = toOklch(parsed);
    if (!oklch) continue;
    colors.push(formatCss(oklch));
    if (colors.length >= 5) break;
  }

  return colors;
}

/**
 * Resolve a color reference like "imageColors[0][2]" to the actual oklch value.
 */
export function resolveColorRef(
  ref: string,
  imageColors: (string[] | null)[] | undefined,
): string | null {
  if (!ref || !imageColors) return null;
  const match = ref.match(/^imageColors\[(\d+)]\[(\d+)]$/);
  if (!match) return null;
  const slotIndex = parseInt(match[1], 10);
  const colorIndex = parseInt(match[2], 10);
  const palette = imageColors[slotIndex];
  if (!palette) return null;
  return palette[colorIndex] ?? null;
}

/**
 * Find the index in `palette` whose color is closest to `targetOklch`.
 * Returns -1 if palette is empty.
 */
export function findClosestColorIndex(targetOklch: string, palette: string[]): number {
  if (palette.length === 0) return -1;
  const target = parse(targetOklch);
  if (!target) return 0;

  let bestIndex = 0;
  let bestDist = Infinity;
  for (let i = 0; i < palette.length; i++) {
    const c = parse(palette[i]);
    if (!c) continue;
    const dist = deltaE(target, c);
    if (dist < bestDist) {
      bestDist = dist;
      bestIndex = i;
    }
  }
  return bestIndex;
}
