'use client';

import Image from 'next/image';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { conferenceConfig } from '@/lib/conference-config';

type Props = { compact?: boolean; showNotice?: boolean; unread?: number };

// The notice shortcut belongs on the home hero only — every compact (detail
// or 더보기-branch) screen already has a back link and the bottom tab bar, so
// it defaults off there instead of needing every caller to opt out. (Search
// used to sit alongside it but was dropped — 논문 tab already covers that.)
export default function AppHeader({ compact = false, showNotice = !compact, unread = 0 }: Props) {
  return (
    <header className={`hero ${compact ? 'hero-compact' : 'hero-today'}`}>
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
          {!compact && <span className="hero-org-name">한국소음진동공학회</span>}
          <b>{conferenceConfig.headerTitle}</b>
          <small>
            <span>{conferenceConfig.displayDate}</span>
            <span>{conferenceConfig.venue}</span>
          </small>
          {!compact && <em className="conference-tagline">지속가능한 내일의 소음 진동</em>}
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
