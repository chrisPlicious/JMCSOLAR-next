import type { MetadataRoute } from 'next';
import { adminDb } from '@/lib/firebase/admin';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jmcsolar.ph';

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/services`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/products`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/projects`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  ];

  // Dynamic service detail pages
  let servicePages: MetadataRoute.Sitemap = [];
  try {
    const snap = await adminDb.collection('services').get();
    servicePages = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        url: `${baseUrl}/services/${data.slug}`,
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
