"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAudioPlayer } from "@/components/AudioPlayer";
import { getOrCreateAnonymousUserId } from "@/lib/auth";
import type { ApprovedTag, TrackCatalogItem } from "@/lib/types";

export function TrackExperience({
  track,
  approvedTags,
}: {
  track: TrackCatalogItem;
  approvedTags: ApprovedTag[];
}) {
  const { playTrack } = useAudioPlayer();
  const [rating, setRating] = useState(0);
  const [tag, setTag] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const id = getOrCreateAnonymousUserId();
    fetch(`/api/ratings?trackId=${track.id}&userId=${encodeURIComponent(id)}`)
      .then((response) => response.json() as Promise<{ rating?: number | null }>)
      .then((data) => setRating(data.rating ?? 0))
      .catch(() => undefined);
  }, [track.id]);

  async function submitRating(value: number) {
    const userId = getOrCreateAnonymousUserId();
    if (!userId) return;
    setRating(value);
    const response = await fetch("/api/ratings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ trackId: track.id, userId, rating: value }),
    });
    setMessage(response.ok ? "Rating saved." : "Rating could not be saved.");
  }

  async function submitTag(event: FormEvent) {
    event.preventDefault();
    const userId = getOrCreateAnonymousUserId();
    if (!userId || !tag.trim()) return;
    const response = await fetch("/api/tags", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ trackId: track.id, userId, tag }),
    });
    const result = (await response.json()) as { error?: string };
    if (response.ok) {
      setTag("");
      setMessage("Tag submitted for review.");
    } else {
      setMessage(result.error ?? "Tag could not be submitted.");
    }
  }

  function startListening() {
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

  return (
    <>
      <section className="track-player-section">
        <button
          className="main-play-button"
          style={{ background: track.personaColor }}
          onClick={startListening}
          disabled={!track.publicUrl}
          type="button"
        >
          <span>▶</span> {track.publicUrl ? "START LISTENING" : "AUDIO COMING SOON"}
        </button>
      </section>

      {approvedTags.length > 0 && (
        <section className="track-tags">
          <h3>Tags</h3>
          <div className="tag-cloud">
            {approvedTags.map((approvedTag) => (
              <span key={approvedTag.id}>#{approvedTag.displayLabel}</span>
            ))}
          </div>
        </section>
      )}

      <section className="track-engagement">
        <div className="engagement-panel">
          <h3>Your Signal</h3>
          <p>Rate this track and add a tag to leave your trace in the archive.</p>
          <div className="stars" aria-label={`${rating} of 5 stars`}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`Rate ${value} stars`}
                onClick={() => submitRating(value)}
              >
                {value <= rating ? "★" : "☆"}
              </button>
            ))}
          </div>
          <form className="tag-form-placeholder" onSubmit={submitTag}>
            <input
              type="text"
              value={tag}
              onChange={(event) => setTag(event.target.value)}
              placeholder="Add a tag..."
              aria-label="Add a tag"
              maxLength={64}
            />
            <button type="submit" aria-label="Submit tag">＋</button>
          </form>
          {message && <p role="status">{message}</p>}
        </div>
      </section>
    </>
  );
}
