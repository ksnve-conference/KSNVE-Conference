'use client';

import { getScrollY, scrollToY } from '@/lib/scroll';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Screen state that survives a trip to a detail page and back.
 *
 * The programme and paper lists keep their selected day, opened sessions and
 * filters in React state, which is gone once the user opens a paper; coming
 * back (phone back gesture, browser back, 「목록으로」) rebuilt the list at
 * day 1, scrolled to the top. State is mirrored to sessionStorage and put back
 * only on a back/forward navigation — a tab tap still opens the screen fresh.
 */

const BACK_KEY = 'ksnveBackAt';

let lastPopState = 0;
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => { lastPopState = Date.now(); });
  // Following a link is a fresh visit, even right after a return.
  document.addEventListener('click', (event) => {
    if (!(event.target as Element | null)?.closest?.('a[href]')) return;
    lastPopState = 0;
    try {
      sessionStorage.removeItem(BACK_KEY);
    } catch {
      // storage unavailable
    }
  }, true);
}

/** Called by 「목록으로」 just before going back, so a slow phone still counts it as a return. */
export function markBackNavigation() {
  try {
    sessionStorage.setItem(BACK_KEY, String(Date.now()));
  } catch {
    // the popstate timestamp still covers most returns
  }
}

/**
 * True while mounting a screen reached with back/forward. A phone on a busy
 * network can take a few seconds to draw the list, so the window is generous.
 */
export const arrivedByBack = () => {
  let marked = 0;
  try {
    marked = Number(sessionStorage.getItem(BACK_KEY)) || 0;
  } catch {
    // storage unavailable
  }
  const since = Date.now() - Math.max(lastPopState, marked);
  return since >= 0 && since < 6000;
};

const storageKey = (screen: string) => `ksnveView:${screen}`;

function readStored(screen: string): Record<string, unknown> | null {
  try {
    const raw = sessionStorage.getItem(storageKey(screen));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStored(screen: string, value: Record<string, unknown>) {
  try {
    sessionStorage.setItem(storageKey(screen), JSON.stringify(value));
  } catch {
    // private mode or storage full: the screen just won't be restored
  }
}

/**
 * `restore(saved)` runs once after mount when the user came back to `screen`;
 * `snapshot` is saved whenever it changes, together with the scroll position,
 * which is reapplied after the restored state has rendered.
 */
export function useViewState(
  screen: string,
  snapshot: Record<string, unknown>,
  restore: (saved: Record<string, unknown>) => void,
) {
  const [ready, setReady] = useState(false);
  const latest = useRef(snapshot);
  latest.current = snapshot;
  const save = useCallback(() => {
    writeStored(screen, { ...latest.current, scrollY: getScrollY() });
  }, [screen]);
  const pendingScroll = useRef<number | null>(null);
  const restoreRef = useRef(restore);
  restoreRef.current = restore;

  useEffect(() => {
    const back = arrivedByBack();
    try {
      sessionStorage.removeItem(BACK_KEY);
    } catch {
      // storage unavailable
    }
    const saved = back ? readStored(screen) : null;
    if (saved) {
      restoreRef.current(saved);
      if (typeof saved.scrollY === 'number') pendingScroll.current = saved.scrollY;
    }
    setReady(true);
  }, [screen]);

  // Scroll once the restored state is on screen. On a phone the long list can
  // still be laying out, or the router can scroll the page after us, so the
  // jump is re-applied for a moment until it holds — unless the user starts
  // scrolling first.
  useEffect(() => {
    if (!ready || pendingScroll.current === null) return undefined;
    const y = pendingScroll.current;
    pendingScroll.current = null;
    let stopped = false;
    const timers: number[] = [];
    const stop = () => { stopped = true; };
    const apply = () => {
      if (stopped || Math.abs(getScrollY() - y) < 4) return;
      scrollToY(y, 'instant');  // not the page's smooth scroll
      save();  // the save on mount ran before this jump and stored the top
    };
    requestAnimationFrame(() => requestAnimationFrame(apply));
    for (const ms of [120, 300, 600, 1000, 1600]) timers.push(window.setTimeout(apply, ms));
    const opts = { passive: true, capture: true } as const;
    window.addEventListener('touchstart', stop, opts);
    window.addEventListener('wheel', stop, opts);
    window.addEventListener('keydown', stop, true);
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener('touchstart', stop, opts);
      window.removeEventListener('wheel', stop, opts);
      window.removeEventListener('keydown', stop, true);
    };
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const serialized = JSON.stringify(snapshot);
  useEffect(() => {
    if (ready) save();
  }, [ready, serialized, save]);

  // Record the scroll position at the tap that leaves the list, while the list
  // is still the page on screen. Saving on every scroll instead also catches
  // the clamped position while the next page swaps in, which is wrong.
  useEffect(() => {
    if (!ready) return undefined;
    document.addEventListener('click', save, true);
    window.addEventListener('pagehide', save);
    return () => {
      document.removeEventListener('click', save, true);
      window.removeEventListener('pagehide', save);
    };
  }, [ready, save]);
}
