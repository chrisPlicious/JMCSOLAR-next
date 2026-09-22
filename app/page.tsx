import type { Metadata } from 'next';
import HomePage from '@/page-components/home/HomePage';
import { adminDb } from '@/lib/firebase/admin';
import type { DbReview } from '@/lib/firebase/types';
import type { Review } from '@/types';
import { SITE_URL } from '@/lib/seo/site';
import { SITE_OPEN_GRAPH } from '@/lib/seo/metadata';
import { BUSINESS_ID } from '@/lib/seo/organization';
import { getServices } from '@/lib/data/getServices';

// Homepage owns the site-root canonical and og:url. (They used to live on the
// root layout, but that leaked to every child page — see app/layout.tsx.)
export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: { ...SITE_OPEN_GRAPH, url: '/' },
};

// H1: fetch approved reviews server-side; Firestore rules can now deny public reads
async function fetchApprovedReviews(): Promise<Review[]> {
  try {
    const snap = await Promise.race([
      adminDb
        .collection('reviews')
        .where('status', '==', 'approved')
        .orderBy('created_at', 'desc')
        .get(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore timeout')), 5000)
      ),
    ]);
    return snap.docs.map((doc) => {
      const r = doc.data() as DbReview;
      return {
        id: doc.id,
        name: r.reviewer_name,
        rating: r.rating,
        quote: r.quote,
        source: r.source as Review['source'],
      };
    });
  } catch (err) {
    // H6: log error, return empty array so page still renders
    console.error('[home] Failed to fetch reviews:', err);
    return [];
  }
}

export default async function Home() {
  const [reviews, services] = await Promise.all([
    fetchApprovedReviews(),
    getServices(),
  ]);

  const ratings = reviews.filter((r) => typeof r.rating === 'number');
  const aggregateRating =
    ratings.length > 0
      ? {
          '@type': 'AggregateRating',
          ratingValue: (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1),
          reviewCount: ratings.length,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined;

  const hasOfferCatalog = services.length > 0
    ? {
        '@type': 'OfferCatalog',
        name: 'Solar Energy Services',
        itemListElement: services.map((s) => ({
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: s.title, url: `${SITE_URL}/services/${s.slug}` },
        })),
      }
    : undefined;

  // The LocalBusiness node itself comes from the root layout (siteGraphLd).
  // This adds the homepage-only facts to that same @id; parsers merge them.
  const jsonLd =
    aggregateRating || hasOfferCatalog
      ? {
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          '@id': BUSINESS_ID,
          ...(aggregateRating && { aggregateRating }),
          ...(hasOfferCatalog && { hasOfferCatalog }),
        }
      : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <HomePage reviews={reviews} services={services} />
    </>
  );
}
