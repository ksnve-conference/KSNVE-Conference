'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';
import { EMAIL_MAX, MESSAGE_MAX, feedbackCategories, sendFeedback } from '@/lib/feedback';

const APP_ISSUE = '앱 오류 · 개선';

/** Phone and browser details, attached only to app reports so they can be reproduced. */
function deviceSummary() {
  const standalone = window.matchMedia('(display-mode: standalone)').matches ? '홈 화면 앱' : '브라우저';
  return `${standalone} · ${window.innerWidth}×${window.innerHeight} · ${navigator.userAgent}`;
}

export default function FeedbackForm() {
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const ready = category && message.trim() && state !== 'sending';

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready) return;
    setState('sending');
    const ok = await sendFeedback({
      kind: 'feedback',
      website,
      data: { category, message, email, device: category === APP_ISSUE ? deviceSummary() : '' },
    });
    setState(ok ? 'done' : 'error');
  };

  if (state === 'done') {
    return (
      <div className="form-done" role="status">
        <span><Icon name="check" size={22} /></span>
        <b>접수되었습니다</b>
        <p>소중한 의견 감사합니다. {email ? '답변이 필요한 내용은 남겨주신 이메일로 연락드리겠습니다.' : '여러 분께 해당하는 내용은 공지사항으로 안내하겠습니다.'}</p>
        <button type="button" onClick={() => { setCategory(''); setMessage(''); setEmail(''); setState('idle'); }}>다른 의견 보내기</button>
      </div>
    );
  }

  return (
    <form className="app-form" onSubmit={submit}>
      <fieldset>
        <legend>분류 <em>필수</em></legend>
        <div className="form-choices">
          {feedbackCategories.map((c) => (
            <button key={c} type="button" className={category === c ? 'active' : ''} aria-pressed={category === c} onClick={() => setCategory(c)}>{c}</button>
          ))}
        </div>
      </fieldset>

      <label className="form-field">
        <span>내용 <em>필수</em></span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_MAX))}
          rows={6}
          placeholder={category === APP_ISSUE ? '어느 화면에서 무엇을 했을 때 문제가 생겼는지 적어 주세요.' : '건의하실 내용이나 불편했던 점을 적어 주세요.'}
          required
        />
        <small>{message.length} / {MESSAGE_MAX}</small>
      </label>

      <label className="form-field">
        <span>답변 받을 이메일 <i>선택</i></span>
        <input type="email" inputMode="email" autoComplete="email" value={email} maxLength={EMAIL_MAX} onChange={(e) => setEmail(e.target.value)} placeholder="답변을 원하실 때만 입력" />
        <small>이메일은 이 건의에 답변하는 데에만 사용하며, 학술대회 관련 처리가 끝나면 삭제합니다.</small>
      </label>

      {/* Left empty by people; bots that fill every field are dropped. */}
      <input className="form-trap" tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={(e) => setWebsite(e.target.value)} name="website" />

      {category === APP_ISSUE && <p className="info-note">앱 오류를 빠르게 확인할 수 있도록 기기 종류와 브라우저 정보가 함께 전송됩니다.</p>}
      {state === 'error' && <p className="form-error" role="alert">전송하지 못했습니다. 네트워크 연결을 확인한 뒤 다시 시도해 주세요.</p>}

      <button type="submit" className="form-submit" disabled={!ready}>{state === 'sending' ? '보내는 중…' : '보내기'}</button>
    </form>
  );
}
