'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { getNewDeployment } from '@/lib/deployment-update';

/** Registers the service worker and shows a banner while the device is offline. */
export default function OfflineReady() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let disposed = false;
    let reloading = false;
    let checking = false;
    let controller: AbortController | undefined;
    let timeout: number | undefined;
    let registration: ServiceWorkerRegistration | undefined;
    const currentVersion = process.env.NEXT_PUBLIC_DEPLOYMENT_VERSION;
    const checkForUpdate = async () => {
      if (disposed || checking || reloading || document.visibilityState !== 'visible' || !navigator.onLine) return;
      registration?.update().catch(() => undefined);
      if (process.env.NODE_ENV !== 'production' || !currentVersion) return;
      checking = true;
      controller = new AbortController();
      timeout = window.setTimeout(() => controller?.abort(), 8000);
      const nextVersion = await getNewDeployment(currentVersion, controller.signal);
      window.clearTimeout(timeout);
      checking = false;
      if (disposed || !nextVersion || document.visibilityState !== 'visible') return;
      // Avoid a refresh loop if a proxy briefly serves an older page after reload.
      try {
        const previous = JSON.parse(sessionStorage.getItem('ksnveDeploymentReload') || 'null');
        if (previous?.version === nextVersion && Date.now() - previous.time < 30000) return;
        sessionStorage.setItem('ksnveDeploymentReload', JSON.stringify({ version: nextVersion, time: Date.now() }));
      } catch { /* Storage is optional; never clear saved schedules. */ }
      reloading = true;
      window.location.reload();
    };
    let hadController = 'serviceWorker' in navigator && !!navigator.serviceWorker.controller;
    const onControllerChange = () => {
      if (!hadController) { hadController = true; return; }
      if (disposed || reloading) return;
      reloading = true;
      window.location.reload();
    };
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').then((value) => {
        if (disposed) return;
        registration = value;
      }).catch(() => undefined);
      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    }
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    document.addEventListener('visibilitychange', checkForUpdate);
    window.addEventListener('pageshow', checkForUpdate);
    window.addEventListener('online', checkForUpdate);
    void checkForUpdate();
    return () => {
      disposed = true;
      controller?.abort();
      window.clearTimeout(timeout);
      document.removeEventListener('visibilitychange', checkForUpdate);
      window.removeEventListener('pageshow', checkForUpdate);
      window.removeEventListener('online', checkForUpdate);
      if ('serviceWorker' in navigator) navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
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
