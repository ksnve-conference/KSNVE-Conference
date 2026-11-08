import type { Paper, Session } from '@/lib/conference';

export type NotificationTarget = {
  id: string;
  title: string;
  venue: string;
  start: number;
  kind: 'paper' | 'session';
};

/** Session bookmarks include each active talk; events without talks get one reminder. */
export function notificationTargets(papers: Paper[], sessions: Session[], paperIds: string[], sessionIds: string[]): NotificationTarget[] {
  const selectedPapers = new Set(paperIds);
  const selectedSessions = new Set(sessionIds);
  const sessionsWithPapers = new Set(papers.map((paper) => paper.sessionId));
  const start = (date: string, time: string) => Date.parse(`${date}T${time.split(/[~–-]/)[0].trim()}:00+09:00`);
  return [
    ...papers.filter((paper) => selectedPapers.has(paper.id) || selectedSessions.has(paper.sessionId))
      .map((paper) => ({ id: paper.id, title: paper.title, venue: paper.venue, start: start(paper.date, paper.time), kind: 'paper' as const })),
    ...sessions.filter((session) => selectedSessions.has(session.id) && !sessionsWithPapers.has(session.id))
      .map((session) => ({ id: `session:${session.id}`, title: session.title, venue: session.venue, start: start(session.date, session.time), kind: 'session' as const })),
  ].filter((target) => Number.isFinite(target.start));
}
