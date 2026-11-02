'use client';

import { useViewState } from '@/lib/view-state';

const nothingToRestore = () => {};

/** Keeps a plain server-rendered screen's scroll position across a detail page and back. */
export default function ScrollMemory({ screen }: { screen: string }) {
  useViewState(screen, {}, nothingToRestore);
  return null;
}
