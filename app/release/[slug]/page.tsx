import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/catalog";
import { formatDate, formatDuration } from "@/lib/utils";

type PageProps = { params: Promise<{ slug: string }> };

async function getRelease(slug: string) {
  const catalog = await getCatalog({ releaseSlug: slug });
  return catalog.releases.find((release) => release.slug === slug) ?? null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const release = await getRelease((await params).slug);
  if (!release) return { title: "Release Not Found" };
  return {
    title: `${release.title} — ${release.personaName} — The Archive`,
    description: release.description || `A ${release.type} by ${release.personaName}.`,
  };
}

export default async function ReleasePage({ params }: PageProps) {
  const release = await getRelease((await params).slug);
  if (!release) notFound();

  return (
    <main>
      <header className="masthead">
        <Link className="wordmark" href="/" aria-label="The Archive home"><span>THE</span> ARCHIVE</Link>
        <div className="mast-meta"><span>INDEPENDENT TRANSMISSIONS</span></div>
      </header>
      <section className="release-header" style={{ "--persona": release.personaColor } as React.CSSProperties}>
        <div className="release-cover-large" style={{ background: release.personaColor }}>
          <span>{release.title.split(" ").map((word) => word[0]).join("").slice(0, 2)}</span>
        </div>
        <div className="release-meta">
          <span className="release-type">{release.type.toUpperCase()}</span>
          <h1>{release.title}</h1>
          <p className="release-artist">{release.personaName}</p>
          {release.releaseDate && <time>{formatDate(release.releaseDate)}</time>}
          {release.description && <p className="release-description">{release.description}</p>}
        </div>
      </section>
      <section className="release-tracks">
        <div className="section-heading"><h2>TRACKS</h2><span>{release.tracks.length} tracks</span></div>
        <div className="track-list">
          {release.tracks.map((track, index) => (
            <article className="track-row" key={track.id}>
              <Link className="track-main" href={`/track/${track.slug}`}>
                <span className="track-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="cover" style={{ background: track.personaColor }}>
                  <i>{track.personaName.split(" ").map((word) => word[0]).join("").slice(0, 2)}</i>
                </span>
                <span className="track-copy"><strong>{track.title}</strong><small>{track.genre || "—"}</small></span>
              </Link>
              {track.duration && <time>{formatDuration(track.duration)}</time>}
            </article>
          ))}
        </div>
      </section>
      <footer><div className="footer-brand">THE<br /><span>ARCHIVE</span></div><p>Five evolving bodies of work.<br />One independent signal.</p></footer>
    </main>
  );
}
