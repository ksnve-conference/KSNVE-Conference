'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { conferenceConfig } from '@/lib/conference-config';
import { surveyDone, surveyPhase } from '@/components/SurveyForm';

/** Home-screen invitation to the satisfaction survey while it is open, until this phone has answered. */
export default function SurveyBanner({ now }: { now: Date }) {
  const [answered, setAnswered] = useState(true);
  useEffect(() => setAnswered(surveyDone()), []);
  if (!conferenceConfig.surveyEnabled || answered || surveyPhase(now) !== 'open') return null;
  return (
    <Link href="/survey" className="notification-prompt survey-banner">
      <span><Icon name="message" size={19} /></span>
      <div><b>참가 만족도 설문에 참여해 주세요</b><small>20개 문항 · 3분 이내</small></div>
      <em>참여하기</em>
    </Link>
  );
}
