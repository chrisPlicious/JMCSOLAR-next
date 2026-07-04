/**
 * Dependency-free slugify: lowercase, strip diacritics, collapse non-alphanumerics
 * to single hyphens, trim leading/trailing hyphens. Used for product detail URLs.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
