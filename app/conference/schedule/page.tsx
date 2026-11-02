import Link from 'next/link';
import InfoPage from '@/components/InfoPage';
import Icon from '@/components/Icon';
import ScrollMemory from '@/components/ScrollMemory';
import { conferenceConfig } from '@/lib/conference-config';
import { allMajorItems, shortDate } from '@/lib/major-events';

export const metadata = { title: '주요 일정' };

export default function MajorSchedulePage() {
  const days = conferenceConfig.dates.map((date, index) => ({
    date,
    no: index + 1,
    items: allMajorItems.filter((item) => item.date === date),
  }));
  return (
    <InfoPage title="주요 일정" intro="4일간 열리는 주요 행사와 키노트·초청 강연입니다. 항목을 누르면 세션이나 발표 상세로 이동합니다.">
      <ScrollMemory screen="major-schedule" />
      {days.map((day) => (
        <section key={day.date}>
          <h2 className="info-subhead">{day.no}일차 <small className="info-subhead-note">{shortDate(day.date)}</small></h2>
          <div className="major-event-list">
            {day.items.map((item) => (
              <Link href={item.href} key={item.key}>
                <time>{item.time.split('~')[0]}</time>
                <div><b>{item.title}</b><small>{item.speaker ? `${item.venue} · 연사 ${item.speaker}` : item.venue}</small></div>
                <span><Icon name="chevron" size={16} /></span>
              </Link>
            ))}
            {day.items.length === 0 && <div className="compact-empty">주요 일정이 없습니다.</div>}
          </div>
        </section>
      ))}
      <p className="info-note">발표 세션 전체는 프로그램 탭에서 볼 수 있습니다. 일정은 현지 사정에 따라 바뀔 수 있습니다.</p>
    </InfoPage>
  );
}
