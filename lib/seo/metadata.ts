import type { Metadata } from 'next';
import { BUSINESS, SERVICE_AREA_SHORT } from './business';

/**
 * The site-wide share card (app/opengraph-image.tsx is served at this path).
 * Pages that define their own `openGraph` REPLACE the parent's object in the
 * App Router — they do not inherit its image — so every page must name one.
 * Exception: a route with its own opengraph-image file must NOT set images,
 * or the config image would win over the file (see `routeImage`).
 */
export const DEFAULT_OG_IMAGE = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  alt: `${BUSINESS.name} — Solar Installation in ${SERVICE_AREA_SHORT}`,
};

const OG_BASE = {
  siteName: BUSINESS.name,
  locale: 'en_PH',
  type: 'website',
} as const;

/** Root-level Open Graph (homepage + pages that set none of their own). */
export const SITE_OPEN_GRAPH = {
  ...OG_BASE,
  title: `${BUSINESS.name} — ${BUSINESS.slogan}`,
  description: `Professional solar installation in ${SERVICE_AREA_SHORT}. From residential rooftops to 100kW+ industrial systems.`,
  images: [DEFAULT_OG_IMAGE],
};

interface PageMetadataInput {
  /** Page title WITHOUT the brand — the root layout template appends "| JMC Solar PH". */
  title: string;
  description: string;
  /** Canonical path, e.g. `/services/hybrid`. Also the og:url. */
  path: string;
  /** Absolute share-image URL (e.g. a product photo). Defaults to the site card. */
  image?: string | null;
  /** The route has its own opengraph-image file — leave `images` unset so it is used. */
  routeImage?: boolean;
  /** false → `noindex, follow`. Omit for indexable pages (the default). */
  index?: boolean;
}

/**
 * One call per page: title, description, canonical, and a COMPLETE Open Graph
 * block. Twitter tags are left to Next, which fills title/description/image
 * from Open Graph when the root sets only `twitter.card` (see app/layout.tsx).
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  routeImage = false,
  index = true,
}: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    ...(!index && { robots: { index: false, follow: true } }),
    openGraph: {
      ...OG_BASE,
      title: `${title} | ${BUSINESS.name}`,
      description,
      url: path,
      ...(!routeImage && { images: [image ? { url: image } : DEFAULT_OG_IMAGE] }),
    },
  };
}
