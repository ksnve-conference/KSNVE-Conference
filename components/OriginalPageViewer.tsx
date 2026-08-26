'use client';

import { useRef, useState } from 'react';

type OriginalPageViewerProps = {
  src: string;
  title: string;
  sourcePage?: number;
};

export default function OriginalPageViewer({ src, title, sourcePage }: OriginalPageViewerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  const openViewer = () => {
    setZoomed(false);
    dialogRef.current?.showModal();
  };

  const closeViewer = () => {
    setZoomed(false);
    dialogRef.current?.close();
  };

  const enterFullscreen = async () => {
    const dialog = dialogRef.current;
    if (dialog?.requestFullscreen) await dialog.requestFullscreen();
  };

  const pageCaption = sourcePage ? `초록집 ${sourcePage}쪽` : '초록집 원문';

  return (
    <section className="abstract original-page">
      <div className="original-page-heading">
        <div>
          <h2>원문 페이지</h2>
          <p>{pageCaption}</p>
        </div>
        <a href={src} target="_blank" rel="noreferrer">
          원문 페이지 열기
        </a>
      </div>

      <button className="page-preview" type="button" onClick={openViewer} aria-label="원문 페이지 확대 보기">
        {!loaded && <span className="page-skeleton" aria-hidden="true" />}
        <img
          className={loaded ? 'loaded' : ''}
          src={src}
          alt={`${title} 원문 페이지`}
          width="1066"
          height="1458"
          loading="lazy"
          onLoad={() => setLoaded(true)}
        />
        <span className="zoom-hint">눌러서 확대</span>
      </button>

      <dialog
        ref={dialogRef}
        className="page-viewer"
        aria-label={`${title} 원문 페이지 전체 화면`}
        onClose={() => setZoomed(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeViewer();
        }}
      >
        <header>
          <div>
            <b>원문 페이지</b>
            <span>{pageCaption}</span>
          </div>
          <button type="button" onClick={enterFullscreen}>전체 화면</button>
          <a href={src} target="_blank" rel="noreferrer">원본 열기</a>
          <button type="button" onClick={closeViewer} aria-label="닫기">×</button>
        </header>
        <div className={`page-viewer-canvas${zoomed ? ' zoomed' : ''}`}>
          <button type="button" onClick={() => setZoomed((current) => !current)} aria-label={zoomed ? '축소하기' : '확대하기'}>
            <img src={src} alt={`${title} 확대 원문 페이지`} width="1066" height="1458" />
          </button>
        </div>
      </dialog>
    </section>
  );
}
