import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { ratings, tags } from "../../../db/schema";

export async function GET(request: Request) {
  const trackId = new URL(request.url).searchParams.get("trackId");
  if (!trackId) return Response.json({ error: "trackId is required" }, { status: 400 });
  try {
    const db = getDb();
    const [ratingRows, tagRows] = await Promise.all([
      db.select({ rating: ratings.rating }).from(ratings).where(eq(ratings.trackId, trackId)),
      db.select({ tag: tags.tag }).from(tags).where(eq(tags.trackId, trackId)),
    ]);
    const average = ratingRows.length ? ratingRows.reduce((sum, row) => sum + row.rating, 0) / ratingRows.length : 0;
    return Response.json({ average, ratingCount: ratingRows.length, tags: [...new Set(tagRows.map((row) => row.tag))] });
  } catch {
    return Response.json({ average: 0, ratingCount: 0, tags: [] });
  }
}

export async function POST(request: Request) {
  const body = await request.json() as { trackId?: string; deviceId?: string; rating?: number; tag?: string };
  if (!body.trackId || !body.deviceId) return Response.json({ error: "trackId and deviceId are required" }, { status: 400 });
  try {
    const db = getDb();
    if (typeof body.rating === "number" && body.rating >= 1 && body.rating <= 5) {
      const existing = await db.select({ id: ratings.id }).from(ratings).where(and(eq(ratings.trackId, body.trackId), eq(ratings.deviceId, body.deviceId))).limit(1);
      if (existing[0]) await db.update(ratings).set({ rating: body.rating, updatedAt: new Date().toISOString() }).where(eq(ratings.id, existing[0].id));
      else await db.insert(ratings).values({ trackId: body.trackId, deviceId: body.deviceId, rating: body.rating });
    }
    if (body.tag?.trim()) await db.insert(tags).values({ trackId: body.trackId, deviceId: body.deviceId, tag: body.tag.trim().toLowerCase() }).onConflictDoNothing();
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
