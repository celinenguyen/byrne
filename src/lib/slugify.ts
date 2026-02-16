export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')       // strip accents
    .replace(/[^\p{L}\p{N}\s-]/gu, '')     // strip emoji/special chars, keep letters/numbers/spaces/hyphens
    .replace(/[\s-]+/g, '-')               // collapse whitespace & hyphens
    .replace(/^-+|-+$/g, '');              // trim leading/trailing hyphens
}
