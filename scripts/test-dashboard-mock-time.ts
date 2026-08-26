import assert from 'node:assert/strict';
import { parseMockNow, upcomingSessionsAt } from '../lib/dashboard-time';
import sessions from '../data/sessions.json';
import official from '../data/official-events.json';

const all = [...sessions, ...official];

const mock = parseMockNow('2026-11-26T09:00:00');
assert.ok(mock, 'mockNow should parse');
assert.equal(mock.date, '2026-11-26');

const upcoming = upcomingSessionsAt(all, mock.instant);
assert.ok(upcoming.length > 0, 'there should be sessions after 09:00 on day 2');
assert.ok(
  upcoming.every((s) => `${s.date}T${s.time.split('~')[0]}` >= '2026-11-26T09:00'),
  'every upcoming session starts at or after the mock time',
);

assert.equal(parseMockNow('nonsense'), null);
assert.equal(parseMockNow(null), null);

const dates = new Set(all.map((s) => s.date));
assert.ok(dates.has('2026-11-28'), 'the fourth day must carry the 대토론회 entry');

console.log(`ok — ${all.length} sessions across ${dates.size} days, ${upcoming.length} upcoming from the mock time`);
