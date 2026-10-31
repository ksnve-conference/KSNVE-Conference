'use client';

import Image from 'next/image';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { conferenceConfig } from '@/lib/conference-config';

/** `status` is the home hero's badge: "D-25" before, "2일차 진행 중" during, "종료" after. */
type Props = { compact?: boolean; showNotice?: boolean; unread?: number; status?: string };

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
            // Official horizontal CI (white, for coloured backgrounds) from KSNVE_CI.ai
            <img className="hero-ci" src="/images/ksnve-ci-horizontal-white.webp" alt="사단법인 한국소음진동공학회" width={900} height={179} />
          )}
          <b>{conferenceConfig.headerTitle}</b>
          <small>
            <span>{compact ? conferenceConfig.displayDate : conferenceConfig.heroDate}</span>
            <span>{conferenceConfig.venue}</span>
          </small>
          {!compact && (
            // theme and status badge share a row, so a tall badge can't ride up into the chips
            <div className="hero-bottom-row">
              <em className="conference-tagline">“{conferenceConfig.theme}”</em>
              {status && <span className="hero-status">{status}</span>}
            </div>
          )}
        </div>
      </Link>
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
