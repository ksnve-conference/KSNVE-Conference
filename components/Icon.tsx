type IconProps = { name: IconName; size?: number; className?: string; strokeWidth?: number };

export type IconName =
  | 'calendar' | 'papers' | 'search' | 'star' | 'star-filled' | 'more'
  | 'pin' | 'clock' | 'chevron' | 'chevron-down' | 'back' | 'close'
  | 'bell' | 'check' | 'info' | 'sponsor' | 'notice' | 'map' | 'download'
  | 'file' | 'user' | 'plus' | 'alert' | 'external' | 'expand' | 'filter' | 'share';

const paths: Record<IconName, React.ReactNode> = {
  calendar: <><rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/></>,
  papers: <><path d="M7 3.5h9l4 4v13a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 6 20.5v-15A2 2 0 0 1 7 3.5Z"/><path d="M15.5 3.5V8h4.5M9.5 13h6M9.5 17h4"/></>,
  search: <><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></>,
  star: <path d="M12 3.6l2.6 5.5 5.9.8-4.3 4.2 1 6-5.2-2.8-5.2 2.8 1-6L3.5 9.9l5.9-.8L12 3.6Z"/>,
  'star-filled': <path d="M12 3.6l2.6 5.5 5.9.8-4.3 4.2 1 6-5.2-2.8-5.2 2.8 1-6L3.5 9.9l5.9-.8L12 3.6Z" fill="currentColor" stroke="none"/>,
  more: <><circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none"/></>,
  pin: <><path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/></>,
  clock: <><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></>,
  chevron: <path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>,
  'chevron-down': <path d="m5.5 9.5 6.5 6.5 6.5-6.5"/>,
  back: <path d="m14.5 5.5-6.5 6.5 6.5 6.5"/>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  bell: <><path d="M18 8.8a6 6 0 1 0-12 0c0 5.2-2 6.7-2 6.7h16s-2-1.5-2-6.7Z"/><path d="M13.7 19a2 2 0 0 1-3.4 0"/></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5"/>,
  info: <><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.2"/></>,
  sponsor: <><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/></>,
  notice: <><path d="M4 9.5h4l7-4.5v14l-7-4.5H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z"/><path d="M18.5 9a4 4 0 0 1 0 6"/></>,
  map: <><path d="m3 6.5 6-2.5 6 2.5 6-2.5v14l-6 2.5-6-2.5-6 2.5v-14Z"/><path d="M9 4v14.5M15 6.5V21"/></>,
  download: <><path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5"/><path d="M4.5 17v2a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-2"/></>,
  file: <><path d="M7 3.5h7l5 5v12a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 20.5v-15A2 2 0 0 1 7 3.5Z"/><path d="M13.5 3.5V9H19"/></>,
  user: <><circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/></>,
  plus: <path d="M12 5.5v13M5.5 12h13"/>,
  alert: <><path d="M12 4.5 21 19.5H3L12 4.5Z"/><path d="M12 10v4M12 16.8v.2"/></>,
  external: <><path d="M14 4.5h5.5V10"/><path d="m19.5 4.5-8 8"/><path d="M18 14v5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 19V8a1.5 1.5 0 0 1 1.5-1.5h5"/></>,
  expand: <><path d="M9 4.5H4.5V9M15 4.5h4.5V9M9 19.5H4.5V15M15 19.5h4.5V15"/></>,
  filter: <path d="M4 5.5h16M7.5 12h9M10.5 18.5h3"/>,
  share: <><path d="M12 14V3.5"/><path d="m8 7.2 4-3.7 4 3.7"/><path d="M4.5 13v4.5A1.5 1.5 0 0 0 6 19h12a1.5 1.5 0 0 0 1.5-1.5V13"/></>,
};

export default function Icon({ name, size = 20, className, strokeWidth = 1.7 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}
