'use client';

import { useEffect, useRef, useState } from 'react';
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
  const guideRef = useRef<HTMLDialogElement>(null);

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
  // includes that option, so it would just be a confusing dead end. The closest
  // useful thing a tap can do is open our own illustrated step-by-step guide.
  const openGuide = () => guideRef.current?.showModal();
  const closeGuide = () => guideRef.current?.close();

  if (dismissed || (!deferredPrompt && !showIosHint)) return null;

  return (
    <div className="install-prompt">
      {deferredPrompt ? (
        <span className="install-prompt-icon"><Icon name="download" size={17} /></span>
      ) : (
        <button type="button" className="install-prompt-icon" onClick={openGuide} aria-label="설치 방법 보기">
          <Icon name="download" size={17} />
        </button>
      )}
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
      {deferredPrompt
        ? <button type="button" onClick={install}>추가</button>
        : <button type="button" onClick={openGuide}>방법 보기</button>}
      <button type="button" className="install-prompt-close" onClick={dismiss} aria-label="닫기">
        <Icon name="close" size={14} />
      </button>

      {!deferredPrompt && (
        <dialog ref={guideRef} className="filter-sheet install-guide-sheet" aria-label="홈 화면에 추가하는 방법">
          <div className="filter-sheet-header">
            <h2>홈 화면에 추가하는 방법</h2>
            <button type="button" onClick={closeGuide} aria-label="닫기"><Icon name="close" size={18} /></button>
          </div>
          <div className="filter-sheet-body">
            <ol className="install-guide-steps">
              <li className="install-guide-step">
                <span className="install-guide-step-icon"><Icon name="share" size={19} /></span>
                <div>
                  <b><span>1</span>공유 버튼 탭하기</b>
                  <p>Safari 하단(또는 상단) 툴바에서 공유 아이콘을 탭하세요.</p>
                </div>
              </li>
              <li className="install-guide-step">
                <span className="install-guide-step-icon"><Icon name="plus" size={19} /></span>
                <div>
                  <b><span>2</span>&lsquo;홈 화면에 추가&rsquo; 선택</b>
                  <p>메뉴를 아래로 스크롤해 &lsquo;홈 화면에 추가&rsquo;를 탭한 뒤 &lsquo;추가&rsquo;를 누르면 완료됩니다.</p>
                </div>
              </li>
            </ol>
          </div>
          <div className="filter-sheet-footer">
            <button type="button" className="filter-sheet-apply" onClick={closeGuide}>확인</button>
          </div>
        </dialog>
      )}
    </div>
  );
}
