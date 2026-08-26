import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import AppTabs from '@/components/AppTabs';
import BackLink from '@/components/BackLink';
import FloorPlanViewer from '@/components/FloorPlanViewer';
import { venues, type Venue } from '@/lib/conference';

const floors = [
  {
    title: '1층',
    src: '/images/Venue_layout_1F.png',
    width: 1574,
    height: 1876,
    rooms: ['그랜드볼룸[1]', '그랜드볼룸[2]', '에메랄드홀', '오팔홀[1]', '오팔홀[2]'],
  },
  {
    title: 'B1층',
    src: '/images/Venue_layout_B1.png',
    width: 1564,
    height: 1922,
    rooms: ['릴리홀[1]', '릴리홀[2]', '사파이어홀[1]', '사파이어홀[2]'],
  },
] as const;

function roomVenues(names: readonly string[]) {
  return names.map((name) => venues.find((venue) => venue.name === name)).filter((venue): venue is Venue => Boolean(venue));
}

export default function VenueLayoutPage() {
  return (
    <main className="shell detail-shell venue-guide-page">
      <AppHeader compact />
      <BackLink fallback="/more" label="더보기" />
      <div className="venue-guide-heading">
        <span className="kicker">VENUE GUIDE</span>
        <h1>행사장 배치도</h1>
        <p>층별 배치도를 확대해서 확인하고 발표장을 선택하세요.</p>
      </div>

      <div className="venue-floor-list">
        {floors.map((floor) => (
          <section className="venue-floor-section" key={floor.title}>
            <h2>{floor.title}</h2>
            <FloorPlanViewer floor={floor.title} src={floor.src} width={floor.width} height={floor.height} />
            <nav className="floor-room-list" aria-label={`${floor.title} 발표장`}>
              {roomVenues(floor.rooms).map((venue) => (
                <Link href={`/venues/${venue.id}`} key={venue.id}>
                  <span>📍 {venue.name}</span>
                  <b aria-hidden="true">›</b>
                </Link>
              ))}
            </nav>
          </section>
        ))}
      </div>
      <AppTabs />
    </main>
  );
}
