'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';

/** The promo videos announced in 공지사항 (landscape plays here, the Shorts cut opens on YouTube). */
const VIDEO_ID = 'C6wIfSbE7t4';
const SHORTS_URL = 'https://youtube.com/shorts/EBksNSpmfgQ';

/**
 * 학술대회 미리보기, shown on the home screen until the conference starts.
 * Only a thumbnail loads until someone taps it, so the page stays light on
 * mobile data; the player then loads in place without leaving the app.
 */
export default function PromoVideo() {
  const [playing, setPlaying] = useState(false);
  return (
    <section className="promo-video" aria-label="학술대회 미리보기">
      <div className="promo-video-heading">
        <b>학술대회 미리보기</b>
        <a href={SHORTS_URL} target="_blank" rel="noopener noreferrer">세로 영상 <Icon name="external" size={13} /></a>
      </div>
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
            <span className="promo-video-play" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg></span>
          </button>
        )}
      </div>
    </section>
  );
}
