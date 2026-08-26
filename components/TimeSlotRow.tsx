import Link from 'next/link';
import Icon from '@/components/Icon';
import { sessionTitleWithoutTrack, type Session } from '@/lib/conference';

type Props = {
  session: Session;
  paperCount: number;
  saved: boolean;
  onToggleSession: (id: string) => void;
};

/** One dense row per session, grouped under a shared time-slot heading — lets a reader
 * compare every hall running at 14:20 in one glance instead of scrolling past 8 tall cards. */
export default function TimeSlotRow({ session, paperCount, saved, onToggleSession }: Props) {
  const title = sessionTitleWithoutTrack(session);
  return (
    <div className={`time-slot-row${saved ? ' mine' : ''}`}>
      <Link href={`/sessions/${session.id}`} className="time-slot-row-link">
        <span className="time-slot-hall">{session.venue}</span>
        <span className="time-slot-info">
          <b>{title}</b>
          <small>{session.chair && session.chair !== '-' ? `좌장 ${session.chair} · ` : ''}발표 {paperCount}건</small>
        </span>
      </Link>
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
  );
}
