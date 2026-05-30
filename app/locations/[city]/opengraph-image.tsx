import { ImageResponse } from 'next/og';
import { getLocation } from '@/data/locations';

export const alt = 'JMC Solar PH — Solar Installation';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: slug } = await params;
  const loc = getLocation(slug);

  const headline =
    loc?.tier === 'province'
      ? `Solar Installation in ${loc.name} Province`
      : loc
      ? `Solar Installation in ${loc.name}, ${loc.province}`
      : 'Solar Installation — JMC Solar PH';

  const sub = loc
    ? loc.tier === 'province'
      ? `${loc.name} Province · ${loc.region}`
      : `${loc.province} · ${loc.region}`
    : 'Eastern & Central Visayas';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
          padding: '64px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '6px',
            background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div
            style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}
          />
          <span
            style={{
              color: '#f59e0b',
              fontSize: '18px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            JMC Solar PH
          </span>
        </div>

        <h1
          style={{
            color: '#ffffff',
            fontSize: '60px',
            fontWeight: 800,
            lineHeight: 1.1,
            margin: '0 0 20px 0',
            maxWidth: '900px',
          }}
        >
          {headline}
        </h1>

        <p style={{ color: '#94a3b8', fontSize: '26px', margin: '0 0 48px 0' }}>{sub}</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#f59e0b', fontSize: '22px', fontWeight: 700 }}>
            jmcsolarph.com
          </span>
          <span style={{ color: '#475569', fontSize: '22px' }}>·</span>
          <span style={{ color: '#64748b', fontSize: '22px' }}>Free Site Assessment</span>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '4px',
            background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
          }}
        />
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
