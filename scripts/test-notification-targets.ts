import assert from 'node:assert/strict';
import { papers, sessions } from '../lib/conference';
import { notificationTargets } from '../lib/notification-targets';

const inSession = papers.filter(paper => paper.sessionId === 's049');
const sessionTargets = notificationTargets(papers, sessions, [], ['s049']);
assert.deepEqual(sessionTargets.map(target => target.id), inSession.map(paper => paper.id));
assert.ok(!sessionTargets.some(target => target.id === 'p214'));
const combined = notificationTargets(papers, sessions, [inSession[0].id], ['s049']);
assert.deepEqual(combined, sessionTargets, 'A talk saved both ways must produce only one reminder');
const event = notificationTargets(papers, sessions, [], ['e18']);
assert.equal(event.length, 1);
assert.equal(event[0].kind, 'session');
assert.equal(event[0].start, Date.parse('2026-11-26T18:40:00+09:00'));
assert.deepEqual(notificationTargets(papers, sessions, ['p214', 'missing'], ['missing']), []);
assert.deepEqual(notificationTargets(papers, sessions, [], []), []);
console.log('PASS: session talks, deduplication, withdrawn talks, event reminders and Korean start times');
