import Link from 'next/link';
import Icon from '@/components/Icon';
import { dayLabel, formatSessionTitle, type Paper } from '@/lib/conference';
import PresentationBadge from '@/components/PresentationBadge';

type PaperCardProps = {
  paper: Paper;
  saved?: boolean;
  onToggle?: (id: string) => void;
  searchResult?: boolean;
};

export default function PaperCard({ paper, saved = false, onToggle, searchResult = false }: PaperCardProps) {
  const sessionTitle = formatSessionTitle(paper.session);
  return (
    <article className={`card paper-card${searchResult ? ' paper-search-result' : ''}`}>
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
      <p className="meta session-link">
        {searchResult ? sessionTitle : <Link href={`/sessions/${paper.sessionId}`}>{sessionTitle}</Link>}
      </p>
    </article>
  );
}
