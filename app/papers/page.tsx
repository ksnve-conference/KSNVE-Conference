'use client';

import { Suspense, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import AppTabs from '@/components/AppTabs';
import SearchBar from '@/components/SearchBar';
import PaperCard from '@/components/PaperCard';
import Icon from '@/components/Icon';
import { dayLabel, formatSessionTitle, papers, sessions, speakers } from '@/lib/conference';
import { conferenceConfig } from '@/lib/conference-config';
import { presentationTypeFor, type PresentationType } from '@/lib/presentation-type';
import { useRecentSearches } from '@/lib/recent-searches';
import { useSaved } from '@/lib/saved';

type Filter = 'all' | PresentationType | 'saved';
const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'ORAL', label: '구두' },
  { id: 'POSTER', label: '포스터' },
  { id: 'KEYNOTE', label: '키노트' },
  { id: 'INVITED', label: '초청' },
  { id: 'saved', label: '저장됨' },
];

const sessionById = new Map(sessions.map((s) => [s.id, s]));

const topics = Array.from(new Set(sessions.map((s) => s.category)))
  .sort((a, b) => a.localeCompare(b, 'ko'));

export default function PapersPage() {
  return (
    <Suspense fallback={null}>
      <PapersPageInner />
    </Suspense>
  );
}

function PapersPageInner() {
  const searchParams = useSearchParams();
  const { savedPapers, togglePaper } = useSaved();
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const [topic, setTopic] = useState<string>('all');
  const [filter, setFilter] = useState<Filter>('all');
  const [day, setDay] = useState<string>('all');
  const [open, setOpen] = useState<string[]>([]);
  const filterSheetRef = useRef<HTMLDialogElement>(null);

  const q = query.trim().toLocaleLowerCase('ko');
  const searching = q.length > 0;
  const { recent, clear: clearRecent } = useRecentSearches(query);

  const activeFilterCount = (topic !== 'all' ? 1 : 0) + (filter !== 'all' ? 1 : 0) + (day !== 'all' ? 1 : 0);
  const openFilters = () => filterSheetRef.current?.showModal();
  const closeFilters = () => filterSheetRef.current?.close();
  const resetFilters = () => { setTopic('all'); setFilter('all'); setDay('all'); };

  const filtered = useMemo(() => papers.filter((paper) => {
    if (topic !== 'all' && sessionById.get(paper.sessionId)?.category !== topic) return false;
    if (day !== 'all' && paper.date !== day) return false;
    if (filter === 'saved' && !savedPapers.includes(paper.id)) return false;
    if (filter !== 'all' && filter !== 'saved' && presentationTypeFor(paper, sessionById.get(paper.sessionId)) !== filter) return false;
    if (!q) return true;
    return [paper.title, paper.authors, paper.presenter, paper.session, paper.venue, ...(paper.keywords ?? [])]
      .join(' ').toLocaleLowerCase('ko').includes(q);
  }), [q, topic, filter, day, savedPapers]);

  // Only matched while actively searching — jump-to results for sessions and
  // speakers, alongside the paper list the day/type/topic filters already narrow.
  const matchedSessions = useMemo(() => searching ? sessions.filter((s) =>
    [s.title, s.chair, s.category, s.venue].join(' ').toLocaleLowerCase('ko').includes(q)) : [], [searching, q]);
  const matchedSpeakers = useMemo(() => searching ? speakers.filter((s) =>
    s.name.toLocaleLowerCase('ko').includes(q)) : [], [searching, q]);
  const searchTotal = filtered.length + matchedSessions.length + matchedSpeakers.length;

  // Grouping keeps the DOM small: only the sessions a reader opens are rendered.
  const groups = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    filtered.forEach((paper) => {
      const list = map.get(paper.sessionId) || [];
      list.push(paper);
      map.set(paper.sessionId, list);
    });
    return [...map.entries()]
      .map(([id, list]) => ({ id, session: sessionById.get(id), list }))
      .sort((a, b) => {
        const A = a.session, B = b.session;
        if (!A || !B) return 0;
        return A.date.localeCompare(B.date) || A.time.localeCompare(B.time);
      });
  }, [filtered]);

  const toggleOpen = (id: string) => setOpen((c) => c.includes(id) ? c.filter((x) => x !== id) : [...c, id]);

  return (
    <main className="shell app-shell">
      <AppHeader compact showSearch={false} />
      <section>
        <div className="screen-title"><h1>발표 논문</h1><strong>{searching ? searchTotal : filtered.length}</strong></div>

        <div className="search-cluster">
          <SearchBar value={query} onChange={setQuery} placeholder="제목, 저자, 발표자, 세션, 장소 검색" />
          {recent.length > 0 && (
            <div className="recent-chips" role="group" aria-label="최근 검색">
              {recent.map((item) => (
                <button key={item} type="button" onClick={() => setQuery(item)}>
                  <Icon name="search" size={12} />{item}
                </button>
              ))}
              <button type="button" className="recent-chips-clear" onClick={clearRecent} aria-label="최근 검색 모두 지우기">
                <Icon name="close" size={12} />
              </button>
            </div>
          )}
        </div>

        <button type="button" className="filter-trigger" onClick={openFilters}>
          <Icon name="filter" size={16} />
          분야 · 유형 · 날짜
          {activeFilterCount > 0 && <em>{activeFilterCount}</em>}
        </button>

        <dialog ref={filterSheetRef} className="filter-sheet" aria-label="필터">
          <div className="filter-sheet-header">
            <h2>필터</h2>
            <button type="button" onClick={closeFilters} aria-label="닫기"><Icon name="close" size={18} /></button>
          </div>
          <div className="filter-sheet-body">
            <section>
              <h3>분야</h3>
              <div className="filter-chips filter-topics" role="group" aria-label="분야">
                <button className={topic === 'all' ? 'active' : ''} onClick={() => setTopic('all')} aria-pressed={topic === 'all'}>전체 분야</button>
                {topics.map((t) => (
                  <button key={t} className={topic === t ? 'active' : ''} onClick={() => setTopic(t)} aria-pressed={topic === t}>{formatSessionTitle(t)}</button>
                ))}
              </div>
            </section>
            <section>
              <h3>발표 유형</h3>
              <div className="filter-chips" role="group" aria-label="발표 유형">
                {filters.map((f) => (
                  <button key={f.id} className={filter === f.id ? 'active' : ''} onClick={() => setFilter(f.id)} aria-pressed={filter === f.id}>{f.label}</button>
                ))}
              </div>
            </section>
            <section>
              <h3>날짜</h3>
              <div className="filter-chips filter-days" role="group" aria-label="날짜">
                <button className={day === 'all' ? 'active' : ''} onClick={() => setDay('all')} aria-pressed={day === 'all'}>전체 날짜</button>
                {conferenceConfig.dates.map((d) => (
                  <button key={d} className={day === d ? 'active' : ''} onClick={() => setDay(d)} aria-pressed={day === d}>{dayLabel(d)}</button>
                ))}
              </div>
            </section>
          </div>
          <div className="filter-sheet-footer">
            <button type="button" className="filter-sheet-reset" onClick={resetFilters} disabled={activeFilterCount === 0}>초기화</button>
            <button type="button" className="filter-sheet-apply" onClick={closeFilters}>결과 {searching ? searchTotal : filtered.length}건 보기</button>
          </div>
        </dialog>

        {searching ? (
          <>
            {searchTotal === 0 && (
              <div className="empty"><span><Icon name="search" size={26} /></span><b>결과가 없습니다</b><p>검색어나 필터를 바꿔 보세요.</p></div>
            )}
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
            {filtered.length > 0 && (
              <div className="search-group">
                <h2>논문 <span>{filtered.length}</span></h2>
                <div className="list paper-list">
                  {filtered.slice(0, 60).map((paper) => (
                    <PaperCard key={paper.id} paper={paper} saved={savedPapers.includes(paper.id)} onToggle={togglePaper} />
                  ))}
                </div>
                {filtered.length > 60 && <p className="list-more">상위 60건을 표시했습니다. 검색어를 좁혀 보세요.</p>}
              </div>
            )}
          </>
        ) : (
          <>
            {filtered.length === 0 && (
              <div className="empty"><span><Icon name="search" size={26} /></span><b>결과가 없습니다</b><p>필터를 바꿔 보세요.</p></div>
            )}
            <div className="paper-groups">
              {groups.map(({ id, session, list }) => {
                const isOpen = open.includes(id);
                return (
                  <section className="paper-group" key={id}>
                    <button className="paper-group-head" onClick={() => toggleOpen(id)} aria-expanded={isOpen}>
                      <div>
                        <b>{formatSessionTitle(session?.title || list[0].session)}</b>
                        <small>{session ? `${dayLabel(session.date)} · ${session.time} · ${session.venue}` : ''}</small>
                      </div>
                      <em>{list.length}</em>
                      <span className={isOpen ? 'rot' : ''}><Icon name="chevron-down" size={16} /></span>
                    </button>
                    {isOpen && (
                      <div className="list paper-list">
                        {list.map((paper) => (
                          <PaperCard key={paper.id} paper={paper} saved={savedPapers.includes(paper.id)} onToggle={togglePaper} />
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </>
        )}
      </section>
      <AppTabs />
    </main>
  );
}
