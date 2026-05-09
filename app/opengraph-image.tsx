import { ImageResponse } from 'next/og';

export const alt = 'JMC Solar PH — Solar Installation in Ormoc City, Leyte';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
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
        {/* Amber accent bar */}
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

        {/* Brand label */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#f59e0b',
            }}
          />
          <span style={{ color: '#f59e0b', fontSize: '18px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            JMC Solar PH
          </span>
        </div>

        {/* Main headline */}
        <h1
          style={{
            color: '#ffffff',
            fontSize: '64px',
            fontWeight: 800,
            lineHeight: 1.1,
            margin: '0 0 20px 0',
            maxWidth: '900px',
          }}
        >
          Solar Installation in Ormoc City, Leyte
        </h1>

        {/* Tagline */}
        <p
          style={{
            color: '#94a3b8',
            fontSize: '28px',
            margin: '0 0 48px 0',
          }}
        >
          Hybrid solar · On-grid · Battery storage · EV chargers
        </p>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#f59e0b', fontSize: '22px', fontWeight: 700 }}>
            jmcsolarph.com
          </span>
          <span style={{ color: '#475569', fontSize: '22px' }}>·</span>
          <span style={{ color: '#64748b', fontSize: '22px' }}>Future is Electric</span>
        </div>

        {/* Bottom amber bar */}
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
