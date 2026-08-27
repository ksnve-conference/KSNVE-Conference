'use client';

import { useEffect, useState, type RefObject } from 'react';
import Icon, { type IconName } from '@/components/Icon';

type Props = { dialogRef: RefObject<HTMLDialogElement | null>; onClose: () => void };
type Platform = 'ios' | 'android' | 'other';

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'other';
}

const stepsByPlatform: Record<Platform, { icon: IconName; title: string; body: string }[]> = {
  ios: [
    { icon: 'share', title: '공유 버튼 탭하기', body: 'Safari 하단(또는 상단) 툴바에서 공유 아이콘을 탭하세요.' },
    { icon: 'plus', title: "'홈 화면에 추가' 선택", body: "메뉴를 아래로 스크롤해 '홈 화면에 추가'를 탭한 뒤 '추가'를 누르면 완료됩니다." },
  ],
  android: [
    { icon: 'more', title: '더보기 메뉴 탭하기', body: 'Chrome 오른쪽 위의 점 3개(⋮) 메뉴를 탭하세요.' },
    { icon: 'plus', title: "'앱 설치' 선택", body: "메뉴에서 '앱 설치' 또는 '홈 화면에 추가'를 선택하고 '설치'를 누르면 완료됩니다." },
  ],
  // Desktop or an unrecognized browser — most desktop Chromium browsers use the same menu path as Android.
  other: [
    { icon: 'more', title: '브라우저 메뉴 열기', body: '주소창 오른쪽의 메뉴 또는 설치 아이콘을 찾아보세요.' },
    { icon: 'plus', title: "'설치' 선택", body: "'이 사이트 설치' 또는 '홈 화면에 추가'를 선택하면 완료됩니다." },
  ],
};

/** "Add to Home Screen" walkthrough, platform-aware — shared by the home-page
 * install banner (iOS only there) and the 더보기 menu entry, which is reachable
 * regardless of platform or whether the banner was already dismissed. */
export default function InstallGuideModal({ dialogRef, onClose }: Props) {
  const [platform, setPlatform] = useState<Platform>('other');
  useEffect(() => { setPlatform(detectPlatform()); }, []);
  const steps = stepsByPlatform[platform];

  return (
    <dialog ref={dialogRef} className="filter-sheet install-guide-sheet" aria-label="홈 화면에 추가하는 방법">
      <div className="filter-sheet-header">
        <h2>홈 화면에 추가하는 방법</h2>
        <button type="button" onClick={onClose} aria-label="닫기"><Icon name="close" size={18} /></button>
      </div>
      <div className="filter-sheet-body">
        <ol className="install-guide-steps">
          {steps.map((step, i) => (
            <li className="install-guide-step" key={step.title}>
              <span className="install-guide-step-icon"><Icon name={step.icon} size={19} /></span>
              <div>
                <b><span>{i + 1}</span>{step.title}</b>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <div className="filter-sheet-footer">
        <button type="button" className="filter-sheet-apply" onClick={onClose}>확인</button>
      </div>
    </dialog>
  );
}
