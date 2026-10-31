import InfoPage from '@/components/InfoPage';
import info from '@/data/conference-info.json';

export const metadata = { title: '행사개요' };

export default function ConferenceOverviewPage() {
  const { overview } = info;
  return (
    <InfoPage
      title="행사개요"
      intro={overview.intro}
      lead={
        // the programme book's emblem (moved here from the home hero)
        <img
          className="conference-emblem"
          src="/images/conference-emblem.webp"
          alt="2026 추계 소음진동 학술대회 엠블럼 — 지속 가능한 내일의 소음진동"
          width={256}
          height={256}
        />
      }
    >
      <dl className="info-table">
        {overview.rows.map((row) => (
          <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>
        ))}
      </dl>
      <h2 className="info-subhead">주요 행사</h2>
      <div className="info-cards">
        {overview.highlights.map((h) => (
          <article key={h.title}><b>{h.title}</b><p>{h.desc}</p></article>
        ))}
      </div>
      <p className="info-note">{overview.note}</p>
    </InfoPage>
  );
}
