import InfoPage from '@/components/InfoPage';
import { conferenceConfig } from '@/lib/conference-config';

export const metadata = { title: '이용안내' };

export default function AppInfoPage() {
  return (
    <InfoPage
      title="이용안내"
      intro={`${conferenceConfig.koreanTitle}의 프로그램과 발표 정보를 제공하는 모바일 웹앱입니다.`}
    >
      <ul className="info-list">
        <li>논문과 세션의 별표를 누르면 <b>내 일정</b>에 저장되고, 시간이 겹치면 알려줍니다.</li>
        <li>내 일정은 캘린더 파일(.ics)로 내보낼 수 있습니다.</li>
        <li>저장한 일정과 읽은 공지는 이 기기의 브라우저에만 보관되며 서버로 전송되지 않습니다.</li>
        <li>한 번 열어 본 프로그램과 초록은 네트워크가 끊겨도 다시 볼 수 있습니다.</li>
      </ul>
    </InfoPage>
  );
}
