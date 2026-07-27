import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/catalog";
import { formatDuration } from "@/lib/utils";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const catalog = await getCatalog({ personaSlug: slug });
  const persona = catalog.personas.find((item) => item.slug === slug);
  if (!persona) return { title: "Persona Not Found" };
  return {
    title: `${persona.name} — The Archive`,
    description: persona.description || `Music and transmissions from ${persona.name}.`,
  };
}

export default async function PersonaPage({ params }: PageProps) {
  const { slug } = await params;
  const catalog = await getCatalog({ personaSlug: slug });
  const persona = catalog.personas.find((item) => item.slug === slug);
  if (!persona) notFound();

  return (
    <main>
      <header className="masthead">
        <Link className="wordmark" href="/" aria-label="The Archive home"><span>THE</span> ARCHIVE</Link>
        <div className="mast-meta"><span>INDEPENDENT TRANSMISSIONS</span></div>
      </header>

      <section className="persona-header" style={{ "--persona": persona.primaryColor } as React.CSSProperties}>
        <div className="persona-mark" style={{ background: persona.primaryColor }}>
          <span>{persona.name.split(" ").map((word) => word[0]).join("")}</span>
        </div>
        <h1>{persona.name}</h1>
        {persona.description && <p>{persona.description}</p>}
        {persona.theologicalStatement && <blockquote className="theological-statement">{persona.theologicalStatement}</blockquote>}
      </section>

      {catalog.releases.length > 0 && (
        <section className="persona-releases">
          <div className="section-heading"><h2>RELEASES</h2></div>
          <div className="release-grid">
            {catalog.releases.map((release) => (
              <Link key={release.id} href={`/release/${release.slug}`} className="release-card">
                <div className="release-cover" style={{ background: release.personaColor }}>
                  <span>{release.title.split(" ").map((word) => word[0]).join("").slice(0, 2)}</span>
                </div>
                <div className="release-info">
                  <strong>{release.title}</strong>
                  <small>{release.type} • {release.releaseDate || "TBD"}</small>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {catalog.tracks.length > 0 && (
        <section className="persona-tracks">
          <div className="section-heading"><h2>TRACKS</h2></div>
          <div className="track-list">
            {catalog.tracks.map((track) => (
              <article className="track-row" key={track.id}>
                <Link className="track-main" href={`/track/${track.slug}`}>
                  <span className="track-number">{track.trackId.split("-").pop()}</span>
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
      )}

      <footer><div className="footer-brand">THE<br /><span>ARCHIVE</span></div><p>Five evolving bodies of work.<br />One independent signal.</p></footer>
    </main>
  );
}
