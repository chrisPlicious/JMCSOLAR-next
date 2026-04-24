import HomePage from '@/page-components/home/HomePage';

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

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomePage />
    </>
  );
}
