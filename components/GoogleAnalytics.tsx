'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

// Public web-stream identifier; local and preview visits are excluded below.
const MEASUREMENT_ID = 'G-P6PBCF56R6';
type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

function withoutQuery(value: string) {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return '';
  }
}

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const previousPage = useRef('');
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || window.location.hostname !== 'ksnve.org') return;
    const analytics = window as AnalyticsWindow;
    if (!analytics.gtag) {
      analytics.dataLayer = analytics.dataLayer || [];
      analytics.gtag = function () { analytics.dataLayer!.push(arguments); };
      analytics.gtag('js', new Date());
      analytics.gtag('config', MEASUREMENT_ID, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        page_location: withoutQuery(window.location.href),
        page_referrer: withoutQuery(document.referrer),
      });
    }
    setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled || !pathname) return;
    const page = `${window.location.origin}${pathname}`;
    if (previousPage.current === page) return;
    const analytics = window as AnalyticsWindow;
    // Search terms and return URLs can contain names. Never include query/hash.
    const details = {
      page_location: page,
      page_referrer: previousPage.current || withoutQuery(document.referrer),
      page_title: document.title,
    };
    analytics.gtag?.('set', details);
    analytics.gtag?.('event', 'page_view', details);
    previousPage.current = page;
  }, [enabled, pathname]);

  return enabled ? (
    <Script src={`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`} strategy="afterInteractive" />
  ) : null;
}
