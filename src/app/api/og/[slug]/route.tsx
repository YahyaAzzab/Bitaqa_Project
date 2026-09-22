import { ImageResponse } from 'next/og';
import { getPublicProfileBySlug } from '@/lib/profile/queries';

export const runtime = 'edge';

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: Ctx) {
  const { slug } = await context.params;
  const profile = await getPublicProfileBySlug(slug);

  const name = profile?.business_name_fr ?? 'Bitaqa';
  const tagline = profile?.tagline_fr ?? 'Carte NFC noir mat';
  const accent = profile?.accent_color ?? '#c9a96e';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          background: '#0a0a0a',
          color: '#f5f0eb',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 12,
              border: `1px solid ${accent}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 600,
              color: accent,
            }}
          >
            {name.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ fontSize: 22, letterSpacing: 4, textTransform: 'uppercase', color: accent }}>
            Bitaqa
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 64, fontWeight: 600, lineHeight: 1.1 }}>{name}</div>
          <div style={{ fontSize: 28, color: '#a8a29e', maxWidth: 900 }}>{tagline}</div>
        </div>
        <div
          style={{
            height: 4,
            width: 160,
            background: accent,
            borderRadius: 2,
          }}
        />
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
