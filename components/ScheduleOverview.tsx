'use client';

import { useRef, useState } from 'react';
import Icon from '@/components/Icon';

const IMAGE = { src: '/images/schedule-overview.webp?v=ff3871ec37', width: 1989, height: 2720 };
const PDF = '/files/2026-autumn-schedule-overview.pdf?v=7d87528f1b';
const PDF_NAME = '2026_추계_소음진동학술대회_총일정표.pdf';
const TITLE = '총일정표 (v2.3)';

/** "총일정표" button beside the programme title: the one-page grid of every hall, zoomable, with the PDF to download. */
export default function ScheduleOverview() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [zoomed, setZoomed] = useState(false);

  const close = () => {
    setZoomed(false);
    dialogRef.current?.close();
  };

  return (
    <div className="schedule-overview">
      <button type="button" className="schedule-overview-open" onClick={() => { setZoomed(false); dialogRef.current?.showModal(); }}>
        <Icon name="calendar" size={15} /> {TITLE}
      </button>

      <dialog
        ref={dialogRef}
        className="page-viewer schedule-overview-viewer"
        aria-label={`${TITLE} 전체 화면`}
        onClose={() => setZoomed(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <header>
          <div>
            <b>{TITLE}</b>
            <span>{zoomed ? '눌러서 화면에 맞추기 · 두 손가락으로 확대' : '눌러서 확대 · 두 손가락으로 확대'}</span>
          </div>
          <div className="schedule-overview-actions">
            <a href={PDF} download={PDF_NAME}><Icon name="download" size={13} /> PDF 다운로드</a>
            <button type="button" onClick={close} aria-label="닫기">×</button>
          </div>
        </header>
        <div className={`page-viewer-canvas${zoomed ? ' zoomed' : ''}`}>
          <button type="button" onClick={() => setZoomed((current) => !current)} aria-label={zoomed ? '화면에 맞추기' : '확대하기'}>
            <img src={IMAGE.src} alt="2026 추계 소음진동 학술대회 총일정표" width={IMAGE.width} height={IMAGE.height} loading="lazy" />
          </button>
        </div>
      </dialog>
    </div>
  );
}
