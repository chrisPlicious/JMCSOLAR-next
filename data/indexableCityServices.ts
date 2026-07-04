/**
 * Allowlist of city×service combos that are rich enough to be indexed.
 *
 * The `/locations/[city]/[service]` pages are auto-generated (every location ×
 * every service). By default they are thin, near-duplicate "doorway" pages
 * (recycled service description + city intro + FAQ), which Google discovers but
 * refuses to index ("Discovered — currently not indexed"). So they are pruned:
 * `noindex, follow` on the page + excluded from the sitemap.
 *
 * This Set is the SINGLE source of truth for the prune/keep decision — read by
 * BOTH the page's `robots` meta (app/locations/[city]/[service]/page.tsx) and the
 * sitemap (app/sitemap.ts). Adding a key here flips that one combo to indexed AND
 * into the sitemap in one edit, so the two signals can never disagree.
 *
 * Keys are `${citySlug}/${serviceSlug}` where serviceSlug is the Firestore
 * `services.slug` (the runtime source of truth used to build the route) — NOT the
 * `data/services.ts` `id`. Empty = prune every combo.
 *
 * Later ("hybrid" graduation): add a combo here ONLY once it carries genuinely
 * unique content (localized intro, city-specific FAQs, a real local project), e.g.
 *   'ormoc-city/hybrid',
 */
export const INDEXABLE_CITY_SERVICES = new Set<string>([
  // Empty = prune all city×service combos. Add `${citySlug}/${serviceSlug}` keys to index.
]);

export function isIndexableCityService(citySlug: string, serviceSlug: string): boolean {
  return INDEXABLE_CITY_SERVICES.has(`${citySlug}/${serviceSlug}`);
}
