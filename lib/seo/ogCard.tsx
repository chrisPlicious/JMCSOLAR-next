import { ImageResponse } from 'next/og';

/**
 * Shared 1200×630 share card for every opengraph-image route. next/og only
 * understands inline styles and literal colours, so the brand values are
 * spelled out here once instead of in each route.
 */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = 'image/png';

const NAVY_BG = 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)';
const SOLAR_BAR = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
const SOLAR = '#f59e0b';

interface OgCardInput {
  /** Small caps label above the headline. */
  eyebrow: string;
  headline: string;
  /** Line under the headline; trimmed to fit. */
  sub?: string;
  /** Right-hand text in the footer row, after the domain. */
  footnote: string;
}

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 3)}...` : text);

export function renderOgCard({ eyebrow, headline, sub, footnote }: OgCardInput) {
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
          background: NAVY_BG,
          padding: '64px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '6px', background: SOLAR_BAR }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: SOLAR }} />
          <span
            style={{
              color: SOLAR,
              fontSize: '18px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            {eyebrow}
          </span>
        </div>

        <h1
          style={{
            color: '#ffffff',
            fontSize: headline.length > 40 ? '56px' : '64px',
            fontWeight: 800,
            lineHeight: 1.1,
            margin: '0 0 20px 0',
            maxWidth: '980px',
          }}
        >
          {headline}
        </h1>

        {sub && (
          <p style={{ color: '#94a3b8', fontSize: '26px', margin: '0 0 48px 0', maxWidth: '900px' }}>
            {clip(sub, 120)}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: SOLAR, fontSize: '22px', fontWeight: 700 }}>jmcsolarph.com</span>
          <span style={{ color: '#475569', fontSize: '22px' }}>·</span>
          <span style={{ color: '#64748b', fontSize: '22px' }}>{footnote}</span>
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', background: SOLAR_BAR }} />
      </div>
    ),
    OG_SIZE,
  );
}
