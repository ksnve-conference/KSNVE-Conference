import Link from 'next/link';
import Icon from '@/components/Icon';
import { dayLabel, formatSessionTitle, type Session } from '@/lib/conference';

export default function SessionCard({ session, paperCount, showDate = false }: { session: Session; paperCount: number; showDate?: boolean }) {
  const [start, end] = session.time.split('~');
  const title = formatSessionTitle(session.title);
  return (
    <article className="card session-card">
      <div className="session-time">
        {showDate && <small>{dayLabel(session.date)}</small>}
        <b>{start}</b><span>{end}</span>
      </div>
      <div className="session-body">
        <div className="badges"><span className="badge live-badge">{formatSessionTitle(session.category)}</span></div>
        <h3 className="paper-title"><Link href={`/sessions/${session.id}`}>{title}</Link></h3>
        <p className="session-place"><Icon name="pin" size={13} /> {session.venue}</p>
        {paperCount > 0 && <p className="meta">좌장 {session.chair} · 발표 {paperCount}건</p>}
      </div>
      <Link className="chevron" href={`/sessions/${session.id}`} aria-label={`${title} 세션 보기`}><Icon name="chevron" size={18} /></Link>
    </article>
  );
}
