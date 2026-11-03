'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLayoutEffect } from 'react';
import Icon, { type IconName } from '@/components/Icon';
import { scrollToY } from '@/lib/scroll';

// AppTabs remounts with each page. Only explicit menu navigation resets scroll;
// returning from a detail page must keep the list's saved position.
let pendingTab: string | null = null;

const items: { href: string; label: string; icon: IconName; match: (path: string) => boolean }[] = [
  { href: '/', label: '프로그램', icon: 'calendar', match: (p) => p === '/' || p.startsWith('/sessions') },
  { href: '/papers', label: '통합검색', icon: 'search', match: (p) => p.startsWith('/papers') },
  { href: '/my', label: '내 일정', icon: 'star', match: (p) => p.startsWith('/my') },
  { href: '/more', label: '더보기', icon: 'more', match: (p) => p.startsWith('/more') || p.startsWith('/venues') || p.startsWith('/notices') || p.startsWith('/sponsors') || p.startsWith('/conference') || p.startsWith('/app-info') },
];

export default function AppTabs() {
  const pathname = usePathname() || '/';
  useLayoutEffect(() => {
    if (pendingTab !== pathname) return;
    pendingTab = null;
    scrollToY(0);
  }, [pathname]);

  return (
    <nav className="bottom" aria-label="주 메뉴">
      <div className="bottom-inner">
        {items.map((item) => {
          const active = item.match(pathname);
          return (
            <Link key={item.href} href={item.href} scroll={false}
              onNavigate={(event) => {
                if (pathname === item.href) {
                  event.preventDefault();
                  pendingTab = null;
                  scrollToY(0, 'smooth');
                } else {
                  pendingTab = item.href;
                }
              }}
              className={`navbtn ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined}>
              <span><Icon name={active && item.icon === 'star' ? 'star-filled' : item.icon} size={22} /></span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
