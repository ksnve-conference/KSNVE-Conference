import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import AppTabs from '@/components/AppTabs';
import BackLink from '@/components/BackLink';
import Icon from '@/components/Icon';
import sponsors from '@/data/sponsors.json';

export const metadata = { title: '후원 · 전시 참여사' };

export default function SponsorsPage() {
  return (
    <main className="shell detail-shell">
      <AppHeader compact />
      <BackLink fallback="/more" label="더보기" />
      <div className="section-heading"><h1>후원 · 전시 참여사</h1></div>
      <p className="section-note">학술대회를 후원·협찬하고 전시회에 참여하는 기업과 기관입니다.</p>

      <h2 className="info-subhead">후원 · 협찬</h2>
      {sponsors.tiers.map((group) => (
        <section className="sponsor-tier" key={group.tier}>
          <h3>{group.tier}</h3>
          <div className="sponsor-grid">
            {group.companies.map((name) => (
              <article className="sponsor" key={name}><strong>{name}</strong></article>
            ))}
          </div>
        </section>
      ))}

      <h2 className="info-subhead">전시회 출품 업체 <em className="sponsor-count">{sponsors.exhibitors.length}</em></h2>
      <p className="section-note">
        전시부스는 1층 컨퍼런스홀과 로비에 있습니다. <Link className="text-link" href="/conference/venue-layout">행사장 배치도 <Icon name="chevron" size={13} /></Link>
      </p>
      <div className="exhibitor-list">
        {sponsors.exhibitors.map((company) => (
          <a className="exhibitor" key={company.name} href={company.url} target="_blank" rel="noreferrer">
            <span className="exhibitor-booth"><small>부스</small>{company.booth}</span>
            <strong>{company.name}</strong>
            <Icon name="external" size={15} />
          </a>
        ))}
      </div>
      <AppTabs />
    </main>
  );
}
