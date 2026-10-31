import InfoPage from '@/components/InfoPage';
import Icon from '@/components/Icon';
import info from '@/data/conference-info.json';

export const metadata = { title: '주변 관광' };

export default function TourismPage() {
  const { tourism } = info;
  return (
    <InfoPage title="주변 관광" intro={tourism.intro}>
      <div className="info-cards">
        {tourism.places.map((place) => (
          <article key={place.name} className="place-card">
            <b>{place.name}</b>
            <p className="place-desc">{place.desc}</p>
            <p><Icon name="pin" size={13} /> {place.access}</p>
            <p><Icon name="clock" size={13} /> {place.info}</p>
            <a className="text-link" href={`tel:${place.tel.replaceAll('-', '')}`}>
              <Icon name="phone" size={13} /> {place.tel}
            </a>
          </article>
        ))}
      </div>

      <h2 className="info-subhead">여수 밤바다 선상투어</h2>
      {tourism.cruises.map((cruise) => (
        <a className="pdf-cta" key={cruise.url} href={cruise.url} target="_blank" rel="noreferrer">
          <span><Icon name="external" size={18} /></span>
          <div><b>{cruise.label}</b><small>{cruise.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</small></div>
          <em><Icon name="chevron" size={17} /></em>
        </a>
      ))}
    </InfoPage>
  );
}
