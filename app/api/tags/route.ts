import { NextRequest, NextResponse } from "next/server";
import { and, count, eq, gte } from "drizzle-orm";
import { getDb } from "@/db";
import { anonymousUsers, tags, trackTagAssignments, tracks } from "@/db/schema";
import { getApprovedTags } from "@/lib/catalog";
import { isValidAnonymousUserId, normalizeTag, toPositiveInteger, validateTag } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const trackId = toPositiveInteger(request.nextUrl.searchParams.get("trackId"));
    if (!trackId) return NextResponse.json({ error: "A valid trackId is required" }, { status: 400 });
    return NextResponse.json({ tags: await getApprovedTags(trackId) });
  } catch (error) {
    console.error("Tags GET error:", error);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const trackId = toPositiveInteger(body.trackId);
    const userId = body.userId;
    const tag = body.tag;
    if (!trackId || !isValidAnonymousUserId(userId) || typeof tag !== "string") {
      return NextResponse.json(
        { error: "A valid trackId, anonymous userId, and tag are required" },
        { status: 400 },
      );
    }

    const validation = validateTag(tag);
    if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 });
    const normalized = normalizeTag(tag);
    const db = getDb();
    const [track] = await db
      .select({ id: tracks.id })
      .from(tracks)
      .where(and(eq(tracks.id, trackId), eq(tracks.status, "public")))
      .limit(1);
    if (!track) return NextResponse.json({ error: "Track not found" }, { status: 404 });

    const now = new Date().toISOString();
    await db.insert(anonymousUsers).values({ id: userId }).onConflictDoNothing();
    await db.update(anonymousUsers).set({ lastSeenAt: now }).where(eq(anonymousUsers.id, userId));

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const [recent] = await db
      .select({ value: count() })
      .from(trackTagAssignments)
      .where(
        and(
          eq(trackTagAssignments.userId, userId),
          eq(trackTagAssignments.source, "listener"),
          gte(trackTagAssignments.createdAt, oneHourAgo),
        ),
      );
    if ((recent?.value ?? 0) >= 5) {
      return NextResponse.json(
        { error: "Tag submission limit reached. Please try again later." },
        { status: 429 },
      );
    }

    const [existingTag] = await db
      .select({ id: tags.id, blocked: tags.blocked })
      .from(tags)
      .where(eq(tags.normalizedSlug, normalized))
      .limit(1);
    if (existingTag?.blocked) {
      return NextResponse.json({ error: "This tag is not allowed" }, { status: 400 });
    }

    if (!existingTag) {
      await db
        .insert(tags)
        .values({ displayLabel: normalized, normalizedSlug: normalized, blocked: false })
        .onConflictDoNothing();
    }
    const [canonicalTag] = await db
      .select({ id: tags.id })
      .from(tags)
      .where(eq(tags.normalizedSlug, normalized))
      .limit(1);
    if (!canonicalTag) throw new Error("Tag could not be created");

    const [duplicate] = await db
      .select({ id: trackTagAssignments.id })
      .from(trackTagAssignments)
      .where(
        and(
          eq(trackTagAssignments.trackId, trackId),
          eq(trackTagAssignments.tagId, canonicalTag.id),
          eq(trackTagAssignments.userId, userId),
        ),
      )
      .limit(1);
    if (duplicate) {
      return NextResponse.json({ error: "You have already added this tag to this track" }, { status: 409 });
    }

    await db.insert(trackTagAssignments).values({
      trackId,
      tagId: canonicalTag.id,
      userId,
      source: "listener",
      moderationStatus: "pending",
      createdAt: now,
    });
    return NextResponse.json({
      success: true,
      tag: { displayLabel: normalized, normalizedSlug: normalized },
      status: "pending",
    });
  } catch (error) {
    console.error("Tags POST error:", error);
    return NextResponse.json({ error: "Failed to submit tag" }, { status: 500 });
  }
}
