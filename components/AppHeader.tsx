'use client';

import Image from 'next/image';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { conferenceConfig } from '@/lib/conference-config';

/** `status` is the home hero's badge: "D-25" before, "2일차 진행 중" during, "종료" after. */
type Props = { compact?: boolean; showNotice?: boolean; unread?: number; status?: string; live?: boolean };

// The notice shortcut belongs on the home hero only — every compact (detail
// or 더보기-branch) screen already has a back link and the bottom tab bar, so
// it defaults off there instead of needing every caller to opt out. (Search
// used to sit alongside it but was dropped — 논문 tab already covers that.)
export default function AppHeader({ compact = false, showNotice = !compact, unread = 0, status, live = false }: Props) {
  const compactTitle = conferenceConfig.headerTitle.match(/^(\d{4}\s+\S+)\s+(.+)$/);
  return (
    <header className={compact ? 'site-header hero-compact' : 'hero hero-today'}>
      {/* Installed iOS app: a white strip pinned to the top edge, which iOS reads as the
          status-bar colour, so every compact screen gets a plain white strip instead of a blurred fade. */}
      {compact && <span className="status-tint" aria-hidden="true" />}
      {!compact && (
        <div className="hero-photo-stack" aria-hidden="true">
          <span /><span /><span /><span />
        </div>
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
          <b>{compact && compactTitle ? <><span className="compact-season">{compactTitle[1]}</span>{' '}<span>{compactTitle[2]}</span></> : conferenceConfig.headerTitle}</b>
          <small>
            <span>{compact ? conferenceConfig.displayDate : conferenceConfig.heroDate}</span>
            <span>{conferenceConfig.venue}</span>
          </small>
          {!compact && (
            <div className="hero-bottom-row">
              <em className="conference-tagline">「 {conferenceConfig.theme} 」</em>
            </div>
          )}
        </div>
      </Link>
      {!compact && status && (
        <span className={`hero-status${live ? ' is-live' : ''}`}>
          {live && <i className="hero-live-dot" aria-label="진행 중" />}
          {status}
        </span>
      )}
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
