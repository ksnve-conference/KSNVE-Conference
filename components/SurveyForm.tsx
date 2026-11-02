'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { conferenceConfig } from '@/lib/conference-config';
import { MESSAGE_MAX, ratingLabels, ratingQuestions, sendFeedback, surveyAgain, surveyRoles } from '@/lib/feedback';

export const SURVEY_DONE_KEY = 'ksnveSurveyDone';

type Phase = 'before' | 'open' | 'closed';

export function surveyPhase(now: Date): Phase {
  if (now < new Date(conferenceConfig.surveyOpensAt)) return 'before';
  if (now > new Date(conferenceConfig.surveyClosesAt)) return 'closed';
  return 'open';
}

export function surveyDone() {
  try {
    return localStorage.getItem(SURVEY_DONE_KEY) === '1';
  } catch {
    return false;
  }
}

type Ratings = Record<(typeof ratingQuestions)[number]['id'], number>;

export default function SurveyForm() {
  // null until mounted: the phase and the done flag depend on this phone's clock and storage.
  const [phase, setPhase] = useState<Phase | null>(null);
  const [done, setDone] = useState(false);
  const [role, setRole] = useState('');
  const [ratings, setRatings] = useState<Partial<Ratings>>({});
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
    const opens = new Date(conferenceConfig.surveyOpensAt);
    return <p className="guide-callout">만족도 설문은 {opens.getMonth() + 1}월 {opens.getDate()}일(토) 낮 12시부터 참여하실 수 있습니다. 행사 중 건의사항은 &lsquo;건의 · 피드백&rsquo;으로 보내 주세요.</p>;
  }
  if (phase === 'closed') return <p className="guide-callout">만족도 설문이 마감되었습니다. 참여해 주신 모든 분께 감사드립니다.</p>;

  const complete = role && again && ratingQuestions.every((q) => ratings[q.id]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!complete || state === 'sending') return;
    setState('sending');
    const ok = await sendFeedback({ kind: 'survey', website, data: { role, again, comment, ...(ratings as Ratings) } });
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

      {ratingQuestions.map((q, i) => (
        <fieldset key={q.id}>
          <legend>{i + 2}. {q.label}</legend>
          <div className="form-rating" role="radiogroup" aria-label={q.label}>
            {ratingLabels.map((label, j) => (
              <button
                key={label}
                type="button"
                role="radio"
                aria-checked={ratings[q.id] === j + 1}
                className={ratings[q.id] === j + 1 ? 'active' : ''}
                onClick={() => setRatings((current) => ({ ...current, [q.id]: j + 1 }))}
              >
                <b>{j + 1}</b><small>{label}</small>
              </button>
            ))}
          </div>
        </fieldset>
      ))}

      <fieldset>
        <legend>{ratingQuestions.length + 2}. 다음 학술대회에도 참가하실 생각이 있나요?</legend>
        <div className="form-choices">
          {surveyAgain.map((a) => (
            <button key={a} type="button" className={again === a ? 'active' : ''} aria-pressed={again === a} onClick={() => setAgain(a)}>{a}</button>
          ))}
        </div>
      </fieldset>

      <label className="form-field">
        <span>{ratingQuestions.length + 3}. 좋았던 점이나 개선할 점 <i>선택</i></span>
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
