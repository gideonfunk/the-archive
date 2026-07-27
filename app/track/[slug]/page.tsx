import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TrackExperience } from "@/components/TrackExperience";
import { getApprovedTags, getCatalog } from "@/lib/catalog";
import { getTrackLyrics } from "@/lib/lyrics";
import { formatDuration } from "@/lib/utils";

type PageProps = { params: Promise<{ slug: string }> };

async function getTrack(slug: string) {
  const catalog = await getCatalog({ trackSlug: slug });
  return catalog.tracks.find((track) => track.slug === slug) ?? null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const track = await getTrack((await params).slug);
  if (!track) return { title: "Track Not Found" };
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  const trackUrl = `${siteUrl}/track/${track.slug}`;
  
  return {
    title: `${track.title} — ${track.personaName} — The Archive`,
    description: `Listen to ${track.title} by ${track.personaName}. ${track.genre ? `${track.genre}.` : ''}`,
    openGraph: {
      title: `${track.title} — ${track.personaName}`,
      description: `Listen to ${track.title} by ${track.personaName}.`,
      url: trackUrl,
      siteName: 'The Archive',
      type: 'music.song',
      audio: track.publicUrl ? track.publicUrl : undefined,
      images: [
        {
          url: `${siteUrl}/og/track/${track.slug}`,
          width: 1200,
          height: 630,
          alt: `${track.title} by ${track.personaName}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${track.title} — ${track.personaName}`,
      description: `Listen to ${track.title} by ${track.personaName}.`,
      images: [`${siteUrl}/og/track/${track.slug}`],
    },
  };
}

export default async function TrackPage({ params }: PageProps) {
  const track = await getTrack((await params).slug);
  if (!track) notFound();
  const approvedTags = await getApprovedTags(track.id);

  // Fetch lyrics server-side
  const lyricsData = await getTrackLyrics(track.id);

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
      {lyricsData.lyrics && lyricsData.lyrics.length > 0 ? (
        <section className="track-lyrics">
          <h3>Lyrics</h3>
          {lyricsData.lyrics.map((lyric: { id: number; plainText: string | null }) => (
            <div key={lyric.id} className="lyric-block">
              {lyric.plainText && (
                <div className="lyric-text">
                  {lyric.plainText.split('\n').map((line: string, i: number) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>
      ) : (
        <section className="track-lyrics">
          <h3>Lyrics</h3>
          <p className="lyrics-unavailable">{lyricsData.message}</p>
        </section>
      )}
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
