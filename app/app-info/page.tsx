import InfoPage from '@/components/InfoPage';
import { conferenceConfig } from '@/lib/conference-config';
import { papers, sessions, speakers, venues } from '@/lib/conference';

export const metadata = { title: '앱 정보' };

const withAbstract = papers.filter((p) => p.hasAbstract).length;

export default function AppInfoPage() {
  return (
    <InfoPage
      title="앱 정보"
      intro={`${conferenceConfig.koreanTitle}의 프로그램과 발표 정보를 제공하는 모바일 웹앱입니다.`}
    >
      <dl className="info-table">
        <div><dt>수록 발표</dt><dd>{papers.length}건 (초록 {withAbstract}건)</dd></div>
        <div><dt>세션</dt><dd>{sessions.length}개</dd></div>
        <div><dt>발표자</dt><dd>{speakers.length}명</dd></div>
        <div><dt>발표장</dt><dd>{venues.length}곳</dd></div>
      </dl>

      <h2 className="info-subhead">이용 안내</h2>
      <ul className="info-list">
        <li>논문과 세션의 별표를 누르면 <b>내 일정</b>에 저장되고, 시간이 겹치면 알려줍니다.</li>
        <li>내 일정은 캘린더 파일(.ics)로 내보낼 수 있습니다.</li>
        <li>저장한 일정과 읽은 공지는 이 기기의 브라우저에만 보관되며 서버로 전송되지 않습니다.</li>
        <li>한 번 열어 본 프로그램과 초록은 네트워크가 끊겨도 다시 볼 수 있습니다.</li>
      </ul>

      <h2 className="info-subhead">데이터 안내</h2>
      <ul className="info-list">
        <li>초록은 학술대회 초록집에서 자동 추출한 것으로, 일부 문자가 정확하지 않을 수 있습니다.</li>
        <li>정확한 내용은 각 발표의 <b>원문 페이지</b>를 확인해 주세요.</li>
        <li>프로그램은 학술대회 진행 상황에 따라 변경될 수 있습니다.</li>
      </ul>

      <p className="info-note">문의 : 한국소음진동공학회 사무국 02-3474-8002 · ksnve@ksnve.or.kr</p>
    </InfoPage>
  );
}
