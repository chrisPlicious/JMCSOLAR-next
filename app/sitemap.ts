import type { MetadataRoute } from 'next';
import { adminDb } from '@/lib/firebase/admin';
import { SITE_URL } from '@/lib/seo/site';
import { LOCATIONS } from '@/data/locations';
import type { DbService } from '@/lib/firebase/types';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/services`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/products`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/projects`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/calculator`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/locations`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.85 },
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

  // Location landing pages — one per city/province slug
  const locationPages: MetadataRoute.Sitemap = LOCATIONS.map((loc) => ({
    url: `${SITE_URL}/locations/${loc.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: loc.tier === 'municipality' ? 0.85 : 0.8,
  }));

  // City × service cross-pages — only generated when we have service slugs
  const cityServicePages: MetadataRoute.Sitemap = serviceSlugs.length > 0
    ? LOCATIONS.flatMap((loc) =>
        serviceSlugs.map((serviceSlug) => ({
          url: `${SITE_URL}/locations/${loc.slug}/${serviceSlug}`,
          lastModified: new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.7,
        }))
      )
    : [];

  return [...staticPages, ...servicePages, ...locationPages, ...cityServicePages];
}
