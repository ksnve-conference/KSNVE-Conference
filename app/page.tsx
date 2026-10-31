'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import AppTabs from '@/components/AppTabs';
import SessionCard from '@/components/SessionCard';
import TimeSlotRow from '@/components/TimeSlotRow';
import TimeTravelPanel from '@/components/TimeTravelPanel';
import InstallPrompt from '@/components/InstallPrompt';
import Icon, { type IconName } from '@/components/Icon';
import { dayLabel, papers, sessions, type Session } from '@/lib/conference';
import { allMajorItems, sessionRange, shortDate } from '@/lib/major-events';
import { conferenceConfig } from '@/lib/conference-config';
import { parseMockNow, type MockNow } from '@/lib/dashboard-time';
import { useSaved } from '@/lib/saved';
import { useAnnouncements } from '@/lib/announcements';
import { useViewState } from '@/lib/view-state';

function localDateKey() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

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

/**
 * Before the conference there is nothing "in progress", and the earliest item
 * is the off-site 친선교류회 — so the home screen shows 참가 안내 links
 * instead. Deadline items drop off once their deadline has passed.
 */
const REGISTRATION_DEADLINE = new Date('2026-11-11T18:00:00+09:00');
const LODGING_DEADLINE = new Date('2026-11-13T23:59:59+09:00');

/** "사전등록 마감 D-6", or "사전등록 오늘 마감" on the day itself. */
function deadlineTitle(label: string, deadline: Date, now: Date) {
  const day = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(d);
  const n = daysBetween(day(now), day(deadline));
  return n === 0 ? `${label} 오늘 마감` : `${label} 마감 D-${n}`;
}

function prepItems(now: Date): { href: string; icon: IconName; title: string; desc: string }[] {
  return [
    ...(now < REGISTRATION_DEADLINE ? [{
      href: '/conference/registration', icon: 'user' as IconName,
      title: deadlineTitle('사전등록', REGISTRATION_DEADLINE, now), desc: '11/11(수) 18:00까지 · 이후 당일등록 회비 적용',
    }] : []),
    ...(now < LODGING_DEADLINE ? [{
      href: '/conference/lodging', icon: 'bed' as IconName,
      title: deadlineTitle('숙박 할인 예약', LODGING_DEADLINE, now), desc: '11/13(금)까지 · 신라스테이 여수 등 할인 숙소',
    }] : []),
    { href: '/conference/schedule', icon: 'calendar', title: '주요 일정 한눈에 보기', desc: '4일간 키노트·초청특별강연·총회·만찬' },
    { href: '/conference/directions', icon: 'train', title: '오시는 길', desc: 'KTX 여수EXPO역 도보 5분 · 주차 할인' },
  ];
}

export default function ProgramPage() {
  const [mockNow, setMockNow] = useState<MockNow | null>(null);
  const [showTimeTravel, setShowTimeTravel] = useState(false);
  const { savedPapers, savedSessions, togglePaper, toggleSession } = useSaved();
  // Separate open-state per section: the same session can appear in both
  // "지금/다음" and the full day timeline, and they must expand independently.
  const [openNowSessions, setOpenNowSessions] = useState<string[]>([]);
  const toggleNowSessionOpen = (id: string) =>
    setOpenNowSessions((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  const [openTimelineSessions, setOpenTimelineSessions] = useState<string[]>([]);
  const toggleTimelineSessionOpen = (id: string) =>
    setOpenTimelineSessions((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  const { items: announcements, unread, markRead, read } = useAnnouncements();
  // The compact home-page list clips each notice to one line; a tap should
  // reveal the rest in place rather than only marking it read with no visible change.
  const [openNotices, setOpenNotices] = useState<string[]>([]);
  const toggleNotice = (id: string) => {
    markRead(id);
    setOpenNotices((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  };

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

  // Back from a paper or session: same day, same sessions open, same scroll.
  useViewState(
    'program',
    { date, openTimelineSessions, openNowSessions },
    (saved) => {
      if (typeof saved.date === 'string' && (dates as string[]).includes(saved.date)) setDate(saved.date);
      if (Array.isArray(saved.openTimelineSessions)) setOpenTimelineSessions(saved.openTimelineSessions as string[]);
      if (Array.isArray(saved.openNowSessions)) setOpenNowSessions(saved.openNowSessions as string[]);
    },
  );

  const now = mockNow?.instant ?? new Date();
  // D-day / day number / finished, shown as the hero badge (replaces the status cards)
  const heroStatus = isBefore ? `D-${daysBetween(today, conferenceConfig.startDate)}`
    : isDuring ? `${(conferenceConfig.dates as readonly string[]).indexOf(today) + 1}일차 진행 중` : '종료';
  const currentOrNext = useMemo(() => currentOrNextSessions(sessions, dashboardDate, now), [dashboardDate, now]);
  // Once the day's last major event has started, the list turns to the next
  // day's instead of sitting empty through the evening.
  const { majorDate, majorEvents } = useMemo(() => {
    const upcomingOn = (day: string) => allMajorItems
      .filter((item) => item.date === day && sessionRange(item).end > now.getTime())
      .sort((a, b) => sessionRange(a).start - sessionRange(b).start);
    const todays = upcomingOn(dashboardDate);
    const nextDate = (dates as string[])[(dates as string[]).indexOf(dashboardDate) + 1];
    if (todays.length === 0 && isDuring && nextDate) return { majorDate: nextDate, majorEvents: upcomingOn(nextDate) };
    return { majorDate: dashboardDate, majorEvents: todays };
  }, [dashboardDate, now]); // eslint-disable-line react-hooks/exhaustive-deps
  const majorDayNo = (dates as string[]).indexOf(majorDate) + 1;
  const daySessions = useMemo(() => sessions
    .filter((s) => s.date === date)
    .sort((a, b) => a.time.localeCompare(b.time)), [date]);

  // Grouped by start time so every hall running at once shows as one dense row
  // under a shared heading, instead of a tall card per session.
  const daySlots = useMemo(() => {
    const map = new Map<string, Session[]>();
    daySessions.forEach((session) => {
      const list = map.get(session.time) || [];
      list.push(session);
      map.set(session.time, list);
    });
    return [...map.entries()];
  }, [daySessions]);

  const changeMockNow = (value: string | null) => {
    setMockNow(parseMockNow(value));
    const url = new URL(window.location.href);
    url.searchParams.set('dev', '1');
    if (value) url.searchParams.set('mockNow', value); else url.searchParams.delete('mockNow');
    window.history.replaceState(null, '', `${url.pathname}${url.search}`);
  };

  return (
    <main className="shell app-shell">
      <AppHeader unread={unread} status={heroStatus} />

      <section className="today-dashboard">
        <InstallPrompt />
        {showTimeTravel && <TimeTravelPanel mockNow={mockNow} onChange={changeMockNow} />}

        {isAfter && (
          <section className="conference-status-card after-conference">
            <h2>학술대회가 종료되었습니다.</h2>
            <p>프로그램과 초록은 계속 열람할 수 있습니다.</p>
          </section>
        )}

        {!isAfter && (
          <>
            {isBefore ? (
              <div className="dashboard-section">
                <div className="dashboard-heading"><h2>참가 안내</h2></div>
                <div className="more-menu prep-list">
                  {prepItems(now).map((item) => (
                    <Link href={item.href} key={item.href}>
                      <span><Icon name={item.icon} size={19} /></span>
                      <div><b>{item.title}</b><small>{item.desc}</small></div>
                      <em><Icon name="chevron" size={16} /></em>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
            <div className="dashboard-section">
              <div className="dashboard-heading"><h2>현재 진행 중 / 다음 세션</h2></div>
              <div className="dashboard-sessions">
                {currentOrNext.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    sessionPapers={papers.filter((p) => p.sessionId === session.id)}
                    isOpen={openNowSessions.includes(session.id)}
                    onToggleOpen={() => toggleNowSessionOpen(session.id)}
                    savedPapers={savedPapers}
                    onTogglePaper={togglePaper}
                  />
                ))}
                {currentOrNext.length === 0 && <div className="compact-empty">현재 진행 중이거나 예정된 세션이 없습니다.</div>}
              </div>
            </div>
            )}

            <div className="dashboard-section">
              <div className="dashboard-heading">
                <h2>{majorDayNo}일차 주요 일정</h2>
                <span className="dashboard-heading-date">
                  {isDuring && majorDate !== dashboardDate ? '내일 · ' : ''}{shortDate(majorDate)}
                </span>
              </div>
              <div className="major-event-list">
                {majorEvents.map((item) => (
                  <Link href={item.href} key={item.key}>
                    <time>{item.time.split('~')[0]}</time>
                    <div><b>{item.title}</b><small>{item.speaker ? `${item.venue} · 연사 ${item.speaker}` : item.venue}</small></div>
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
            <h2>공지사항 {unread > 0 && <i>{unread}</i>}</h2>
            {announcements.length > 2 && <Link href="/notices">전체 보기</Link>}
          </div>
          <div className="announcement-list">
            {announcements.slice(0, 2).map((a) => (
              <button
                className={[read.includes(a.id) ? 'read' : '', openNotices.includes(a.id) ? 'open' : ''].filter(Boolean).join(' ')}
                key={a.id}
                onClick={() => toggleNotice(a.id)}
              >
                <span>{a.category}</span>
                <div><b>{a.title}</b><small>{a.body}</small></div>
                {!read.includes(a.id) && <em>NEW</em>}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="program-block">
        <div className="screen-title"><h1>전체 프로그램</h1></div>
        <div className="date-strip">
          {dates.map((item) => (
            <button key={item} className={date === item ? 'active' : ''} onClick={() => setDate(item)}>
              <b>{Number(item.slice(8, 10))}</b>
              <span>{dayLabel(item).split(' ')[1]}</span>
            </button>
          ))}
        </div>
        <div className="agenda-summary"><b>{dayLabel(date)} 일정</b><span>{daySessions.length}개 세션</span></div>
        <div className="program-timeline">
          {daySlots.map(([time, slotSessions]) => (
            <div className="time-slot-group" key={time}>
              <div className="time-slot-heading">
                <b>{time.split('~')[0]}</b>
                {time.includes('~') && <span>– {time.split('~')[1]}</span>}
              </div>
              <div className="time-slot-rows">
                {slotSessions.map((session) => (
                  <TimeSlotRow
                    key={session.id}
                    session={session}
                    sessionPapers={papers.filter((p) => p.sessionId === session.id)}
                    saved={savedSessions.includes(session.id)}
                    onToggleSession={toggleSession}
                    isOpen={openTimelineSessions.includes(session.id)}
                    onToggleOpen={() => toggleTimelineSessionOpen(session.id)}
                    savedPapers={savedPapers}
                    onTogglePaper={togglePaper}
                  />
                ))}
              </div>
            </div>
          ))}
          {daySessions.length === 0 && <div className="compact-empty">이 날짜에 등록된 일정이 없습니다.</div>}
        </div>
      </section>

      <AppTabs />
    </main>
  );
}
