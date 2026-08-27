'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';

const DISMISSED_KEY = 'ksnveInstallDismissed';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isIos() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/** Neither platform lets a site trigger installation without a tap — Safari has no
 * API for it at all, and Chrome requires the user to act on its own prompt event.
 * This turns that one required tap into the smoothest version of it: a one-tap
 * button on Android/Chrome, clear instructions on iOS (there's no button to give). */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(true); // default hidden until checked, to avoid a flash

  useEffect(() => {
    if (isStandalone()) return;
    try {
      setDismissed(localStorage.getItem(DISMISSED_KEY) === '1');
    } catch {
      setDismissed(false);
    }
    if (isIos()) {
      setShowIosHint(true);
    }

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(DISMISSED_KEY, '1'); } catch { /* quota */ }
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  };

  // iOS has no API to trigger Safari's own share sheet or "Add to Home Screen" —
  // navigator.share() opens a *different*, JS-triggered system sheet that never
  // includes that option, so it would just be a confusing dead end. The icon
  // stays a plain, non-interactive visual cue; the instructions below do the work.
  if (dismissed || (!deferredPrompt && !showIosHint)) return null;

  return (
    <div className="install-prompt">
      <span className="install-prompt-icon"><Icon name="download" size={17} /></span>
      {deferredPrompt ? (
        <div>
          <b>홈 화면에 추가</b>
          <small>앱처럼 바로 열 수 있고, 오프라인에서도 프로그램을 볼 수 있습니다.</small>
        </div>
      ) : (
        <div>
          <b>홈 화면에 추가</b>
          <small>
            공유<Icon name="external" size={12} className="install-prompt-inline-icon" />버튼을 누른 뒤 &lsquo;홈 화면에 추가&rsquo;를 선택하세요.
          </small>
        </div>
      )}
      {deferredPrompt && <button type="button" onClick={install}>추가</button>}
      <button type="button" className="install-prompt-close" onClick={dismiss} aria-label="닫기">
        <Icon name="close" size={14} />
      </button>
    </div>
  );
}
