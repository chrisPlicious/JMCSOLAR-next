import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/seo/ogCard';
import { getLocation, provinceLabel } from '@/data/locations';
import { BUSINESS } from '@/lib/seo/business';

export const alt = `${BUSINESS.name} — Solar Installation`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ city: string }> }) {
  const { city: slug } = await params;
  const loc = getLocation(slug);

  const headline = !loc
    ? `Solar Installation — ${BUSINESS.name}`
    : loc.tier === 'province'
      ? `Solar Installation in ${provinceLabel(loc.name)}`
      : `Solar Installation in ${loc.name}, ${loc.province}`;

  const sub = !loc
    ? 'Eastern & Central Visayas'
    : loc.tier === 'province'
      ? `${provinceLabel(loc.name)} · ${loc.region}`
      : `${loc.province} · ${loc.region}`;

  return renderOgCard({ eyebrow: BUSINESS.name, headline, sub, footnote: 'Free Site Assessment' });
}
