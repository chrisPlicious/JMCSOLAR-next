import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/seo/ogCard';
import { getServiceBySlug } from '@/lib/data/getServices';
import { BUSINESS, SERVICE_AREA_SHORT } from '@/lib/seo/business';

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id: slug } = await params;
  const service = await getServiceBySlug(slug).catch(() => null);

  return renderOgCard({
    eyebrow: `${BUSINESS.name} · Solar Service`,
    headline: service?.title ?? 'Solar Service',
    sub: service?.description ?? `Professional solar installation in ${SERVICE_AREA_SHORT}.`,
    footnote: SERVICE_AREA_SHORT,
  });
}
