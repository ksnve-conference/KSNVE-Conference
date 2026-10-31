'use client';

import Image from 'next/image';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { conferenceConfig } from '@/lib/conference-config';

/** `status` is the home hero's badge: "D-25" before, "2일차 진행 중" during, "종료" after. */
type Props = { compact?: boolean; showNotice?: boolean; unread?: number; status?: string };

/** Sound-wave bars echoing the KSNVE logo, drawn faintly behind the hero text. */
const WAVE = [10, 18, 30, 46, 64, 82, 96, 82, 64, 46, 58, 72, 58, 40, 26, 34, 22, 14, 8];

// The notice shortcut belongs on the home hero only — every compact (detail
// or 더보기-branch) screen already has a back link and the bottom tab bar, so
// it defaults off there instead of needing every caller to opt out. (Search
// used to sit alongside it but was dropped — 논문 tab already covers that.)
export default function AppHeader({ compact = false, showNotice = !compact, unread = 0, status }: Props) {
  return (
    <header className={`hero ${compact ? 'hero-compact' : 'hero-today'}`}>
      {!compact && (
        <div className="hero-photo-stack" aria-hidden="true">
          <span /><span /><span /><span />
        </div>
      )}
      {!compact && (
        <svg className="hero-wave" viewBox="0 0 190 100" preserveAspectRatio="none" aria-hidden="true">
          {WAVE.map((h, i) => <rect key={i} x={i * 10 + 2} y={(100 - h) / 2} width="4" height={h} rx="2" />)}
        </svg>
      )}
      {!compact && (
        // The programme book's emblem, so the app reads as the same event
        <img className="hero-emblem" src="/images/hero-emblem.webp" alt="" width={64} height={64} />
      )}
      <Link href="/" className="brand-mark">
        {compact && (
          <Image
            className="brand-logo"
            src="/images/ksnve-logo-transparent.png"
            alt="한국소음진동공학회"
            width={594}
            height={587}
            sizes="76px"
            priority
          />
        )}
        <div className="hero-title-block">
          {!compact && (
            <span className="hero-org-name">
              <img src="/images/ksnve-mark-white.png" alt="" width={36} height={24} />
              한국소음진동공학회
            </span>
          )}
          <b>{conferenceConfig.headerTitle}</b>
          <small>
            <span>{compact ? conferenceConfig.displayDate : conferenceConfig.heroDate}</span>
            <span>{conferenceConfig.venue}</span>
          </small>
          {!compact && <em className="conference-tagline">“{conferenceConfig.theme}”</em>}
        </div>
      </Link>
      {!compact && status && <span className="hero-status">{status}</span>}
      {showNotice && (
        <nav className="hero-links" aria-label="바로가기">
          <Link href="/notices" aria-label={unread > 0 ? `공지사항 ${unread}건 안 읽음` : '공지사항'} className="hero-link-notice">
            <Icon name="notice" size={18} />
            {unread > 0 && <i className="hero-badge">{unread}</i>}
          </Link>
        </nav>
      )}
    </header>
  );
}
