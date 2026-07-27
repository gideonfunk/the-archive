"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAudioPlayer } from "@/components/AudioPlayer";
import { getOrCreateAnonymousUserId } from "@/lib/auth";
import { formatDuration } from "@/lib/utils";
import type { CatalogData } from "@/lib/types";

function StarRow({ value, onChange, compact = false }: { value: number; onChange: (rating: number) => void; compact?: boolean }) {
  return (
    <div className={`stars ${compact ? "stars-compact" : ""}`} aria-label={`${value} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" aria-label={`Rate ${star} stars`} onClick={() => onChange(star)}>
          {star <= value ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}

export default function Home() {
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [filter, setFilter] = useState("all");
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [userTags, setUserTags] = useState<Record<number, string[]>>({});
  const [tagDraft, setTagDraft] = useState("");
  const [currentTrackId, setCurrentTrackId] = useState<number | null>(null);
  const { playTrack, currentTrack } = useAudioPlayer();

  useEffect(() => {
    fetch("/api/catalog")
      .then((res) => {
        if (!res.ok) throw new Error("Catalog request failed");
        return res.json() as Promise<CatalogData>;
      })
      .then(setCatalog)
      .catch(console.error);
  }, []);

  const personas = catalog?.personas || [];
  const allPersonaOption = { name: "All transmissions", slug: "all", primaryColor: "#e8e2d8", sortOrder: -1 };
  const allPersonas = [allPersonaOption, ...personas];

  const visibleTracks = catalog?.tracks.filter(
    (track) => filter === "all" || track.personaSlug === filter
  ) || [];

  const currentTrackData = visibleTracks.find((t) => t.id === currentTrackId) || visibleTracks[0];

  const currentTags = currentTrackData
    ? [
        ...(currentTrackData.curatorTags?.split(";").filter(Boolean) || []),
        ...(userTags[currentTrackData.id] || []),
      ]
    : [];

  async function saveRating(trackId: number, rating: number) {
    const userId = getOrCreateAnonymousUserId();
    if (!userId) return;
    setRatings((state) => ({ ...state, [trackId]: rating }));
    fetch("/api/ratings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ trackId, userId, rating }),
    }).catch(() => undefined);
  }

  async function addTag(event: FormEvent) {
    event.preventDefault();
    if (!currentTrackData) return;
    const userId = getOrCreateAnonymousUserId();
    if (!userId) return;

    const clean = tagDraft.trim().replace(/^#/, "").toLowerCase();
    if (!clean || currentTags.includes(clean)) return;

    setUserTags((state) => ({
      ...state,
      [currentTrackData.id]: [...(state[currentTrackData.id] || []), clean],
    }));
    setTagDraft("");

    fetch("/api/tags", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ trackId: currentTrackData.id, userId, tag: clean }),
    }).catch(() => undefined);
  }

  function chooseTrack(track: typeof visibleTracks[0]) {
    setCurrentTrackId(track.id);
    if (!track.publicUrl) return;
    playTrack({
      id: track.id,
      title: track.title,
      personaName: track.personaName,
      personaColor: track.personaColor,
      publicUrl: track.publicUrl,
      duration: track.duration,
      versionId: track.versionId,
    });
  }

  if (!catalog) {
    return <main><div className="loading">Loading archive...</div></main>;
  }

  return (
    <main>
      <header className="masthead">
        <a className="wordmark" href="#top" aria-label="The Archive home">
          <span>THE</span> ARCHIVE
        </a>
        <div className="mast-meta">
          <span>INDEPENDENT TRANSMISSIONS</span>
          <span>VOL. 01 / 2026</span>
        </div>
        <button
          className="about-button"
          type="button"
          onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}
        >
          ABOUT ↘
        </button>
      </header>

      <section className="hero" id="top">
        <div className="hero-index">A—001</div>
        <h1>
          FIVE VOICES.<br />
          <em>ONE</em> SIGNAL.
        </h1>
        <p>
          A living archive of songs, sketches, and sonic artifacts by Gideon Funk. Choose a frequency. Leave a trace.
        </p>
        <div className="hero-mark" aria-hidden="true">
          <span>5</span>
          <div />
        </div>
      </section>

      <nav className="persona-nav" aria-label="Filter tracks by persona">
        {allPersonas.map((persona) => (
          <button
            key={persona.slug}
            className={filter === persona.slug ? "active" : ""}
            onClick={() => setFilter(persona.slug)}
            style={{ "--persona": persona.primaryColor } as React.CSSProperties}
            type="button"
          >
            <span>{persona.name.split(" ").map((w) => w[0]).join("")}</span>
            {persona.name}
          </button>
        ))}
      </nav>

      <section className="archive">
        <div className="section-heading">
          <div>
            <span>THE CURRENT</span>
            <h2>
              RECENT<br />
              TRANSMISSIONS
            </h2>
          </div>
          <p>
            {String(visibleTracks.length).padStart(2, "0")} ARTIFACTS<br />
            UPDATED WEEKLY
          </p>
        </div>

        <div className="track-list">
          {visibleTracks.map((track) => (
            <article
              className={`track-row ${currentTrack?.id === track.id ? "selected" : ""}`}
              key={track.id}
            >
              <button
                className="track-main"
                type="button"
                onClick={() => chooseTrack(track)}
                aria-label={`Play ${track.title} by ${track.personaName}`}
              >
                <span className="track-number">{track.trackId?.split("-").pop() || "—"}</span>
                <span className="cover" style={{ background: track.personaColor }}>
                  <i>{track.personaName.split(" ").map((word) => word[0]).join("").slice(0, 2)}</i>
                </span>
                <span className="track-copy">
                  <strong>{track.title}</strong>
                  <small>{track.personaName}</small>
                </span>
              </button>
              <div className="track-tags">
                {track.curatorTags?.split(";").slice(0, 2).filter(Boolean).map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </div>
              <StarRow
                compact
                value={ratings[track.id] ?? 0}
                onChange={(rating) => saveRating(track.id, rating)}
              />
              <time>{track.duration ? formatDuration(track.duration) : "--:--"}</time>
              <button
                className="row-play"
                type="button"
                onClick={() => chooseTrack(track)}
                aria-label={`Play ${track.title}`}
              >
                {currentTrack?.id === track.id ? "Ⅱ" : "▶"}
              </button>
            </article>
          ))}
        </div>
      </section>

      {currentTrackData && (
        <section className="trace-section" id="about">
          <div className="trace-copy">
            <span>LISTENING IS PARTICIPATION</span>
            <h2>
              LEAVE<br />
              A TRACE.
            </h2>
            <p>
              No account. No feed. Rate what moves you and add a word to the collective index. Every response becomes part of the archive.
            </p>
          </div>
          <div className="trace-panel">
            <div className="mini-cover" style={{ background: currentTrackData.personaColor }}>
              <span>{currentTrackData.trackId?.split("-").pop() || "—"}</span>
              <b>{currentTrackData.personaName}</b>
            </div>
            <div className="trace-controls">
              <span>NOW INDEXING</span>
              <h3>{currentTrackData.title}</h3>
              <p>{currentTrackData.personaName}</p>
              <label>Your signal</label>
              <StarRow
                value={ratings[currentTrackData.id] ?? 0}
                onChange={(rating) => saveRating(currentTrackData.id, rating)}
              />
              <label>Tag this artifact</label>
              <form onSubmit={addTag}>
                <input
                  value={tagDraft}
                  onChange={(event) => setTagDraft(event.target.value)}
                  placeholder="one word..."
                  aria-label="Add a tag"
                  maxLength={24}
                />
                <button type="submit" aria-label="Add tag">
                  ＋
                </button>
              </form>
              <div className="tag-cloud">
                {currentTags.map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <footer>
        <div className="footer-brand">
          THE<br />
          <span>ARCHIVE</span>
        </div>
        <p>
          Five evolving bodies of work.<br />
          One independent signal.
        </p>
        <div className="footer-meta">
          <span>© 2026 GIDEON FUNK</span>
          <span>VANCOUVER, BC</span>
        </div>
      </footer>
    </main>
  );
}
