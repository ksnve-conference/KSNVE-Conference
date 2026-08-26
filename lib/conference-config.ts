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
  venue: '여수 엑스포컨벤션센터',
  locationDisplay: 'Yeosu Expo Convention Center, Yeosu, Korea',
  /** Weekday labels for the date strip, derived from `dates`. */
  dayNames: ['수', '목', '금', '토'],
} as const;

export type ConferenceConfig = typeof conferenceConfig;
