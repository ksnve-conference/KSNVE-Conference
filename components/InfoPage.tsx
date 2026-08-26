import AppHeader from '@/components/AppHeader';
import AppTabs from '@/components/AppTabs';
import BackLink from '@/components/BackLink';

export default function InfoPage({
  kicker, title, intro, children,
}: { kicker: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <main className="shell detail-shell info-page">
      <AppHeader compact />
      <BackLink fallback="/more" label="더보기" />
      <div className="section-heading"><div><span className="kicker">{kicker}</span><h1>{title}</h1></div></div>
      {intro && <p className="info-intro">{intro}</p>}
      {children}
      <AppTabs />
    </main>
  );
}
