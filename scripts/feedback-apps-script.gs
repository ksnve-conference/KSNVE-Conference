/**
 * Receives 건의·피드백 and 만족도 설문 submissions from /api/feedback and
 * appends them to this spreadsheet. A new 건의 is also mailed to the account
 * that deployed the script.
 *
 * Setup (once, in the Google account that should own the responses):
 *  1. Create a Google Sheet → Extensions → Apps Script, paste this file.
 *  2. Project Settings → Script properties: FEEDBACK_SECRET = a long random string.
 *  3. Deploy → New deployment → Web app; Execute as: Me; Who has access: Anyone.
 *  4. In Vercel set FEEDBACK_SCRIPT_URL (the /exec URL) and FEEDBACK_SECRET.
 */

const FEEDBACK_HEADERS = ['접수 시각', '분류', '내용', '답변 받을 이메일', '기기', '앱 버전', '처리 상태', '메모'];
const RATING_IDS = ['overall', 'program_level', 'program_qa', 'program_chair', 'program_facility', 'program_poster', 'venue', 'location', 'lodging', 'meal_reception', 'meal_lunch', 'meal_dinner', 'souvenir', 'app'];
const SURVEY_EVENTS = ['웰컴 리셉션', '전시부스 투어', '학생 멘토링', '교양강좌', '마술공연', '캐리커처 체험', '만찬'];
const SURVEY_HEADERS = ['제출 시각', '참가 유형', '주요 역할', '참가 횟수', '전반 만족도', '학술: 발표 수준', '학술: 질의응답·토론', '학술: 좌장 진행', '학술: 발표장 시설', '학술: 포스터 세션', '행사장·운영', '행사장 위치', '주변 숙소', '식사: 웰컴 리셉션', '식사: 점심', '식사: 만찬', '기념품', '학술대회 앱', '유익했던 분야']
  .concat(SURVEY_EVENTS.map((name) => `부대행사: ${name}`), ['다음 참가 의향', '다뤘으면 하는 주제·연사', '자유 의견', '성별', '연령대', '앱 버전']);

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (error) {
    return reply({ ok: false, error: 'bad-json' });
  }
  const secret = PropertiesService.getScriptProperties().getProperty('FEEDBACK_SECRET');
  if (!secret || body.secret !== secret) return reply({ ok: false, error: 'forbidden' });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const book = SpreadsheetApp.getActiveSpreadsheet();
    if (body.kind === 'feedback') {
      const f = body.data;
      sheetFor(book, '건의', FEEDBACK_HEADERS).appendRow([new Date(), f.category, f.message, f.email, f.device, body.version, '접수', ''].map(cell));
      MailApp.sendEmail({
        to: Session.getEffectiveUser().getEmail(),
        subject: `[KSNVE 학술대회 앱] 새 건의 · ${f.category}`,
        body: `${f.message}\n\n답변 받을 이메일: ${f.email || '(없음)'}\n기기: ${f.device || '-'}\n\n전체 목록: ${book.getUrl()}`,
      });
    } else if (body.kind === 'survey') {
      const s = body.data;
      const events = s.events || {};
      sheetFor(book, '만족도 설문', SURVEY_HEADERS).appendRow([new Date(), s.role, (s.participation || []).join(' / '), s.visits, ...RATING_IDS.map((id) => score((s.ratings || {})[id])), (s.fields || []).join(' / ')]
        .concat(SURVEY_EVENTS.map((name) => score(events[name])), [s.again, s.wishes, s.comment, s.gender, s.age, body.version]).map(cell));
    } else if (body.kind === 'raffle') {
      // Its own tab and no shared id, so a contact can't be matched to a survey row.
      sheetFor(book, '경품 응모', ['응모 시각', '연락처']).appendRow([new Date(), body.data.contact].map(cell));
    } else {
      return reply({ ok: false, error: 'bad-kind' });
    }
  } finally {
    lock.releaseLock();
  }
  return reply({ ok: true });
}

function sheetFor(book, name, headers) {
  let sheet = book.getSheetByName(name);
  if (!sheet) {
    sheet = book.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  return sheet;
}

/** 0 is 해당 없음 (didn't use or attend); scores stay numbers so the sheet can average them. */
function score(value) {
  if (value === 0) return '해당 없음';
  return value === undefined || value === null ? '' : value;
}

/** Text that starts like a formula is stored as text, so a submission can't run one. */
function cell(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string' && /^[=+\-@]/.test(value)) return `'${value}`;
  return value;
}

function reply(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
