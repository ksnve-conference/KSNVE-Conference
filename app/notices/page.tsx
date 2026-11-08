'use client';

import { useState } from 'react';
import AppHeader from '@/components/AppHeader';
import AppTabs from '@/components/AppTabs';
import BackLink from '@/components/BackLink';
import Icon from '@/components/Icon';
import { useAnnouncements } from '@/lib/announcements';
import { linkify } from '@/lib/linkify';

export default function NoticesPage() {
  const { items, read, readReady, unread, markRead, source, error } = useAnnouncements();
  // Unread notices open; ones already read on an earlier visit fold to their
  // title. Notices opened (or newly read) on this visit stay open until tapped.
  const [openNow, setOpenNow] = useState<string[]>([]);
  const isOpen = (id: string) => (readReady && !read.includes(id)) || openNow.includes(id);
  const toggle = (id: string) => {
    if (!read.includes(id)) {
      markRead(id);
      setOpenNow((c) => (c.includes(id) ? c : [...c, id]));
      return;
    }
    setOpenNow((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  };

  return (
    <main className="shell detail-shell">
      <AppHeader compact />
      <BackLink fallback="/more" label="더보기" />
      <div className="section-heading">
        <h1>공지사항</h1>
        <strong>{unread > 0 ? `새 소식 ${unread}건` : `${items.length}건`}</strong>
      </div>

      {error ? (
        <p className="section-note" role="status">최신 공지를 불러오지 못했습니다. 기존 내용을 표시하며 자동으로 다시 확인합니다.</p>
      ) : source === 'cache' && (
        <p className="section-note"><Icon name="info" size={13} /> 저장된 공지를 표시하고 있습니다. 연결되면 최신 내용으로 갱신됩니다.</p>
      )}

      <div className="list">
        {items.map((item) => (
          // An article rather than a button so links inside the body are valid and tappable.
          <article
            className={`card notice announcement-card ${read.includes(item.id) ? 'read' : ''} ${isOpen(item.id) ? 'open' : 'folded'}`}
            key={item.id}
            onClick={(event) => {
              if ((event.target as Element).closest('a')) return;  // a link in the body opens, the card stays put
              toggle(item.id);
            }}
          >
            <div className="notice-head">
              <span className="badge">{item.category}</span>
              <h2><button type="button" className="notice-title" aria-expanded={isOpen(item.id)}>{item.title}</button></h2>
              {readReady && !read.includes(item.id) && <em>NEW</em>}
              <Icon name="chevron-down" size={18} className="notice-chevron" />
            </div>
            {isOpen(item.id) && (
              <>
                <p>{linkify(item.body)}</p>
                {item.image && <img className="notice-image" src={item.image} alt={item.title} loading="lazy" />}
              </>
            )}
            {item.date && <time>{item.date.replaceAll('-', '.')}</time>}
          </article>
        ))}
        {items.length === 0 && (
          <div className="empty"><span><Icon name="notice" size={26} /></span><b>등록된 공지가 없습니다</b></div>
        )}
      </div>
      <AppTabs />
    </main>
  );
}
