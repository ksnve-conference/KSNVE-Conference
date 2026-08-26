/**
 * Data integrity check — run this after swapping in the real autumn programme.
 *   npx tsx scripts/validate-data.ts
 * Exits non-zero when anything the app relies on is missing or inconsistent.
 */
import sessions from '../data/sessions.json';
import official from '../data/official-events.json';
import papers from '../data/papers-with-abstracts.json';
import posters from '../data/poster-papers.json';
import venues from '../data/venues.json';
import speakers from '../data/speakers.json';
import announcements from '../data/announcements.json';
import { conferenceConfig } from '../lib/conference-config';

const errors: string[] = [];
const warnings: string[] = [];
const fail = (m: string) => errors.push(m);
const warn = (m: string) => warnings.push(m);

const allSessions = [...sessions, ...official];
const allPapers = [...papers, ...posters];
const dates = new Set<string>(conferenceConfig.dates);
const sessionIds = new Set(allSessions.map((s) => s.id));
const venueNames = new Set(venues.map((v) => v.name));

// --- identity ---
const dupSession = allSessions.map((s) => s.id).filter((id, i, a) => a.indexOf(id) !== i);
if (dupSession.length) fail(`중복 세션 ID: ${[...new Set(dupSession)].join(', ')}`);
const dupPaper = allPapers.map((p) => p.id).filter((id, i, a) => a.indexOf(id) !== i);
if (dupPaper.length) fail(`중복 논문 ID: ${[...new Set(dupPaper)].join(', ')}`);

// --- references ---
allPapers.forEach((p) => {
  if (!sessionIds.has(p.sessionId)) fail(`${p.id}: 존재하지 않는 세션 ${p.sessionId}`);
  if (!dates.has(p.date)) fail(`${p.id}: 학술대회 기간 밖의 날짜 ${p.date}`);
  if (!venueNames.has(p.venue)) warn(`${p.id}: venues.json에 없는 장소 "${p.venue}"`);
  if (!/^\d{2}:\d{2}/.test(p.time)) fail(`${p.id}: 시간 형식 오류 "${p.time}"`);
});

allSessions.forEach((s) => {
  if (!dates.has(s.date)) fail(`${s.id}: 학술대회 기간 밖의 날짜 ${s.date}`);
  if (!venueNames.has(s.venue) && s.venue !== '미정') warn(`${s.id}: venues.json에 없는 장소 "${s.venue}"`);
  if (!/^\d{2}:\d{2}/.test(s.time)) fail(`${s.id}: 시간 형식 오류 "${s.time}"`);
});

// --- coverage ---
const covered = new Set(speakers.flatMap((s) => s.papers));
const uncovered = allPapers.filter((p) => !covered.has(p.id));
if (uncovered.length) warn(`speakers.json에 없는 논문 ${uncovered.length}건 (검색에서 발표자로 찾을 수 없음)`);
const ghosts = [...covered].filter((id) => !allPapers.some((p) => p.id === id));
if (ghosts.length) fail(`speakers.json이 존재하지 않는 논문을 참조: ${ghosts.slice(0, 5).join(', ')}`);

const emptyDays = conferenceConfig.dates.filter((d) => !allSessions.some((s) => s.date === d));
if (emptyDays.length) warn(`일정이 하나도 없는 날: ${emptyDays.join(', ')}`);

const noAbstract = papers.filter((p) => !(p as { abstract?: string }).abstract);
if (noAbstract.length) warn(`초록이 비어 있는 논문 ${noAbstract.length}건: ${noAbstract.map((p) => p.id).join(', ')}`);

const lowQuality = papers.filter((p) => ((p as { extractionQuality?: number }).extractionQuality ?? 1) < 0.55);
if (lowQuality.length) warn(`추출 품질이 낮아 검수가 필요한 논문 ${lowQuality.length}건: ${lowQuality.map((p) => p.id).join(', ')}`);

if (!announcements.length) warn('공지사항이 비어 있습니다.');

console.log(`세션 ${allSessions.length}건 · 논문 ${allPapers.length}건 · 장소 ${venues.length}곳 · 발표자 ${speakers.length}명`);
warnings.forEach((w) => console.log(`  경고  ${w}`));
errors.forEach((e) => console.log(`  오류  ${e}`));
console.log(errors.length ? `\n검증 실패 — 오류 ${errors.length}건` : `\n검증 통과 — 경고 ${warnings.length}건`);
process.exit(errors.length ? 1 : 0);
