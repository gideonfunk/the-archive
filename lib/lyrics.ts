import { getDb } from '@/db';
import { lyrics } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getTrackLyrics(trackId: number) {
  const db = getDb();
  
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
    .where(eq(lyrics.trackId, trackId));

  // Filter to only verified and rights-cleared lyrics
  const displayableLyrics = trackLyrics.filter(
    (lyric) => lyric.verificationStatus === 'verified' && 
    (lyric.rightsStatus === 'owned' || lyric.rightsStatus === 'licensed' || lyric.rightsStatus === 'public_domain')
  );

  if (displayableLyrics.length === 0) {
    return { lyrics: null, message: 'Lyrics are not published for this track yet.' };
  }

  return { lyrics: displayableLyrics };
}
