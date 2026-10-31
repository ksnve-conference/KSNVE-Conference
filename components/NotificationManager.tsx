'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { papers } from '@/lib/conference';

const notifiedKey = 'ksnveNotifiedPapers';
// The browser permission can't be withdrawn from a web page once granted, so
// the app keeps its own on/off switch on top of it.
const enabledKey = 'ksnveNotificationsOn';

function readEnabled() {
  try { return localStorage.getItem(enabledKey) !== 'off'; } catch { return true; }
}
function writeEnabled(on: boolean) {
  try { localStorage.setItem(enabledKey, on ? 'on' : 'off'); } catch { /* private mode */ }
}

/** Conference times are Korea Standard Time regardless of the device's own zone. */
function paperStartMs(date: string, time: string) {
  const start = time.split(/[~–-]/)[0]?.trim() || '00:00';
  const value = Date.parse(`${date}T${start}:00+09:00`);
  return Number.isNaN(value) ? 0 : value;
}

export default function NotificationManager({ favoriteIds }: { favoriteIds: string[] }) {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setPermission('Notification' in window ? Notification.permission : 'unsupported');
    setEnabled(readEnabled());
  }, []);

  const toggle = (on: boolean) => { writeEnabled(on); setEnabled(on); };

  useEffect(() => {
    if (permission !== 'granted' || !enabled) return;
    let checking = false;
    let stopped = false;
    const check = async () => {
      if (checking || stopped) return;
      checking = true;
      const now = Date.now();
      let notified: string[] = [];
      try {
        const value: unknown = JSON.parse(localStorage.getItem(notifiedKey) || '[]');
        if (Array.isArray(value)) notified = value.filter((item): item is string => typeof item === 'string');
      } catch { notified = []; }
      const next = new Set(notified);
      for (const paper of papers.filter((paper) => favoriteIds.includes(paper.id))) {
        const start = paperStartMs(paper.date, paper.time);
        if (!start || stopped) continue;
        const notifyAt = start - 10 * 60 * 1000;
        if (now >= notifyAt && now < start && !next.has(paper.id)) {
          try {
            const options = { body: `${paper.title} · ${paper.venue}`, tag: `paper-${paper.id}` };
            const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
            if (stopped) break;
            if (registration?.active) await registration.showNotification('발표가 곧 시작됩니다', options);
            else new Notification('발표가 곧 시작됩니다', options);
            next.add(paper.id);
          } catch { /* Unsupported or revoked permission: retry on the next check. */ }
        }
      }
      checking = false;
      try { localStorage.setItem(notifiedKey, JSON.stringify([...next])); } catch { /* quota */ }
    };
    check();
    const timer = window.setInterval(check, 30_000);
    return () => { stopped = true; window.clearInterval(timer); };
  }, [favoriteIds, permission, enabled]);

  if (permission === 'unsupported') return null;

  if (permission === 'granted' && enabled) {
    return (
      <button type="button" className="notification-status notification-on" onClick={() => toggle(false)}>
        <span><Icon name="check" size={16} /></span>
        <div><b>일정 알림 켜짐</b><small>내 일정 화면이 열려 있는 동안 발표 시작 전 10분 이내에 알려드립니다.</small></div>
        <em>끄기</em>
      </button>
    );
  }

  if (permission === 'granted') {
    return (
      <button type="button" className="notification-prompt" onClick={() => toggle(true)}>
        <span><Icon name="bell" size={17} /></span>
        <div><b>일정 알림 꺼짐</b><small>켜면 내 일정 화면이 열려 있는 동안 발표 시작 전 10분 이내에 알려드립니다.</small></div>
        <em>켜기</em>
      </button>
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

  const request = async () => {
    const result = await Notification.requestPermission();
    if (result === 'granted') toggle(true);
    setPermission(result);
  };
  return (
    <button className="notification-prompt" onClick={request}>
      <span><Icon name="bell" size={17} /></span>
      <div><b>발표 알림 받기</b><small>내 일정 화면이 열려 있는 동안 발표 시작 전 10분 이내에 알려드립니다.</small></div>
      <em>켜기</em>
    </button>
  );
}
