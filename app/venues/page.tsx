import AppHeader from '@/components/AppHeader';
import AppTabs from '@/components/AppTabs';
import BackLink from '@/components/BackLink';
import VenueCard from '@/components/VenueCard';
import { sessions, venues } from '@/lib/conference';

export const metadata = { title: '발표장 안내' };

export default function VenuesPage() {
  return (
    <main className="shell detail-shell">
      <AppHeader compact />
      <BackLink fallback="/more" label="더보기" />
      <div className="section-heading">
        <h1>발표장 안내</h1>
        <strong>{venues.length}</strong>
      </div>
      <div className="list">
        {venues.map((v) => (
          <VenueCard key={v.id} venue={v} sessionCount={sessions.filter((s) => s.venue === v.name).length} />
        ))}
      </div>
      <AppTabs />
    </main>
  );
}
