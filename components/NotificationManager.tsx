'use client';

import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/Icon';
import { papers, sessions } from '@/lib/conference';
import { notificationTargets } from '@/lib/notification-targets';
import { useSaved } from '@/lib/saved';

const notifiedKey = 'ksnveNotifiedPapers';
// The browser permission can't be withdrawn from a web page once granted, so
// the app keeps its own on/off switch on top of it.
const enabledKey = 'ksnveNotificationsOn';

function readEnabled() {
  try { return localStorage.getItem(enabledKey) !== 'off'; } catch { return true; }
}
function writeEnabled(on: boolean) {
  try { localStorage.setItem(enabledKey, on ? 'on' : 'off'); window.dispatchEvent(new Event('ksnve:notifications-changed')); } catch { /* private mode */ }
}

const scopeMessage = '이 사이트를 보고 있을 때 저장한 일정의 시작 전 10분 이내에 알려드립니다. 세션 저장 시 포함된 발표도 대상입니다. 앱을 닫거나 다른 앱을 사용 중일 때는 알림이 제공되지 않습니다.';

function useNotificationPreferences() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [enabled, setEnabled] = useState(true);
  useEffect(() => {
    const sync = () => {
      setPermission('Notification' in window ? Notification.permission : 'unsupported');
      setEnabled(readEnabled());
    };
    sync();
    window.addEventListener('ksnve:notifications-changed', sync);
    window.addEventListener('storage', sync);
    window.addEventListener('pageshow', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      window.removeEventListener('ksnve:notifications-changed', sync);
      window.removeEventListener('storage', sync);
      window.removeEventListener('pageshow', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);
  return { permission, enabled, setPermission, setEnabled };
}

/** One watcher in the root layout keeps reminders active across page navigation. */
export function NotificationWatcher() {
  const { savedPapers, savedSessions } = useSaved();
  const targets = useMemo(() => notificationTargets(papers, sessions, savedPapers, savedSessions), [savedPapers, savedSessions]);
  const { permission, enabled } = useNotificationPreferences();
  useEffect(() => {
    if (permission !== 'granted' || !enabled) return;
    let checking = false;
    let stopped = false;
    const check = async () => {
      if (checking || stopped || document.visibilityState !== 'visible') return;
      checking = true;
      const now = Date.now();
      let notified: string[] = [];
      try {
        const value: unknown = JSON.parse(localStorage.getItem(notifiedKey) || '[]');
        if (Array.isArray(value)) notified = value.filter((item): item is string => typeof item === 'string');
      } catch { notified = []; }
      const next = new Set(notified);
      for (const paper of targets) {
        const start = paper.start;
        if (!start || stopped) continue;
        const notifyAt = start - 10 * 60 * 1000;
        if (now >= notifyAt && now < start && !next.has(paper.id)) {
          try {
            const options = { body: `${paper.title} · ${paper.venue}`, tag: `paper-${paper.id}` };
            const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
            if (stopped || document.visibilityState !== 'visible') break;
            const title = paper.kind === 'paper' ? '발표가 곧 시작됩니다' : '행사가 곧 시작됩니다';
            if (registration?.active) await registration.showNotification(title, options);
            else new Notification(title, options);
            next.add(paper.id);
          } catch { /* Unsupported or revoked permission: retry on the next check. */ }
        }
      }
      checking = false;
      try { localStorage.setItem(notifiedKey, JSON.stringify([...next])); } catch { /* quota */ }
    };
    check();
    const timer = window.setInterval(check, 30_000);
    document.addEventListener('visibilitychange', check);
    window.addEventListener('pageshow', check);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('pageshow', check);
    };
  }, [targets, permission, enabled]);

  return null;
}

/** Permission and on/off controls remain in My Schedule. */
export default function NotificationManager() {
  const { permission, enabled, setPermission, setEnabled } = useNotificationPreferences();
  const toggle = (on: boolean) => { writeEnabled(on); setEnabled(on); };

  if (permission === 'unsupported') return null;

  if (permission === 'granted' && enabled) {
    return (
      <button type="button" className="notification-status notification-on" onClick={() => toggle(false)}>
        <span><Icon name="check" size={16} /></span>
        <div><b>일정 알림 켜짐</b><small>{scopeMessage}</small></div>
        <em>끄기</em>
      </button>
    );
  }

  if (permission === 'granted') {
    return (
      <button type="button" className="notification-prompt" onClick={() => toggle(true)}>
        <span><Icon name="bell" size={17} /></span>
        <div><b>일정 알림 꺼짐</b><small>{scopeMessage}</small></div>
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
      <div><b>일정 알림 받기</b><small>{scopeMessage}</small></div>
      <em>켜기</em>
    </button>
  );
}
