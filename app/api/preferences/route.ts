import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { trackPreferences, anonymousUsers, tracks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET /api/preferences?trackId=<id>&userId=<uuid> - Get user's favorite/vote state for a track
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const searchParams = request.nextUrl.searchParams;
    const trackId = searchParams.get('trackId');
    const userId = searchParams.get('userId');

    if (!trackId || !userId) {
      return NextResponse.json(
        { error: 'trackId and userId are required' },
        { status: 400 }
      );
    }

    // Ensure anonymous user exists
    await db.insert(anonymousUsers).values({ id: userId }).onConflictDoNothing();

    const preference = await db
      .select({ favorite: trackPreferences.favorite, vote: trackPreferences.vote })
      .from(trackPreferences)
      .where(and(
        eq(trackPreferences.trackId, parseInt(trackId)),
        eq(trackPreferences.userId, userId)
      ))
      .limit(1);

    return NextResponse.json({ 
      favorite: preference[0]?.favorite || false,
      vote: preference[0]?.vote || 0 
    });
  } catch (error) {
    console.error('Preferences GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

// POST /api/preferences - Set favorite/vote state for a track
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { trackId?: string; userId?: string; favorite?: boolean; vote?: number };
    const { trackId, userId, favorite, vote } = body;

    if (!trackId || !userId) {
      return NextResponse.json(
        { error: 'trackId and userId are required' },
        { status: 400 }
      );
    }

    // Validate vote value
    if (vote !== undefined && ![-1, 0, 1].includes(vote)) {
      return NextResponse.json(
        { error: 'vote must be -1, 0, or 1' },
        { status: 400 }
      );
    }

    // Verify track exists and is public
    const db = getDb();
    const track = await db
      .select({ id: tracks.id })
      .from(tracks)
      .where(eq(tracks.id, parseInt(trackId)))
      .limit(1);

    if (!track[0]) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      );
    }

    // Ensure anonymous user exists
    await db.insert(anonymousUsers).values({ id: userId }).onConflictDoNothing();

    // Update user's last seen
    await db
      .update(anonymousUsers)
      .set({ lastSeenAt: new Date().toISOString() })
      .where(eq(anonymousUsers.id, userId));

    // Upsert preference
    const existing = await db
      .select({ id: trackPreferences.id, favorite: trackPreferences.favorite, vote: trackPreferences.vote })
      .from(trackPreferences)
      .where(and(
        eq(trackPreferences.trackId, parseInt(trackId)),
        eq(trackPreferences.userId, userId)
      ))
      .limit(1);

    const updateData: { updatedAt: string; favorite?: boolean; vote?: number } = { updatedAt: new Date().toISOString() };
    if (favorite !== undefined) updateData.favorite = favorite;
    if (vote !== undefined) updateData.vote = vote;

    if (existing[0]) {
      await db
        .update(trackPreferences)
        .set(updateData)
        .where(eq(trackPreferences.id, existing[0].id));
    } else {
      await db.insert(trackPreferences).values({
        trackId: parseInt(trackId),
        userId,
        favorite: favorite ?? false,
        vote: vote ?? 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    const resultFavorite = favorite !== undefined ? favorite : (existing[0]?.favorite ?? false);
    const resultVote = vote !== undefined ? vote : (existing[0]?.vote ?? 0);

    return NextResponse.json({ 
      success: true,
      favorite: resultFavorite,
      vote: resultVote
    });
  } catch (error) {
    console.error('Preferences POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 }
    );
  }
}
