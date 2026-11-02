'use client';

import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/Icon';
import { conferenceConfig } from '@/lib/conference-config';
import {
  CONTACT_MAX, FIELD_NONE, MESSAGE_MAX, NOT_APPLICABLE, NOT_APPLICABLE_LABEL, allowsNotApplicable, eventsComplete, exhibitOnly, fieldNone,
  fieldsComplete, ratingAnswered, ratingBlocks, ratingLabels, ratingQuestions, ratingsComplete, sendFeedback, surveyAgain, surveyAges,
  surveyEvents, surveyFieldGroups, surveyGenders, surveyParticipation, surveyRoles, surveyVisits,
} from '@/lib/feedback';

export const SURVEY_DONE_KEY = 'ksnveSurveyDone';
const DRAFT_KEY = 'ksnveSurveyDraft';
const RAFFLE_KEY = 'ksnveRaffleDone';

type Phase = 'before' | 'open' | 'closed';

export function surveyPhase(now: Date): Phase {
  if (now < new Date(conferenceConfig.surveyOpensAt)) return 'before';
  if (now > new Date(conferenceConfig.surveyClosesAt)) return 'closed';
  return 'open';
}

/** "11월 27일(금)", plus the hour when the survey doesn't open at midnight (KST). */
function openingLabel() {
  const [date, time] = conferenceConfig.surveyOpensAt.split('T');
  const [, month, day] = date.split('-').map(Number);
  const index = (conferenceConfig.dates as readonly string[]).indexOf(date);
  const weekday = index >= 0 ? `(${conferenceConfig.dayNames[index]})` : '';
  const hour = Number(time.slice(0, 2));
  return `${month}월 ${day}일${weekday}${hour ? ` ${hour}시` : ''}`;
}

const readFlag = (key: string) => {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
};
const writeStorage = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value);
  } catch {
    // private mode: the survey still works, it just can't remember
  }
};

export const surveyDone = () => readFlag(SURVEY_DONE_KEY);

/** 1–5 buttons, plus 해당 없음 for rows people may not have experienced. */
function RatingRow({ label, value, onChange, allowNone = false }: {
  label: string; value?: number; onChange: (v: number) => void; allowNone?: boolean;
}) {
  return (
    <div className="form-rating-row">
      <div className="form-rating" role="radiogroup" aria-label={label}>
        {ratingLabels.map((text, j) => (
          <button key={text} type="button" role="radio" aria-checked={value === j + 1} className={value === j + 1 ? 'active' : ''} onClick={() => onChange(j + 1)}>
            <b>{j + 1}</b><small>{text}</small>
          </button>
        ))}
      </div>
      {allowNone && (
        <button type="button" className={`form-rating-none${value === NOT_APPLICABLE ? ' active' : ''}`} aria-pressed={value === NOT_APPLICABLE} onClick={() => onChange(NOT_APPLICABLE)}>
          {NOT_APPLICABLE_LABEL}
        </button>
      )}
    </div>
  );
}

type Draft = {
  role: string; participation: string[]; visits: string; ratings: Record<string, number>; fields: string[];
  events: Record<string, number>; again: string; wishes: string; comment: string; gender: string; age: string;
};
const emptyDraft: Draft = {
  role: '', participation: [], visits: '', ratings: {}, fields: [], events: {}, again: '', wishes: '', comment: '', gender: '', age: '',
};

function readDraft(): Draft {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return emptyDraft;
    const draft: Draft = { ...emptyDraft, ...JSON.parse(raw) };
    return { ...draft, participation: draft.participation.slice(0, 1) };  // 주요 역할 is a single choice
  } catch {
    return emptyDraft;
  }
}

/** After the survey: optional 경품 응모, sent separately so the contact can't be tied to the answers. */
function Raffle() {
  const [entered, setEntered] = useState(() => readFlag(RAFFLE_KEY));
  const [contact, setContact] = useState('');
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<'idle' | 'sending' | 'error'>('idle');
  if (entered) return <p className="form-hint">경품 추첨에 응모되었습니다. 당첨되시면 남겨 주신 연락처로 안내드립니다.</p>;
  const ready = contact.trim().length >= 5 && consent && state !== 'sending';
  return (
    <form
      className="raffle-form"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!ready) return;
        setState('sending');
        const ok = await sendFeedback({ kind: 'raffle', data: { contact, consent: true } });
        if (!ok) {
          setState('error');
          return;
        }
        writeStorage(RAFFLE_KEY, '1');
        setEntered(true);
      }}
    >
      <b>경품 추첨 응모 <i>선택</i></b>
      <input value={contact} maxLength={CONTACT_MAX} onChange={(e) => setContact(e.target.value)} placeholder="휴대전화 번호 또는 이메일" autoComplete="tel" />
      <label className="raffle-consent">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>연락처는 경품 당첨 안내에만 사용하고 추첨 후 삭제합니다. 설문 응답과는 따로 저장되어 연결되지 않습니다. 이에 동의합니다.</span>
      </label>
      {state === 'error' && <p className="form-error" role="alert">응모하지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}
      <button type="submit" className="form-submit" disabled={!ready}>{state === 'sending' ? '보내는 중…' : '응모하기'}</button>
    </form>
  );
}

export default function SurveyForm() {
  // null until mounted: the phase, the done flag and the draft depend on this phone's clock and storage.
  const [phase, setPhase] = useState<Phase | null>(null);
  const [done, setDone] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [website, setWebsite] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'error'>('idle');
  const restored = useRef(false);

  useEffect(() => {
    // ?preview lets the organisers try the form before it opens.
    const preview = new URLSearchParams(window.location.search).has('preview');
    setPhase(preview ? 'open' : surveyPhase(new Date()));
    setDone(surveyDone());
    setDraft(readDraft());
    restored.current = true;
  }, []);

  // Keep answers on the phone, so leaving the app mid-survey doesn't lose them.
  useEffect(() => {
    if (restored.current && !done) writeStorage(DRAFT_KEY, JSON.stringify(draft));
  }, [draft, done]);

  if (phase === null) return null;

  if (done) {
    return (
      <div className="form-done" role="status">
        <span><Icon name="check" size={22} /></span>
        <b>설문에 참여해 주셔서 감사합니다</b>
        <p>보내주신 의견은 다음 학술대회 준비에 반영하겠습니다.</p>
        {conferenceConfig.surveyRaffle && <Raffle />}
      </div>
    );
  }
  if (phase === 'before') {
    return <p className="guide-callout">만족도 설문은 {openingLabel()}부터 참여하실 수 있습니다. 행사 중 건의사항은 &lsquo;건의 · 피드백&rsquo;으로 보내 주세요.</p>;
  }
  if (phase === 'closed') return <p className="guide-callout">만족도 설문이 마감되었습니다. 참여해 주신 모든 분께 감사드립니다.</p>;

  const { role, participation, visits, ratings, fields, events, again, wishes, comment, gender, age } = draft;
  const update = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));
  const setRating = (id: string) => (v: number) => update({ ratings: { ...ratings, [id]: v } });

  const chooseParticipation = (p: string) => {
    const next = [p];
    // 해당 없음 on session rows is only for people who came just for the exhibition.
    const kept = Object.fromEntries(Object.entries(ratings).filter(([id, v]) => {
      const q = ratingQuestions.find((x) => x.id === id);
      return !q || v !== NOT_APPLICABLE || allowsNotApplicable(q, next);
    }));
    update({ participation: next, ratings: kept });
  };

  // 해당 없음 clears the group's other choices, and picking one of them clears 해당 없음.
  const toggleField = (group: { label: string; items: string[] }, item: string) => {
    if (fields.includes(item)) return update({ fields: fields.filter((f) => f !== item) });
    const none = fieldNone(group.label);
    const others = item === none ? fields.filter((f) => !group.items.includes(f)) : fields.filter((f) => f !== none);
    update({ fields: [...others, item] });
  };
  const answeredGroups = surveyFieldGroups.filter((g) => fields.some((f) => f === fieldNone(g.label) || g.items.includes(f))).length;

  // Progress over the required questions (15 and 16 are free text and optional).
  const required = [
    Boolean(role), participation.length > 0, Boolean(visits),
    ...ratingBlocks.map((block) => block.every((q) => ratingAnswered(q, ratings[q.id], participation))),
    fieldsComplete(fields), eventsComplete(events), Boolean(again), Boolean(gender), Boolean(age),
  ];
  const answered = required.filter(Boolean).length;
  const complete = answered === required.length && ratingsComplete(ratings, participation);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!complete || state === 'sending') return;
    setState('sending');
    const ok = await sendFeedback({ kind: 'survey', website, data: { role, participation, gender, age, visits, again, wishes, comment, fields, events, ratings } });
    if (!ok) {
      setState('error');
      return;
    }
    writeStorage(SURVEY_DONE_KEY, '1');
    writeStorage(DRAFT_KEY, null);
    setDone(true);
  };

  const choices = (options: readonly string[], value: string, set: (v: string) => void) => (
    <div className="form-choices">
      {options.map((o) => (
        <button key={o} type="button" className={value === o ? 'active' : ''} aria-pressed={value === o} onClick={() => set(o)}>{o}</button>
      ))}
    </div>
  );
  const onlyExhibit = exhibitOnly(participation);

  return (
    <form className="app-form" onSubmit={submit}>
      <div className="survey-progress" role="status" aria-live="polite">
        <span>필수 문항 {answered} / {required.length}</span>
        <div><i style={{ width: `${Math.round((answered / required.length) * 100)}%` }} /></div>
      </div>
      {answered > 0 && <p className="form-hint form-hint-top">답한 내용은 이 휴대폰에 임시 저장되어, 앱을 닫았다가 다시 열어도 이어서 할 수 있습니다.</p>}

      <fieldset>
        <legend>1. 참가 유형</legend>
        {choices(surveyRoles, role, (v) => update({ role: v }))}
      </fieldset>

      <fieldset>
        <legend>2. 이번 학술대회에서의 주요 역할 <i>하나만 선택</i></legend>
        {choices(surveyParticipation, participation[0] ?? '', chooseParticipation)}
      </fieldset>

      <fieldset>
        <legend>3. 학술대회 참가 횟수</legend>
        {choices(surveyVisits, visits, (v) => update({ visits: v }))}
      </fieldset>

      {ratingBlocks.map((block, i) => {
        const q = block[0];
        const anyNone = block.some((row) => allowsNotApplicable(row, participation));
        if (q.group) {
          return (
            <fieldset key={q.group}>
              <legend>{i + 4}. {q.group}</legend>
              <div className="form-event-ratings">
                {block.map((row) => (
                  <div key={row.id}>
                    <small>{row.label}</small>
                    <RatingRow label={row.label} allowNone={allowsNotApplicable(row, participation)} value={ratings[row.id]} onChange={setRating(row.id)} />
                  </div>
                ))}
              </div>
              {anyNone && (
                <p className="form-hint">
                  {q.id === 'program_level' && onlyExhibit
                    ? '세션에 참석하지 않으셨다면 각 항목에서 ‘해당 없음’을 눌러 주세요.'
                    : '이용하거나 참여하지 않은 항목은 ‘해당 없음’을 눌러 주세요.'}
                </p>
              )}
            </fieldset>
          );
        }
        return (
          <fieldset key={q.id}>
            <legend>{i + 4}. {q.label}</legend>
            <RatingRow label={q.label} allowNone={allowsNotApplicable(q, participation)} value={ratings[q.id]} onChange={setRating(q.id)} />
            {anyNone && <p className="form-hint">이용하지 않으셨다면 &lsquo;해당 없음&rsquo;을 눌러 주세요.</p>}
          </fieldset>
        );
      })}

      <fieldset>
        <legend>12. 가장 유익했던 분야 <i>분야별 1개 이상 · 복수 선택 가능</i></legend>
        <p className="form-hint form-hint-top">묶음마다 하나 이상 골라 주세요. 듣지 않은 묶음은 &lsquo;{FIELD_NONE}&rsquo;을 누르면 됩니다. ({answeredGroups}/{surveyFieldGroups.length} 묶음 응답)</p>
        {surveyFieldGroups.map((group) => (
          <div className="form-choice-group" key={group.label}>
            <small>{group.label}</small>
            <div className="form-choices compact">
              {group.items.map((item) => {
                const on = fields.includes(item);
                return <button key={item} type="button" className={on ? 'active' : ''} aria-pressed={on} onClick={() => toggleField(group, item)}>{item}</button>;
              })}
              <button
                type="button"
                className={`form-choice-none${fields.includes(fieldNone(group.label)) ? ' active' : ''}`}
                aria-pressed={fields.includes(fieldNone(group.label))}
                onClick={() => toggleField(group, fieldNone(group.label))}
              >{FIELD_NONE}</button>
            </div>
          </div>
        ))}
      </fieldset>

      <fieldset>
        <legend>13. 부대행사(프로그램·진행)는 어떠셨나요?</legend>
        <div className="form-event-ratings">
          {surveyEvents.map((name) => (
            <div key={name}>
              <small>{name}</small>
              <RatingRow label={name} allowNone value={events[name]} onChange={(v) => update({ events: { ...events, [name]: v } })} />
            </div>
          ))}
        </div>
        <p className="form-hint">참가하지 않은 행사는 &lsquo;해당 없음&rsquo;을 눌러 주세요.</p>
      </fieldset>

      <fieldset>
        <legend>14. 다음 학술대회에도 참가하실 생각이 있나요?</legend>
        {choices(surveyAgain, again, (v) => update({ again: v }))}
      </fieldset>

      <label className="form-field">
        <span>15. 다음 학술대회에서 다뤘으면 하는 주제나 초청 연사 <i>선택</i></span>
        <textarea value={wishes} onChange={(e) => update({ wishes: e.target.value.slice(0, MESSAGE_MAX) })} rows={3} placeholder="예: 기획세션 주제, 모시고 싶은 연사" />
        <small>{wishes.length} / {MESSAGE_MAX}</small>
      </label>

      <label className="form-field">
        <span>16. 좋았던 점이나 개선할 점 <i>선택</i></span>
        <textarea value={comment} onChange={(e) => update({ comment: e.target.value.slice(0, MESSAGE_MAX) })} rows={5} placeholder="자유롭게 적어 주세요." />
        <small>{comment.length} / {MESSAGE_MAX}</small>
      </label>

      <fieldset>
        <legend>17. 성별</legend>
        {choices(surveyGenders, gender, (v) => update({ gender: v }))}
      </fieldset>

      <fieldset>
        <legend>18. 연령대</legend>
        {choices(surveyAges, age, (v) => update({ age: v }))}
      </fieldset>

      <input className="form-trap" tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={(e) => setWebsite(e.target.value)} name="website" />

      {state === 'error' && <p className="form-error" role="alert">전송하지 못했습니다. 네트워크 연결을 확인한 뒤 다시 시도해 주세요. 답한 내용은 그대로 남아 있습니다.</p>}
      <button type="submit" className="form-submit" disabled={!complete || state === 'sending'}>
        {state === 'sending' ? '보내는 중…' : complete ? '설문 제출' : `필수 문항 ${required.length - answered}개가 남았습니다`}
      </button>
      <p className="info-note">설문은 익명으로 수집되며, 학술대회 운영 개선에만 사용합니다.</p>
    </form>
  );
}
