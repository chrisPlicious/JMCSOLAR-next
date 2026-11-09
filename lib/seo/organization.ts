import { SITE_URL, FACEBOOK_URL } from './site';
import { BUSINESS } from './business';
import { buildAreaServedArray } from './serviceArea';

/** Stable node ids. Other JSON-LD on a page points at these instead of repeating the business. */
export const BUSINESS_ID = `${SITE_URL}/#business`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/**
 * Site-wide JSON-LD graph, emitted once by the root layout so every page's
 * `provider: { '@id': BUSINESS_ID }` resolves on that same page.
 *
 * - LocalBusiness: the NAP entity (from BUSINESS — never inline these facts).
 * - WebSite: tells Google which name to show as the site name in results.
 *
 * Page-specific facts (homepage aggregateRating / OfferCatalog) are added by
 * the page as a second node with the same `@id`, which parsers merge.
 */
export function siteGraphLd() {
  const { address, geo, hours } = BUSINESS;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness',
        '@id': BUSINESS_ID,
        name: BUSINESS.name,
        description:
          'Professional solar installation services in Ormoc City, Leyte and Cebu, Central Visayas. Hybrid solar, on-grid, battery storage, EV chargers, and more.',
        url: SITE_URL,
        logo: `${SITE_URL}/JMC.png`,
        image: `${SITE_URL}/opengraph-image`,
        telephone: BUSINESS.phone.e164,
        email: BUSINESS.email,
        address: {
          '@type': 'PostalAddress',
          streetAddress: address.street,
          addressLocality: address.locality,
          addressRegion: address.region,
          postalCode: address.postalCode,
          addressCountry: address.country,
        },
        geo: { '@type': 'GeoCoordinates', latitude: geo.lat, longitude: geo.lng },
        openingHoursSpecification: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: hours.opens,
          closes: hours.closes,
        },
        sameAs: [FACEBOOK_URL],
        priceRange: '$$',
        slogan: BUSINESS.slogan,
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
      },
      {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        name: BUSINESS.name,
        alternateName: 'JMC Solar',
        url: SITE_URL,
        inLanguage: 'en-PH',
        publisher: { '@id': BUSINESS_ID },
      },
    ],
  };
}
