'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';

/** The promo videos announced in 공지사항: Shorts for phones, the landscape cut for desktops. */
const VIDEO_ID = 'C6wIfSbE7t4';
const LANDSCAPE_URL = `https://youtu.be/${VIDEO_ID}`;
const SHORTS_URL = 'https://youtube.com/shorts/EBksNSpmfgQ';

/**
 * 학술대회 미리보기, shown on the home screen until the conference starts.
 * The whole card opens the video on YouTube: touch devices get the vertical
 * Shorts cut, everything else the landscape one (also the server-rendered default).
 */
export default function PromoVideo() {
  const [href, setHref] = useState(LANDSCAPE_URL);
  useEffect(() => {
    if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) setHref(SHORTS_URL);
  }, []);

  return (
    <a className="promo-video" href={href} target="_blank" rel="noopener noreferrer" aria-label="학술대회 미리보기 영상 (YouTube에서 열기)">
      <div className="promo-video-heading">
        <b>학술대회 미리보기</b>
        <span>YouTube에서 보기 <Icon name="external" size={13} /></span>
      </div>
      <div className="promo-video-frame">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`} alt="" loading="lazy" />
        <span className="promo-video-play" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg></span>
      </div>
    </a>
  );
}
