import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
try {
  const page = await browser.newPage({ serviceWorkers: 'block' });
  await page.clock.install();
  let csv = 'id,title,body,visible\nnotice,테스트 최초 공지,원래 본문,true';
  let fail = false;
  let requests = 0;
  await page.route('**/api/announcements', async route => {
    requests++;
    assert.equal(route.request().headers()['cache-control'], undefined);
    await route.fulfill({ status: fail ? 502 : 200, contentType: 'text/csv', headers: { 'Cache-Control': 'no-store' }, body: fail ? 'Unavailable' : csv });
  });
  const expectText = async text => page.getByText(text, { exact: true }).waitFor({ state: 'visible', timeout: 10000 });
  await page.goto('http://localhost:3001/notices');
  await expectText('테스트 최초 공지');
  csv = 'id,title,body,visible\nnotice,테스트 수정 공지,수정된 본문,true\nnew,테스트 추가 공지,추가 본문,true';
  await page.clock.fastForward(60000);
  await expectText('테스트 수정 공지');
  await expectText('수정된 본문');
  await expectText('테스트 추가 공지');
  assert.equal(await page.getByText('테스트 최초 공지', { exact: true }).count(), 0);
  fail = true;
  await page.clock.fastForward(60000);
  await page.getByRole('status').filter({ hasText: '최신 공지를 불러오지 못했습니다' }).waitFor();
  await expectText('테스트 수정 공지');
  fail = false;
  csv = 'id,title,body,visible\nnotice,테스트 수정 공지,수정된 본문,false';
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expectText('등록된 공지가 없습니다');
  assert.equal(await page.locator('.announcement-card').count(), 0);
  console.log(`PASS: UI polling edits/additions, error fallback, online recovery and hidden/deleted notices (${requests} requests)`);
} finally { await browser.close(); }
