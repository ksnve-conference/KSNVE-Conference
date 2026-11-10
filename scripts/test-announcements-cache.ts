import assert from 'node:assert/strict';
import { GET } from '../app/api/announcements/route';

async function main() {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.NEXT_PUBLIC_ANNOUNCEMENTS_SHEET_URL;
  let csv = 'id,title,body,visible\nnotice,Before,Original,true';
  let status = 200;
  let calls = 0;
  process.env.NEXT_PUBLIC_ANNOUNCEMENTS_SHEET_URL = 'https://example.test/notices.csv';
  globalThis.fetch = async (_input, options) => {
    assert.equal(options?.cache, 'no-store', 'Expired CDN responses must read fresh upstream data');
    calls++;
    return new Response(csv, { status });
  };
  try {
    const first = await GET();
    assert.equal(first.headers.get('Cache-Control'), 'no-store');
    assert.equal(first.headers.get('CDN-Cache-Control'), 'no-store');
    assert.equal(first.headers.get('Vercel-CDN-Cache-Control'), 'public, s-maxage=30');
    assert.match(await first.text(), /Before/);
    // A new origin invocation after CDN expiry must see edits, additions and removals.
    csv = 'id,title,body,visible\nnotice,After,Edited,true\nnew,Added,New,true';
    assert.equal(await (await GET()).text(), csv);
    csv = 'id,title,body,visible\n';
    assert.equal(await (await GET()).text(), csv, 'An empty sheet clears old notices');
    csv = '<html>upstream error</html>';
    let response = await GET();
    assert.equal(response.status, 502);
    assert.equal(response.headers.get('Vercel-CDN-Cache-Control'), 'no-store');
    status = 503;
    response = await GET();
    assert.equal(response.status, 502);
    assert.equal(response.headers.get('Vercel-CDN-Cache-Control'), 'no-store');
    globalThis.fetch = async () => { throw new Error('network unavailable'); };
    assert.equal((await GET()).status, 502);
    delete process.env.NEXT_PUBLIC_ANNOUNCEMENTS_SHEET_URL;
    response = await GET();
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('Vercel-CDN-Cache-Control'), 'no-store');
    assert.equal(calls, 5);
    console.log('PASS: fresh edits/additions/removals, 30s CDN policy, no browser cache, uncached errors');
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_ANNOUNCEMENTS_SHEET_URL;
    else process.env.NEXT_PUBLIC_ANNOUNCEMENTS_SHEET_URL = originalUrl;
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
