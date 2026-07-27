import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { lyrics } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET /api/lyrics?trackId=<id> - Get verified lyrics for a track
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const searchParams = request.nextUrl.searchParams;
    const trackId = searchParams.get('trackId');

    if (!trackId) {
      return NextResponse.json(
        { error: 'trackId is required' },
        { status: 400 }
      );
    }

    // Get verified lyrics that have rights to be displayed
    const trackLyrics = await db
      .select({
        id: lyrics.id,
        language: lyrics.language,
        plainText: lyrics.plainText,
        synchronizedJson: lyrics.synchronizedJson,
        verificationStatus: lyrics.verificationStatus,
        rightsStatus: lyrics.rightsStatus,
      })
      .from(lyrics)
      .where(eq(lyrics.trackId, parseInt(trackId)));

    // Filter to only verified and rights-cleared lyrics
    const displayableLyrics = trackLyrics.filter(
      (lyric) => lyric.verificationStatus === 'verified' && 
      (lyric.rightsStatus === 'owned' || lyric.rightsStatus === 'licensed' || lyric.rightsStatus === 'public_domain')
    );

    if (displayableLyrics.length === 0) {
      return NextResponse.json({ 
        lyrics: null,
        message: 'Lyrics are not published for this track yet.'
      });
    }

    return NextResponse.json({ lyrics: displayableLyrics });
  } catch (error) {
    console.error('Lyrics GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lyrics' },
      { status: 500 }
    );
  }
}
