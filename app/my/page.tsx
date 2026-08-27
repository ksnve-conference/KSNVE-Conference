'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import AppTabs from '@/components/AppTabs';
import PaperCard from '@/components/PaperCard';
import Icon from '@/components/Icon';
import NotificationManager from '@/components/NotificationManager';
import { dayLabel, formatSessionTitle } from '@/lib/conference';
import { conferenceConfig } from '@/lib/conference-config';
import { buildIcs, conflicts, scheduleItems, useSaved } from '@/lib/saved';

export default function MySchedulePage() {
  const { savedPapers, savedSessions, togglePaper, toggleSession, ready } = useSaved();
  const items = useMemo(() => scheduleItems(savedPapers, savedSessions), [savedPapers, savedSessions]);
  const clashes = useMemo(() => conflicts(items), [items]);
  const clashKeys = new Set(clashes.flat().map((i) => i.key));

  const exportIcs = () => {
    const blob = new Blob([buildIcs(items, conferenceConfig.shortTitle)], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ksnve-my-schedule.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <main className="shell app-shell">
      <AppHeader compact showNotice={false} />
      <section>
        <div className="screen-title"><h1>내 일정</h1><strong>{items.length}</strong></div>

        {ready && items.length === 0 && (
          <div className="empty schedule-empty">
            <span><Icon name="star" size={28} /></span>
            <b>나만의 일정을 만들어 보세요</b>
            <p>논문이나 세션의 별표를 누르면 날짜별 일정과 발표 알림을 한곳에서 관리할 수 있습니다.</p>
            <Link href="/papers" className="empty-cta">논문 둘러보기</Link>
          </div>
        )}

        {items.length > 0 && (
          <>
            <NotificationManager favoriteIds={savedPapers} />

            <div className="schedule-actions">
              <button type="button" onClick={exportIcs}>
                <Icon name="download" size={16} /> 캘린더로 내보내기 (.ics)
              </button>
            </div>

            {clashes.length > 0 && (
              <div className="conflict-banner" role="status">
                <span><Icon name="alert" size={17} /></span>
                <div>
                  <b>시간이 겹치는 일정이 {clashes.length}건 있습니다</b>
                  <small>겹치는 항목에 표시해 두었습니다. 확인 후 하나를 정리해 보세요.</small>
                </div>
              </div>
            )}

            {conferenceConfig.dates.map((d) => {
              const dayItems = items.filter((i) => i.date === d);
              if (!dayItems.length) return null;
              return (
                <div className="saved-day" key={d}>
                  <h2>{dayLabel(d)} <span>{dayItems.length}</span></h2>
                  <div className="list paper-list">
                    {dayItems.map((item) => item.kind === 'paper' && item.paper ? (
                      <div key={item.key} className={clashKeys.has(item.key) ? 'clash-wrap' : undefined}>
                        <PaperCard paper={item.paper} saved onToggle={togglePaper} />
                      </div>
                    ) : item.session ? (
                      <article className={`card session-saved ${clashKeys.has(item.key) ? 'clash-wrap' : ''}`} key={item.key}>
                        <button
                          className="star on"
                          onClick={() => toggleSession(item.session!.id)}
                          aria-label={`${item.title} 세션을 내 일정에서 제거`}
                          aria-pressed
                        >
                          <Icon name="star-filled" size={17} />
                        </button>
                        <div className="paper-slot"><b>{dayLabel(item.date)} · {item.time}</b><span><Icon name="pin" size={12} /> {item.venue}</span></div>
                        <h3 className="paper-title"><Link href={`/sessions/${item.session.id}`}>{formatSessionTitle(item.title)}</Link></h3>
                        <p className="meta">세션 전체</p>
                      </article>
                    ) : null)}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </section>
      <AppTabs />
    </main>
  );
}
