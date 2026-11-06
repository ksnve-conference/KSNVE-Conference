'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';

/** The promo videos announced in 공지사항: Shorts for phones, the landscape cut for desktops. */
const VIDEO_ID = 'C6wIfSbE7t4';
const LANDSCAPE_URL = `https://youtu.be/${VIDEO_ID}`;
const SHORTS_URL = 'https://youtube.com/shorts/EBksNSpmfgQ';

/** Touch devices get the vertical Shorts cut, everything else the landscape one (also the server-rendered default). */
function useVideoUrl() {
  const [href, setHref] = useState(LANDSCAPE_URL);
  useEffect(() => {
    if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) setHref(SHORTS_URL);
  }, []);
  return href;
}

/** One-line shortcut under 전체 프로그램 바로가기 on the home screen. */
export function PromoVideoShortcut() {
  const href = useVideoUrl();
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="program-shortcut promo-shortcut">
      <Icon name="video" size={20} />
      <span>학술대회 미리보기</span>
      <Icon name="external" size={16} />
    </a>
  );
}

/**
 * The native YouTube play button receives the user's tap directly, avoiding
 * a second tap when mobile browsers block autoplay on a newly mounted iframe.
 * youtube.com rather than youtube-nocookie.com: desktop Safari's tracking
 * prevention made the nocookie player swallow the first click.
 */
export default function PromoVideoCard() {
  const href = useVideoUrl();
  return (
    <section className="promo-video" aria-label="학술대회 미리보기">
      <div className="promo-video-frame">
          <iframe
            src={`https://www.youtube.com/embed/${VIDEO_ID}?playsinline=1&rel=0`}
            title="2026 추계 학술대회 홍보 영상"
            loading="lazy"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
      </div>
      <div className="promo-video-heading">
        <b>2026 추계 학술대회 미리보기</b>
        <a href={href} target="_blank" rel="noopener noreferrer">YouTube에서 보기 <Icon name="external" size={13} /></a>
      </div>
    </section>
  );
}
