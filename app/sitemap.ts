import type { MetadataRoute } from 'next';
import { adminDb } from '@/lib/firebase/admin';
import { SITE_URL } from '@/lib/seo/site';
import { LOCATIONS } from '@/data/locations';
import { isIndexableCityService } from '@/data/indexableCityServices';
import { isProductIndexable } from '@/lib/seo/product';
import type { DbService, DbShopItem } from '@/lib/firebase/types';
import type { Product } from '@/types';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/services`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/products`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/shop`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/projects`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/calculator`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/locations`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.85 },
    { url: `${SITE_URL}/results`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ];

  // Dynamic service detail pages — only those with full ServiceDetail content
  let servicePages: MetadataRoute.Sitemap = [];
  let serviceSlugs: string[] = [];
  try {
    const [servicesSnap, detailsSnap] = await Promise.all([
      adminDb.collection('services').get(),
      adminDb.collection('serviceDetails').select('service_id').get(),
    ]);
    const withDetail = new Set(detailsSnap.docs.map((d) => d.data().service_id as string));
    const serviceDocs = servicesSnap.docs.filter((doc) => withDetail.has(doc.id));
    serviceSlugs = serviceDocs.map((doc) => (doc.data() as DbService).slug);
    servicePages = serviceDocs.map((doc) => {
      const data = doc.data() as DbService;
      return {
        url: `${SITE_URL}/services/${data.slug}`,
        lastModified: new Date(data.updated_at || data.created_at),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      };
    });
  } catch (err) {
    console.error('[sitemap] Failed to fetch service pages:', err);
  }

  // Dynamic shop item detail pages — active items only
  let shopItemPages: MetadataRoute.Sitemap = [];
  try {
    const shopSnap = await adminDb.collection('shopItems').get();
    shopItemPages = shopSnap.docs
      .map((doc) => doc.data() as DbShopItem)
      .filter((item) => item.active)
      .map((item) => ({
        url: `${SITE_URL}/shop/${item.slug}`,
        lastModified: new Date(item.updated_at || item.created_at),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
  } catch (err) {
    console.error('[sitemap] Failed to fetch shop items:', err);
  }

  // Location landing pages — one per city/province slug
  const locationPages: MetadataRoute.Sitemap = LOCATIONS.map((loc) => ({
    url: `${SITE_URL}/locations/${loc.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: loc.tier === 'municipality' ? 0.85 : 0.8,
  }));

  // City × service cross-pages — only allowlisted combos (data/indexableCityServices.ts).
  // Empty allowlist = none emitted: the rest are pruned (noindex) so must NOT appear here.
  const cityServicePages: MetadataRoute.Sitemap = serviceSlugs.length > 0
    ? LOCATIONS.flatMap((loc) =>
        serviceSlugs
          .filter((serviceSlug) => isIndexableCityService(loc.slug, serviceSlug))
          .map((serviceSlug) => ({
            url: `${SITE_URL}/locations/${loc.slug}/${serviceSlug}`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.7,
          }))
      )
    : [];

  // Product detail pages — only substantial products (isProductIndexable gate), so
  // thin/slug-less products stay out of the index just like the pruned location combos.
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const snap = await adminDb.collection('products').get();
    productPages = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as Product)
      .filter(isProductIndexable)
      .map((p) => ({
        url: `${SITE_URL}/products/${p.slug}`,
        lastModified: new Date(p.created_at),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));
  } catch (err) {
    console.error('[sitemap] Failed to fetch product pages:', err);
  }

  return [
    ...staticPages,
    ...servicePages,
    ...shopItemPages,
    ...locationPages,
    ...cityServicePages,
    ...productPages,
  ];
}
