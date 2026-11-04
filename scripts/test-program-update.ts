/** Regression checks for the reviewed November 4 programme update. */
import assert from 'node:assert/strict';
import { papers, withdrawnPapers, sessionById, speakers, activeSpeakers } from '../lib/conference';
import { getPaperDetail } from '../lib/paper-detail';
import { scheduleItems, buildIcs, conflicts } from '../lib/saved';
import metadata from '../data/papers.json';

const find = (id: string) => {
  const paper = papers.find((item) => item.id === id);
  assert.ok(paper, `Active paper ${id}`);
  return paper;
};
const sessionIds = (id: string) => papers.filter((paper) => paper.sessionId === id).map((paper) => paper.id);

assert.equal(papers.length, 362);
assert.equal(new Set([...papers, ...withdrawnPapers].map((paper) => paper.id)).size, 363);
assert.deepEqual(withdrawnPapers.map((paper) => paper.id), ['p214']);
assert.equal(getPaperDetail('p214')?.status, 'withdrawn');
assert.equal(getPaperDetail('p214')?.presenter, '이준영');
assert.ok(activeSpeakers.every((speaker) => speaker.papers.length > 0 && !speaker.papers.includes('p214')));
assert.deepEqual(sessionIds('s049'), ['p213', 'p215', 'p216', 'p217']);
assert.equal(find('p215').time, '08:55~09:10');
assert.equal(find('p216').time, '09:10~09:25');
assert.equal(find('p217').time, '09:25~09:40');

assert.deepEqual(sessionIds('s010'), ['p039', 'p272', 'p273', 'p040', 'p041', 'p042']);
assert.equal(sessionById.get('s010')?.time, '16:40~18:10');
assert.equal(find('p272').presenter, '장대식');
assert.equal(find('p272').time, '16:55~17:10');
assert.equal(find('p273').presenter, '이현준');
assert.equal(find('p273').time, '17:10~17:25');
assert.equal(find('p042').time, '17:55~18:10');
assert.equal(conflicts(scheduleItems(sessionIds('s010'), [])).length, 0);

assert.equal(sessionById.get('s012')?.date, '2026-11-26');
assert.equal(sessionById.get('s012')?.time, '14:40~16:00');
assert.equal(sessionById.get('s012')?.venue, '세미나실[8]');
for (const id of ['p047', 'p048', 'p049']) {
  const paper = find(id);
  assert.equal(paper.sessionId, 's012');
  assert.equal(paper.date, '2026-11-26');
  assert.equal(paper.venue, '세미나실[8]');
}

// The separately approved swap takes precedence over the book's old slots.
assert.equal(find('p268').sessionId, 's007');
assert.equal(find('p268').date, '2026-11-25');
assert.equal(find('p268').time, '15:00~15:15');
assert.equal(find('p027').sessionId, 's061');
assert.equal(find('p027').date, '2026-11-27');
assert.equal(find('p027').time, '10:40~10:55');
assert.equal(find('p108').title, '인간중심 음향AI엔지니어링: 개인화 지각-정서 모델');
assert.ok(find('p139').title.startsWith('2024 MIT 혁신 기술이 선정한 두 기회:'));
assert.equal(speakers.find((speaker) => speaker.id === 'sp004')?.name, 'Viktoriia Gutorova');

// Saved IDs resolve to current details, while withdrawn talks cannot generate calendar events.
const saved = scheduleItems(['p047', 'p214', 'p272'], ['s012']);
assert.equal(saved.length, 3);
assert.ok(!saved.some((item) => item.paper?.id === 'p214'));
assert.equal(saved.find((item) => item.paper?.id === 'p047')?.date, '2026-11-26');
const ics = buildIcs(saved, 'KSNVE');
assert.ok(!ics.includes('paper-p214@ksnve'));
assert.ok(ics.includes('paper-p272@ksnve'));

// All browsing screens, full details and source metadata must agree.
for (const paper of [...papers, ...withdrawnPapers]) {
  const detail = getPaperDetail(paper.id);
  const source = metadata.find((item) => item.id === paper.id);
  assert.ok(detail && source, paper.id);
  for (const field of ['title', 'authors', 'presenter', 'date', 'time', 'venue', 'sessionId', 'status'] as const) {
    assert.equal(paper[field], detail[field], `${paper.id}: index/detail ${field}`);
    assert.equal(paper[field], (source as Record<string, unknown>)[field], `${paper.id}: source ${field}`);
  }
  if (paper.status !== 'withdrawn') {
    const session = sessionById.get(paper.sessionId);
    assert.equal(paper.date, session?.date, `${paper.id}: session date`);
    assert.equal(paper.venue, session?.venue, `${paper.id}: session venue`);
  }
}
console.log('PASS: active/withdrawn IDs, new talk order, moved session, approved swap, saved schedules and data consistency');
