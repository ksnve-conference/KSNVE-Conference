import Link from 'next/link';
import Icon from '@/components/Icon';
import PaperCard from '@/components/PaperCard';
import { dayLabel, formatSessionTitle, type Paper, type Session } from '@/lib/conference';

const isTalkSession = (session: Session) => /키노트|초청/.test(session.category);

type Props = {
  session: Session;
  sessionPapers: Paper[];
  showDate?: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
  savedPapers: string[];
  onTogglePaper: (id: string) => void;
};

export default function SessionCard({
  session, sessionPapers, showDate = false, isOpen, onToggleOpen, savedPapers, onTogglePaper,
}: Props) {
  const [start, end] = session.time.split('~');
  const title = formatSessionTitle(session.title);
  const metaText = isTalkSession(session) && sessionPapers.length > 0
    ? `발표자 ${sessionPapers.map((p) => p.presenter).filter(Boolean).join(', ')}`
    : session.chair && session.chair !== '-' ? `좌장 ${session.chair}` : '';

  return (
    <article className="card session-card">
      <div className="session-card-main">
        <div className="session-time">
          {showDate && <small>{dayLabel(session.date)}</small>}
          <b>{start}</b><span>{end}</span>
        </div>
        <div className="session-body">
          <h3 className="paper-title"><Link href={`/sessions/${session.id}`}>{title}</Link></h3>
          <p className="session-place"><Icon name="pin" size={13} /> {session.venue}</p>
          {metaText && <p className="meta">{metaText}</p>}
        </div>
        {sessionPapers.length > 0 && (
          <button
            type="button"
            className="time-slot-toggle"
            onClick={onToggleOpen}
            aria-expanded={isOpen}
            aria-label={`${title} 발표 목록 ${isOpen ? '접기' : '펼치기'}`}
          >
            <em>{sessionPapers.length}</em>
            <Icon name="chevron-down" size={16} className={isOpen ? 'rot' : ''} />
          </button>
        )}
      </div>
      {isOpen && sessionPapers.length > 0 && (
        <div className="time-slot-papers">
          {sessionPapers.map((paper) => (
            <PaperCard key={paper.id} paper={paper} saved={savedPapers.includes(paper.id)} onToggle={onTogglePaper} />
          ))}
        </div>
      )}
    </article>
  );
}
