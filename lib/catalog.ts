import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  artAssets,
  personas,
  releases,
  releaseTracks,
  tags,
  trackPreferences,
  trackRatings,
  trackTagAssignments,
  tracks,
  trackVersions,
  playEvents,
} from "@/db/schema";
import type { ApprovedTag, CatalogData, TrackCatalogItem, ReleaseCatalogItem } from "@/lib/types";
import { featuredPersonas, featuredTracks } from "@/lib/featured-catalog";

type CatalogFilters = {
  personaSlug?: string | null;
  releaseSlug?: string | null;
  trackSlug?: string | null;
  view?: "all" | "top" | null;
  userId?: string | null;
};

export async function getCatalog(filters: CatalogFilters = {}): Promise<CatalogData> {
  const db = getDb();
  let allPersonas = await db
    .select({
      id: personas.id,
      name: personas.name,
      slug: personas.slug,
      primaryColor: personas.primaryColor,
      description: personas.description,
      theologicalStatement: personas.theologicalStatement,
      sortOrder: personas.sortOrder,
    })
    .from(personas)
    .where(eq(personas.status, "active"))
    .orderBy(personas.sortOrder);

  const selectedPersona = filters.personaSlug
    ? allPersonas.find((persona) => persona.slug === filters.personaSlug)
    : undefined;

  const trackConditions = [eq(tracks.status, "public"), eq(trackVersions.isPublic, true)];
  if (selectedPersona) trackConditions.push(eq(tracks.personaId, selectedPersona.id));
  if (filters.trackSlug) trackConditions.push(eq(tracks.slug, filters.trackSlug));

  let allTracks = await db
    .select({
      id: tracks.id,
      trackId: tracks.trackId,
      title: tracks.title,
      slug: tracks.slug,
      genre: tracks.genre,
      explicit: tracks.explicit,
      curatorTags: tracks.curatorTags,
      scriptureReferences: tracks.scriptureReferences,
      personaId: tracks.personaId,
      personaName: personas.name,
      personaSlug: personas.slug,
      personaColor: personas.primaryColor,
      versionId: trackVersions.id,
      version: trackVersions.version,
      duration: trackVersions.duration,
      publicUrl: trackVersions.publicUrl,
      publishedAt: tracks.publishedAt,
      downloadEnabled: trackVersions.downloadEnabled,
      downloadUrl: trackVersions.downloadUrl,
      downloadFormat: trackVersions.downloadFormat,
      downloadSizeBytes: trackVersions.downloadSizeBytes,
      license: trackVersions.license,
    })
    .from(tracks)
    .innerJoin(personas, eq(tracks.personaId, personas.id))
    .innerJoin(trackVersions, eq(tracks.id, trackVersions.trackId))
    .where(and(...trackConditions));

  // Ship the approved launch tracks even before the full D1 catalog is imported.
  // The static public files are bundled with the site; D1 remains the source for
  // the complete catalog and all community interaction data.
  if (allPersonas.length === 0) allPersonas = featuredPersonas;
  if (allTracks.length === 0) {
    const fallbackTracks = featuredTracks.filter((track) =>
      (!selectedPersona || track.personaSlug === selectedPersona.slug) &&
      (!filters.trackSlug || track.slug === filters.trackSlug),
    );
    allTracks = fallbackTracks as typeof allTracks;
  }

  // Get aggregate metrics for all tracks
  const aggregateMetrics = await Promise.all(
    allTracks.map(async (track) => {
      const [favoriteCount, voteCounts, ratingStats, playCount] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)` })
          .from(trackPreferences)
          .where(and(eq(trackPreferences.trackId, track.id), eq(trackPreferences.favorite, true))),
        db
          .select({
            up: sql<number>`count(*) filter (where vote = 1)`,
            down: sql<number>`count(*) filter (where vote = -1)`,
          })
          .from(trackPreferences)
          .where(eq(trackPreferences.trackId, track.id)),
        db
          .select({
            avg: sql<number>`avg(rating)`,
            count: sql<number>`count(*)`,
          })
          .from(trackRatings)
          .where(eq(trackRatings.trackId, track.id)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(playEvents)
          .innerJoin(trackVersions, eq(playEvents.trackVersionId, trackVersions.id))
          .where(and(eq(trackVersions.trackId, track.id), eq(playEvents.qualified, true))),
      ]);

      return {
        trackId: track.trackId,
        favoriteCount: favoriteCount[0]?.count || 0,
        thumbsUp: voteCounts[0]?.up || 0,
        thumbsDown: voteCounts[0]?.down || 0,
        avgRating: ratingStats[0]?.avg || null,
        ratingCount: ratingStats[0]?.count || 0,
        qualifiedPlays: playCount[0]?.count || 0,
      };
    })
  );

  // Get user's personal preferences if userId provided
  const userPreferences: Record<number, { favorite: boolean; vote: number; rating?: number }> = {};
  if (filters.userId) {
    const prefs = await db
      .select({
        trackId: trackPreferences.trackId,
        favorite: trackPreferences.favorite,
        vote: trackPreferences.vote,
      })
      .from(trackPreferences)
      .where(eq(trackPreferences.userId, filters.userId));

    const ratings = await db
      .select({
        trackId: trackRatings.trackId,
        rating: trackRatings.rating,
      })
      .from(trackRatings)
      .where(eq(trackRatings.userId, filters.userId));

    prefs.forEach((p) => {
      userPreferences[p.trackId] = { favorite: p.favorite, vote: p.vote };
    });
    ratings.forEach((r) => {
      if (userPreferences[r.trackId]) {
        userPreferences[r.trackId].rating = r.rating;
      }
    });
  }

  // Add metrics and user preferences to tracks
  allTracks = allTracks.map((track) => {
    const metrics = aggregateMetrics.find((m) => m.trackId === track.trackId) || {
      favoriteCount: 0,
      thumbsUp: 0,
      thumbsDown: 0,
      avgRating: null,
      ratingCount: 0,
      qualifiedPlays: 0,
    };
    const userPref = userPreferences[track.id] || { favorite: false, vote: 0 };

    // Calculate editorial score for ranking
    const editorialScore = 
      metrics.favoriteCount * 10 +
      (metrics.thumbsUp / (metrics.thumbsUp + metrics.thumbsDown || 1)) * 5 +
      (metrics.avgRating || 0) +
      Math.log(metrics.qualifiedPlays + 1) +
      (track.publishedAt ? new Date(track.publishedAt).getTime() / 1000000000000 : 0);

    return {
      ...track,
      ...metrics,
      ...userPref,
      editorialScore,
    };
  });

  // Apply view filter
  if (filters.view === "top" && !filters.trackSlug) {
    // Sort by editorial score and limit to top 12
    allTracks = allTracks
      .sort((a, b) => ((b as TrackCatalogItem).editorialScore || 0) - ((a as TrackCatalogItem).editorialScore || 0))
      .slice(0, 12) as TrackCatalogItem[];
  } else {
    // Default sort by published date
    allTracks = allTracks.sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  const releaseConditions = [eq(releases.status, "public")];
  if (selectedPersona) releaseConditions.push(eq(releases.personaId, selectedPersona.id));
  if (filters.releaseSlug) releaseConditions.push(eq(releases.slug, filters.releaseSlug));

  const allReleases = await db
    .select({
      id: releases.id,
      title: releases.title,
      slug: releases.slug,
      type: releases.type,
      description: releases.description,
      releaseDate: releases.releaseDate,
      publishedAt: releases.publishedAt,
      personaId: releases.personaId,
      personaName: personas.name,
      personaSlug: personas.slug,
      personaColor: personas.primaryColor,
    })
    .from(releases)
    .innerJoin(personas, eq(releases.personaId, personas.id))
    .where(and(...releaseConditions))
    .orderBy(desc(releases.publishedAt));

  const releaseIds = new Set(allReleases.map((release) => release.id));
  const mappings = (await db
    .select({
      releaseId: releaseTracks.releaseId,
      trackId: releaseTracks.trackId,
      position: releaseTracks.position,
    })
    .from(releaseTracks))
    .filter((mapping) => releaseIds.has(mapping.releaseId));

  const releasesWithTracks = allReleases.map((release) => ({
    ...release,
    tracks: mappings
      .filter((mapping) => mapping.releaseId === release.id)
      .sort((a, b) => a.position - b.position)
      .flatMap((mapping) => {
        const track = allTracks.find((candidate) => candidate.id === mapping.trackId);
        return track ? [{ ...track, position: mapping.position }] : [];
      }),
  }));

  const artwork = await db
    .select({
      entityType: artAssets.entityType,
      entityId: artAssets.entityId,
      purpose: artAssets.purpose,
      publicUrl: artAssets.publicUrl,
      width: artAssets.width,
      height: artAssets.height,
    })
    .from(artAssets)
    .where(and(eq(artAssets.isPrimary, true), eq(artAssets.approvalStatus, "approved")));

  return {
    personas: allPersonas,
    tracks: allTracks as TrackCatalogItem[],
    releases: releasesWithTracks as ReleaseCatalogItem[],
    artwork,
  };
}

export async function getApprovedTags(trackId: number): Promise<ApprovedTag[]> {
  return getDb()
    .select({
      id: tags.id,
      displayLabel: tags.displayLabel,
      normalizedSlug: tags.normalizedSlug,
    })
    .from(tags)
    .innerJoin(trackTagAssignments, eq(tags.id, trackTagAssignments.tagId))
    .where(
      and(
        eq(trackTagAssignments.trackId, trackId),
        eq(trackTagAssignments.moderationStatus, "approved"),
        eq(tags.blocked, false),
      ),
    )
    .orderBy(tags.displayLabel);
}
