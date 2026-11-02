import InfoPage from '@/components/InfoPage';
import SurveyForm from '@/components/SurveyForm';

export const metadata = { title: '참가 만족도 설문' };

export default function SurveyPage() {
  return (
    <InfoPage title="참가 만족도 설문" backLabel="뒤로" intro="3분 안에 끝나는 18개 문항입니다. 보내주신 의견은 다음 학술대회 준비에 반영합니다.">
      <SurveyForm />
    </InfoPage>
  );
}
