'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';

/** Registers the service worker and shows a banner while the device is offline. */
export default function OfflineReady() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
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
