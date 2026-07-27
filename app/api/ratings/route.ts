import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { anonymousUsers, trackRatings, tracks } from "@/db/schema";
import { isValidAnonymousUserId, toPositiveInteger } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const trackId = toPositiveInteger(request.nextUrl.searchParams.get("trackId"));
    const userId = request.nextUrl.searchParams.get("userId");
    if (!trackId || !isValidAnonymousUserId(userId)) {
      return NextResponse.json(
        { error: "A valid trackId and anonymous userId are required" },
        { status: 400 },
      );
    }

    const db = getDb();
    await db.insert(anonymousUsers).values({ id: userId }).onConflictDoNothing();
    const [rating] = await db
      .select({ rating: trackRatings.rating })
      .from(trackRatings)
      .where(and(eq(trackRatings.trackId, trackId), eq(trackRatings.userId, userId)))
      .limit(1);
    return NextResponse.json({ rating: rating?.rating ?? null });
  } catch (error) {
    console.error("Ratings GET error:", error);
    return NextResponse.json({ error: "Failed to fetch rating" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const trackId = toPositiveInteger(body.trackId);
    const userId = body.userId;
    const rating = Number(body.rating);
    if (!trackId || !isValidAnonymousUserId(userId) || !Number.isInteger(rating)) {
      return NextResponse.json(
        { error: "A valid trackId, anonymous userId, and integer rating are required" },
        { status: 400 },
      );
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

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

    const [existing] = await db
      .select({ id: trackRatings.id })
      .from(trackRatings)
      .where(and(eq(trackRatings.trackId, trackId), eq(trackRatings.userId, userId)))
      .limit(1);
    if (existing) {
      await db.update(trackRatings).set({ rating, updatedAt: now }).where(eq(trackRatings.id, existing.id));
    } else {
      await db.insert(trackRatings).values({ trackId, userId, rating, createdAt: now, updatedAt: now });
    }
    return NextResponse.json({ success: true, rating });
  } catch (error) {
    console.error("Ratings POST error:", error);
    return NextResponse.json({ error: "Failed to save rating" }, { status: 500 });
  }
}
