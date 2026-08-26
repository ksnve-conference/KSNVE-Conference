import Link from 'next/link';
import PaperCard from '@/components/PaperCard';
import Icon from '@/components/Icon';
import { formatSessionTitle, type Paper, type Session } from '@/lib/conference';

type Props = {
  session: Session;
  sessionPapers: Paper[];
  favorites: string[];
  onToggle: (id: string) => void;
  saved?: boolean;
  onToggleSession?: (id: string) => void;
};

export default function TimelineSession({ session, sessionPapers, favorites, onToggle, saved = false, onToggleSession }: Props) {
  const [start, end] = session.time.split('~');
  return (
    <article className="agenda-session">
      <div className="agenda-time"><b>{start}</b><span>{end}</span></div>
      <div className="agenda-card">
        {onToggleSession && (
          <button
            className={`star session-star ${saved ? 'on' : ''}`}
            onClick={() => onToggleSession(session.id)}
            aria-pressed={saved}
            aria-label={saved ? `${session.title} 세션을 내 일정에서 제거` : `${session.title} 세션을 내 일정에 저장`}
          >
            <Icon name={saved ? 'star-filled' : 'star'} size={17} />
          </button>
        )}
        <span className="category-label">{formatSessionTitle(session.category)}</span>
        <h3><Link href={`/sessions/${session.id}`}>{formatSessionTitle(session.title)}</Link></h3>
        <p><Icon name="pin" size={13} /> {session.venue}{session.chair && session.chair !== '-' ? ` · 좌장 ${session.chair}` : ''}</p>
        {sessionPapers.length > 0 && (
          <details>
            <summary>발표 {sessionPapers.length}건 보기 <Icon name="chevron-down" size={14} /></summary>
            <div className="nested-papers">
              {sessionPapers.map((paper) => (
                <PaperCard key={paper.id} paper={paper} saved={favorites.includes(paper.id)} onToggle={onToggle} />
              ))}
            </div>
          </details>
        )}
      </div>
    </article>
  );
}
