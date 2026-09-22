/**
 * Single source of truth for business facts (name, NAP, service area).
 *
 * Name/address/phone must read identically everywhere they appear — footer,
 * contact section, JSON-LD, FAQ answers — because NAP consistency is a local
 * ranking signal. Change a fact here, never inline.
 */
export const BUSINESS = {
  name: 'JMC Solar PH',
  slogan: 'Future is Electric',
  phone: {
    /** E.164, for tel: links and JSON-LD. */
    e164: '+639175088220',
    /** Local format, for display. */
    display: '0917 508 8220',
  },
  email: 'jmcsolarph@gmail.com',
  address: {
    street: 'Lilia Avenue, Cogon',
    locality: 'Ormoc City',
    region: 'Leyte',
    postalCode: '6541',
    country: 'PH',
    countryName: 'Philippines',
  },
  geo: { lat: 11.016443, lng: 124.606008 },
  hours: { days: 'Monday - Friday', opens: '08:00', closes: '17:00', display: '8:00 AM - 5:00 PM' },
} as const;

/** "Lilia Avenue, Cogon, Ormoc City, Leyte 6541" */
export const ADDRESS_LINE = `${BUSINESS.address.street}, ${BUSINESS.address.locality}, ${BUSINESS.address.region} ${BUSINESS.address.postalCode}`;

/** The home base — used where copy names where the team is based. */
export const HQ_AREA = `${BUSINESS.address.locality}, ${BUSINESS.address.region}`;

/**
 * The full coverage area, for descriptions that should not undersell reach.
 * Keep in step with the provinces in data/locations.ts.
 */
export const SERVICE_AREA = 'Leyte, Southern Leyte and Cebu';

/** Short form used in titles and taglines. */
export const SERVICE_AREA_SHORT = 'Ormoc City & Cebu';
