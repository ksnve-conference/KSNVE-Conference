import Link from 'next/link';
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
        <li>불편한 점이나 오류는 <Link href="/feedback">건의 · 피드백</Link>으로 보내 주세요. 보낸 내용과 선택해서 남긴 성함·소속, 이메일만 학술대회 담당자에게 전달되며, 앱 오류를 신고할 때는 기기·브라우저 정보가 함께 전송됩니다.</li>
        <li>한 번 열어 본 프로그램과 초록은 네트워크가 끊겨도 다시 볼 수 있습니다.</li>
        <li>서비스 개선을 위해 Google Analytics를 사용하여 방문 페이지와 이용 통계를 수집합니다. 쿠키가 사용되며, 검색어와 저장한 일정은 Google Analytics로 전송하지 않습니다. <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noreferrer">Google의 데이터 이용 안내</a></li>
      </ul>
    </InfoPage>
  );
}
