'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { papers } from '@/lib/conference';

const notifiedKey = 'ksnveNotifiedPapers';

/** Conference times are Korea Standard Time regardless of the device's own zone. */
function paperStartMs(date: string, time: string) {
  const start = time.split(/[~–-]/)[0]?.trim() || '00:00';
  const value = Date.parse(`${date}T${start}:00+09:00`);
  return Number.isNaN(value) ? 0 : value;
}

export default function NotificationManager({ favoriteIds }: { favoriteIds: string[] }) {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    setPermission('Notification' in window ? Notification.permission : 'unsupported');
  }, []);

  useEffect(() => {
    if (permission !== 'granted') return;
    const check = () => {
      const now = Date.now();
      let notified: string[] = [];
      try {
        const value: unknown = JSON.parse(localStorage.getItem(notifiedKey) || '[]');
        if (Array.isArray(value)) notified = value.filter((item): item is string => typeof item === 'string');
      } catch { notified = []; }
      const next = new Set(notified);
      papers.filter((paper) => favoriteIds.includes(paper.id)).forEach((paper) => {
        const start = paperStartMs(paper.date, paper.time);
        if (!start) return;
        const notifyAt = start - 10 * 60 * 1000;
        if (now >= notifyAt && now < start && !next.has(paper.id)) {
          new Notification('발표가 10분 후 시작됩니다', { body: `${paper.title} · ${paper.venue}`, tag: `paper-${paper.id}` });
          next.add(paper.id);
        }
      });
      try { localStorage.setItem(notifiedKey, JSON.stringify([...next])); } catch { /* quota */ }
    };
    check();
    const timer = window.setInterval(check, 30_000);
    return () => window.clearInterval(timer);
  }, [favoriteIds, permission]);

  if (permission === 'unsupported') return null;

  if (permission === 'granted') {
    return (
      <div className="notification-status">
        <span><Icon name="check" size={16} /></span>
        <div><b>일정 알림 켜짐</b><small>앱이 열려 있는 동안 발표 10분 전에 알려드립니다.</small></div>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="notification-status denied">
        <span><Icon name="alert" size={16} /></span>
        <div><b>알림이 차단되어 있습니다</b><small>브라우저 사이트 설정에서 알림을 허용해 주세요.</small></div>
      </div>
    );
  }

  const request = async () => setPermission(await Notification.requestPermission());
  return (
    <button className="notification-prompt" onClick={request}>
      <span><Icon name="bell" size={17} /></span>
      <div><b>발표 알림 받기</b><small>앱이 열려 있는 동안 발표 10분 전에 알려드립니다.</small></div>
      <em>켜기</em>
    </button>
  );
}
