import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { conferenceConfig } from '@/lib/conference-config';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = `${conferenceConfig.koreanTitle} · ${conferenceConfig.displayDate} · ${conferenceConfig.venue}`;

// Satori (the renderer behind ImageResponse) needs a real font file with
// Korean glyphs — it doesn't fall back to system/web fonts. Pretendard's
// OTF ships as a devDependency; the self-hosted WOFF2 subset in app/fonts
// isn't a format Satori accepts.
const FONT_DIR = join(process.cwd(), 'node_modules/pretendard/dist/public/static');

export default function OpengraphImage() {
  const logoBase64 = readFileSync(join(process.cwd(), 'public/images/ksnve-logo-transparent.png')).toString('base64');
  const bgBase64 = readFileSync(join(process.cwd(), 'public/images/og-background.jpg')).toString('base64');
  const bold = readFileSync(join(FONT_DIR, 'Pretendard-Bold.otf'));
  const extraBold = readFileSync(join(FONT_DIR, 'Pretendard-ExtraBold.otf'));

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 22 }}>
            <div
              style={{
                display: 'flex',
                width: 68,
                height: 68,
                borderRadius: 17,
                background: 'rgba(255,255,255,0.96)',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/png;base64,${logoBase64}`}
                width={50}
                height={50}
                alt=""
                style={{ objectFit: 'contain' }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 54,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'rgba(255,255,255,0.94)',
                textShadow: '0 2px 12px rgba(0,0,0,0.4)',
              }}
            >
              한국소음진동공학회
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              marginTop: 8,
              fontSize: 54,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'rgba(255,255,255,0.9)',
              textShadow: '0 2px 12px rgba(0,0,0,0.4)',
            }}
          >
            지속가능한 내일의 소음 진동
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Pretendard', data: bold, weight: 700, style: 'normal' },
        { name: 'Pretendard', data: extraBold, weight: 800, style: 'normal' },
      ],
    },
  );
}
