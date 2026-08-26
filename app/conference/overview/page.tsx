import InfoPage from '@/components/InfoPage';
import info from '@/data/conference-info.json';

export const metadata = { title: '행사개요' };

export default function ConferenceOverviewPage() {
  const { overview } = info;
  return (
    <InfoPage kicker="CONFERENCE OVERVIEW" title="행사개요" intro={overview.intro}>
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
