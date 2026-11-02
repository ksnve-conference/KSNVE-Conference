'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon, { type IconName } from '@/components/Icon';

const items: { href: string; label: string; icon: IconName; match: (path: string) => boolean }[] = [
  { href: '/', label: '프로그램', icon: 'calendar', match: (p) => p === '/' || p.startsWith('/sessions') },
  { href: '/papers', label: '통합검색', icon: 'search', match: (p) => p.startsWith('/papers') },
  { href: '/my', label: '내 일정', icon: 'star', match: (p) => p.startsWith('/my') },
  { href: '/more', label: '더보기', icon: 'more', match: (p) => p.startsWith('/more') || p.startsWith('/venues') || p.startsWith('/notices') || p.startsWith('/sponsors') || p.startsWith('/conference') || p.startsWith('/app-info') },
];

/**
 * iOS 26 home-screen (standalone) web apps have a WebKit bug where a
 * `position: fixed; bottom: 0` bar drifts up off the bottom edge after
 * scrolling or navigating (WebKit bug 297779), so it overlaps page content.
 * In standalone mode only, measure the gap between the bar and the bottom of
 * the visual viewport and translate the bar back down by that amount.
 */
function useStandaloneBottomAnchor(ref: React.RefObject<HTMLElement | null>, pathname: string) {
  useEffect(() => {
    const nav = ref.current;
    const vv = window.visualViewport;
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (!nav || !vv || !standalone) return;
    let shift = 0;
    let frame = 0;
    const realign = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bottom = nav.getBoundingClientRect().bottom - shift;   // where the bar would sit untranslated
        const gap = Math.round(vv.offsetTop + vv.height - bottom);
        // Only correct a small upward drift; a large gap means the keyboard is open, leave it alone.
        const next = gap > 0 && gap < 80 ? gap : 0;
        if (next !== shift) {
          shift = next;
          nav.style.transform = shift ? `translateY(${shift}px)` : '';
        }
      });
    };
    realign();
    vv.addEventListener('resize', realign);
    vv.addEventListener('scroll', realign);
    window.addEventListener('scroll', realign, { passive: true });
    window.addEventListener('orientationchange', realign);
    return () => {
      cancelAnimationFrame(frame);
      vv.removeEventListener('resize', realign);
      vv.removeEventListener('scroll', realign);
      window.removeEventListener('scroll', realign);
      window.removeEventListener('orientationchange', realign);
      nav.style.transform = '';
    };
  }, [ref, pathname]);
}

export default function AppTabs() {
  const pathname = usePathname() || '/';
  const navRef = useRef<HTMLElement>(null);
  useStandaloneBottomAnchor(navRef, pathname);
  return (
    <nav ref={navRef} className="bottom" aria-label="주 메뉴">
      <div className="bottom-inner">
        {items.map((item) => {
          const active = item.match(pathname);
          return (
            <Link key={item.href} href={item.href} className={`navbtn ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined}>
              <span><Icon name={active && item.icon === 'star' ? 'star-filled' : item.icon} size={22} /></span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
