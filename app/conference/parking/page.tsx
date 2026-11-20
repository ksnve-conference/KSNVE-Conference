import InfoPage from '@/components/InfoPage';
import Icon from '@/components/Icon';
import info from '@/data/conference-info.json';

export const metadata = { title: '주차 할인 등록' };

export default function ParkingPage() {
  const { parking } = info;
  return (
    <InfoPage title="주차 할인 등록" intro={parking.intro}>
      {/* A phone can't scan a QR shown on its own screen, so the link opens directly. */}
      <a className="pdf-cta parking-cta" href={parking.registerUrl} target="_blank" rel="noopener noreferrer">
        <span><Icon name="parking" size={22} /></span>
        <div><b>주차 할인 등록하기</b><small>차량번호 뒷자리 4자리로 등록 · 1회 2,000원</small></div>
        <em><Icon name="external" size={17} /></em>
      </a>
      <p className="parking-warn" role="note"><Icon name="alert" size={16} /> {parking.warning}</p>

      <h2 className="info-subhead">등록 방법</h2>
      <ol className="info-list">
        {parking.steps.map((step) => <li key={step}>{step}</li>)}
      </ol>

      <h2 className="info-subhead">유의사항</h2>
      <ul className="info-list">
        {parking.notes.map((note) => <li key={note}>{note}</li>)}
      </ul>

      <h2 className="info-subhead">주차 요금</h2>
      <dl className="info-table">
        {parking.fees.map(([label, value]) => (
          <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
        ))}
      </dl>

      <h2 className="info-subhead">주차 할인 QR</h2>
      <figure className="guide-figure parking-qr">
        <img src={parking.qr.src} width={parking.qr.width} height={parking.qr.height} alt="주차 할인 등록 QR코드" loading="lazy" />
        <figcaption>다른 기기로 스캔할 때 사용하세요.</figcaption>
      </figure>

      <a className="pdf-cta" href={`tel:${parking.tel.replaceAll('-', '')}`}>
        <span><Icon name="phone" size={18} /></span>
        <div><b>주차관제센터 {parking.tel}</b><small>여수엑스포컨벤션센터 · 누르면 전화 연결</small></div>
        <em><Icon name="chevron" size={17} /></em>
      </a>
      <a className="pdf-cta" href={parking.pdf} target="_blank" rel="noreferrer">
        <span><Icon name="file" size={18} /></span>
        <div><b>주차 등록 안내문 (PDF)</b><small>학회 공지 원본</small></div>
        <em><Icon name="download" size={17} /></em>
      </a>
    </InfoPage>
  );
}
