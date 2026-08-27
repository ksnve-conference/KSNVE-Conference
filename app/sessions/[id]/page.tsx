import Link from 'next/link';
import { notFound } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import AppTabs from '@/components/AppTabs';
import BackLink from '@/components/BackLink';
import PaperCard from '@/components/PaperCard';
import Icon from '@/components/Icon';
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
  const hasChair = Boolean(session.chair && session.chair !== '-');
  const isTalk = /키노트|초청/.test(session.category);
  const metaText = isTalk && sessionPapers.length > 0
    ? `발표자 ${sessionPapers.map((p) => p.presenter).filter(Boolean).join(', ')}`
    : [hasChair ? `좌장 ${session.chair}` : null, sessionPapers.length > 0 ? `발표 ${sessionPapers.length}건` : null]
      .filter(Boolean).join(' · ');

  return (
    <main className="shell detail-shell">
      <AppHeader compact />
      <BackLink fallback="/" label="뒤로" />

      <section className="detail-card">
        <div className="badges">
          <span className="badge">{dayLabel(session.date)}</span>
          <span className="badge">{session.time}</span>
          {venue ? (
            <Link className="badge" href={`/venues/${venue.id}`}><Icon name="pin" size={12} /> {session.venue}</Link>
          ) : (
            <span className="badge">{session.venue}</span>
          )}
        </div>
        <p className="kicker">{session.id.toUpperCase()}</p>
        <h1>{formatSessionTitle(session.title)}</h1>
        {metaText && <p className="meta large">{metaText}</p>}
      </section>

      {sessionPapers.length > 0 && (
        <>
          <h2 className="section-title">세션 발표</h2>
          <div className="list">{sessionPapers.map((paper) => <PaperCard key={paper.id} paper={paper} />)}</div>
        </>
      )}
      <AppTabs />
    </main>
  );
}
