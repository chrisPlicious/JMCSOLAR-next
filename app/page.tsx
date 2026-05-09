import HomePage from '@/page-components/home/HomePage';
import { adminDb } from '@/lib/firebase/admin';
import type { DbReview } from '@/lib/firebase/types';
import type { Review } from '@/types';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://jmcsolar.ph/#business',
  name: 'JMC Solar PH',
  description:
    'Professional solar installation services in Ormoc City, Leyte. Hybrid solar, on-grid, battery storage, EV chargers, and more.',
  url: 'https://jmcsolar.ph',
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
  areaServed: {
    '@type': 'GeoCircle',
    geoMidpoint: { '@type': 'GeoCoordinates', latitude: 11.016443, longitude: 124.606008 },
    geoRadius: '100000',
  },
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
  const reviews = await fetchApprovedReviews();

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
