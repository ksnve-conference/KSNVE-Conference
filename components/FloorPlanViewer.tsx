'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';

type FloorPlanViewerProps = {
  floor: string;
  src: string;
  width: number;
  height: number;
  /** Overrides the default "{floor} 행사장 배치도" wording (e.g. the 동선 map). */
  title?: string;
};

export default function FloorPlanViewer({ floor, src, width, height, title }: FloorPlanViewerProps) {
  const name = title ?? `${floor} 행사장 배치도`;
  const dialogRef = useRef<HTMLDialogElement>(null);
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
    if (dialogRef.current?.requestFullscreen) await dialogRef.current.requestFullscreen();
  };

  return (
    <>
      <div className="floor-plan-stage" data-floor={floor}>
        <button type="button" className="floor-plan-preview" onClick={openViewer} aria-label={`${name} 확대 보기`}>
          <Image src={src} alt={name} width={width} height={height} sizes="(max-width: 760px) 100vw, 720px" />
          <span>눌러서 확대</span>
        </button>
        <div className="floor-plan-pin-layer" aria-hidden="true" data-floor={floor} />
      </div>

      <dialog ref={dialogRef} className="floor-plan-dialog" aria-label={`${name} 전체 화면`} onClose={() => setZoomed(false)}>
        <header>
          <b>{name}</b>
          <button type="button" onClick={enterFullscreen}>전체 화면</button>
          <button type="button" onClick={closeViewer} aria-label="닫기">×</button>
        </header>
        <div className={`floor-plan-dialog-canvas${zoomed ? ' zoomed' : ''}`}>
          <button type="button" onClick={() => setZoomed((current) => !current)} aria-label={zoomed ? '배치도 축소하기' : '배치도 확대하기'}>
            <img src={src} alt={`${name} (확대)`} width={width} height={height} />
          </button>
        </div>
      </dialog>
    </>
  );
}
