import InfoPage from '@/components/InfoPage';
import FeedbackForm from '@/components/FeedbackForm';

export const metadata = { title: '건의 · 피드백' };

export default function FeedbackPage() {
  return (
    <InfoPage title="건의 · 피드백" backLabel="뒤로" intro="행사 운영, 발표장, 앱 사용 중 불편한 점이나 건의사항을 보내 주세요. 성함과 소속을 남겨 주셔도 좋고, 익명으로 보내셔도 괜찮습니다.">
      <FeedbackForm />
    </InfoPage>
  );
}
