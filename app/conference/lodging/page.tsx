import InfoPage from '@/components/InfoPage';
import Icon from '@/components/Icon';
import info from '@/data/conference-info.json';

export const metadata = { title: '숙박 안내' };

export default function LodgingPage() {
  const { lodging } = info;
  return (
    <InfoPage title="숙박 안내" intro={lodging.intro}>
      <dl className="info-table">
        {lodging.rows.map((row) => (
          <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>
        ))}
      </dl>
      <a className="pdf-cta" href={lodging.link.url} target="_blank" rel="noreferrer">
        <span><Icon name="bed" size={18} /></span>
        <div><b>{lodging.link.label}</b><small>{lodging.link.url.replace('https://', '')}</small></div>
        <em><Icon name="external" size={17} /></em>
      </a>

      <h2 className="info-subhead">숙소별 할인 요금 <small className="info-subhead-note">1박, 주중, VAT 포함</small></h2>
      <div className="info-cards">
        {lodging.hotels.map((hotel) => (
          <article key={hotel.name} className="place-card">
            <b>{hotel.name}{'main' in hotel && hotel.main && <span className="badge place-badge">메인 호텔</span>}</b>
            <p><Icon name="pin" size={13} /> {hotel.distance}</p>
            <ul className="room-list">
              {hotel.rooms.map((room) => (
                <li key={room.type}>
                  <span>{room.type}<small>{room.note}</small></span>
                  <strong>{room.price}</strong>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <h2 className="info-subhead">참고사항</h2>
      <ul className="info-list">
        {lodging.notes.map((note) => <li key={note}>{note}</li>)}
      </ul>
    </InfoPage>
  );
}
