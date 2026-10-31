import Link from 'next/link';
import Icon from '@/components/Icon';
import type { EventDetails } from '@/lib/conference';

/** An official event's introduction from the programme book: what it is,
 * its running order, the speaker or mentor, and practical notes. */
export default function EventDetailsView({ details }: { details: EventDetails }) {
  const hasBody = Boolean(details.image || details.lead || details.intro || details.rows?.length || details.program?.length || details.topics?.length || details.profile || details.notes?.length || details.links?.length);
  return (
    <>
      {details.preface && (
        <section className="detail-card event-details">
          <h2>{details.preface.title}</h2>
          {details.preface.paragraphs.map((paragraph) => (
            <p className="event-intro" key={paragraph}>{paragraph}</p>
          ))}
        </section>
      )}
    {hasBody && <section className="detail-card event-details">
      {details.image && (
        <a className="event-poster" href={details.image.src} target="_blank" rel="noreferrer">
          <img src={details.image.src} alt={details.image.alt} width={details.image.width} height={details.image.height} loading="lazy" />
        </a>
      )}
      {details.lead && <p className="event-lead">{details.lead}</p>}
      {details.intro?.split(/\n\s*\n/).map((paragraph) => (
        <p className="event-intro" key={paragraph}>{paragraph}</p>
      ))}

      {details.rows && details.rows.length > 0 && (
        <dl className="info-table">
          {details.rows.map((row) => (
            <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>
          ))}
        </dl>
      )}

      {details.program && details.program.length > 0 && (
        <>
          <h2>프로그램</h2>
          <ol className="event-program">
            {details.program.map((item) => (
              <li key={item.time}>
                <time>{item.time}</time>
                <div>
                  <b>{item.title}</b>
                  {item.desc && <p>{item.desc}</p>}
                  {item.speaker && <small>발표 {item.speaker}</small>}
                </div>
              </li>
            ))}
          </ol>
        </>
      )}

      {details.topics && details.topics.length > 0 && (
        <>
          <h2>{details.topicsTitle ?? '내용'}</h2>
          <ol className="info-list">
            {details.topics.map((topic) => <li key={topic}>{topic}</li>)}
          </ol>
        </>
      )}

      {details.profile && (
        <>
          <h2>{details.profile.title}</h2>
          <div className="event-profile">
            {details.profile.photo ? (
              <div className="keynote-profile">
                <img src={details.profile.photo} alt={`${details.profile.name.split(' · ')[0]} 사진`} width={120} height={156} loading="lazy" />
                <b>{details.profile.name.split(' · ')[0]}<small>{details.profile.name.split(' · ')[1]}</small></b>
              </div>
            ) : <b>{details.profile.name}</b>}
            <ul>
              {details.profile.lines.map((line) => <li key={line}>{line}</li>)}
            </ul>
          </div>
        </>
      )}

      {details.notes && details.notes.length > 0 && (
        <>
          <h2>안내</h2>
          <ul className="info-list">
            {details.notes.map((note) => <li key={note}>{note}</li>)}
          </ul>
        </>
      )}

      {details.links?.map((link) => link.href.startsWith('/') ? (
        <Link className="pdf-cta" key={link.href} href={link.href}>
          <span><Icon name="info" size={18} /></span>
          <div><b>{link.label}</b></div>
          <em><Icon name="chevron" size={17} /></em>
        </Link>
      ) : (
        <a className="pdf-cta" key={link.href} href={link.href} target="_blank" rel="noreferrer">
          <span><Icon name="external" size={18} /></span>
          <div><b>{link.label}</b><small>{link.href.replace(/^https?:\/\//, '')}</small></div>
          <em><Icon name="chevron" size={17} /></em>
        </a>
      ))}
    </section>}
    </>
  );
}
