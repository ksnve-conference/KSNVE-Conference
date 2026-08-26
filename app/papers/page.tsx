'use client';

import { useMemo, useState } from 'react';
import AppHeader from '@/components/AppHeader';
import AppTabs from '@/components/AppTabs';
import SearchBar from '@/components/SearchBar';
import PaperCard from '@/components/PaperCard';
import Icon from '@/components/Icon';
import { dayLabel, formatSessionTitle, papers, sessions } from '@/lib/conference';
import { conferenceConfig } from '@/lib/conference-config';
import { presentationTypeFor, type PresentationType } from '@/lib/presentation-type';
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
  const { savedPapers, togglePaper } = useSaved();
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<string>('all');
  const [filter, setFilter] = useState<Filter>('all');
  const [day, setDay] = useState<string>('all');
  const [open, setOpen] = useState<string[]>([]);

  const q = query.trim().toLocaleLowerCase('ko');
  const filtered = useMemo(() => papers.filter((paper) => {
    if (topic !== 'all' && sessionById.get(paper.sessionId)?.category !== topic) return false;
    if (day !== 'all' && paper.date !== day) return false;
    if (filter === 'saved' && !savedPapers.includes(paper.id)) return false;
    if (filter !== 'all' && filter !== 'saved' && presentationTypeFor(paper, sessionById.get(paper.sessionId)) !== filter) return false;
    if (!q) return true;
    return [paper.title, paper.authors, paper.presenter, paper.session, paper.venue, ...(paper.keywords ?? [])]
      .join(' ').toLocaleLowerCase('ko').includes(q);
  }), [q, topic, filter, day, savedPapers]);

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

  const searching = q.length > 0;
  const toggleOpen = (id: string) => setOpen((c) => c.includes(id) ? c.filter((x) => x !== id) : [...c, id]);

  return (
    <main className="shell app-shell">
      <AppHeader compact />
      <section>
        <div className="screen-title"><h1>발표 논문</h1><strong>{filtered.length}</strong></div>
        <SearchBar value={query} onChange={setQuery} placeholder="제목, 저자, 발표자, 세션, 장소 검색" />

        <div className="filter-chips filter-topics" role="group" aria-label="분야">
          <button className={topic === 'all' ? 'active' : ''} onClick={() => setTopic('all')} aria-pressed={topic === 'all'}>전체 분야</button>
          {topics.map((t) => (
            <button key={t} className={topic === t ? 'active' : ''} onClick={() => setTopic(t)} aria-pressed={topic === t}>{formatSessionTitle(t)}</button>
          ))}
        </div>
        <div className="filter-chips" role="group" aria-label="발표 유형">
          {filters.map((f) => (
            <button key={f.id} className={filter === f.id ? 'active' : ''} onClick={() => setFilter(f.id)} aria-pressed={filter === f.id}>{f.label}</button>
          ))}
        </div>
        <div className="filter-chips filter-days" role="group" aria-label="날짜">
          <button className={day === 'all' ? 'active' : ''} onClick={() => setDay('all')} aria-pressed={day === 'all'}>전체 날짜</button>
          {conferenceConfig.dates.map((d) => (
            <button key={d} className={day === d ? 'active' : ''} onClick={() => setDay(d)} aria-pressed={day === d}>{dayLabel(d)}</button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="empty"><span><Icon name="search" size={26} /></span><b>결과가 없습니다</b><p>검색어나 필터를 바꿔 보세요.</p></div>
        )}

        {searching ? (
          <div className="list paper-list">
            {filtered.slice(0, 60).map((paper) => (
              <PaperCard key={paper.id} paper={paper} saved={savedPapers.includes(paper.id)} onToggle={togglePaper} />
            ))}
            {filtered.length > 60 && <p className="list-more">상위 60건을 표시했습니다. 검색어를 좁혀 보세요.</p>}
          </div>
        ) : (
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
        )}
      </section>
      <AppTabs />
    </main>
  );
}
