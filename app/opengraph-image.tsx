import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { conferenceConfig } from '@/lib/conference-config';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = `${conferenceConfig.koreanTitle} · ${conferenceConfig.displayDate} · ${conferenceConfig.venue}`;

export default function OpengraphImage() {
  const logoBase64 = readFileSync(join(process.cwd(), 'public/images/ksnve-ci-horizontal-white.png')).toString('base64');
  const bgBase64 = readFileSync(join(process.cwd(), 'public/images/og-background.jpg')).toString('base64');
  // Use the hero's GodoM typeface in the TTF format supported by ImageResponse.
  const ciFont = readFileSync(join(process.cwd(), 'app/fonts/GodoM.subset.ttf'));

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/jpeg;base64,${bgBase64}`}
          width={1200}
          height={630}
          alt=""
          style={{ position: 'absolute', inset: 0, objectFit: 'cover' }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(3,17,15,0.82) 0%, rgba(3,17,15,0.5) 32%, rgba(3,17,15,0.18) 60%, rgba(3,17,15,0.3) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(3,17,15,0.7) 0%, rgba(3,17,15,0.3) 50%, rgba(3,17,15,0) 82%)',
          }}
        />
        <div
          style={{
            position: 'relative',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            padding: '64px 88px',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${logoBase64}`}
            width={540}
            height={107.4}
            alt="사단법인 한국소음진동공학회"
            style={{ objectFit: 'contain', marginBottom: 22 }}
          />

          <div
            style={{
              display: 'flex',
              marginTop: 8,
              fontSize: 54,
              fontFamily: 'GodoM',
              fontWeight: 500,
              letterSpacing: '-0.02em',
              color: 'rgba(255,255,255,0.9)',
              textShadow: '0 2px 12px rgba(0,0,0,0.4)',
            }}
          >
            “{conferenceConfig.theme}”
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'GodoM', data: ciFont, weight: 500, style: 'normal' },
      ],
    },
  );
}
