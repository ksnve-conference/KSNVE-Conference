import { notFound } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import AppTabs from '@/components/AppTabs';
import BackLink from '@/components/BackLink';
import PaperCard from '@/components/PaperCard';
import { papers, speakers } from '@/lib/conference';

export function generateStaticParams() {
  return speakers.map((s) => ({ id: s.id }));
}

export default async function SpeakerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const speaker = speakers.find((s) => s.id === id);
  if (!speaker) notFound();

  const speakerPapers = papers.filter((p) => speaker.papers.includes(p.id));

  return (
    <main className="shell detail-shell profile-detail">
      <AppHeader compact />
      <BackLink fallback="/" label="뒤로" />

      <section className="profile-hero">
        <span>{speaker.name.slice(0, 1)}</span>
        <p className="kicker">발표자</p>
        <h1>{speaker.name}</h1>
        <p>{speakerPapers.length}개 발표 참여</p>
      </section>

      <div className="section-heading">
        <h2>발표 논문</h2>
        <strong>{speakerPapers.length}</strong>
      </div>
      <div className="list">
        {speakerPapers.map((p) => <PaperCard key={p.id} paper={p} />)}
      </div>
      <AppTabs />
    </main>
  );
}
