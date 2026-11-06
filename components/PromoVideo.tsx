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

const Play = ({ size }: { size: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>
);

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
 * Card on 더보기: the landscape video plays in place. Only the thumbnail loads
 * until someone taps it, so the page stays light on mobile data.
 */
export default function PromoVideoCard() {
  const href = useVideoUrl();
  const [playing, setPlaying] = useState(false);
  return (
    <section className="promo-video" aria-label="학술대회 미리보기">
      <div className="promo-video-frame">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&playsinline=1&rel=0`}
            title="2026 추계 학술대회 홍보 영상"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <button type="button" onClick={() => setPlaying(true)} aria-label="홍보 영상 재생">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`} alt="" loading="lazy" />
            <span className="promo-video-play"><Play size={26} /></span>
          </button>
        )}
      </div>
      <div className="promo-video-heading">
        <b>2026 추계 학술대회 미리보기</b>
        <a href={href} target="_blank" rel="noopener noreferrer">YouTube에서 보기 <Icon name="external" size={13} /></a>
      </div>
    </section>
  );
}
