import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import AppTabs from '@/components/AppTabs';
import BackLink from '@/components/BackLink';
import FloorPlanViewer from '@/components/FloorPlanViewer';
import Icon from '@/components/Icon';
import { venues, type Venue } from '@/lib/conference';

// Cropped from the programme book's 행사장 배치도 (PDF p21, rendered at 300dpi).
const floors = [
  {
    id: 'floor-b1',
    title: 'B1층 · 세미나실',
    src: '/images/Venue_layout_B1.webp',
    width: 1322,
    height: 1081,
    rooms: ['세미나실[1]', 'LIG D&A홀', '세미나실[3]', '세미나실[4]', '세미나실[5]', '세미나실[6]', '세미나실[7]', '세미나실[8]', '세미나실[10]'],
  },
  {
    // linked from the sponsors page (전시부스) as #floor-1f
    id: 'floor-1f',
    title: '1층 · 컨퍼런스홀',
    src: '/images/Venue_layout_1F.webp',
    width: 1672,
    height: 1571,
    rooms: ['컨퍼런스홀'],
  },
] as const;

/** Event spaces with no floor plan in the programme book. */
const otherRooms = ['엑스포홀', '엑스포홀 로비', '2층 연회장', '3층 연회장', '여수 디오션CC'];

function roomVenues(names: readonly string[]) {
  return names.map((name) => venues.find((venue) => venue.name === name)).filter((venue): venue is Venue => Boolean(venue));
}

export default function VenueLayoutPage() {
  return (
    <main className="shell detail-shell venue-guide-page">
      <AppHeader compact />
      <BackLink fallback="/more" label="더보기" />
      <div className="venue-guide-heading">
        <h1>행사장 배치도</h1>
        <p>층별 배치도를 확대해서 확인하고 발표장을 선택하세요. 논문 발표는 B1층 세미나실, 포스터와 전시는 1층 컨퍼런스홀에서 진행됩니다.</p>
      </div>

      <p className="section-note">
        <Icon name="info" size={13} /> 현지 사정에 의해 전시부스 위치 등이 변동될 수 있습니다.
      </p>

      <div className="venue-floor-list">
        {floors.map((floor) => (
          <section className="venue-floor-section" id={floor.id} key={floor.id}>
            <h2>{floor.title}</h2>
            <FloorPlanViewer floor={floor.title} src={floor.src} width={floor.width} height={floor.height} />
            <nav className="floor-room-list" aria-label={`${floor.title} 발표장`}>
              {roomVenues(floor.rooms).map((venue) => (
                <Link href={`/venues/${venue.id}`} key={venue.id}>
                  <span><Icon name="pin" size={14} /> {venue.name}</span>
                  <Icon name="chevron" size={16} />
                </Link>
              ))}
            </nav>
          </section>
        ))}
        <section className="venue-floor-section">
          <h2>그 외 행사 장소</h2>
          <nav className="floor-room-list" aria-label="그 외 행사 장소">
            {roomVenues(otherRooms).map((venue) => (
              <Link href={`/venues/${venue.id}`} key={venue.id}>
                <span><Icon name="pin" size={14} /> {venue.name}<small> · {venue.floor}</small></span>
                <Icon name="chevron" size={16} />
              </Link>
            ))}
          </nav>
        </section>
      </div>
      <AppTabs />
    </main>
  );
}
