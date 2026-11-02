/** Shared between the forms and /api/feedback, so both check the same limits. */

export const feedbackCategories = ['행사 운영', '발표장 · 시설', '앱 오류 · 개선', '기타'] as const;
export const surveyRoles = ['학계', '연구계', '산업계', '학생', '기타'] as const;
export const surveyAgain = ['예', '아직 모르겠음', '아니오'] as const;
export const ratingLabels = ['매우 불만족', '불만족', '보통', '만족', '매우 만족'] as const;
export const ratingQuestions = [
  { id: 'overall', label: '학술대회 전반에 얼마나 만족하셨나요?' },
  { id: 'program', label: '발표·강연 등 프로그램 구성은 어떠셨나요?' },
  { id: 'venue', label: '행사장과 현장 운영은 어떠셨나요?' },
  { id: 'app', label: '학술대회 앱은 도움이 되었나요?' },
] as const;

export const MESSAGE_MAX = 1000;
export const EMAIL_MAX = 120;
export const DEVICE_MAX = 300;

export type FeedbackData = { category: string; message: string; email: string; device: string };
export type SurveyData = {
  role: string; overall: number; program: number; venue: number; app: number; again: string; comment: string;
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
    return { kind, data: { category, message, email, device: text(data.device, DEVICE_MAX) } };
  }
  if (kind === 'survey') {
    const role = text(data.role, 20);
    const again = text(data.again, 20);
    if (!(surveyRoles as readonly string[]).includes(role) || !(surveyAgain as readonly string[]).includes(again)) return null;
    if (!ratingQuestions.every((q) => isRating(data[q.id]))) return null;
    return {
      kind,
      data: {
        role, again, comment: text(data.comment, MESSAGE_MAX),
        overall: data.overall as number, program: data.program as number, venue: data.venue as number, app: data.app as number,
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
