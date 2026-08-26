import { notFound } from 'next/navigation';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import AppTabs from '@/components/AppTabs';
import BackLink from '@/components/BackLink';
import OriginalPageViewer from '@/components/OriginalPageViewer';
import PaperActions from '@/components/PaperActions';
import PresentationBadge from '@/components/PresentationBadge';
import Icon from '@/components/Icon';
import { dayLabel, formatSessionTitle, papers, sessionById, speakers, venueByName } from '@/lib/conference';
import { getPaperDetail } from '@/lib/paper-detail';

export function generateStaticParams() {
  return papers.map((p) => ({ id: p.id }));
}

export default async function PaperDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const paper = getPaperDetail(id);
  if (!paper) notFound();

  const session = sessionById.get(paper.sessionId);
  const speaker = speakers.find((s) => s.papers.includes(paper.id));
  const venue = venueByName.get(paper.venue);
  const affiliations = Array.isArray(paper.affiliations) ? paper.affiliations : paper.affiliations ? [paper.affiliations] : [];
  const needsReview = (paper.extractionQuality ?? 1) < 0.55 && Boolean(paper.abstract);

  const sessionPapers = papers
    .filter((p) => p.sessionId === paper.sessionId)
    .sort((a, b) => a.time.localeCompare(b.time) || a.id.localeCompare(b.id));
  const ownIndex = sessionPapers.findIndex((p) => p.id === paper.id);
  const prevPaper = ownIndex > 0 ? sessionPapers[ownIndex - 1] : undefined;
  const nextPaper = ownIndex >= 0 && ownIndex < sessionPapers.length - 1 ? sessionPapers[ownIndex + 1] : undefined;

  return (
    <main className="shell detail-shell paper-detail">
      <AppHeader compact />
      <BackLink fallback="/papers" label="목록으로" />

      <article className="detail-card">
        <PresentationBadge paper={paper} showId />
        <h1>{paper.title}</h1>

        <div className="presenter">
          <span>{paper.presenter?.slice(0, 1) || '?'}</span>
          <div>
            <small>발표자</small>
            <b>
              {speaker
                ? <Link className="text-link" href={`/speakers/${speaker.id}`}>{paper.presenter} <Icon name="chevron" size={13} /></Link>
                : paper.presenter}
            </b>
            <p>{paper.authors}</p>
          </div>
        </div>

        <PaperActions id={paper.id} title={paper.title} />

        <section className="schedule-panel">
          <div>
            <span><Icon name="clock" size={17} /></span>
            <p><small>일시</small><b>{dayLabel(paper.date)} · {paper.time}</b></p>
          </div>
          <div>
            <span><Icon name="pin" size={17} /></span>
            <p>
              <small>발표장</small>
              <b>{venue ? <Link className="text-link" href={`/venues/${venue.id}`}>{paper.venue} <Icon name="chevron" size={13} /></Link> : paper.venue}</b>
            </p>
          </div>
        </section>

        {paper.paperPdf && (
          <a className="pdf-cta" href={paper.paperPdf} target="_blank" rel="noreferrer">
            <span><Icon name="file" size={19} /></span>
            <div><b>논문 원문 PDF</b><small>새 탭에서 열립니다</small></div>
            <em><Icon name="download" size={17} /></em>
          </a>
        )}

        <dl className="details">
          <div><dt>저자</dt><dd>{paper.authors}</dd></div>
          <div><dt>소속</dt><dd>{affiliations.length > 0 ? affiliations.join(', ') : '-'}</dd></div>
          <div>
            <dt>세션</dt>
            <dd>{session
              ? <Link className="text-link" href={`/sessions/${session.id}`}>{formatSessionTitle(session.title)} <Icon name="chevron" size={13} /></Link>
              : formatSessionTitle(paper.session)}</dd>
          </div>
          <div><dt>좌장</dt><dd>{session?.chair && session.chair !== '-' ? session.chair : '-'}</dd></div>
          {paper.sourcePage ? <div><dt>초록집 페이지</dt><dd>{paper.sourcePage}쪽</dd></div> : null}
        </dl>

        {paper.keywords && paper.keywords.length > 0 && (
          <section className="abstract">
            <h2>키워드</h2>
            <div className="keyword-list">
              {paper.keywords.map((keyword) => (
                <Link key={keyword} href={`/search?q=${encodeURIComponent(keyword)}`} className="keyword-chip">
                  {keyword}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="abstract">
          <h2>초록</h2>
          {paper.abstract
            ? <p className="abstract-text">{paper.abstract}</p>
            : <p className="abstract-empty">이 발표는 초록집에 초록이 수록되어 있지 않습니다.</p>}
          {needsReview && (
            <p className="extraction-note">
              <Icon name="info" size={14} /> 자동 추출된 초록으로, 일부 문자가 정확하지 않을 수 있습니다. 정확한 내용은 원문 페이지를 확인해 주세요.
            </p>
          )}
        </section>

        {paper.pageImage && (
          <OriginalPageViewer src={paper.pageImage} title={paper.title} sourcePage={paper.sourcePage} />
        )}
      </article>

      {(prevPaper || nextPaper) && (
        <nav className="paper-siblings" aria-label="같은 세션의 다른 발표">
          {prevPaper ? (
            <Link href={`/papers/${prevPaper.id}`} className="paper-sibling prev">
              <Icon name="back" size={15} />
              <div><small>이전 발표</small><b>{prevPaper.title}</b></div>
            </Link>
          ) : <span />}
          {nextPaper ? (
            <Link href={`/papers/${nextPaper.id}`} className="paper-sibling next">
              <div><small>다음 발표</small><b>{nextPaper.title}</b></div>
              <Icon name="chevron" size={15} />
            </Link>
          ) : <span />}
        </nav>
      )}

      <AppTabs />
    </main>
  );
}
