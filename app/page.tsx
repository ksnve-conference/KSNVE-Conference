'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import AppTabs from '@/components/AppTabs';
import SessionCard from '@/components/SessionCard';
import TimelineSession from '@/components/TimelineSession';
import TimeTravelPanel from '@/components/TimeTravelPanel';
import Icon from '@/components/Icon';
import { dayLabel, formatSessionTitle, papers, sessions, type Session } from '@/lib/conference';
import { conferenceConfig } from '@/lib/conference-config';
import { parseMockNow, type MockNow } from '@/lib/dashboard-time';
import { useSaved } from '@/lib/saved';
import { useAnnouncements } from '@/lib/announcements';

function localDateKey() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function formatKoreanDate(date: string) {
  return new Date(`${date}T00:00:00+09:00`).toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  });
}

const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

function sessionRange(session: Session) {
  const [start, end] = session.time.split(/[~–-]/);
  const startsAt = new Date(`${session.date}T${(start || '00:00').trim()}:00+09:00`).getTime();
  return { start: startsAt, end: end ? new Date(`${session.date}T${end.trim()}:00+09:00`).getTime() : startsAt + 2 * 60 * 60 * 1000 };
}

function currentOrNextSessions(items: Session[], date: string, now: Date) {
  const dated = items.filter((s) => s.date === date);
  const nowTime = now.getTime();
  const running = dated.filter((s) => { const r = sessionRange(s); return r.start <= nowTime && nowTime < r.end; });
  if (running.length > 0) return running;
  const upcoming = dated.filter((s) => sessionRange(s).start > nowTime);
  if (upcoming.length === 0) return [];
  const nearest = Math.min(...upcoming.map((s) => sessionRange(s).start));
  return upcoming.filter((s) => sessionRange(s).start === nearest);
}

const majorEventPattern = /평의원회|개회|개막|키노트|keynote|기조\s*강연|plenary|초청.*강연|특별\s*초청강연|특별세션|총회|시상|만찬|웰컴\s*리셉션|웰컴리셉션|폐회|폐막|대토론회/i;
const isMajorEvent = (s: Session) => majorEventPattern.test(`${s.title} ${s.category}`);

export default function ProgramPage() {
  const [mockNow, setMockNow] = useState<MockNow | null>(null);
  const [showTimeTravel, setShowTimeTravel] = useState(false);
  const { savedPapers, savedSessions, togglePaper, toggleSession } = useSaved();
  const { items: announcements, unread, markRead, read } = useAnnouncements();

  const dates = [...conferenceConfig.dates];
  const today = mockNow?.date ?? localDateKey();
  const isBefore = today < conferenceConfig.startDate;
  const isAfter = today > conferenceConfig.endDate;
  const isDuring = !isBefore && !isAfter;
  const dashboardDate = isDuring ? today : conferenceConfig.startDate;
  const [date, setDate] = useState(dashboardDate);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setShowTimeTravel(process.env.NODE_ENV === 'development' || params.get('dev') === '1');
    setMockNow(parseMockNow(params.get('mockNow')));
  }, []);

  useEffect(() => { setDate(dashboardDate); }, [dashboardDate]);

  const now = mockNow?.instant ?? new Date();
  const currentOrNext = useMemo(() => currentOrNextSessions(sessions, dashboardDate, now), [dashboardDate, now]);
  const majorEvents = useMemo(() => sessions
    .filter((s) => s.date === dashboardDate && isMajorEvent(s) && sessionRange(s).end > now.getTime())
    .sort((a, b) => sessionRange(a).start - sessionRange(b).start), [dashboardDate, now]);
  const daySessions = useMemo(() => sessions
    .filter((s) => s.date === date)
    .sort((a, b) => a.time.localeCompare(b.time)), [date]);

  const changeMockNow = (value: string | null) => {
    setMockNow(parseMockNow(value));
    const url = new URL(window.location.href);
    url.searchParams.set('dev', '1');
    if (value) url.searchParams.set('mockNow', value); else url.searchParams.delete('mockNow');
    window.history.replaceState(null, '', `${url.pathname}${url.search}`);
  };

  return (
    <main className="shell app-shell">
      <AppHeader unread={unread} />

      <section className="today-dashboard">
        {showTimeTravel && <TimeTravelPanel mockNow={mockNow} onChange={changeMockNow} />}

        {isBefore && (
          <section className="conference-status-card before-conference">
            <div className="conference-status-meta"><time>{formatKoreanDate(today)}</time><strong>D-{daysBetween(today, conferenceConfig.startDate)}</strong></div>
            <span>CONFERENCE COUNTDOWN</span>
            <h2>{conferenceConfig.koreanTitle}</h2>
            <p className="countdown-copy">
              <strong>학술대회가 {daysBetween(today, conferenceConfig.startDate)}일 남았습니다.</strong>
              <span>첫 행사일 프로그램을 미리 살펴보세요.</span>
            </p>
          </section>
        )}

        {isDuring && (
          <div className="conference-live-status">
            <span>LIVE</span>
            <div><b>학술대회 진행 중</b><small>{formatKoreanDate(today)} · {conferenceConfig.venue}</small></div>
          </div>
        )}

        {isAfter && (
          <section className="conference-status-card after-conference">
            <span>CONFERENCE ARCHIVE</span>
            <h2>학술대회가 종료되었습니다.</h2>
            <p>프로그램과 초록은 계속 열람할 수 있습니다.</p>
          </section>
        )}

        {!isAfter && (
          <>
            <div className="dashboard-section">
              <div className="dashboard-heading"><div><span>NOW &amp; NEXT</span><h2>현재 진행 중 / 다음 세션</h2></div></div>
              <div className="dashboard-sessions">
                {currentOrNext.map((session) => (
                  <SessionCard key={session.id} session={session} paperCount={papers.filter((p) => p.sessionId === session.id).length} />
                ))}
                {currentOrNext.length === 0 && <div className="compact-empty">현재 진행 중이거나 예정된 세션이 없습니다.</div>}
              </div>
            </div>

            <div className="dashboard-section">
              <div className="dashboard-heading"><div><span>MAJOR EVENTS</span><h2>주요 일정</h2></div></div>
              <div className="major-event-list">
                {majorEvents.map((session) => (
                  <Link href={`/sessions/${session.id}`} key={session.id}>
                    <time>{session.time.split('~')[0]}</time>
                    <div><b>{formatSessionTitle(session.title)}</b><small>{session.venue}</small></div>
                    <span><Icon name="chevron" size={16} /></span>
                  </Link>
                ))}
                {majorEvents.length === 0 && <div className="compact-empty">예정된 주요 일정이 없습니다.</div>}
              </div>
            </div>
          </>
        )}

        <div className="dashboard-section">
          <div className="dashboard-heading">
            <div><span>ANNOUNCEMENTS</span><h2>공지사항 {unread > 0 && <i>{unread}</i>}</h2></div>
            {announcements.length > 2 && <Link href="/notices">전체 보기</Link>}
          </div>
          <div className="announcement-list">
            {announcements.slice(0, 2).map((a) => (
              <button className={read.includes(a.id) ? 'read' : ''} key={a.id} onClick={() => markRead(a.id)}>
                <span>{a.category}</span>
                <div><b>{a.title}</b><small>{a.body}</small></div>
                {!read.includes(a.id) && <em>NEW</em>}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="program-block">
        <div className="screen-title"><div><span>CONFERENCE AGENDA</span><h1>전체 프로그램</h1></div></div>
        <div className="date-strip">
          {dates.map((item) => (
            <button key={item} className={date === item ? 'active' : ''} onClick={() => setDate(item)}>
              <small>{dayLabel(item).split(' ')[1]}요일</small>
              <b>{Number(item.slice(8, 10))}</b>
              <span>{Number(item.slice(5, 7))}월</span>
            </button>
          ))}
        </div>
        <div className="agenda-summary"><b>{dayLabel(date)} 일정</b><span>{daySessions.length}개 세션</span></div>
        <div className="program-timeline">
          {daySessions.map((session) => (
            <TimelineSession
              key={session.id}
              session={session}
              sessionPapers={papers.filter((p) => p.sessionId === session.id)}
              favorites={savedPapers}
              onToggle={togglePaper}
              saved={savedSessions.includes(session.id)}
              onToggleSession={toggleSession}
            />
          ))}
          {daySessions.length === 0 && <div className="compact-empty">이 날짜에 등록된 일정이 없습니다.</div>}
        </div>
      </section>

      <AppTabs />
    </main>
  );
}
