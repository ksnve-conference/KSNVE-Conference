/** Shared between the forms and /api/feedback, so both check the same limits. */

import sessionsData from '@/data/sessions.json';

export const feedbackCategories = ['행사 운영', '발표장 · 시설', '앱 오류 · 개선', '기타'] as const;
export const surveyRoles = ['학계', '연구계', '산업계', '학생', '기타'] as const;
export const surveyAgain = ['예', '아직 모르겠음', '아니오'] as const;
export const surveyParticipation = ['구두 발표', '포스터 발표', '좌장', '청중', '전시 참가'] as const;
export const surveyGenders = ['남성', '여성', '응답하지 않음'] as const;
export const surveyAges = ['20대 이하', '30대', '40대', '50대', '60대', '70대 이상', '응답하지 않음'] as const;
export const surveyVisits = ['처음', '2~3회', '4~5회', '6~9회', '10회 이상'] as const;

/** 가장 유익했던 분야: every session category in programme order, grouped like the programme book. */
const categories = Array.from(new Set((sessionsData as { category: string }[]).map((x) => x.category)));
const prefixed = (prefix: string) => categories.filter((c) => c.startsWith(`${prefix} `)).map((c) => c.slice(prefix.length + 1));
export const surveyFieldGroups = [
  { label: '일반 분야', items: categories.filter((c) => !/^(기획|부문|특별) /.test(c)) },
  { label: '기획세션', items: prefixed('기획') },
  { label: '부문세션', items: prefixed('부문') },
  { label: '특별세션', items: [...prefixed('특별'), '기업 특별세션'] },
];
/** Each group needs an answer; this choice is how someone who skipped that kind of session says so. */
export const FIELD_NONE = '해당 없음';
export const fieldNone = (group: string) => `${group}: ${FIELD_NONE}`;
const fieldGroupOf = new Map(surveyFieldGroups.flatMap((g) => [...g.items, fieldNone(g.label)].map((item) => [item, g.label] as const)));
/** Stored as "[기획] 디지털 헬스" so sheet readers see where an item came from. */
export const fieldLabel = (item: string) => {
  const group = fieldGroupOf.get(item);
  return group?.endsWith('세션') && item !== fieldNone(group) ? `[${group.replace('세션', '')}] ${item}` : item;
};

/** Every group has a choice, and 해당 없음 is never mixed with real ones. */
export const fieldsComplete = (fields: string[]) => surveyFieldGroups.every((g) => {
  const picked = fields.filter((f) => fieldGroupOf.get(f) === g.label);
  return picked.length > 0 && (!picked.includes(fieldNone(g.label)) || picked.length === 1);
});

/** 웰컴 리셉션 and 만찬 appear here for the event itself and under 식사 for the food. */
export const surveyEvents = ['웰컴 리셉션', '전시부스 투어', '학생 멘토링', '교양강좌', '마술공연', '캐리커처 체험', '만찬'] as const;
export const ratingLabels = ['매우 불만족', '불만족', '보통', '만족', '매우 만족'] as const;

/**
 * Rows people may not have experienced take an explicit 해당 없음 (stored as 0)
 * instead of a blank, so a skipped row can't be mistaken for an unused service.
 * `notApplicable: 'always'` offers it to everyone; `'exhibitOnly'` only to
 * people whose sole role was 전시 참가 (they didn't sit in sessions).
 * Consecutive entries with the same `group` are asked as one question with a row each.
 */
export const NOT_APPLICABLE = 0;
export const NOT_APPLICABLE_LABEL = '해당 없음';
export type RatingQuestion = { id: string; label: string; group?: string; notApplicable?: 'always' | 'exhibitOnly' };
const ACADEMIC = '학술 프로그램은 어떠셨나요?';
const MEALS = '식사(음식)는 어떠셨나요?';
export const ratingQuestions: readonly RatingQuestion[] = [
  { id: 'overall', label: '학술대회 전반에 얼마나 만족하셨나요?' },
  { id: 'program_level', label: '발표 내용의 수준', group: ACADEMIC, notApplicable: 'exhibitOnly' },
  { id: 'program_qa', label: '질의응답·토론', group: ACADEMIC, notApplicable: 'exhibitOnly' },
  { id: 'program_chair', label: '좌장 진행', group: ACADEMIC, notApplicable: 'exhibitOnly' },
  { id: 'program_facility', label: '발표장 시설 (음향·영상·노트북)', group: ACADEMIC, notApplicable: 'exhibitOnly' },
  { id: 'program_poster', label: '포스터 세션 운영', group: ACADEMIC, notApplicable: 'always' },
  { id: 'venue', label: '행사장과 현장 운영은 어떠셨나요?' },
  { id: 'location', label: '행사장 위치(교통·접근성)는 어떠셨나요?' },
  { id: 'lodging', label: '주변 숙소는 어떠셨나요?', notApplicable: 'always' },
  { id: 'meal_reception', label: '웰컴 리셉션', group: MEALS, notApplicable: 'always' },
  { id: 'meal_lunch', label: '점심', group: MEALS, notApplicable: 'always' },
  { id: 'meal_dinner', label: '만찬', group: MEALS, notApplicable: 'always' },
  { id: 'souvenir', label: '기념품은 어떠셨나요?' },
  { id: 'app', label: '학술대회 앱은 도움이 되었나요?' },
];
/** ratingQuestions as the form asks them: single questions, and groups folded into one. */
export const ratingBlocks = ratingQuestions.reduce<RatingQuestion[][]>((blocks, q) => {
  const last = blocks[blocks.length - 1];
  if (q.group && last?.[0].group === q.group) last.push(q); else blocks.push([q]);
  return blocks;
}, []);

export const exhibitOnly = (participation: readonly string[]) => participation.length === 1 && participation[0] === '전시 참가';
export const allowsNotApplicable = (q: RatingQuestion, participation: readonly string[]) => (
  q.notApplicable === 'always' || (q.notApplicable === 'exhibitOnly' && exhibitOnly(participation))
);
const isAnswer = (value: unknown, noneAllowed: boolean) => isRating(value) || (noneAllowed && value === NOT_APPLICABLE);
export const ratingAnswered = (q: RatingQuestion, value: unknown, participation: readonly string[]) => (
  isAnswer(value, allowsNotApplicable(q, participation))
);
/** Every row needs a score, or 해당 없음 where that row allows it. */
export const ratingsComplete = (ratings: Record<string, unknown>, participation: readonly string[]) => (
  ratingQuestions.every((q) => ratingAnswered(q, ratings[q.id], participation))
);
/** Every 부대행사 needs a score or 해당 없음. */
export const eventsComplete = (events: Record<string, unknown>) => surveyEvents.every((e) => isAnswer(events[e], true));

export const MESSAGE_MAX = 1000;
export const EMAIL_MAX = 120;
export const DEVICE_MAX = 300;

export type FeedbackData = { category: string; message: string; sender: string; email: string; device: string };
export const SENDER_MAX = 100;
export type SurveyData = {
  role: string; participation: string[]; wishes: string; venueWish: string; gender: string; age: string; visits: string; ratings: Record<string, number>;
  fields: string[]; events: Record<string, number>; again: string; comment: string;
};
export type FeedbackPayload =
  | { kind: 'feedback'; data: FeedbackData; website?: string }
  | { kind: 'survey'; data: SurveyData; website?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isRating = (value: unknown) => Number.isInteger(value) && (value as number) >= 1 && (value as number) <= 5;
const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

/** Returns the cleaned payload, or null when it isn't one the forms could have sent. */
export function cleanPayload(raw: unknown): FeedbackPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const { kind, data } = raw as { kind?: unknown; data?: Record<string, unknown> };
  if (!data || typeof data !== 'object') return null;
  if (kind === 'feedback') {
    const category = text(data.category, 40);
    const message = text(data.message, MESSAGE_MAX);
    const email = text(data.email, EMAIL_MAX);
    if (!(feedbackCategories as readonly string[]).includes(category) || !message) return null;
    if (email && !EMAIL.test(email)) return null;
    return { kind, data: { category, message, sender: text(data.sender, SENDER_MAX), email, device: text(data.device, DEVICE_MAX) } };
  }
  if (kind === 'survey') {
    const role = text(data.role, 20);
    const participation = Array.isArray(data.participation)
      ? (surveyParticipation as readonly string[]).filter((p) => (data.participation as unknown[]).includes(p)) : [];
    if (participation.length !== 1) return null;  // 주요 역할: exactly one
    const gender = text(data.gender, 20);
    const age = text(data.age, 20);
    const visits = text(data.visits, 20);
    const again = text(data.again, 20);
    if (!(surveyRoles as readonly string[]).includes(role) || !(surveyAgain as readonly string[]).includes(again)) return null;
    if (!(surveyVisits as readonly string[]).includes(visits)) return null;
    if (!(surveyGenders as readonly string[]).includes(gender) || !(surveyAges as readonly string[]).includes(age)) return null;
    const rawRatings = data.ratings && typeof data.ratings === 'object' ? data.ratings as Record<string, unknown> : {};
    if (!ratingsComplete(rawRatings, participation)) return null;
    const ratings = Object.fromEntries(ratingQuestions.map((q) => [q.id, rawRatings[q.id] as number]));
    const fields = Array.isArray(data.fields) ? Array.from(new Set(data.fields.filter((f): f is string => typeof f === 'string'))) : [];
    if (!fields.every((f) => fieldGroupOf.has(f)) || !fieldsComplete(fields)) return null;
    const rawEvents = data.events && typeof data.events === 'object' ? data.events as Record<string, unknown> : {};
    if (!eventsComplete(rawEvents)) return null;
    const events = Object.fromEntries(surveyEvents.map((e) => [e, rawEvents[e] as number]));
    return {
      kind,
      data: {
        role, participation, gender, age, visits, again, wishes: text(data.wishes, MESSAGE_MAX), venueWish: text(data.venueWish, MESSAGE_MAX), fields: fields.map(fieldLabel), events, comment: text(data.comment, MESSAGE_MAX),
        ratings,
      },
    };
  }
  return null;
}

export async function sendFeedback(payload: FeedbackPayload): Promise<boolean> {
  try {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
