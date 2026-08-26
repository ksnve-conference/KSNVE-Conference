import Link from 'next/link';
import Icon from '@/components/Icon';
import { dayLabel, formatSessionTitle, type Paper } from '@/lib/conference';
import PresentationBadge from '@/components/PresentationBadge';

export default function PaperCard({ paper, saved = false, onToggle }: { paper: Paper; saved?: boolean; onToggle?: (id: string) => void }) {
  return (
    <article className="card paper-card">
      <PresentationBadge paper={paper} showId />
      {onToggle && (
        <button
          className={`star ${saved ? 'on' : ''}`}
          onClick={() => onToggle(paper.id)}
          aria-label={saved ? `${paper.title} 일정에서 제거` : `${paper.title} 일정에 저장`}
          aria-pressed={saved}
        >
          <Icon name={saved ? 'star-filled' : 'star'} size={17} />
        </button>
      )}
      <div className="paper-slot">
        <b>{dayLabel(paper.date)} · {paper.time}</b>
        <span><Icon name="pin" size={12} /> {paper.venue}</span>
      </div>
      <h3 className="paper-title"><Link href={`/papers/${paper.id}`}>{paper.title}</Link></h3>
      <p className="meta authors">{paper.authors}</p>
      <p className="meta session-link"><Link href={`/sessions/${paper.sessionId}`}>{formatSessionTitle(paper.session)}</Link></p>
    </article>
  );
}
