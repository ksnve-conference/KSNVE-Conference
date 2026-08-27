'use client';

import type { RefObject } from 'react';
import Icon from '@/components/Icon';

type Props = { dialogRef: RefObject<HTMLDialogElement | null>; onClose: () => void };

/** iOS's "Add to Home Screen" walkthrough — shared by the home-page install
 * banner and the 더보기 menu, so it's reachable even after the banner is
 * dismissed (dismissing it only hides the banner, not this how-to). */
export default function InstallGuideModal({ dialogRef, onClose }: Props) {
  return (
    <dialog ref={dialogRef} className="filter-sheet install-guide-sheet" aria-label="홈 화면에 추가하는 방법">
      <div className="filter-sheet-header">
        <h2>홈 화면에 추가하는 방법</h2>
        <button type="button" onClick={onClose} aria-label="닫기"><Icon name="close" size={18} /></button>
      </div>
      <div className="filter-sheet-body">
        <ol className="install-guide-steps">
          <li className="install-guide-step">
            <span className="install-guide-step-icon"><Icon name="share" size={19} /></span>
            <div>
              <b><span>1</span>공유 버튼 탭하기</b>
              <p>Safari 하단(또는 상단) 툴바에서 공유 아이콘을 탭하세요.</p>
            </div>
          </li>
          <li className="install-guide-step">
            <span className="install-guide-step-icon"><Icon name="plus" size={19} /></span>
            <div>
              <b><span>2</span>&lsquo;홈 화면에 추가&rsquo; 선택</b>
              <p>메뉴를 아래로 스크롤해 &lsquo;홈 화면에 추가&rsquo;를 탭한 뒤 &lsquo;추가&rsquo;를 누르면 완료됩니다.</p>
            </div>
          </li>
        </ol>
      </div>
      <div className="filter-sheet-footer">
        <button type="button" className="filter-sheet-apply" onClick={onClose}>확인</button>
      </div>
    </dialog>
  );
}
