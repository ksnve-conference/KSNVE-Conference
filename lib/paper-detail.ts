/**
 * Full paper records — abstract, keywords, extended-abstract page image.
 * Only the paper detail route (a server component) imports this, so the
 * ~250KB (gzipped) of abstract text never reaches the client bundle used
 * by the program, paper list, search, and my-schedule screens. Those use
 * the lightweight index in `lib/conference.ts` instead.
 */
import papersData from '@/data/papers-with-abstracts.json';
import posterPapersData from '@/data/poster-papers.json';
import type { Paper } from '@/lib/conference';

const fullPapers = [...papersData, ...posterPapersData] as Paper[];

export function getPaperDetail(id: string): Paper | undefined {
  return fullPapers.find((paper) => paper.id === id);
}
