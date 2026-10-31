'use client';

import { useCallback, useEffect, useState } from 'react';
import { announcements as bundled, type Announcement } from '@/lib/conference';

const READ_KEY = 'ksnveReadAnnouncements';
const CACHE_KEY = 'ksnveAnnouncementsCache';
const SHEET_URL = process.env.NEXT_PUBLIC_ANNOUNCEMENTS_SHEET_URL;

export type AnnouncementSource = 'sheet' | 'cache' | 'bundled';

/** Minimal RFC-4180 CSV parser — handles quoted fields, embedded commas and newlines. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 1; } else { quoted = false; }
      } else field += c;
      continue;
    }
    if (c === '"') { quoted = true; continue; }
    if (c === ',') { row.push(field); field = ''; continue; }
    if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field); field = '';
      if (row.some((v) => v.trim() !== '')) rows.push(row);
      row = [];
      continue;
    }
    field += c;
  }
  row.push(field);
  if (row.some((v) => v.trim() !== '')) rows.push(row);
  return rows;
}

const HIDDEN_VALUES = new Set(['false', '0', 'n', 'no', 'off', '아니오', '비공개']);

/** Sheet columns are matched by header name so the organiser can reorder them freely. */
export function rowsToAnnouncements(rows: string[][]): Announcement[] {
  if (rows.length < 2) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (...names: string[]) => {
    for (const name of names) {
      const i = header.indexOf(name);
      if (i >= 0) return i;
    }
    return -1;
  };
  const iId = col('id', '번호');
  const iTitle = col('title', '제목');
  const iBody = col('body', 'content', '내용');
  const iDate = col('date', '날짜');
  const iCat = col('category', '분류', '구분', 'tag', '태그');
  const iVisible = col('visible', '공개', '노출');
  const out: Announcement[] = [];
  rows.slice(1).forEach((r, n) => {
    const title = (iTitle >= 0 ? r[iTitle] : '')?.trim();
    if (!title) return;
    if (iVisible >= 0 && HIDDEN_VALUES.has((r[iVisible] || '').trim().toLowerCase())) return;
    out.push({
      id: (iId >= 0 ? r[iId] : '')?.trim() || `sheet-${n + 1}`,
      title,
      body: (iBody >= 0 ? r[iBody] : '')?.trim() || '',
      date: (iDate >= 0 ? r[iDate] : '')?.trim() || '',
      category: (iCat >= 0 ? r[iCat] : '')?.trim() || '공지',
    });
  });
  return sortByDateDesc(out);
}

/** Accepts both `2026-11-25` and `2026.11.25` (the two formats organisers tend to use).
 * Undated announcements sort after every dated one instead of breaking the order. */
function dateSortKey(date: string): number {
  const match = date.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (!match) return -Infinity;
  const [, y, m, d] = match;
  return Number(y) * 10000 + Number(m) * 100 + Number(d);
}

function sortByDateDesc(items: Announcement[]): Announcement[] {
  return [...items].sort((a, b) => dateSortKey(b.date) - dateSortKey(a.date));
}

function readRead(): string[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(READ_KEY) || '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch { return []; }
}

export function useAnnouncements() {
  const [items, setItems] = useState<Announcement[]>(() => sortByDateDesc(bundled));
  const [source, setSource] = useState<AnnouncementSource>('bundled');
  const [read, setRead] = useState<string[]>([]);
  const [readReady, setReadReady] = useState(false);

  useEffect(() => {
    setRead(readRead());
    setReadReady(true);
    // A disabled or changed sheet must not revive notices from the old source.
    if (!SHEET_URL) return;
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: unknown = JSON.parse(cached);
        if (parsed && typeof parsed === 'object' && 'url' in parsed && parsed.url === SHEET_URL && 'items' in parsed && Array.isArray(parsed.items) && parsed.items.every((item) => item && ['id', 'title', 'body', 'date', 'category'].every((key) => typeof item[key] === 'string'))) {
          setItems(sortByDateDesc(parsed.items));
          setSource('cache');
        }
      }
    } catch { /* ignore malformed cache */ }

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 8000);
    fetch(SHEET_URL, { signal: controller.signal, cache: 'no-store' })
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error(String(res.status)))))
      .then((text) => {
        const rows = parseCsv(text);
        // Accept a valid empty sheet (all notices removed), but not an HTML error page.
        if (!rows[0]?.some((cell) => ['title', '제목'].includes(cell.trim().toLowerCase()))) return;
        const next = rowsToAnnouncements(rows);
        setItems(next);
        setSource('sheet');
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ url: SHEET_URL, items: next })); } catch { /* quota */ }
      })
      .catch(() => { /* offline or sheet unreachable — cached/bundled notices stay */ })
      .finally(() => window.clearTimeout(timer));
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, []);

  const markRead = useCallback((id: string) => {
    setRead((current) => {
      if (current.includes(id)) return current;
      const next = [...current, id];
      try { localStorage.setItem(READ_KEY, JSON.stringify(next)); } catch { /* quota */ }
      return next;
    });
  }, []);

  // The server cannot know this browser's read history. Hide the badge until
  // that history is loaded instead of briefly treating every notice as unread.
  const unread = readReady ? items.filter((a) => !read.includes(a.id)).length : 0;
  return { items, source, read, unread, markRead };
}
