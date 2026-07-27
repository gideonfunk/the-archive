# The Archive — Listening, Sharing, and Annual Collections

**Status:** Ready for Devin/SWE implementation

## 1. Purpose

Make The Archive a complete listening experience: listeners can see complete, verified track information and lyrics; express both a star rating and a simple reaction; find the community's strongest material first; shuffle through the catalog; download and share approved works; and discover curator-approved annual collections such as **Best of 2026**.

The public site remains account-free. A browser-local anonymous ID is used only to remember one listener's ratings and preferences, while aggregate metrics are stored in D1.

## 2. Product decisions

### Default home experience

- The default catalog view is **Top Favorites**, not the complete catalog.
- Show the top 12 eligible public tracks, ranked by a transparent editorial score:
  1. favorite count,
  2. thumbs-up ratio,
  3. average star rating (minimum 3 ratings),
  4. qualified play count,
  5. newest publication date as the tie-breaker.
- Include an **Explore all transmissions** control that reveals the full catalog without losing the listener's current filter.
- Clearly label the list as community activity plus curator selection; never present it as an objective quality score.

### Listener actions

Each public track supports four independent actions:

| Action | Per listener | Aggregate displayed | Meaning |
| --- | --- | --- | --- |
| Star rating | One 1–5 rating; editable | Average + rating count | Personal quality response |
| Thumbs up/down | One current vote; editable or removable | Up/down totals | Quick response |
| Favorite | Toggle | Favorite total | Save as a personal favorite |
| Play | Qualified once per track/version/listener/hour | Qualified play count | Listening signal |

- Ratings, vote, and favorite state persist in D1 and reload when the same browser returns.
- On a new browser/device, the listener begins with a new anonymous identity; no cross-device promise is made.
- A reaction is acknowledged immediately in the interface and reconciled with the server response.
- Show plain-language status text for success, rate limits, or unavailable network/database conditions.

### Shuffle and queue

- Add a **Shuffle** control to the home view and each persona/release page.
- Shuffle selects a random item from the currently visible set, starts playback, and builds a temporary queue from that same set.
- Add **previous** and **next** buttons to the persistent player.
- Avoid repeating the immediately previous track when at least two tracks are available.
- At the end of a track, automatically advance to the next queued track when a queue exists.
- Shuffle state is browser-local and may reset on reload.

## 3. Full track metadata and lyrics

### Obsidian is the authoritative private source

- The private source of truth for lyrics, songwriting notes, and track metadata is the Obsidian music vault, currently documented at `~/Obsidian/Brain/04-Data/Devotional/songs/`.
- Hermes and OpenClaw own the private intake workflow: when a new track is created, they must preserve the source audio location, create or update its Obsidian record, and retain lyrics and metadata there.
- The Archive website and its D1 database are **publication projections**, never the authoritative archive. A public edit on the website must not overwrite an Obsidian source record.
- Do not expose Obsidian paths, unpublished notes, prompts, drafts, private collaborator information, or unverified lyrics through a public API.

### Required Obsidian track record

Each publishable track record must include:

- immutable `track_id`, title, persona, status, version, and source-audio reference;
- release/publication date, rights owner, license decision, attribution line, and download approval;
- plain lyrics, optional synchronized lyrics, language, provenance, verification status, and rights status;
- public-safe genre, tags, scripture references, and short description;
- an explicit `public_ready` / `publish_approved` field.

### Export boundary

- Build a deliberate exporter that reads only records marked `publish_approved` and emits a validated public manifest for D1/R2.
- The manifest must contain only public-safe fields and the approved web-audio/artwork object keys.
- The exporter must be idempotent, report changed records, and never delete or modify the Obsidian original.
- If a lyric is not both verified and rights-cleared in Obsidian, the public manifest must omit it.

### Track-page content

Every public track page must display, when present:

- title, persona, artwork, release, track number, release/publication date;
- duration, genre, language, explicit flag, lyrics language;
- stable track ID and current web-version label;
- scripture references, curator tags, copyright/rights notice, and license;
- community metrics: average stars, rating count, favorites, thumbs up/down, qualified plays;
- listener's own star rating, vote, and favorite state.

### Lyrics

- Add a dedicated **Lyrics** section to track pages.
- Display only lyrics whose verification status is `verified` and whose rights status permits display.
- Support plain lyrics first. If synchronized lyrics exist, add a **Follow playback** mode that highlights the current line; fall back cleanly to plain lyrics.
- Show a clear state for absent lyrics: `Lyrics are not published for this track yet.`
- Never fetch, scrape, or display third-party lyrics automatically without a rights and verification record.
- Add a compact lyrics preview/expand control to the player only after the track-page version is complete.

## 4. Downloads and sharing

### Downloads

- A public track may expose a download only when its current version has `download_enabled = true` and a downloadable web derivative URL.
- The download button must use the web derivative, never the archival master.
- Show file format and approximate size before download when known.
- If downloading is disabled, omit the button rather than showing a broken control.

### Sharing

- Add a **Share** button to track, release, and annual-collection pages.
- Use the native Web Share API where supported; otherwise provide a copy-link control with confirmation.
- Shared URLs are canonical track/release URLs, optionally including a campaign parameter—not raw R2 URLs.
- Add Open Graph metadata and a social card for public track and release routes.
- Keep QR `/listen/<code>` destinations stable for physical posters.

## 5. License and faith-use statement

### Recommended standard license

Use **CC BY-NC-SA 4.0 International** for each track explicitly approved for free sharing:

- listeners may copy, share, and adapt the material non-commercially;
- they must credit Gideon Funk / the named persona;
- shared adaptations use the same license.

This standard license matches the request that no one make money from the music. Creative Commons attribution requires credit to the creator, but a CC license cannot add a legal requirement that a listener use the work only to glorify God or Yeshua/Jesus; CC licenses forbid adding restrictions beyond their standard terms. Put that desire in a separate, prominent **Artist's Request** rather than presenting it as part of the CC legal license.

**Artist's Request (non-legal copy):**

> These songs are freely offered in the name of Jesus/Yeshua. If you use or share them, please credit Gideon Funk and use them in a way that honours God and serves people with love.

If ministry-only use must be legally enforceable, do not label it Creative Commons. Use a separately drafted custom license and obtain legal advice before publishing.

### License UI

- Add a license field to tracks and web versions.
- Show the exact license name, license link, attribution text, and artist request on every downloadable/sharable track page.
- Include the same information in downloaded-file metadata when technically supported.
- Default all existing and future material to `All rights reserved` until Gideon explicitly approves a release license.

## 6. Annual collections

### Collection model

- Create an annual, curator-approved public release called `Best of <year>` (for example, `Best of 2026`).
- It is a normal release/playlist with a fixed, ordered track list and a published date.
- It must never change automatically after publication; this preserves the historical record.

### Year-end candidate report

Add an internal/curator-only report for each year that ranks eligible tracks using:

- public release date during that calendar year;
- qualified plays;
- favorite count;
- thumbs-up ratio;
- average stars, only when there are at least 3 ratings;
- curator override, with a reason saved in the publishing audit trail.

The report proposes candidates but does not publish an annual collection automatically. Gideon chooses the final list, order, title, artwork, and license before publishing.

### Future years

- Use the track's `published_at` date, not the upload date or master-file date, to determine eligibility.
- Allow a track from an older recording session to appear in the year it was first publicly published.
- Add a browse filter for `Best of 2026`, `Best of 2027`, and later years as they are published.

## 7. Data model and API requirements

### New or changed data

- `track_preferences`: one record per `(track_id, user_id)` with `favorite` boolean, `vote` integer (`-1`, `0`, `1`), timestamps.
- `track_versions`: add `download_enabled`, `download_url`, `download_format`, `download_size_bytes`, and `license`.
- `tracks`: add `published_at` and an optional `attribution_text`.
- Reuse existing `lyrics` fields: `plain_text`, `synchronized_json`, `verification_status`, `rights_status`.
- Add indexes for preference aggregation and annual-candidate queries.

### API additions

- `GET /api/catalog?userId=<uuid>&view=top|all` returns public tracks plus aggregate metrics and the listener's own preference state.
- `GET /api/preferences?trackId=<id>&userId=<uuid>` returns personal favorite/vote state.
- `POST /api/preferences` accepts `trackId`, `userId`, optional `favorite`, optional `vote`; validates public tracks and uses an upsert.
- `GET /api/annuals?year=<yyyy>` returns public annual collections.
- Existing rating and play endpoints remain authoritative and must retain validation and rate limits.

### Metric rules

- Never trust client-provided totals.
- Derive aggregate metrics from D1 server-side.
- Count only `qualified = true` play events in public rankings.
- Do not show a star average until at least 3 ratings; show `Not enough ratings yet` instead.
- Do not expose anonymous user IDs, raw play events, or individual ratings publicly.

## 8. Accessibility and mobile behavior

- All rating, vote, favorite, shuffle, share, download, next, and previous controls require clear accessible names and keyboard support.
- Use text/icon pairs for thumbs and favorite controls; do not rely on color alone.
- On mobile, keep one-tap play, favorite, and share actions available without crowding the track row.
- Respect reduced-motion preferences for lyric-follow highlighting and shuffle transitions.

## 9. Acceptance criteria

1. A listener can revisit in the same browser and see their prior star rating, vote, and favorite state.
2. The site shows aggregate rating, favorites, votes, and qualified plays without exposing personal data.
3. The home page defaults to a top-favorites list and offers an explicit path to the full catalog.
4. Shuffle, next, and previous operate against the current visible set without immediate repeats.
5. A verified, rights-cleared lyric is visible on its track page; an unavailable lyric has a clear non-error state.
6. A licensed downloadable track exposes a working download and share path; unapproved tracks do not.
7. Every public licensed track shows the exact license and attribution requirements.
8. A curator can create and publish an immutable `Best of <year>` release from a reviewed annual candidate report.
9. All new schema changes have reviewed migrations, and all routes pass lint, type checking, build, and interaction tests.

## 10. Recommended delivery order for Devin/SWE

1. Define and validate the Obsidian-to-public manifest contract; do not read directly from a user-specific vault path at runtime.
2. Schema migration, metrics, ratings persistence verification, and preferences API.
3. Home ranking, favorite/vote UI, and the full-catalog reveal.
4. Shuffle queue plus next/previous player controls.
5. Track metadata and verified lyrics.
6. Download/share controls and license presentation.
7. Annual candidate report and curator-published Best Of releases.

## 11. Decisions Gideon must make before public release

- Approve CC BY-NC-SA 4.0, CC BY-NC-ND 4.0, or a custom license per release.
- Identify the tracks/versions approved for public download.
- Supply or verify lyrics and their rights status.
- Approve the exact attribution line for each persona.
- Select the first annual collection only after reviewing its candidate report.
