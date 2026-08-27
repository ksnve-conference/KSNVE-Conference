'use client';

import { useRef } from 'react';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import AppTabs from '@/components/AppTabs';
import VenueCard from '@/components/VenueCard';
import InstallGuideModal from '@/components/InstallGuideModal';
import Icon, { type IconName } from '@/components/Icon';
import { sessions, venues } from '@/lib/conference';
import { useAnnouncements } from '@/lib/announcements';

const menu: { href: string; icon: IconName; title: string; desc: string }[] = [
  { href: '/notices', icon: 'notice', title: '공지사항', desc: '학술대회 최신 안내' },
  { href: '/conference/overview', icon: 'info', title: '행사개요', desc: '주제, 일정, 주최' },
  { href: '/conference/registration', icon: 'user', title: '등록안내', desc: '등록비와 현장 등록' },
  { href: '/conference/venue-layout', icon: 'map', title: '행사장 배치도', desc: '층별 배치와 발표장' },
  { href: '/sponsors', icon: 'sponsor', title: '후원사', desc: '함께하는 후원사' },
  { href: '/app-info', icon: 'info', title: '앱 정보', desc: '서비스 안내와 데이터 출처' },
];

export default function MorePage() {
  const { unread } = useAnnouncements();
  const guideRef = useRef<HTMLDialogElement>(null);
  const openGuide = () => guideRef.current?.showModal();
  const closeGuide = () => guideRef.current?.close();

  return (
    <main className="shell app-shell">
      <AppHeader compact showSearch={false} showNotice={false} />
      <section>
        <div className="screen-title"><h1>더보기</h1></div>
        <div className="more-menu">
          <button type="button" onClick={openGuide}>
            <span><Icon name="download" size={19} /></span>
            <div><b>홈 화면에 추가</b><small>앱처럼 설치하는 방법 보기</small></div>
            <em><Icon name="chevron" size={16} /></em>
          </button>
          {menu.map((m) => (
            <Link href={m.href} key={m.href}>
              <span><Icon name={m.icon} size={19} /></span>
              <div><b>{m.title}</b><small>{m.desc}</small></div>
              {m.href === '/notices' && unread > 0 ? <i>{unread}</i> : <em><Icon name="chevron" size={16} /></em>}
            </Link>
          ))}
        </div>
        <InstallGuideModal dialogRef={guideRef} onClose={closeGuide} />

        <div className="venue-section-heading"><span>발표장</span></div>
        <div className="venue-preview">
          {venues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} sessionCount={sessions.filter((s) => s.venue === venue.name).length} />
          ))}
        </div>
      </section>
      <AppTabs />
    </main>
  );
}
