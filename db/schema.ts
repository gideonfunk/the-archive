import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// Anonymous users for identity management (replaces Supabase Auth)
export const anonymousUsers = sqliteTable("anonymous_users", {
  id: text("id").primaryKey(), // UUID
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  lastSeenAt: text("last_seen_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Personas - Five public identities
export const personas = sqliteTable("personas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  primaryColor: text("primary_color").notNull(),
  description: text("description"),
  theologicalStatement: text("theological_statement"),
  status: text("status").notNull().default("active"), // active, retired
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Releases - Albums, EPs, collections, QR destinations
export const releases = sqliteTable("releases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  personaId: integer("persona_id").notNull().references(() => personas.id),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  type: text("type").notNull(), // album, ep, single, collection
  description: text("description"),
  releaseDate: text("release_date"),
  publishedAt: text("published_at"),
  status: text("status").notNull().default("draft"), // draft, scheduled, public, retired
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("releases_persona_slug_idx").on(table.personaId, table.slug)]);

// Tracks - Stable work identity
export const tracks = sqliteTable("tracks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  personaId: integer("persona_id").notNull().references(() => personas.id),
  trackId: text("track_id").notNull().unique(), // TWS-2026-001
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  status: text("status").notNull().default("draft"), // draft, scheduled, public, retired
  genre: text("genre"),
  language: text("language").notNull().default("en"),
  explicit: integer("explicit", { mode: "boolean" }).notNull().default(false),
  isrc: text("isrc"),
  curatorTags: text("curator_tags"), // semicolon-separated
  scriptureReferences: text("scripture_references"), // semicolon-separated
  rightsNote: text("rights_note").notNull(),
  attributionText: text("attribution_text"), // For CC license attribution
  publishedAt: text("published_at"), // When first made public
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Release tracks - Ordered tracks in releases
export const releaseTracks = sqliteTable("release_tracks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  releaseId: integer("release_id").notNull().references(() => releases.id),
  trackId: integer("track_id").notNull().references(() => tracks.id),
  position: integer("position").notNull(),
  versionId: integer("version_id").references(() => trackVersions.id), // specific version for this release
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("release_tracks_release_position_idx").on(table.releaseId, table.position)]);

// Track versions - Master/web version history
export const trackVersions = sqliteTable("track_versions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  trackId: integer("track_id").notNull().references(() => tracks.id),
  version: text("version").notNull(), // v03
  purpose: text("purpose").notNull(), // master, web
  duration: integer("duration"), // seconds
  checksum: text("checksum"),
  loudnessIntegrated: text("loudness_integrated"), // LUFS
  loudnessRange: text("loudness_range"),
  truePeak: text("true_peak"), // dBTP
  sampleRate: integer("sample_rate"),
  bitDepth: integer("bit_depth"),
  objectKey: text("object_key"), // R2 key
  publicUrl: text("public_url"),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(false),
  downloadEnabled: integer("download_enabled", { mode: "boolean" }).notNull().default(false),
  downloadUrl: text("download_url"),
  downloadFormat: text("download_format"), // mp3, flac, wav
  downloadSizeBytes: integer("download_size_bytes"),
  license: text("license"), // CC BY-NC-SA 4.0, CC BY-NC-ND 4.0, All rights reserved
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Lyrics - Plain and synchronized lyrics
export const lyrics = sqliteTable("lyrics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  trackId: integer("track_id").notNull().references(() => tracks.id),
  language: text("language").notNull().default("en"),
  source: text("source"), // manual, lrclib, other
  sourceUrl: text("source_url"),
  plainText: text("plain_text"),
  synchronizedJson: text("synchronized_json"), // JSON array of {time, text}
  verificationStatus: text("verification_status").notNull().default("unverified"), // unverified, verified, rejected
  rightsStatus: text("rights_status").notNull().default("unknown"), // unknown, owned, licensed, public_domain
  verifiedAt: text("verified_at"),
  verifiedBy: text("verified_by"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("lyrics_track_language_idx").on(table.trackId, table.language)]);

// Art assets - Artwork variants and provenance
export const artAssets = sqliteTable("art_assets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entityType: text("entity_type").notNull(), // persona, release, track
  entityId: integer("entity_id").notNull(),
  purpose: text("purpose").notNull(), // primary, square, og, mobile_poster
  objectKey: text("object_key").notNull(),
  publicUrl: text("public_url"),
  width: integer("width"),
  height: integer("height"),
  format: text("format"), // jpg, png, webp
  generatorProvider: text("generator_provider"),
  prompt: text("prompt"),
  sourceInputs: text("source_inputs"),
  approvalStatus: text("approval_status").notNull().default("pending"), // pending, approved, rejected
  isPrimary: integer("is_primary", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Tags - Canonical normalized tag vocabulary
export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  displayLabel: text("display_label").notNull(),
  normalizedSlug: text("normalized_slug").notNull().unique(),
  blocked: integer("blocked", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Track tag assignments - Curator and listener tag links
export const trackTagAssignments = sqliteTable("track_tag_assignments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  trackId: integer("track_id").notNull().references(() => tracks.id),
  tagId: integer("tag_id").notNull().references(() => tags.id),
  userId: text("user_id").references(() => anonymousUsers.id),
  source: text("source").notNull(), // curator, listener
  moderationStatus: text("moderation_status").notNull().default("pending"), // pending, approved, rejected
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("track_tag_assignments_track_user_tag_idx").on(table.trackId, table.userId, table.tagId),
  index("track_tag_assignments_user_created_idx").on(table.userId, table.createdAt),
]);

// Track ratings - One rating per anonymous user per track
export const trackRatings = sqliteTable("track_ratings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  trackId: integer("track_id").notNull().references(() => tracks.id),
  userId: text("user_id").notNull().references(() => anonymousUsers.id),
  rating: integer("rating").notNull(), // 1-5
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("track_ratings_track_user_idx").on(table.trackId, table.userId)]);

// Track preferences - Favorites and votes per anonymous user per track
export const trackPreferences = sqliteTable("track_preferences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  trackId: integer("track_id").notNull().references(() => tracks.id),
  userId: text("user_id").notNull().references(() => anonymousUsers.id),
  favorite: integer("favorite", { mode: "boolean" }).notNull().default(false),
  vote: integer("vote").notNull().default(0), // -1 (down), 0 (none), 1 (up)
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("track_preferences_track_user_idx").on(table.trackId, table.userId),
  index("track_preferences_user_favorite_idx").on(table.userId, table.favorite),
]);

// Play events - Short-retention qualified playback events
export const playEvents = sqliteTable("play_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  trackVersionId: integer("track_version_id").notNull().references(() => trackVersions.id),
  userId: text("user_id").references(() => anonymousUsers.id),
  source: text("source").notNull(), // web, qr, direct
  campaign: text("campaign"),
  playDuration: integer("play_duration"), // seconds actually played
  qualified: integer("qualified", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("play_events_user_created_idx").on(table.userId, table.createdAt),
  index("play_events_version_user_created_idx").on(table.trackVersionId, table.userId, table.createdAt),
]);

// QR links - Stable short-code redirects
export const qrLinks = sqliteTable("qr_links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  shortCode: text("short_code").notNull().unique(),
  destinationType: text("destination_type").notNull(), // release, track, url
  destinationId: integer("destination_id"), // for release/track
  destinationUrl: text("destination_url"), // for direct url
  campaign: text("campaign"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Publishing events - Private audit trail
export const publishingEvents = sqliteTable("publishing_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entityType: text("entity_type").notNull(), // track, release, artwork, lyrics
  entityId: integer("entity_id").notNull(),
  action: text("action").notNull(), // publish, unpublish, update, retire
  priorStatus: text("prior_status"),
  newStatus: text("new_status"),
  curator: text("curator").notNull(),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
