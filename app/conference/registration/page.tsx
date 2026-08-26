import InfoPage from '@/components/InfoPage';
import Icon from '@/components/Icon';
import info from '@/data/conference-info.json';

export const metadata = { title: '등록안내' };

export default function RegistrationGuidePage() {
  const { registration } = info;
  return (
    <InfoPage kicker="REGISTRATION" title="등록안내" intro={registration.intro}>
      <div className="info-cards">
        {registration.steps.map((s, i) => (
          <article key={s.title}><span className="info-step">{i + 1}</span><b>{s.title}</b><p>{s.desc}</p></article>
        ))}
      </div>

      <h2 className="info-subhead">등록회비 제공 내용</h2>
      <div className="keyword-list">
        {registration.includes.map((x) => <span className="keyword-chip" key={x}>{x}</span>)}
      </div>

      <h2 className="info-subhead">유의사항</h2>
      <ul className="info-list">
        {registration.notes.map((n) => <li key={n}>{n}</li>)}
      </ul>

      <a className="pdf-cta" href={registration.link.url} target="_blank" rel="noreferrer">
        <span><Icon name="external" size={18} /></span>
        <div><b>{registration.link.label}</b><small>{registration.link.url.replace('https://', '')}</small></div>
        <em><Icon name="chevron" size={17} /></em>
      </a>
      <p className="info-note">{registration.contact}</p>
    </InfoPage>
  );
}
