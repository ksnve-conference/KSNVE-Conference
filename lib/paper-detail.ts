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

/** Each parenthesized affiliation applies to the preceding comma-separated authors. */
export function getPresenterAffiliation(paper: Paper): string | undefined {
  for (const group of paper.authors.matchAll(/([^()]+)\(([^()]+)\)/g)) {
    if (group[1].split(',').some((name) => name.trim() === paper.presenter.trim())) {
      return group[2].trim();
    }
  }
  const affiliations = Array.isArray(paper.affiliations)
    ? paper.affiliations
    : paper.affiliations ? [paper.affiliations] : [];
  // Do not attribute all collaborating institutions to a single presenter.
  return affiliations.length === 1 ? affiliations[0] : undefined;
}
