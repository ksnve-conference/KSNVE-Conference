import type { Paper, Session } from '@/lib/conference';

export type PresentationType = 'ORAL' | 'POSTER' | 'KEYNOTE' | 'INVITED';

export const presentationTypeMeta: Record<PresentationType, { label: PresentationType; symbol: string }> = {
  ORAL: { label: 'ORAL', symbol: '●' },
  POSTER: { label: 'POSTER', symbol: '●' },
  KEYNOTE: { label: 'KEYNOTE', symbol: '●' },
  INVITED: { label: 'INVITED', symbol: '●' },
};

export function presentationTypeFor(paper: Paper, session?: Session): PresentationType {
  if (paper.presentationType && paper.presentationType !== 'ORAL') return paper.presentationType;
  const metadata = `${session?.title ?? paper.session} ${session?.category ?? ''}`;
  if (/포스터|poster/i.test(metadata)) return 'POSTER';
  if (/키노트|keynote|기조\s*강연/i.test(metadata)) return 'KEYNOTE';
  if (/초청|invited/i.test(metadata)) return 'INVITED';
  return 'ORAL';
}
