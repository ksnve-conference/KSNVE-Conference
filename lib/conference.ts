import papersData from '@/data/papers-with-abstracts.json';
import posterPapersData from '@/data/poster-papers.json';
import sessionsData from '@/data/sessions.json';
import officialEventsData from '@/data/official-events.json';
import venuesData from '@/data/venues.json';
import speakersData from '@/data/speakers.json';
import announcementsData from '@/data/announcements.json';
import { conferenceConfig } from '@/lib/conference-config';

export type PaperFigure = { id?: string; caption?: string; image?: string };

export type Paper = {
  paper_id?: string;
  id: string;
  session_id?: string;
  sessionId: string;
  date: string;
  time: string;
  venue: string;
  session: string;
  chair?: string;
  flags: string;
  title: string;
  authors: string;
  presenter: string;
  affiliations?: string[] | string;
  abstract?: string;
  keywords?: string[];
  sourcePage?: number;
  /** How the abstract was obtained: font-decode | ocr-300dpi | no-page */
  extractionStatus?: string;
  /** 0–1 confidence in the extracted text; low values are worth a human check. */
  extractionQuality?: number;
  figures?: PaperFigure[];
  pageImage?: string;
  /** Per-paper PDF, supplied for the autumn conference. */
  paperPdf?: string;
};

export type Session = {
  id: string;
  title: string;
  date: string;
  day: string;
  time: string;
  venue: string;
  chair: string;
  category: string;
};

export type Venue = { id: string; name: string; floor: string };
export type Speaker = { id: string; name: string; papers: string[] };
export type Announcement = { id: string; title: string; body: string; date: string; category: string };

type PaperRecord = Omit<Paper, 'sourcePage'> & { source_page?: number | null };

export const papers: Paper[] = ([...papersData, ...posterPapersData] as PaperRecord[]).map(
  ({ source_page: sourcePage, ...paper }) => ({ ...paper, sourcePage: sourcePage ?? undefined }),
);

/** Paper sessions plus the official programme-book events (opening, keynotes, dinner…). */
export const sessions: Session[] = [
  ...(sessionsData as Session[]),
  ...(officialEventsData as Session[]),
];

export const venues = venuesData as Venue[];
export const speakers = speakersData as Speaker[];
export const announcements = announcementsData as Announcement[];

const dayLabels = new Map(
  (conferenceConfig.dates as readonly string[]).map((date, index) => {
    const [, month, day] = date.split('-');
    return [date, `${Number(month)}/${Number(day)} ${conferenceConfig.dayNames[index] ?? ''}`.trim()];
  }),
);

export const dayLabel = (date: string) => dayLabels.get(date) ?? date;

export const formatSessionTitle = (title: string) => title.replace(/^(기획|부문|특별)\s+/, '[$1] ');

export const sessionById = new Map(sessions.map((session) => [session.id, session]));
export const venueByName = new Map(venues.map((venue) => [venue.name, venue]));
