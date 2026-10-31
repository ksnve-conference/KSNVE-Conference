'use client';

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

let lastPopState = 0;
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => { lastPopState = Date.now(); });
}

/** True while mounting a screen reached with back/forward. */
export const arrivedByBack = () => Date.now() - lastPopState < 2000;

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
    writeStored(screen, { ...latest.current, scrollY: window.scrollY });
  }, [screen]);
  const pendingScroll = useRef<number | null>(null);
  const restoreRef = useRef(restore);
  restoreRef.current = restore;

  useEffect(() => {
    const saved = arrivedByBack() ? readStored(screen) : null;
    if (saved) {
      restoreRef.current(saved);
      if (typeof saved.scrollY === 'number') pendingScroll.current = saved.scrollY;
    }
    setReady(true);
  }, [screen]);

  // Scroll once the restored state is on screen; two frames lets the longer
  // list lay out before jumping into it.
  useEffect(() => {
    if (!ready || pendingScroll.current === null) return;
    const y = pendingScroll.current;
    pendingScroll.current = null;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.scrollTo({ top: y, behavior: 'instant' });  // not the page's smooth scroll
      save();  // the save on mount ran before this jump and stored the top
    }));
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
