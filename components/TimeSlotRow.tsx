import Link from 'next/link';
import Icon from '@/components/Icon';
import PaperCard from '@/components/PaperCard';
import { formatSessionTitle, type Paper, type Session } from '@/lib/conference';

type Props = {
  session: Session;
  sessionPapers: Paper[];
  saved: boolean;
  onToggleSession: (id: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  savedPapers: string[];
  onTogglePaper: (id: string) => void;
};

/** Keynotes and invited talks have no chair and (structurally) never more than
 * one paper — naming the speaker is more useful there than a chair/count line. */
const isTalkSession = (session: Session) => /키노트|초청/.test(session.category);

/** One dense row per session, grouped under a shared time-slot heading — lets a reader
 * compare every hall running at 14:20 in one glance instead of scrolling past 8 tall cards. */
export default function TimeSlotRow({
  session, sessionPapers, saved, onToggleSession, isOpen, onToggleOpen, savedPapers, onTogglePaper,
}: Props) {
  const title = formatSessionTitle(session.title);
  const metaText = isTalkSession(session) && sessionPapers.length > 0
    ? `발표자 ${sessionPapers.map((p) => p.presenter).filter(Boolean).join(', ')}`
    : session.chair && session.chair !== '-' ? `좌장 ${session.chair}` : '';

  return (
    <div className={`time-slot-row${saved ? ' mine' : ''}`}>
      <div className="time-slot-row-main">
        <Link href={`/sessions/${session.id}`} className="time-slot-row-link">
          <span className="time-slot-hall">{session.venue}</span>
          <span className="time-slot-info">
            <b>{title}</b>
            {metaText && <small>{metaText}</small>}
          </span>
        </Link>
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
        <button
          type="button"
          className={`star ${saved ? 'on' : ''}`}
          onClick={() => onToggleSession(session.id)}
          aria-pressed={saved}
          aria-label={saved ? `${session.title} 세션을 내 일정에서 제거` : `${session.title} 세션을 내 일정에 저장`}
        >
          <Icon name={saved ? 'star-filled' : 'star'} size={16} />
        </button>
      </div>
      {isOpen && sessionPapers.length > 0 && (
        <div className="time-slot-papers">
          {sessionPapers.map((paper) => (
            <PaperCard key={paper.id} paper={paper} saved={savedPapers.includes(paper.id)} onToggle={onTogglePaper} />
          ))}
        </div>
      )}
    </div>
  );
}
