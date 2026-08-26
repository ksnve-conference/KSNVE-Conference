import Link from 'next/link';
import Icon from '@/components/Icon';
import type { Venue } from '@/lib/conference';

export default function VenueCard({ venue, sessionCount }: { venue: Venue; sessionCount: number }) {
  return (
    <Link className="card venue-card" href={`/venues/${venue.id}`}>
      <span className="venue-icon"><Icon name="pin" size={20} /></span>
      <div>
        <h3 className="paper-title">{venue.name}</h3>
        <p className="meta">{venue.floor ? `${venue.floor} · ` : ''}세션 {sessionCount}개</p>
      </div>
      <span className="chevron"><Icon name="chevron" size={18} /></span>
    </Link>
  );
}
