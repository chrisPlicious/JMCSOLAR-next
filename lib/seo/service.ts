import type { DbServiceDetail } from '@/lib/firebase/types';

/**
 * Content-completeness gate for /services/[slug] — the same anti-thin
 * discipline as isProductIndexable. A service page is indexed (and listed in
 * the sitemap) only when its detail doc exists AND carries at least one
 * substantive section beyond the intro. Otherwise the page still renders for
 * users but is `noindex, follow`. Filling benefits / use cases / specs in the
 * admin flips it back automatically.
 */
export function isServiceIndexable(detail: DbServiceDetail | null): boolean {
  if (!detail) return false;
  return detail.benefits.length > 0 || detail.use_cases.length > 0 || detail.specs.length > 0;
}
