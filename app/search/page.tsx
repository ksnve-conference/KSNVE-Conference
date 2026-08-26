'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import AppTabs from '@/components/AppTabs';
import SearchBar from '@/components/SearchBar';
import PaperCard from '@/components/PaperCard';
import Icon from '@/components/Icon';
import { dayLabel, formatSessionTitle, papers, sessions, speakers } from '@/lib/conference';
import { useSaved } from '@/lib/saved';

const RECENT_KEY = 'ksnveRecentSearches';

function readRecent(): string[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch { return []; }
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageInner />
    </Suspense>
  );
}

function SearchPageInner() {
  const searchParams = useSearchParams();
  const { savedPapers, togglePaper } = useSaved();
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => { setRecent(readRecent()); }, []);

  const q = query.trim().toLocaleLowerCase('ko');

  useEffect(() => {
    if (q.length < 2) return;
    const timer = window.setTimeout(() => {
      setRecent((current) => {
        const next = [query.trim(), ...current.filter((i) => i.toLocaleLowerCase('ko') !== q)].slice(0, 5);
        try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* quota */ }
        return next;
      });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [q, query]);

  const matchedPapers = useMemo(() => q ? papers.filter((p) =>
    [p.title, p.authors, p.presenter, p.session, p.venue, ...(p.keywords ?? [])]
      .join(' ').toLocaleLowerCase('ko').includes(q)) : [], [q]);
  const matchedSessions = useMemo(() => q ? sessions.filter((s) =>
    [s.title, s.chair, s.category, s.venue].join(' ').toLocaleLowerCase('ko').includes(q)) : [], [q]);
  const matchedSpeakers = useMemo(() => q ? speakers.filter((s) =>
    s.name.toLocaleLowerCase('ko').includes(q)) : [], [q]);
  const total = matchedPapers.length + matchedSessions.length + matchedSpeakers.length;

  const removeRecent = (v: string) => setRecent((c) => {
    const next = c.filter((i) => i !== v);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* quota */ }
    return next;
  });
  const clearRecent = () => { try { localStorage.setItem(RECENT_KEY, '[]'); } catch { /* quota */ } setRecent([]); };

  return (
    <main className="shell app-shell search-screen">
      <AppHeader compact showSearch={false} />
      <section>
        <div className="screen-title"><h1>통합 검색</h1></div>
        <SearchBar value={query} onChange={setQuery} placeholder="논문, 저자, 발표자, 세션, 장소 검색" autoFocus />
        <p className="search-hint">{q ? `‘${query.trim()}’ 검색 결과 ${total}건` : '관심 있는 키워드나 발표자 이름을 검색하세요.'}</p>

        {!q && (
          <section className="recent-search-panel">
            <div className="recent-search-heading">
              <h2>최근 검색</h2>
              {recent.length > 0 && <button type="button" onClick={clearRecent}>모두 지우기</button>}
            </div>
            {recent.length > 0 ? (
              <div className="recent-search-list">
                {recent.map((item) => (
                  <div className="recent-search-item" key={item}>
                    <button type="button" className="recent-search-text" onClick={() => setQuery(item)}>
                      <Icon name="search" size={14} />{item}
                    </button>
                    <button type="button" className="recent-search-remove" aria-label={`${item} 검색 기록 삭제`} onClick={() => removeRecent(item)}>
                      <Icon name="close" size={13} />
                    </button>
                  </div>
                ))}
              </div>
            ) : <p className="recent-search-empty">최근 검색 기록이 없습니다.</p>}
          </section>
        )}

        {q && (
          <>
            {matchedSpeakers.length > 0 && (
              <div className="search-group">
                <h2>발표자 <span>{matchedSpeakers.length}</span></h2>
                {matchedSpeakers.slice(0, 20).map((sp) => (
                  <Link className="result-row" href={`/speakers/${sp.id}`} key={sp.id}>
                    <span className="mini-avatar">{sp.name.slice(0, 1)}</span>
                    <div><b>{sp.name}</b><small>발표 {sp.papers.length}건</small></div>
                    <em><Icon name="chevron" size={16} /></em>
                  </Link>
                ))}
              </div>
            )}
            {matchedSessions.length > 0 && (
              <div className="search-group">
                <h2>세션 <span>{matchedSessions.length}</span></h2>
                {matchedSessions.slice(0, 20).map((s) => (
                  <Link className="result-row" href={`/sessions/${s.id}`} key={s.id}>
                    <span className="result-icon"><Icon name="calendar" size={16} /></span>
                    <div><b>{formatSessionTitle(s.title)}</b><small>{dayLabel(s.date)} · {s.time} · {s.venue}</small></div>
                    <em><Icon name="chevron" size={16} /></em>
                  </Link>
                ))}
              </div>
            )}
            {matchedPapers.length > 0 && (
              <div className="search-group">
                <h2>논문 <span>{matchedPapers.length}</span></h2>
                <div className="list paper-list">
                  {matchedPapers.slice(0, 40).map((p) => (
                    <PaperCard key={p.id} paper={p} saved={savedPapers.includes(p.id)} onToggle={togglePaper} />
                  ))}
                </div>
                {matchedPapers.length > 40 && <p className="list-more">상위 40건을 표시했습니다.</p>}
              </div>
            )}
            {total === 0 && (
              <div className="empty"><span><Icon name="search" size={26} /></span><b>검색 결과가 없습니다</b><p>다른 제목, 발표자 또는 장소를 검색해 보세요.</p></div>
            )}
          </>
        )}
      </section>
      <AppTabs />
    </main>
  );
}
