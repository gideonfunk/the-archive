import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  artAssets,
  personas,
  releases,
  releaseTracks,
  tags,
  trackTagAssignments,
  tracks,
  trackVersions,
} from "@/db/schema";
import type { ApprovedTag, CatalogData, TrackCatalogItem } from "@/lib/types";

type CatalogFilters = {
  personaSlug?: string | null;
  releaseSlug?: string | null;
  trackSlug?: string | null;
};

export async function getCatalog(filters: CatalogFilters = {}): Promise<CatalogData> {
  const db = getDb();
  const allPersonas = await db
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

  const allTracks: TrackCatalogItem[] = await db
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
    })
    .from(tracks)
    .innerJoin(personas, eq(tracks.personaId, personas.id))
    .innerJoin(trackVersions, eq(tracks.id, trackVersions.trackId))
    .where(and(...trackConditions))
    .orderBy(desc(tracks.createdAt));

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
    tracks: allTracks,
    releases: releasesWithTracks,
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
