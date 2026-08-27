'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';

/** Registers the service worker and shows a banner while the device is offline. */
export default function OfflineReady() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        // A home-screen iOS web app is rarely a fresh load -- iOS suspends and
        // resumes it instead of reloading, so it can sit on a deploy from days
        // ago until the app is fully force-quit. Ask the SW to check for an
        // update every time the app comes back to the foreground instead.
        const checkForUpdate = () => registration.update().catch(() => undefined);
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') checkForUpdate();
        });
        window.addEventListener('pageshow', checkForUpdate);
      }).catch(() => undefined);

      // sw.js already skipWaiting()+clients.claim()s on activate, so once an
      // update is found it takes over immediately -- reload once to pick up
      // the new page. Guarded so the very first activation (no prior
      // controller) doesn't also trigger a needless reload.
      let hadController = !!navigator.serviceWorker.controller;
      let reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!hadController) { hadController = true; return; }
        if (reloading) return;
        reloading = true;
        window.location.reload();
      });
    }
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (!offline) return null;
  return (
    <div className="offline-banner" role="status">
      <Icon name="alert" size={15} /> 오프라인 상태입니다 — 저장된 내용을 표시합니다
    </div>
  );
}
