/**
 * Installed home-screen apps scroll an inner #app-scroll container instead of
 * the document (see the display-mode: standalone rules in globals.css): iOS 26
 * lets a fixed bottom bar drift up while the document scrolls (WebKit bug
 * 297779). These helpers read and set the scroll position wherever it lives.
 */
function scroller(): HTMLElement | null {
  const el = document.getElementById('app-scroll');
  return el && getComputedStyle(el).overflowY !== 'visible' ? el : null;
}

export function getScrollY(): number {
  const el = scroller();
  return el ? el.scrollTop : window.scrollY;
}

export function scrollToY(top: number, behavior: ScrollBehavior = 'instant') {
  const el = scroller();
  if (el) el.scrollTo({ top, behavior });
  else window.scrollTo({ top, behavior });
}
