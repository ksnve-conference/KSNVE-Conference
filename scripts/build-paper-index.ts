/**
 * Generates data/papers-index.json — a lightweight paper list for screens
 * that only browse (program, paper list, search, my schedule). Full
 * abstracts, keywords, figures and page images stay in
 * papers-with-abstracts.json / poster-papers.json, which only the paper
 * detail route (a server component) reads directly.
 *
 * Run after regenerating papers-with-abstracts.json or poster-papers.json:
 *   npm run build:paper-index
 */
import { writeFileSync } from 'node:fs';
import papersData from '../data/papers-with-abstracts.json';
import posterPapersData from '../data/poster-papers.json';

type SourceRecord = Record<string, unknown>;

const summarize = (paper: SourceRecord) => ({
  id: paper.id,
  sessionId: paper.sessionId ?? paper.session_id,
  date: paper.date,
  time: paper.time,
  venue: paper.venue,
  session: paper.session,
  chair: paper.chair,
  flags: paper.flags,
  title: paper.title,
  authors: paper.authors,
  presenter: paper.presenter,
  hasAbstract: Boolean(paper.abstract),
});

const index = [...(papersData as SourceRecord[]), ...(posterPapersData as SourceRecord[])].map(summarize);

writeFileSync(
  new URL('../data/papers-index.json', import.meta.url),
  `${JSON.stringify(index, null, 2)}\n`,
);

console.log(`papers-index.json — 논문 ${index.length}건 (경량 인덱스, 초록/키워드/원문이미지 제외)`);
