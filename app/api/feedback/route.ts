import { conferenceConfig } from '@/lib/conference-config';
import { cleanPayload } from '@/lib/feedback';

export const dynamic = 'force-dynamic';

const headers = { 'Cache-Control': 'no-store' };

// Best effort per server instance: enough to stop one phone from flooding the sheet.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 6;
const recent = new Map<string, number[]>();

function limited(ip: string) {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 5000) recent.clear();
  return hits.length > MAX_PER_WINDOW;
}

/** Forwards 건의·피드백 and 만족도 설문 to the organiser's Apps Script (scripts/feedback-apps-script.gs). */
export async function POST(request: Request) {
  const url = process.env.FEEDBACK_SCRIPT_URL;
  const secret = process.env.FEEDBACK_SECRET;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ ok: false }, { status: 400, headers });
  }
  if (!conferenceConfig.surveyEnabled && raw && typeof raw === 'object' && (raw as { kind?: unknown }).kind === 'survey') {
    return Response.json({ ok: false, error: 'survey_disabled' }, { status: 403, headers });
  }
  if (!url || !secret) return Response.json({ ok: false }, { status: 503, headers });
  // Hidden field only bots fill in: pretend it worked.
  if (raw && typeof raw === 'object' && (raw as { website?: unknown }).website) return Response.json({ ok: true }, { headers });

  const payload = cleanPayload(raw);
  if (!payload) return Response.json({ ok: false }, { status: 400, headers });

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (limited(ip)) return Response.json({ ok: false }, { status: 429, headers });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, secret, version: (process.env.NEXT_PUBLIC_DEPLOYMENT_VERSION ?? '').slice(0, 7) }),
      signal: AbortSignal.timeout(12000),
    });
    const body = await response.text();
    let result: { ok?: boolean; error?: string } | null = null;
    try {
      result = JSON.parse(body);
    } catch {
      // Apps Script answers with an HTML page when the web app isn't open to anyone
    }
    if (!response.ok || !result?.ok) {
      // Shows in Vercel's function logs; never includes the secret or the submission.
      console.error('feedback: Apps Script rejected', {
        status: response.status,
        contentType: response.headers.get('content-type'),
        error: result?.error ?? body.replace(/\s+/g, ' ').slice(0, 160),
      });
      return Response.json({ ok: false }, { status: 502, headers });
    }
    return Response.json({ ok: true }, { headers });
  } catch (error) {
    console.error('feedback: Apps Script unreachable', String(error));
    return Response.json({ ok: false }, { status: 502, headers });
  }
}
