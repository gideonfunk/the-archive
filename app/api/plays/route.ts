import { NextRequest, NextResponse } from "next/server";
import { and, count, eq, gte } from "drizzle-orm";
import { getDb } from "@/db";
import { anonymousUsers, playEvents, trackVersions } from "@/db/schema";
import { isValidAnonymousUserId, toPositiveInteger } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const trackVersionId = toPositiveInteger(body.trackVersionId);
    const userId = body.userId;
    const playDuration = Number(body.playDuration);
    if (
      !trackVersionId ||
      !isValidAnonymousUserId(userId) ||
      !Number.isFinite(playDuration) ||
      playDuration < 0
    ) {
      return NextResponse.json(
        { error: "A valid trackVersionId, anonymous userId, and playDuration are required" },
        { status: 400 },
      );
    }

    const db = getDb();
    const [version] = await db
      .select({ id: trackVersions.id, duration: trackVersions.duration })
      .from(trackVersions)
      .where(and(eq(trackVersions.id, trackVersionId), eq(trackVersions.isPublic, true)))
      .limit(1);
    if (!version) return NextResponse.json({ error: "Track version not found" }, { status: 404 });

    const now = new Date().toISOString();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    await db.insert(anonymousUsers).values({ id: userId }).onConflictDoNothing();
    await db.update(anonymousUsers).set({ lastSeenAt: now }).where(eq(anonymousUsers.id, userId));

    const [recentEvents] = await db
      .select({ value: count() })
      .from(playEvents)
      .where(and(eq(playEvents.userId, userId), gte(playEvents.createdAt, oneHourAgo)));
    if ((recentEvents?.value ?? 0) >= 60) {
      return NextResponse.json(
        { error: "Playback event limit reached. Please try again later." },
        { status: 429 },
      );
    }

    const trackDuration = version.duration ?? 0;
    const boundedDuration = Math.floor(Math.min(playDuration, trackDuration || playDuration));
    let qualified = trackDuration > 0 && (
      (trackDuration < 60 && boundedDuration >= trackDuration * 0.5) ||
      (trackDuration >= 60 && boundedDuration >= 30)
    );

    if (qualified) {
      const [recentPlay] = await db
        .select({ id: playEvents.id })
        .from(playEvents)
        .where(
          and(
            eq(playEvents.trackVersionId, trackVersionId),
            eq(playEvents.userId, userId),
            eq(playEvents.qualified, true),
            gte(playEvents.createdAt, oneHourAgo),
          ),
        )
        .limit(1);
      if (recentPlay) qualified = false;
    }

    const source = typeof body.source === "string" ? body.source.slice(0, 24) : "web";
    const campaign = typeof body.campaign === "string" ? body.campaign.slice(0, 64) : null;
    await db.insert(playEvents).values({
      trackVersionId,
      userId,
      source,
      campaign,
      playDuration: boundedDuration,
      qualified,
      createdAt: now,
    });
    return NextResponse.json({ success: true, qualified });
  } catch (error) {
    console.error("Plays POST error:", error);
    return NextResponse.json({ error: "Failed to record play" }, { status: 500 });
  }
}
