'use client';

import { useEffect, useState } from 'react';

const RECENT_KEY = 'ksnveRecentSearches';

function readRecent(): string[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function writeRecent(next: string[]) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* quota */ }
}

/** Recent search terms, kept in localStorage. Records a term after it has been
 * the active query for a moment (so a page-through of characters while typing
 * doesn't spam the list), and exposes remove/clear for the recent-search panel. */
export function useRecentSearches(activeQuery: string) {
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => { setRecent(readRecent()); }, []);

  useEffect(() => {
    const q = activeQuery.trim();
    if (q.length < 2) return;
    const timer = window.setTimeout(() => {
      setRecent((current) => {
        const qLower = q.toLocaleLowerCase('ko');
        const next = [q, ...current.filter((item) => item.toLocaleLowerCase('ko') !== qLower)].slice(0, 5);
        writeRecent(next);
        return next;
      });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [activeQuery]);

  const remove = (value: string) => setRecent((current) => {
    const next = current.filter((item) => item !== value);
    writeRecent(next);
    return next;
  });

  const clear = () => { writeRecent([]); setRecent([]); };

  return { recent, remove, clear };
}
