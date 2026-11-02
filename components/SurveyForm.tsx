'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { conferenceConfig } from '@/lib/conference-config';
import {
  FIELD_NONE, MESSAGE_MAX, fieldNone, fieldsComplete, ratingBlocks, ratingLabels, ratingsComplete, sendFeedback, surveyAgain, surveyEvents, surveyFieldGroups, surveyAges, surveyGenders, surveyRoles, surveyVisits,
} from '@/lib/feedback';

export const SURVEY_DONE_KEY = 'ksnveSurveyDone';

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

export function surveyDone() {
  try {
    return localStorage.getItem(SURVEY_DONE_KEY) === '1';
  } catch {
    return false;
  }
}


/** 1–5 buttons; tapping the chosen score again clears it when `clearable` (optional rows). */
function RatingRow({ label, value, onChange, clearable = false }: { label: string; value?: number; onChange: (v: number | undefined) => void; clearable?: boolean }) {
  return (
    <div className="form-rating" role="radiogroup" aria-label={label}>
      {ratingLabels.map((text, j) => (
        <button
          key={text}
          type="button"
          role="radio"
          aria-checked={value === j + 1}
          className={value === j + 1 ? 'active' : ''}
          onClick={() => onChange(clearable && value === j + 1 ? undefined : j + 1)}
        >
          <b>{j + 1}</b><small>{text}</small>
        </button>
      ))}
    </div>
  );
}

export default function SurveyForm() {
  // null until mounted: the phase and the done flag depend on this phone's clock and storage.
  const [phase, setPhase] = useState<Phase | null>(null);
  const [done, setDone] = useState(false);
  const [role, setRole] = useState('');
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [visits, setVisits] = useState('');
  const [fields, setFields] = useState<string[]>([]);
  const [events, setEvents] = useState<Record<string, number>>({});
  const [again, setAgain] = useState('');
  const [comment, setComment] = useState('');
  const [website, setWebsite] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'error'>('idle');

  useEffect(() => {
    // ?preview lets the organisers try the form before it opens.
    const preview = new URLSearchParams(window.location.search).has('preview');
    setPhase(preview ? 'open' : surveyPhase(new Date()));
    setDone(surveyDone());
  }, []);

  if (phase === null) return null;

  if (done) {
    return (
      <div className="form-done" role="status">
        <span><Icon name="check" size={22} /></span>
        <b>설문에 참여해 주셔서 감사합니다</b>
        <p>보내주신 의견은 다음 학술대회 준비에 반영하겠습니다.</p>
      </div>
    );
  }
  if (phase === 'before') {
    return <p className="guide-callout">만족도 설문은 {openingLabel()}부터 참여하실 수 있습니다. 행사 중 건의사항은 &lsquo;건의 · 피드백&rsquo;으로 보내 주세요.</p>;
  }
  if (phase === 'closed') return <p className="guide-callout">만족도 설문이 마감되었습니다. 참여해 주신 모든 분께 감사드립니다.</p>;

  const complete = role && gender && age && visits && again && fieldsComplete(fields) && ratingsComplete(ratings);

  // 해당 없음 clears the group's other choices, and picking one of them clears 해당 없음.
  const toggleField = (group: { label: string; items: string[] }, item: string) => setFields((current) => {
    if (current.includes(item)) return current.filter((f) => f !== item);
    const none = fieldNone(group.label);
    const others = item === none ? current.filter((f) => !group.items.includes(f)) : current.filter((f) => f !== none);
    return [...others, item];
  });
  const answeredGroups = surveyFieldGroups.filter((g) => fields.some((f) => f === fieldNone(g.label) || g.items.includes(f))).length;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!complete || state === 'sending') return;
    setState('sending');
    const ok = await sendFeedback({ kind: 'survey', website, data: { role, gender, age, visits, again, comment, fields, events, ratings } });
    if (!ok) {
      setState('error');
      return;
    }
    try {
      localStorage.setItem(SURVEY_DONE_KEY, '1');
    } catch {
      // the thank-you still shows; the banner may just come back
    }
    setDone(true);
  };

  return (
    <form className="app-form" onSubmit={submit}>
      <fieldset>
        <legend>1. 참가 유형</legend>
        <div className="form-choices">
          {surveyRoles.map((r) => (
            <button key={r} type="button" className={role === r ? 'active' : ''} aria-pressed={role === r} onClick={() => setRole(r)}>{r}</button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>2. 성별</legend>
        <div className="form-choices">
          {surveyGenders.map((g) => (
            <button key={g} type="button" className={gender === g ? 'active' : ''} aria-pressed={gender === g} onClick={() => setGender(g)}>{g}</button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>3. 연령대</legend>
        <div className="form-choices">
          {surveyAges.map((a) => (
            <button key={a} type="button" className={age === a ? 'active' : ''} aria-pressed={age === a} onClick={() => setAge(a)}>{a}</button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>4. 학술대회 참가 횟수</legend>
        <div className="form-choices">
          {surveyVisits.map((v) => (
            <button key={v} type="button" className={visits === v ? 'active' : ''} aria-pressed={visits === v} onClick={() => setVisits(v)}>{v}</button>
          ))}
        </div>
      </fieldset>

      {ratingBlocks.map((block, i) => {
        const q = block[0];
        const setRating = (id: string) => (v: number | undefined) => setRatings((current) => {
          const next = { ...current };
          if (v === undefined) delete next[id]; else next[id] = v;
          return next;
        });
        if (q.group) {
          return (
            <fieldset key={q.group}>
              <legend>{i + 5}. {q.group}{q.optional && <i>{q.optional}</i>}</legend>
              <div className="form-event-ratings">
                {block.map((row) => (
                  <div key={row.id}>
                    <small>{row.label}</small>
                    <RatingRow label={row.label} clearable={Boolean(row.optional)} value={ratings[row.id]} onChange={setRating(row.id)} />
                  </div>
                ))}
              </div>
              {q.optional && <p className="form-hint">참여하지 않은 항목은 비워 두세요. 선택한 점수를 다시 누르면 지워집니다.</p>}
            </fieldset>
          );
        }
        return (
          <fieldset key={q.id}>
            <legend>{i + 5}. {q.label}{q.optional && <i>선택</i>}</legend>
            <RatingRow label={q.label} clearable={Boolean(q.optional)} value={ratings[q.id]} onChange={setRating(q.id)} />
            {q.optional && <p className="form-hint">{q.optional}. 선택한 점수를 다시 누르면 지워집니다.</p>}
          </fieldset>
        );
      })}

      <fieldset>
        <legend>13. 가장 유익했던 분야 <i>분야별 1개 이상 · 복수 선택 가능</i></legend>
        <p className="form-hint form-hint-top">묶음마다 하나 이상 골라 주세요. 듣지 않은 묶음은 &lsquo;{FIELD_NONE}&rsquo;을 누르면 됩니다. ({answeredGroups}/{surveyFieldGroups.length} 묶음 응답)</p>
        {surveyFieldGroups.map((group) => (
          <div className="form-choice-group" key={group.label}>
            <small>{group.label}</small>
            <div className="form-choices compact">
              {group.items.map((item) => {
                const on = fields.includes(item);
                return (
                  <button key={item} type="button" className={on ? 'active' : ''} aria-pressed={on} onClick={() => toggleField(group, item)}>{item}</button>
                );
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
        <legend>14. 부대행사(프로그램·진행)는 어떠셨나요? <i>참가한 행사만</i></legend>
        <div className="form-event-ratings">
          {surveyEvents.map((name) => (
            <div key={name}>
              <small>{name}</small>
              <RatingRow
                label={name}
                clearable
                value={events[name]}
                onChange={(v) => setEvents((current) => {
                  const next = { ...current };
                  if (v === undefined) delete next[name]; else next[name] = v;
                  return next;
                })}
              />
            </div>
          ))}
        </div>
        <p className="form-hint">참가하지 않은 행사는 비워 두세요. 선택한 점수를 다시 누르면 지워집니다.</p>
      </fieldset>

      <fieldset>
        <legend>15. 다음 학술대회에도 참가하실 생각이 있나요?</legend>
        <div className="form-choices">
          {surveyAgain.map((a) => (
            <button key={a} type="button" className={again === a ? 'active' : ''} aria-pressed={again === a} onClick={() => setAgain(a)}>{a}</button>
          ))}
        </div>
      </fieldset>

      <label className="form-field">
        <span>16. 좋았던 점이나 개선할 점 <i>선택</i></span>
        <textarea value={comment} onChange={(e) => setComment(e.target.value.slice(0, MESSAGE_MAX))} rows={5} placeholder="자유롭게 적어 주세요." />
        <small>{comment.length} / {MESSAGE_MAX}</small>
      </label>

      <input className="form-trap" tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={(e) => setWebsite(e.target.value)} name="website" />

      {state === 'error' && <p className="form-error" role="alert">전송하지 못했습니다. 네트워크 연결을 확인한 뒤 다시 시도해 주세요.</p>}
      <button type="submit" className="form-submit" disabled={!complete || state === 'sending'}>
        {state === 'sending' ? '보내는 중…' : complete ? '설문 제출' : '모든 문항에 답해 주세요'}
      </button>
      <p className="info-note">설문은 익명으로 수집되며, 학술대회 운영 개선에만 사용합니다.</p>
    </form>
  );
}
