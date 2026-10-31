/**
 * 주요 일정 — the official events and headline talks picked out of the
 * programme. Shared by the home screen (today's / tomorrow's list) and the
 * all-days 주요 일정 page, so both always show the same set.
 */
import { dayLabel, formatSessionTitle, papers, sessions, type Session } from '@/lib/conference';
import { keynoteByNo } from '@/lib/keynotes';

export function sessionRange(session: Pick<Session, 'date' | 'time'>) {
  const [start, end] = session.time.split(/[~–-]/);
  const startsAt = new Date(`${session.date}T${(start || '00:00').trim()}:00+09:00`).getTime();
  return { start: startsAt, end: end ? new Date(`${session.date}T${end.trim()}:00+09:00`).getTime() : startsAt + 2 * 60 * 60 * 1000 };
}

const majorEventPattern = /평의원회|개회|개막|키노트|keynote|기조\s*강연|plenary|초청.*강연|특별\s*초청강연|총회|시상|만찬|웰컴\s*리셉션|웰컴리셉션|폐회|폐막|대토론회|교양\s*강좌|마술|캐리커쳐|학회발전\s*TF|친선교류회|학생\s*멘토링/i;
// (기업)특별세션 is a sponsor session, so it stays in the programme but not in 주요 일정.
const isMajorEvent = (s: Session) => majorEventPattern.test(`${s.title} ${s.category}`);

export type MajorItem = { key: string; href: string; date: string; time: string; title: string; venue: string; speaker?: string };

/** Keynotes are talks inside ordinary sessions, not sessions of their own, so
 * they are picked out of the paper list and link to the talk itself. */
const keynoteItems: MajorItem[] = papers
  .filter((p) => p.presentationType === 'KEYNOTE')
  .map((p) => ({
    key: p.id,
    href: `/papers/${p.id}`,
    date: p.date,
    time: p.time,
    title: `${p.keynoteNo ? `키노트 강연 ${p.keynoteNo}` : '키노트 강연'} - ${p.title}`,
    venue: p.venue,
    speaker: (() => {
      const k = p.keynoteNo ? keynoteByNo.get(p.keynoteNo) : undefined;
      return k ? `${k.name} (${k.affiliation})` : p.presenter;
    })(),
  }));

export const allMajorItems: MajorItem[] = [
  ...sessions.filter(isMajorEvent).map((s): MajorItem => ({
    key: s.id, href: `/sessions/${s.id}`, date: s.date, time: s.time, title: formatSessionTitle(s.title), venue: s.venue,
    speaker: s.speaker,
  })),
  ...keynoteItems,
].sort((a, b) => sessionRange(a).start - sessionRange(b).start);

/** "11.26 (목)" */
export function shortDate(date: string) {
  const [, month, day] = date.split('-');
  return `${Number(month)}.${Number(day)} (${dayLabel(date).split(' ')[1] ?? ''})`;
}
