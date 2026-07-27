import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { personas, tracks } from "@/db/schema";

export const dynamic = "force-dynamic";

type ManifestTrack = {
  trackId: string;
  slug: string;
  title: string;
  persona: string;
  rightsNote: string;
  publishedAt: string;
  attributionText?: string;
  genre?: string;
  explicit?: boolean;
  scriptureReferences?: string;
  curatorTags?: string;
  publishApproved: true;
};

type ObsidianManifest = {
  version: string;
  source: "obsidian";
  publishApproved: true;
  tracks: ManifestTrack[];
  metadata?: { vaultName?: string; exportDate?: string };
};

function isAuthorized(request: NextRequest) {
  const token = process.env.CURATOR_API_TOKEN;
  return Boolean(token) && request.headers.get("authorization") === `Bearer ${token}`;
}

// This is intentionally a one-way, curator-authenticated public projection.
// It accepts only explicitly approved metadata and never reads or exposes vault files.
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const manifest = (await request.json()) as ObsidianManifest;
    if (
      !manifest.version ||
      manifest.source !== "obsidian" ||
      manifest.publishApproved !== true ||
      !Array.isArray(manifest.tracks)
    ) {
      return NextResponse.json({ error: "Invalid approved manifest" }, { status: 400 });
    }

    const db = getDb();
    const availablePersonas = await db.select({ id: personas.id, name: personas.name }).from(personas);
    const personaByName = new Map(availablePersonas.map((persona) => [persona.name, persona.id]));
    const errors: string[] = [];

    for (const track of manifest.tracks) {
      if (
        !track.trackId || !track.slug || !track.title || !track.rightsNote ||
        !track.publishedAt || track.publishApproved !== true || !personaByName.has(track.persona) ||
        Number.isNaN(Date.parse(track.publishedAt))
      ) {
        errors.push(`Invalid approved track record: ${track.trackId || track.title || "unknown"}`);
      }
    }
    if (errors.length > 0) return NextResponse.json({ error: "Manifest validation failed", errors }, { status: 400 });

    const now = new Date().toISOString();
    let created = 0;
    let updated = 0;
    for (const item of manifest.tracks) {
      const values = {
        personaId: personaByName.get(item.persona)!,
        trackId: item.trackId,
        title: item.title,
        slug: item.slug,
        status: "public",
        genre: item.genre ?? null,
        explicit: item.explicit ?? false,
        curatorTags: item.curatorTags ?? null,
        scriptureReferences: item.scriptureReferences ?? null,
        rightsNote: item.rightsNote,
        attributionText: item.attributionText ?? null,
        publishedAt: item.publishedAt,
        updatedAt: now,
      };
      const [existing] = await db.select({ id: tracks.id }).from(tracks).where(eq(tracks.trackId, item.trackId)).limit(1);
      if (existing) {
        await db.update(tracks).set(values).where(eq(tracks.id, existing.id));
        updated += 1;
      } else {
        await db.insert(tracks).values({ ...values, createdAt: now });
        created += 1;
      }
    }

    return NextResponse.json({ success: true, created, updated, trackCount: manifest.tracks.length });
  } catch (error) {
    console.error("Manifest import error:", error);
    return NextResponse.json({ error: "Failed to import approved manifest" }, { status: 500 });
  }
}
