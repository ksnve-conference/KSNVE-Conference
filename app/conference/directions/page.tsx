import InfoPage from '@/components/InfoPage';
import Icon from '@/components/Icon';
import info from '@/data/conference-info.json';

export const metadata = { title: '오시는 길' };

export default function DirectionsPage() {
  const { directions } = info;
  return (
    <InfoPage title="오시는 길" intro={directions.intro}>
      <dl className="info-table">
        {directions.rows.map((row) => (
          <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>
        ))}
      </dl>
      <a className="pdf-cta" href={directions.mapUrl} target="_blank" rel="noreferrer">
        <span><Icon name="pin" size={18} /></span>
        <div><b>지도에서 보기</b><small>네이버 지도 · 여수엑스포컨벤션센터</small></div>
        <em><Icon name="external" size={17} /></em>
      </a>

      <h2 className="info-subhead">KTX (여수EXPO역)</h2>
      <div className="fee-table-wrap">
        <table className="fee-table">
          <thead>
            <tr><th scope="col">구간</th>{directions.ktx.columns.map((c) => <th scope="col" key={c}>{c}</th>)}</tr>
          </thead>
          {directions.ktx.groups.map((group) => (
            <tbody key={group.label}>
              {group.rows.map((row, i) => (
                <tr key={row[0]}>
                  {i === 0 && <th scope="rowgroup" rowSpan={group.rows.length}>{group.label}</th>}
                  {row.map((cell, j) => <td key={directions.ktx.columns[j]}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
      <p className="info-note">{directions.ktx.note}</p>

      <h2 className="info-subhead">여수EXPO역에서 행사장까지</h2>
      <ol className="info-list">
        {directions.fromStation.map((step) => <li key={step}>{step}</li>)}
      </ol>

      <h2 className="info-subhead">자가용</h2>
      <div className="fee-table-wrap">
        <table className="fee-table">
          <thead><tr>{directions.driving.columns.map((c) => <th scope="col" key={c}>{c}</th>)}</tr></thead>
          <tbody>
            {directions.driving.rows.map(([from, time]) => (
              <tr key={from}><th scope="row">{from}</th><td>{time}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="info-note">{directions.driving.note}</p>

      <h2 className="info-subhead">주차</h2>
      <ul className="info-list">
        {directions.parking.map((line) => <li key={line}>{line}</li>)}
      </ul>

      <a className="pdf-cta" href={directions.venueUrl} target="_blank" rel="noreferrer">
        <span><Icon name="external" size={18} /></span>
        <div><b>여수엑스포컨벤션센터 교통 안내</b><small>expo2012.kr</small></div>
        <em><Icon name="chevron" size={17} /></em>
      </a>
    </InfoPage>
  );
}
