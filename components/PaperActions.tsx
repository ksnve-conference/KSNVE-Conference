'use client';

import Icon from '@/components/Icon';
import { useSaved } from '@/lib/saved';

export default function PaperActions({ id, title }: { id: string; title: string }) {
  const { savedPapers, togglePaper } = useSaved();
  const saved = savedPapers.includes(id);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title, url });
      else await navigator.clipboard.writeText(url);
    } catch { /* the user dismissed the sheet */ }
  };

  return (
    <div className="paper-actions">
      <button type="button" className={saved ? 'on' : ''} onClick={() => togglePaper(id)} aria-pressed={saved}>
        <Icon name={saved ? 'star-filled' : 'star'} size={17} />
        {saved ? '내 일정에 저장됨' : '내 일정에 저장'}
      </button>
      <button type="button" onClick={share} aria-label="이 발표 공유하기">
        <Icon name="external" size={16} /> 공유
      </button>
    </div>
  );
}
