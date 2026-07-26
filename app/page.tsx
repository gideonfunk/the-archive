"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Track = {
  id: string;
  title: string;
  artist: string;
  persona: string;
  number: string;
  duration: string;
  color: string;
  tags: string[];
};

const personas = [
  { name: "All transmissions", short: "ALL", color: "#e8e2d8" },
  { name: "The War Scroll", short: "WS", color: "#a82a25" },
  { name: "Echo Gray", short: "EG", color: "#829097" },
  { name: "Chanokh", short: "CH", color: "#4e735e" },
  { name: "Instrumental Band", short: "IB", color: "#b46d37" },
  { name: "Gideon", short: "GD", color: "#c49b42" },
];

const tracks: Track[] = [
  { id: "iron-witness", title: "Iron Witness", artist: "The War Scroll", persona: "The War Scroll", number: "001", duration: "03:41", color: "#a82a25", tags: ["prophetic", "industrial", "psalm"] },
  { id: "salt-memory", title: "Salt Memory", artist: "Echo Gray", persona: "Echo Gray", number: "002", duration: "04:08", color: "#829097", tags: ["nocturne", "ambient", "memory"] },
  { id: "eastward", title: "Eastward, Still", artist: "Chanokh", persona: "Chanokh", number: "003", duration: "03:26", color: "#4e735e", tags: ["pilgrimage", "folk", "field"] },
  { id: "rooms-of-brass", title: "Rooms of Brass", artist: "Instrumental Band", persona: "Instrumental Band", number: "004", duration: "05:12", color: "#b46d37", tags: ["ensemble", "cinematic", "brass"] },
  { id: "the-gold-between", title: "The Gold Between", artist: "Gideon", persona: "Gideon", number: "005", duration: "04:37", color: "#c49b42", tags: ["songwriter", "intimate", "gold"] },
  { id: "no-king-but-fire", title: "No King but Fire", artist: "The War Scroll", persona: "The War Scroll", number: "006", duration: "02:58", color: "#a82a25", tags: ["manifesto", "distortion", "live"] },
  { id: "static-coast", title: "Static Coast", artist: "Echo Gray", persona: "Echo Gray", number: "007", duration: "04:44", color: "#829097", tags: ["shoegaze", "tide", "drift"] },
  { id: "unmetered", title: "Unmetered", artist: "Instrumental Band", persona: "Instrumental Band", number: "008", duration: "06:03", color: "#b46d37", tags: ["improvised", "rhythm", "suite"] },
];

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
  const [filter, setFilter] = useState("All transmissions");
  const [current, setCurrent] = useState(tracks[0]);
  const [playing, setPlaying] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({ "iron-witness": 4 });
  const [tags, setTags] = useState<Record<string, string[]>>({});
  const [tagDraft, setTagDraft] = useState("");
  const [progress, setProgress] = useState(21);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const visibleTracks = filter === "All transmissions" ? tracks : tracks.filter((track) => track.persona === filter);
  const currentTags = [...current.tags, ...(tags[current.id] ?? [])];

  useEffect(() => {
    if (playing) {
      timer.current = setInterval(() => setProgress((value) => (value >= 100 ? 0 : value + 0.25)), 250);
    }
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing]);

  function chooseTrack(track: Track) {
    setCurrent(track);
    setProgress(0);
    setPlaying(true);
  }

  async function saveRating(trackId: string, rating: number) {
    setRatings((state) => ({ ...state, [trackId]: rating }));
    fetch("/api/engagement", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ trackId, rating, deviceId: "browser-device" }),
    }).catch(() => undefined);
  }

  function addTag(event: FormEvent) {
    event.preventDefault();
    const clean = tagDraft.trim().replace(/^#/, "").toLowerCase();
    if (!clean || currentTags.includes(clean)) return;
    setTags((state) => ({ ...state, [current.id]: [...(state[current.id] ?? []), clean] }));
    setTagDraft("");
    fetch("/api/engagement", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ trackId: current.id, tag: clean, deviceId: "browser-device" }),
    }).catch(() => undefined);
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
        <button className="about-button" type="button" onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}>
          ABOUT ↘
        </button>
      </header>

      <section className="hero" id="top">
        <div className="hero-index">A—001</div>
        <h1>FIVE VOICES.<br /><em>ONE</em> SIGNAL.</h1>
        <p>A living archive of songs, sketches, and sonic artifacts by Gideon Funk. Choose a frequency. Leave a trace.</p>
        <div className="hero-mark" aria-hidden="true">
          <span>5</span>
          <div />
        </div>
      </section>

      <nav className="persona-nav" aria-label="Filter tracks by persona">
        {personas.map((persona) => (
          <button
            key={persona.name}
            className={filter === persona.name ? "active" : ""}
            onClick={() => setFilter(persona.name)}
            style={{ "--persona": persona.color } as React.CSSProperties}
            type="button"
          >
            <span>{persona.short}</span>
            {persona.name}
          </button>
        ))}
      </nav>

      <section className="archive">
        <div className="section-heading">
          <div>
            <span>THE CURRENT</span>
            <h2>RECENT<br />TRANSMISSIONS</h2>
          </div>
          <p>{String(visibleTracks.length).padStart(2, "0")} ARTIFACTS<br />UPDATED WEEKLY</p>
        </div>

        <div className="track-list">
          {visibleTracks.map((track) => (
            <article className={`track-row ${current.id === track.id ? "selected" : ""}`} key={track.id}>
              <button className="track-main" type="button" onClick={() => chooseTrack(track)} aria-label={`Play ${track.title} by ${track.artist}`}>
                <span className="track-number">{track.number}</span>
                <span className="cover" style={{ background: track.color }}><i>{track.artist.split(" ").map((word) => word[0]).join("").slice(0, 2)}</i></span>
                <span className="track-copy">
                  <strong>{track.title}</strong>
                  <small>{track.artist}</small>
                </span>
              </button>
              <div className="track-tags">{track.tags.slice(0, 2).map((tag) => <span key={tag}>#{tag}</span>)}</div>
              <StarRow compact value={ratings[track.id] ?? 0} onChange={(rating) => saveRating(track.id, rating)} />
              <time>{track.duration}</time>
              <button className="row-play" type="button" onClick={() => chooseTrack(track)} aria-label={`Play ${track.title}`}>{current.id === track.id && playing ? "Ⅱ" : "▶"}</button>
            </article>
          ))}
        </div>
      </section>

      <section className="trace-section" id="about">
        <div className="trace-copy">
          <span>LISTENING IS PARTICIPATION</span>
          <h2>LEAVE<br />A TRACE.</h2>
          <p>No account. No feed. Rate what moves you and add a word to the collective index. Every response becomes part of the archive.</p>
        </div>
        <div className="trace-panel">
          <div className="mini-cover" style={{ background: current.color }}><span>{current.number}</span><b>{current.artist}</b></div>
          <div className="trace-controls">
            <span>NOW INDEXING</span>
            <h3>{current.title}</h3>
            <p>{current.artist}</p>
            <label>Your signal</label>
            <StarRow value={ratings[current.id] ?? 0} onChange={(rating) => saveRating(current.id, rating)} />
            <label>Tag this artifact</label>
            <form onSubmit={addTag}>
              <input value={tagDraft} onChange={(event) => setTagDraft(event.target.value)} placeholder="one word..." aria-label="Add a tag" maxLength={24} />
              <button type="submit" aria-label="Add tag">＋</button>
            </form>
            <div className="tag-cloud">{currentTags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
          </div>
        </div>
      </section>

      <footer>
        <div className="footer-brand">THE<br /><span>ARCHIVE</span></div>
        <p>Five evolving bodies of work.<br />One independent signal.</p>
        <div className="footer-meta"><span>© 2026 GIDEON FUNK</span><span>VANCOUVER, BC</span></div>
      </footer>

      <aside className="player" aria-label="Now playing">
        <button className="player-cover" style={{ background: current.color }} type="button" onClick={() => setPlaying(!playing)}>{playing ? "Ⅱ" : "▶"}</button>
        <div className="player-title"><strong>{current.title}</strong><span>{current.artist}</span></div>
        <button className="skip" type="button" onClick={() => setProgress(Math.max(0, progress - 10))} aria-label="Back ten seconds">−10</button>
        <button className="main-play" type="button" onClick={() => setPlaying(!playing)} aria-label={playing ? "Pause" : "Play"}>{playing ? "Ⅱ" : "▶"}</button>
        <button className="skip" type="button" onClick={() => setProgress(Math.min(100, progress + 10))} aria-label="Forward ten seconds">+10</button>
        <div className="timeline"><span style={{ width: `${progress}%`, background: current.color }} /></div>
        <span className="elapsed">{Math.floor(progress * 0.026)}:{String(Math.floor((progress * 1.73) % 60)).padStart(2, "0")} / {current.duration}</span>
      </aside>
    </main>
  );
}
