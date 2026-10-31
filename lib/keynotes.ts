import keynotesData from '@/data/keynotes.json';

/** Keynote speakers as introduced on programme pp. 9–11: photo, title, career and talk outline. */
export type Keynote = {
  no: number;
  name: string;
  affiliation: string;
  photo: string;
  topics: string[];
  bio: string[];
};

export const keynoteByNo = new Map<number, Keynote>(
  (keynotesData.keynotes as Keynote[]).map((k) => [k.no, k]),
);
