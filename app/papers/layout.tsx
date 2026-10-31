import { conferenceConfig } from '@/lib/conference-config';

// default: the 통합검색 tab itself; template: keeps the conference-name suffix
// on the paper pages below it (a plain string here would drop it for them).
export const metadata = {
  title: { default: '통합검색', template: `%s | ${conferenceConfig.headerTitle}` },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
