'use client';

import { useCallback, useEffect, useState } from 'react';
import { papers, sessions, type Paper, type Session } from '@/lib/conference';

export const SAVED_PAPERS_KEY = 'ksnveFav';
export const SAVED_SESSIONS_KEY = 'ksnveFavSessions';

function readList(key: string): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function writeList(key: string, value: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('ksnve:saved-changed'));
  } catch {
    /* storage unavailable (private mode, quota) — keep the in-memory state */
  }
}

/** Saved papers and sessions, kept in sync across every mounted component. */
export function useSaved() {
  const [savedPapers, setSavedPapers] = useState<string[]>([]);
  const [savedSessions, setSavedSessions] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  const sync = useCallback(() => {
    setSavedPapers(readList(SAVED_PAPERS_KEY));
    setSavedSessions(readList(SAVED_SESSIONS_KEY));
  }, []);

  useEffect(() => {
    sync();
    setReady(true);
    const onChange = () => sync();
    window.addEventListener('ksnve:saved-changed', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('ksnve:saved-changed', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, [sync]);

  const togglePaper = useCallback((id: string) => {
    setSavedPapers((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      writeList(SAVED_PAPERS_KEY, next);
      return next;
    });
  }, []);

  const toggleSession = useCallback((id: string) => {
    setSavedSessions((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      writeList(SAVED_SESSIONS_KEY, next);
      return next;
    });
  }, []);

  return { savedPapers, savedSessions, togglePaper, toggleSession, ready, count: savedPapers.length + savedSessions.length };
}

export type ScheduleItem = {
  key: string;
  kind: 'paper' | 'session';
  title: string;
  date: string;
  time: string;
  venue: string;
  paper?: Paper;
  session?: Session;
};

const startMs = (date: string, time: string) => {
  const start = time.split(/[~–-]/)[0]?.trim();
  const value = Date.parse(`${date}T${start || '00:00'}:00+09:00`);
  return Number.isNaN(value) ? 0 : value;
};

const endMs = (date: string, time: string) => {
  const parts = time.split(/[~–-]/);
  const end = parts[1]?.trim();
  if (!end) return startMs(date, time) + 30 * 60 * 1000;
  const value = Date.parse(`${date}T${end}:00+09:00`);
  return Number.isNaN(value) ? startMs(date, time) + 30 * 60 * 1000 : value;
};

export function scheduleItems(savedPapers: string[], savedSessions: string[]): ScheduleItem[] {
  const items: ScheduleItem[] = [];
  papers.filter((paper) => savedPapers.includes(paper.id)).forEach((paper) => {
    items.push({ key: `paper:${paper.id}`, kind: 'paper', title: paper.title, date: paper.date, time: paper.time, venue: paper.venue, paper });
  });
  sessions.filter((session) => savedSessions.includes(session.id)).forEach((session) => {
    items.push({ key: `session:${session.id}`, kind: 'session', title: session.title, date: session.date, time: session.time, venue: session.venue, session });
  });
  return items.sort((left, right) => startMs(left.date, left.time) - startMs(right.date, right.time));
}

/** Pairs of saved items whose times overlap — surfaced as a warning in My Schedule. */
export function conflicts(items: ScheduleItem[]): [ScheduleItem, ScheduleItem][] {
  const found: [ScheduleItem, ScheduleItem][] = [];
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const a = items[i];
      const b = items[j];
      if (a.date !== b.date) continue;
      if (startMs(b.date, b.time) < endMs(a.date, a.time) && startMs(a.date, a.time) < endMs(b.date, b.time)) {
        found.push([a, b]);
      }
    }
  }
  return found;
}

const icsTime = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export function buildIcs(items: ScheduleItem[], calendarName: string) {
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//KSNVE//Conference App//KO', 'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${calendarName}`,
  ];
  items.forEach((item) => {
    const escape = (value: string) => value.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
    lines.push(
      'BEGIN:VEVENT',
      `UID:${item.key.replace(':', '-')}@ksnve`,
      `DTSTAMP:${icsTime(Date.now())}`,
      `DTSTART:${icsTime(startMs(item.date, item.time))}`,
      `DTEND:${icsTime(endMs(item.date, item.time))}`,
      `SUMMARY:${escape(item.title)}`,
      `LOCATION:${escape(item.venue)}`,
      item.paper ? `DESCRIPTION:${escape(`${item.paper.presenter} · ${item.paper.session}`)}` : 'DESCRIPTION:',
      'END:VEVENT',
    );
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
