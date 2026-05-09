import { ImageResponse } from 'next/og';
import { adminDb } from '@/lib/firebase/admin';
import type { DbService } from '@/lib/firebase/types';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id: slug } = await params;

  let title = 'Solar Service';
  let description = 'Professional solar installation services in Ormoc City, Leyte.';

  try {
    const snap = await adminDb.collection('services').where('slug', '==', slug).limit(1).get();
    if (!snap.empty) {
      const service = snap.docs[0].data() as DbService;
      title = service.title;
      description = service.description;
    }
  } catch {
    // fall through to defaults
  }

  const shortDesc = description.length > 120 ? description.slice(0, 117) + '...' : description;

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
        {/* Amber top bar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
          <span style={{ color: '#f59e0b', fontSize: '18px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            JMC Solar PH · Solar Service
          </span>
        </div>

        {/* Service title */}
        <h1
          style={{
            color: '#ffffff',
            fontSize: '68px',
            fontWeight: 800,
            lineHeight: 1.1,
            margin: '0 0 24px 0',
            maxWidth: '980px',
          }}
        >
          {title}
        </h1>

        {/* Description */}
        <p style={{ color: '#94a3b8', fontSize: '26px', margin: '0 0 48px 0', maxWidth: '900px' }}>
          {shortDesc}
        </p>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#f59e0b', fontSize: '22px', fontWeight: 700 }}>jmcsolarph.com</span>
          <span style={{ color: '#475569', fontSize: '22px' }}>·</span>
          <span style={{ color: '#64748b', fontSize: '22px' }}>Ormoc City, Leyte</span>
        </div>

        {/* Bottom bar */}
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
