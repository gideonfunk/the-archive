import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TrackExperience } from "@/components/TrackExperience";
import { getApprovedTags, getCatalog } from "@/lib/catalog";
import { formatDuration } from "@/lib/utils";

type PageProps = { params: Promise<{ slug: string }> };

async function getTrack(slug: string) {
  const catalog = await getCatalog({ trackSlug: slug });
  return catalog.tracks.find((track) => track.slug === slug) ?? null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const track = await getTrack((await params).slug);
  if (!track) return { title: "Track Not Found" };
  return {
    title: `${track.title} — ${track.personaName} — The Archive`,
    description: `Listen to ${track.title} by ${track.personaName}.`,
  };
}

export default async function TrackPage({ params }: PageProps) {
  const track = await getTrack((await params).slug);
  if (!track) notFound();
  const approvedTags = await getApprovedTags(track.id);

  return (
    <main>
      <header className="masthead">
        <Link className="wordmark" href="/" aria-label="The Archive home"><span>THE</span> ARCHIVE</Link>
        <div className="mast-meta"><span>INDEPENDENT TRANSMISSIONS</span></div>
      </header>
      <section className="track-header" style={{ "--persona": track.personaColor } as React.CSSProperties}>
        <div className="track-cover-large" style={{ background: track.personaColor }}>
          <span>{track.personaName.split(" ").map((word) => word[0]).join("").slice(0, 2)}</span>
        </div>
        <div className="track-meta">
          <span className="track-id">{track.trackId}</span>
          <h1>{track.title}</h1>
          <p className="track-artist">{track.personaName}</p>
          {track.genre && <span className="track-genre">{track.genre}</span>}
          {track.duration && <time className="track-duration">{formatDuration(track.duration)}</time>}
          {track.explicit && <span className="explicit-badge">EXPLICIT</span>}
        </div>
      </section>
      <TrackExperience track={track} approvedTags={approvedTags} />
      {track.scriptureReferences && (
        <section className="track-scripture">
          <h3>Scripture</h3>
          <p>{track.scriptureReferences.split(";").map((reference) => reference.trim()).join(" • ")}</p>
        </section>
      )}
      <footer><div className="footer-brand">THE<br /><span>ARCHIVE</span></div><p>Five evolving bodies of work.<br />One independent signal.</p></footer>
    </main>
  );
}
