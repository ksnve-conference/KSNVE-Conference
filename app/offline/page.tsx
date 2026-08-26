import Link from 'next/link';
import Icon from '@/components/Icon';

export const metadata = { title: '오프라인' };

export default function OfflinePage() {
  return (
    <main className="shell detail-shell">
      <div className="empty offline-page">
        <span><Icon name="alert" size={28} /></span>
        <b>연결이 끊겼습니다</b>
        <p>이미 열어 본 프로그램과 초록은 오프라인에서도 볼 수 있습니다. 네트워크가 돌아오면 자동으로 최신 내용을 불러옵니다.</p>
        <Link href="/" className="empty-cta">프로그램으로</Link>
      </div>
    </main>
  );
}
