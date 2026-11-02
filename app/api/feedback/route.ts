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
  if (!url || !secret) return Response.json({ ok: false }, { status: 503, headers });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ ok: false }, { status: 400, headers });
  }
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
    const result = await response.json().catch(() => null) as { ok?: boolean } | null;
    if (!response.ok || !result?.ok) throw new Error('Script rejected');
    return Response.json({ ok: true }, { headers });
  } catch {
    return Response.json({ ok: false }, { status: 502, headers });
  }
}
