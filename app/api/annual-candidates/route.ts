import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { tracks, trackPreferences, trackRatings, playEvents, trackVersions, personas } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET /api/annual-candidates?year=<yyyy> - Get curator-only annual candidate report
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year');

    if (!year) {
      return NextResponse.json(
        { error: 'year is required' },
        { status: 400 }
      );
    }

    // Get tracks published in the given year
    const yearTracks = await db
      .select({
        id: tracks.id,
        trackId: tracks.trackId,
        title: tracks.title,
        slug: tracks.slug,
        personaId: tracks.personaId,
        personaName: personas.name,
        personaSlug: personas.slug,
        publishedAt: tracks.publishedAt,
      })
      .from(tracks)
      .innerJoin(personas, eq(tracks.personaId, personas.id))
      .where(and(
        eq(tracks.status, 'public'),
        sql`strftime('%Y', ${tracks.publishedAt}) = ${year}`
      ));

    if (yearTracks.length === 0) {
      return NextResponse.json({ candidates: [], year });
    }

    // Get metrics for each track
    const candidates = await Promise.all(
      yearTracks.map(async (track) => {
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

        const thumbsUp = voteCounts[0]?.up || 0;
        const thumbsDown = voteCounts[0]?.down || 0;
        const thumbsUpRatio = thumbsUp + thumbsDown > 0 ? thumbsUp / (thumbsUp + thumbsDown) : 0;
        const avgRating = ratingStats[0]?.avg || 0;
        const ratingCount = ratingStats[0]?.count || 0;

        // Calculate candidate score (same as editorial score)
        const candidateScore = 
          (favoriteCount[0]?.count || 0) * 10 +
          thumbsUpRatio * 5 +
          (ratingCount >= 3 ? avgRating : 0) +
          Math.log((playCount[0]?.count || 0) + 1);

        return {
          ...track,
          favoriteCount: favoriteCount[0]?.count || 0,
          thumbsUp,
          thumbsDown,
          thumbsUpRatio,
          avgRating: ratingCount >= 3 ? avgRating : null,
          ratingCount,
          qualifiedPlays: playCount[0]?.count || 0,
          candidateScore,
        };
      })
    );

    // Sort by candidate score descending
    candidates.sort((a, b) => b.candidateScore - a.candidateScore);

    return NextResponse.json({ candidates, year });
  } catch (error) {
    console.error('Annual candidates GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch annual candidates' },
      { status: 500 }
    );
  }
}
