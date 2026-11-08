import localFont from 'next/font/local';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import './styles.css';
import type { Viewport } from 'next';
import { conferenceConfig } from '@/lib/conference-config';
import OfflineReady from '@/components/OfflineReady';
import { NotificationWatcher } from '@/components/NotificationManager';
import GoogleAnalytics from '@/components/GoogleAnalytics';

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

// 고도M, the KSNVE CI typeface, subset to the conference name and the hero's
// date/venue/theme/badge text (~5 KB). Regenerate with scripts/subset-ci-font.py.
const ciFont = localFont({
  src: './fonts/GodoM.subset.woff2',
  weight: '500',
  style: 'normal',
  display: 'swap',
  variable: '--font-ci',
  fallback: ['sans-serif'],
});

// KakaoTalk/Slack/등 링크 미리보기 크롤러는 상대 경로 og:image를 못 읽는 경우가 많아
// 절대 URL로 못박아야 한다. 실제 배포 주소가 정해지면 여기 또는
// NEXT_PUBLIC_SITE_URL 환경변수로 갱신할 것.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ksnve-conference.vercel.app';
const shareDescription = `${conferenceConfig.displayDate}\n${conferenceConfig.venue}`;

export const metadata = {
  metadataBase: new URL(siteUrl),
  // Pages set their own title ("주요 일정", a paper title …) and get the
  // conference name appended; the home screen shows the name alone.
  title: { default: conferenceConfig.headerTitle, template: `%s | ${conferenceConfig.headerTitle}` },
  description: `한국소음진동공학회 ${conferenceConfig.koreanTitle} · ${conferenceConfig.displayDate} · ${conferenceConfig.venue}. 프로그램, 발표논문 확장요약문, 내 일정, 행사장 안내.`,
  applicationName: conferenceConfig.headerTitle,
  manifest: '/manifest.json',
  icons: { apple: '/icons/apple-touch-icon.png' },
  // Home-screen label only — kept short on purpose, separate from shortTitle
  // (which stays "KSNVE 2026 Fall" for OG/calendar contexts where more detail helps).
  appleWebApp: { capable: true, statusBarStyle: 'default' as const, title: 'KSNVE' },
  openGraph: {
    type: 'website' as const,
    locale: 'ko_KR',
    siteName: '한국소음진동공학회',
    title: conferenceConfig.koreanTitle,
    description: shareDescription,
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: conferenceConfig.koreanTitle,
    description: shareDescription,
  },
};

// Pinch-zoom stays enabled: abstracts and floor plans need it, and blocking it fails WCAG 1.4.4.
// iOS input auto-zoom is prevented by the 16px minimum font-size on inputs in globals.css.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  interactiveWidget: 'resizes-content',
  viewportFit: 'cover',
  themeColor: '#076db0',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-scroll-behavior="smooth" className={`${bodyFont.variable} ${ciFont.variable}`}>
      <body>
        <OfflineReady />
        <NotificationWatcher />
        <div id="app-scroll">{children}</div>
        <Analytics />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
