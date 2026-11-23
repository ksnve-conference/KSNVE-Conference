'use client';

import { useEffect, useRef } from 'react';

/**
 * "PDF 저장·공유": on phones, hands the PDF to the system share sheet (파일에 저장,
 * 카카오톡, 메일, 인쇄 …). A home-screen app opens new tabs in a bare viewer with no
 * save menu, so a plain link is not enough there. Elsewhere — or if sharing fails —
 * it falls back to a normal download.
 *
 * iOS only allows navigator.share() close to the tap, so the file is fetched as
 * soon as the button scrolls into view and the tap shares it without waiting.
 */
export default function PdfShareButton({ href, fileName }: { href: string; fileName: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const file = useRef<File | null>(null);
  const loading = useRef<Promise<File | null> | null>(null);

  const load = () => {
    loading.current ??= fetch(href)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then((blob) => (file.current = new File([blob], fileName, { type: 'application/pdf' })))
      .catch(() => null);
    return loading.current;
  };

  const shareable = () => typeof navigator !== 'undefined' && 'share' in navigator
    && window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  useEffect(() => {
    const el = ref.current;
    if (!el || !shareable()) return undefined;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { void load(); io.disconnect(); }
    }, { rootMargin: '400px' });
    io.observe(el);
    return () => io.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [href]);

  const onClick = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!shareable()) return;               // desktop: let the download link work
    event.preventDefault();
    const ready = file.current ?? await load();
    if (ready && navigator.canShare?.({ files: [ready] })) {
      try {
        await navigator.share({ files: [ready] });   // files only: a title becomes an extra text item in some apps
        return;
      } catch (error) {
        if ((error as DOMException)?.name === 'AbortError') return;   // user closed the sheet
      }
    }
    window.open(href, '_blank', 'noopener');  // last resort: the old behaviour
  };

  return (
    <a ref={ref} href={href} download={fileName} onClick={onClick}>PDF 저장·공유</a>
  );
}
