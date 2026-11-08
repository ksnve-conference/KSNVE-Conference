'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import Icon from '@/components/Icon';
import { useViewState } from '@/lib/view-state';

type Item = {
  id: string;
  title: string;
  count: number;
  heading: ReactNode;
  papers: ReactNode;
};

export default function VenueSessionList({ venueId, items }: { venueId: string; items: Item[] }) {
  const [open, setOpen] = useState<string[]>([]);
  useViewState(`venue:${venueId}`, { open }, (saved) => {
    if (Array.isArray(saved.open)) {
      setOpen(saved.open.filter((id): id is string => typeof id === 'string' && items.some((item) => item.id === id)));
    }
  });

  return (
    <div className="venue-session-list">
      {items.map((item) => {
        const isOpen = open.includes(item.id);
        const panelId = `venue-papers-${item.id}`;
        return (
          <article className="card venue-session-card" key={item.id}>
            <div className="venue-session-row">
              {item.heading}
              {item.count > 0 ? (
                <button
                  type="button"
                  className="time-slot-toggle"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  aria-label={`${item.title} 발표 목록 ${isOpen ? '접기' : '펼치기'}`}
                  onClick={() => setOpen((current) => current.includes(item.id)
                    ? current.filter((id) => id !== item.id)
                    : [...current, item.id])}
                >
                  <em>{item.count}</em>
                  <Icon name="chevron-down" size={16} className={isOpen ? 'rot' : ''} />
                </button>
              ) : (
                <Link className="chevron" href={`/sessions/${item.id}`} aria-label={`${item.title} 세션 보기`}>
                  <Icon name="chevron" size={18} />
                </Link>
              )}
            </div>
            {item.count > 0 && <div id={panelId} hidden={!isOpen}>{item.papers}</div>}
          </article>
        );
      })}
    </div>
  );
}
