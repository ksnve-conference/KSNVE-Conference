/**
 * Conference metadata. Everything schedule-related now lives in `data/`, so
 * swapping in the real autumn programme means replacing JSON files only —
 * no code changes, no runtime date rewriting.
 */
export const conferenceConfig = {
  koreanTitle: '2026년도 추계 소음진동 학술대회',
  englishTitle: 'KSNVE Annual Fall Conference 2026',
  shortTitle: 'KSNVE 2026 Fall',
  headerTitle: '2026 추계 소음진동 학술대회',
  shortKoreanTitle: '추계학술대회',
  startDate: '2026-11-25',
  endDate: '2026-11-28',
  dates: ['2026-11-25', '2026-11-26', '2026-11-27', '2026-11-28'],
  displayDate: '2026. 11. 25.(수) ~ 28.(토)',
  /** Compact form for the home hero's date chip. */
  heroDate: '11.25(수) – 28(토)',
  /** Official theme as printed in the programme book. */
  theme: '지속 가능한 내일의 소음진동',
  venue: '여수 엑스포컨벤션센터',
  locationDisplay: 'Yeosu Expo Convention Center, Yeosu, Korea',
  /** Weekday labels for the date strip, derived from `dates`. */
  dayNames: ['수', '목', '금', '토'],
  /**
   * Authors' submitted extended-abstract pages (public/paper-pages/pNNN.webp).
   * Kept private until the secretariat finishes the bibliographic edit; while
   * false the paper page shows a notice and proxy.ts answers 404 for the files.
   */
  originalPagesPublic: false,
  /** 만족도 설문: home banner and the form are open in this window (KST). */
  surveyOpensAt: '2026-11-28T12:00:00+09:00',
  surveyClosesAt: '2026-12-12T23:59:59+09:00',
} as const;

export type ConferenceConfig = typeof conferenceConfig;
