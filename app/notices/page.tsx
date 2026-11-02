'use client';

import AppHeader from '@/components/AppHeader';
import AppTabs from '@/components/AppTabs';
import BackLink from '@/components/BackLink';
import Icon from '@/components/Icon';
import { useAnnouncements } from '@/lib/announcements';
import { linkify } from '@/lib/linkify';

export default function NoticesPage() {
  const { items, read, unread, markRead, source } = useAnnouncements();

  return (
    <main className="shell detail-shell">
      <AppHeader compact />
      <BackLink fallback="/more" label="더보기" />
      <div className="section-heading">
        <h1>공지사항</h1>
        <strong>{unread > 0 ? `새 소식 ${unread}건` : `${items.length}건`}</strong>
      </div>

      {source === 'cache' && (
        <p className="section-note"><Icon name="info" size={13} /> 저장된 공지를 표시하고 있습니다. 연결되면 최신 내용으로 갱신됩니다.</p>
      )}

      <div className="list">
        {items.map((item) => (
          // An article rather than a button so links inside the body are valid and tappable.
          <article
            className={`card notice announcement-card ${read.includes(item.id) ? 'read' : ''}`}
            key={item.id}
            onClick={() => markRead(item.id)}
          >
            <div><span className="badge">{item.category}</span>{!read.includes(item.id) && <em>NEW</em>}</div>
            <h2>{item.title}</h2>
            <p>{linkify(item.body)}</p>
            {item.image && <img className="notice-image" src={item.image} alt={item.title} loading="lazy" />}
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
