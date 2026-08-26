import Link from 'next/link';
import { notFound } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import AppTabs from '@/components/AppTabs';
import BackLink from '@/components/BackLink';
import PaperCard from '@/components/PaperCard';
import { dayLabel, formatSessionTitle, papers, sessions, venues } from '@/lib/conference';

export function generateStaticParams() {
  return sessions.map((session) => ({ id: session.id }));
}

export default async function SessionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = sessions.find((item) => item.id === id);
  if (!session) notFound();

  const sessionPapers = papers.filter((paper) => paper.sessionId === id);
  const venue = venues.find((item) => item.name === session.venue);

  return (
    <main className="shell detail-shell">
      <AppHeader compact />
      <BackLink fallback="/" label="뒤로" />

      <section className="detail-card">
        <div className="badges">
          <span className="badge">{dayLabel(session.date)}</span>
          <span className="badge">{session.time}</span>
          {venue ? (
            <Link className="badge" href={`/venues/${venue.id}`}>⌖ {session.venue}</Link>
          ) : (
            <span className="badge">{session.venue}</span>
          )}
        </div>
        <p className="kicker">SESSION · {session.id.toUpperCase()}</p>
        <h1>{formatSessionTitle(session.title)}</h1>
        <p className="meta large">좌장 {session.chair} · 발표 {sessionPapers.length}건</p>
      </section>

      <h2 className="section-title">세션 발표</h2>
      <div className="list">{sessionPapers.map((paper) => <PaperCard key={paper.id} paper={paper} />)}</div>
      <AppTabs />
    </main>
  );
}
