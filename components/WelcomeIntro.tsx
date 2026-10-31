'use client';

import { useEffect, useRef } from 'react';
import { conferenceConfig } from '@/lib/conference-config';
import './WelcomeIntro.css';

const SEEN_KEY = 'ksnve-2026-welcome-seen';
let seenThisVisit = false;

export default function WelcomeIntro() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const preview = process.env.NODE_ENV === 'development' && new URLSearchParams(window.location.search).get('intro') === '1';
    if (!dialog || (!preview && (window.location.hash || seenThisVisit))) return;
    try {
      if (!preview && localStorage.getItem(SEEN_KEY)) return;
    } catch { /* The intro still works when browser storage is unavailable. */ }

    dialog.classList.remove('is-leaving');
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    let timer: number | undefined;
    const finish = () => {
      if (timer !== undefined) return;
      if (!preview) {
        seenThisVisit = true;
        try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* Optional persistence. */ }
      }
      dialog.classList.add('is-leaving');
      timer = window.setTimeout(() => {
        dialog.close();
        document.body.style.overflow = previousOverflow;
      }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 350);
    };
    const start = startRef.current;
    const cancel = (event: Event) => { event.preventDefault(); finish(); };
    start?.addEventListener('click', finish);
    dialog.addEventListener('cancel', cancel);
    return () => {
      window.clearTimeout(timer);
      start?.removeEventListener('click', finish);
      dialog.removeEventListener('cancel', cancel);
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <dialog ref={dialogRef} className="welcome-intro" aria-label="학술대회 환영 화면">
      <div className="welcome-intro-content">
        <img src="/images/ksnve-ci-horizontal-white.webp" alt="한국소음진동공학회" width={900} height={179} />
        <div className="welcome-intro-rule" />
        <p className="welcome-intro-year">2026</p>
        <p className="welcome-intro-title">추계 소음진동<br />학술대회</p>
        <p className="welcome-intro-theme">{conferenceConfig.theme}</p>
        <p className="welcome-intro-place">{conferenceConfig.displayDate}<br />{conferenceConfig.venue}</p>
      </div>
      <button ref={startRef} type="button" className="welcome-intro-skip" autoFocus>학술대회 시작하기 <span aria-hidden="true">→</span></button>
    </dialog>
  );
}
