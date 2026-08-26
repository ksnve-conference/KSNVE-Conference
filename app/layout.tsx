import localFont from 'next/font/local';
import './globals.css';
import './styles.css';
import type { Viewport } from 'next';
import { conferenceConfig } from '@/lib/conference-config';
import OfflineReady from '@/components/OfflineReady';

// Pretendard, subsetted to the characters this app renders (2 MB -> 456 KB) and
// served from our own origin: no CDN request on the critical path, which matters
// on saturated conference wifi. Regenerate with `npm run build:font`.
const bodyFont = localFont({
  src: './fonts/PretendardVariable.subset.woff2',
  weight: '400 800',
  style: 'normal',
  display: 'swap',
  variable: '--font-body',
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'Apple SD Gothic Neo', 'Malgun Gothic', 'sans-serif'],
});

export const metadata = {
  title: conferenceConfig.englishTitle,
  description: `${conferenceConfig.koreanTitle} · ${conferenceConfig.locationDisplay}`,
  manifest: '/manifest.json',
  icons: { apple: '/icons/apple-touch-icon.png' },
  appleWebApp: { capable: true, statusBarStyle: 'default' as const, title: conferenceConfig.shortTitle },
};

// Pinch-zoom stays enabled: abstracts and floor plans need it, and blocking it fails WCAG 1.4.4.
// iOS input auto-zoom is prevented by the 16px minimum font-size on inputs in globals.css.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  interactiveWidget: 'resizes-content',
  viewportFit: 'cover',
  themeColor: '#006b5b',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={bodyFont.variable}>
      <body>
        <OfflineReady />
        {children}
      </body>
    </html>
  );
}
