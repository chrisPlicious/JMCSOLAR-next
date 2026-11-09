import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/seo/ogCard';
import { DEFAULT_OG_IMAGE } from '@/lib/seo/metadata';
import { BUSINESS, SERVICE_AREA_SHORT } from '@/lib/seo/business';

export const alt = DEFAULT_OG_IMAGE.alt;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    eyebrow: BUSINESS.name,
    headline: `Solar Installation in ${SERVICE_AREA_SHORT}`,
    sub: 'Hybrid solar · On-grid · Battery storage · EV chargers',
    footnote: BUSINESS.slogan,
  });
}
