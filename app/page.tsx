import HomePage from '@/page-components/home/HomePage';
import { adminDb } from '@/lib/firebase/admin';
import type { DbReview, DbService } from '@/lib/firebase/types';
import type { Review } from '@/types';
import { SITE_URL } from '@/lib/seo/site';
import { buildAreaServedArray } from '@/lib/seo/serviceArea';

const baseJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': `${SITE_URL}/#business`,
  name: 'JMC Solar PH',
  description:
    'Professional solar installation services in Ormoc City, Leyte. Hybrid solar, on-grid, battery storage, EV chargers, and more.',
  url: SITE_URL,
  telephone: '+639175088220',
  email: 'jmcsolarph@gmail.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Lilia Avenue, Cogon',
    addressLocality: 'Ormoc City',
    addressRegion: 'Leyte',
    postalCode: '6541',
    addressCountry: 'PH',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 11.016443,
    longitude: 124.606008,
  },
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '08:00',
    closes: '17:00',
  },
  sameAs: ['https://www.facebook.com/JMCSolarPH'],
  priceRange: '$$',
  slogan: 'Future is Electric',
  knowsAbout: [
    'Solar Panel Installation',
    'Hybrid Solar Systems',
    'On-Grid Solar',
    'Net Metering',
    'Battery Energy Storage Systems',
    'EV Charging',
    'Solar Water Pumping',
  ],
  areaServed: buildAreaServedArray(),
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

async function fetchServices(): Promise<DbService[]> {
  try {
    const snap = await adminDb.collection('services').orderBy('display_order').get();
    return snap.docs.map((d) => d.data() as DbService);
  } catch {
    return [];
  }
}

export default async function Home() {
  const [reviews, services] = await Promise.all([
    fetchApprovedReviews(),
    fetchServices(),
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

  const jsonLd = {
    ...baseJsonLd,
    ...(aggregateRating && { aggregateRating }),
    ...(hasOfferCatalog && { hasOfferCatalog }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomePage reviews={reviews} />
    </>
  );
}
