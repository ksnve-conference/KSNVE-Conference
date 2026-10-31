import InfoPage from '@/components/InfoPage';
import Icon from '@/components/Icon';
import info from '@/data/conference-info.json';

export const metadata = { title: '편의시설' };

export default function FacilitiesPage() {
  const { facilities } = info;
  return (
    <InfoPage title="편의시설" intro={facilities.intro}>
      {facilities.groups.map((group) => (
        <section key={group.label}>
          <h2 className="info-subhead">{group.label}</h2>
          <div className="info-cards">
            {group.items.map((item) => (
              <article key={item.name} className="place-card">
                <b>{item.name}</b>
                <p><Icon name="pin" size={13} /> {item.place}</p>
                <p><Icon name="clock" size={13} /> {item.hours}</p>
                {item.tel && (
                  <a className="text-link" href={`tel:${item.tel.replaceAll('-', '')}`}>
                    <Icon name="phone" size={13} /> {item.tel}
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>
      ))}
    </InfoPage>
  );
}
