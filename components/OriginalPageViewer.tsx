'use client';

import { useEffect, useRef, useState } from 'react';

type OriginalPageViewerProps = {
  src: string;
  title: string;
};

export default function OriginalPageViewer({ src, title }: OriginalPageViewerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previewRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  // A cached image can finish loading before hydration attaches onLoad, which
  // then never fires and leaves the preview stuck at opacity 0 — check on mount.
  useEffect(() => {
    const img = previewRef.current;
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, [src]);
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

  return (
    <section className="abstract original-page">
      <div className="original-page-heading">
        <div>
          <h2>확장요약문</h2>
          <p>학술대회 제출 원문</p>
        </div>
        <a href={src} target="_blank" rel="noreferrer">
          원문 열기
        </a>
      </div>

      <button className="page-preview" type="button" onClick={openViewer} aria-label="확장요약문 확대 보기">
        {!loaded && <span className="page-skeleton" aria-hidden="true" />}
        <img
          ref={previewRef}
          className={loaded ? 'loaded' : ''}
          src={src}
          alt={`${title} 확장요약문`}
          width="1434"
          height="2024"
          loading="lazy"
          onLoad={() => setLoaded(true)}
        />
        <span className="zoom-hint">눌러서 확대</span>
      </button>

      <dialog
        ref={dialogRef}
        className="page-viewer"
        aria-label={`${title} 확장요약문 전체 화면`}
        onClose={() => setZoomed(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeViewer();
        }}
      >
        <header>
          <div>
            <b>확장요약문</b>
            <span>{title}</span>
          </div>
          <button type="button" onClick={enterFullscreen}>전체 화면</button>
          <a href={src} target="_blank" rel="noreferrer">원본 열기</a>
          <button type="button" onClick={closeViewer} aria-label="닫기">×</button>
        </header>
        <div className={`page-viewer-canvas${zoomed ? ' zoomed' : ''}`}>
          <button type="button" onClick={() => setZoomed((current) => !current)} aria-label={zoomed ? '축소하기' : '확대하기'}>
            <img src={src} alt={`${title} 확장요약문 확대`} width="1434" height="2024" />
          </button>
        </div>
      </dialog>
    </section>
  );
}
