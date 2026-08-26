import AppHeader from '@/components/AppHeader';
import AppTabs from '@/components/AppTabs';
import BackLink from '@/components/BackLink';
import sponsors from '@/data/sponsors.json';

export const metadata = { title: '후원사' };

export default function SponsorsPage() {
  return (
    <main className="shell detail-shell">
      <AppHeader compact />
      <BackLink fallback="/more" label="더보기" />
      <div className="section-heading">
        <h1>후원 · 전시 참여사</h1>
        <strong>{sponsors.companies.length}</strong>
      </div>
      <p className="section-note">학술대회를 후원하고 전시회에 참여하는 기업과 기관입니다.</p>
      <div className="sponsor-grid">
        {sponsors.companies.map((name) => (
          <article className="sponsor" key={name}><strong>{name}</strong></article>
        ))}
      </div>
      <AppTabs />
    </main>
  );
}
