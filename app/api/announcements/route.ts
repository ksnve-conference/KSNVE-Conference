import { parseCsv } from '@/lib/announcement-csv';

export const dynamic = 'force-dynamic';

const headers = { 'Cache-Control': 'no-store', 'CDN-Cache-Control': 'no-store', 'Vercel-CDN-Cache-Control': 'no-store' };

export async function GET() {
  const url = process.env.NEXT_PUBLIC_ANNOUNCEMENTS_SHEET_URL;
  if (!url) return new Response('Not configured', { status: 503, headers });
  try {
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Upstream unavailable');
    const csv = await response.text();
    if (!parseCsv(csv)[0]?.some((cell) => ['title', '제목'].includes(cell.trim().toLowerCase()))) {
      throw new Error('Invalid CSV');
    }
    // Public notices share a short CDN cache; browsers and error responses do not.
    // No stale-while-revalidate: after 30s the next request waits for fresh CSV.
    return new Response(csv, { headers: {
      ...headers,
      'Vercel-CDN-Cache-Control': 'public, s-maxage=30',
      'Content-Type': 'text/csv; charset=utf-8',
    } });
  } catch {
    return new Response('Announcements temporarily unavailable', { status: 502, headers });
  }
}
