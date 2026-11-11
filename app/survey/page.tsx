import InfoPage from '@/components/InfoPage';
import { conferenceConfig } from '@/lib/conference-config';
import SurveyForm from '@/components/SurveyForm';

export const metadata = { title: '참가 만족도 설문' };

export default function SurveyPage() {
  if (!conferenceConfig.surveyEnabled) {
    return (
      <InfoPage title="참가 만족도 설문" backLabel="뒤로">
        <p className="guide-callout">이번 학술대회에서는 참가 만족도 설문을 운영하지 않습니다. 다음 학술대회부터 운영할 예정입니다.</p>
      </InfoPage>
    );
  }
  return (
    <InfoPage title="참가 만족도 설문" backLabel="뒤로" intro="3분 안에 끝나는 20개 문항입니다. 보내주신 의견은 다음 학술대회 준비에 반영합니다.">
      <SurveyForm />
    </InfoPage>
  );
}
