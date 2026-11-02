import InfoPage from '@/components/InfoPage';
import PresentationGuide from '@/components/PresentationGuide';

export const metadata = { title: '발표 참가요령' };

export default function PresentationGuidePage() {
  return (
    <InfoPage title="발표 참가요령" backLabel="뒤로" intro="좌장·구두발표·포스터발표 참가요령과 시상 안내입니다. 프로그램북 27~30쪽 내용입니다.">
      <PresentationGuide />
    </InfoPage>
  );
}
