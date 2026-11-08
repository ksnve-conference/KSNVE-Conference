import Link from 'next/link';
import { notFound } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import AppTabs from '@/components/AppTabs';
import BackLink from '@/components/BackLink';
import Icon from '@/components/Icon';
import PresentationBadge from '@/components/PresentationBadge';
import VenueSessionList from '@/components/VenueSessionList';
import {
  dayLabel,
  formatSessionTitle,
  papers,
  sessions,
  venues,
  type Paper,
  type Session,
} from '@/lib/conference';

const isTalkSession = (session: Session) => /키노트|초청/.test(session.category);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const venue = venues.find((item) => item.id === id);
  return venue ? { title: venue.name } : {};
}

export function generateStaticParams() {
  return venues.map((venue) => ({ id: venue.id }));
}

function sortSessions(left: Session, right: Session) {
  return left.date.localeCompare(right.date) || left.time.localeCompare(right.time);
}

function sortPapers(left: Paper, right: Paper) {
  return left.time.localeCompare(right.time) || left.id.localeCompare(right.id);
}

export default async function VenueDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const venue = venues.find((item) => item.id === id);
  if (!venue) notFound();

  const venueSessions = sessions
    .filter((session) => session.venue === venue.name)
    .sort(sortSessions);

  const paperCount = venueSessions.reduce(
    (count, session) => count + papers.filter((paper) => paper.sessionId === session.id).length,
    0,
  );
  // 엑스포홀·연회장 같은 행사 전용 장소는 발표논문이 없으니 일정만 보여 준다.
  const hasPapers = paperCount > 0;

  return (
    <main className="shell detail-shell venue-detail">
      <AppHeader compact />
      <BackLink fallback="/more" label="더보기" />

      <section className="profile-hero venue-hero">
        <span><Icon name="pin" size={28} /></span>
        <p className="kicker">{hasPapers ? '발표장' : '행사장'}</p>
        <h1>{venue.name}</h1>
        <p>{hasPapers ? `예정 세션 ${venueSessions.length}개 · 발표논문 ${paperCount}건` : `예정 일정 ${venueSessions.length}개`}</p>
      </section>

      <h2 className="section-title">{hasPapers ? '이 장소의 세션과 발표논문' : '이 장소의 일정'}</h2>

      {venueSessions.length ? (
        <VenueSessionList key={venue.id} venueId={venue.id} items={venueSessions.map((session) => {
            const sessionPapers = papers
              .filter((paper) => paper.sessionId === session.id)
              .sort(sortPapers);
            const [start, end] = session.time.split('~');
            const title = formatSessionTitle(session.title);
            const metaText = isTalkSession(session) && sessionPapers.length > 0
              ? `발표자 ${sessionPapers.map((p) => p.presenter).filter(Boolean).join(', ')}`
              : session.chair && session.chair !== '-' ? `좌장 ${session.chair}` : '';

            return {
              id: session.id,
              title,
              count: sessionPapers.length,
              heading: (<>
                  <div className="venue-session-time">
                    <small>{dayLabel(session.date)}</small>
                    <b>{start}</b>
                    {end && <span>{end}</span>}
                  </div>

                  <div className="venue-session-body">
                    <h3>
                      <Link href={`/sessions/${session.id}`}>{title}</Link>
                    </h3>
                    {metaText && <p>{metaText}</p>}
                  </div>

              </>),
              papers: sessionPapers.length > 0 ? (
                  <div className="venue-paper-list">
                    {sessionPapers.map((paper) => (
                      <Link className="venue-paper-item" href={`/papers/${paper.id}`} key={paper.id}>
                        <PresentationBadge paper={paper} showId />
                        <b>{paper.title}</b>
                        <small>{paper.authors}</small>
                      </Link>
                    ))}
                  </div>
              ) : null,
            };
          })} />
      ) : (
        <div className="empty">
          <b>등록된 세션이 없습니다</b>
          <p>프로그램 업데이트 시 이곳에 표시됩니다.</p>
        </div>
      )}
      <AppTabs />
    </main>
  );
}
