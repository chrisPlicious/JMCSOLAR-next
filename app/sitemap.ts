import type { MetadataRoute } from 'next';
import { adminDb } from '@/lib/firebase/admin';
import { SITE_URL } from '@/lib/seo/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/services`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/products`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/projects`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/calculator`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  ];

  // Dynamic service detail pages — only those with full ServiceDetail content
  let servicePages: MetadataRoute.Sitemap = [];
  try {
    const [servicesSnap, detailsSnap] = await Promise.all([
      adminDb.collection('services').get(),
      adminDb.collection('serviceDetails').select('service_id').get(),
    ]);
    const withDetail = new Set(detailsSnap.docs.map((d) => d.data().service_id as string));
    servicePages = servicesSnap.docs
      .filter((doc) => withDetail.has(doc.id))
      .map((doc) => {
        const data = doc.data();
        return {
          url: `${SITE_URL}/services/${data.slug}`,
          lastModified: new Date(data.updated_at || data.created_at),
          changeFrequency: 'monthly' as const,
          priority: 0.7,
        };
      });
  } catch (err) {
    // M5: log so we notice if Firestore is permanently down
    console.error('[sitemap] Failed to fetch service pages:', err);
  }

  return [...staticPages, ...servicePages];
}
