import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { releases, releaseTracks, personas } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET /api/annuals?year=<yyyy> - Get public annual collections for a year
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year');

    const conditions = [
      eq(releases.type, 'collection'),
      eq(releases.status, 'public'),
    ];

    if (year) {
      // Filter by year based on published_at
      conditions.push(
        sql`strftime('%Y', ${releases.publishedAt}) = ${year}`
      );
    }

    const annuals = await db
      .select({
        id: releases.id,
        title: releases.title,
        slug: releases.slug,
        year: sql`strftime('%Y', ${releases.publishedAt})`,
        description: releases.description,
        publishedAt: releases.publishedAt,
        personaId: releases.personaId,
        personaName: personas.name,
        personaSlug: personas.slug,
        personaColor: personas.primaryColor,
      })
      .from(releases)
      .innerJoin(personas, eq(releases.personaId, personas.id))
      .where(and(...conditions))
      .orderBy(desc(releases.publishedAt));

    // Get track counts for each annual
    const annualsWithTrackCounts = await Promise.all(
      annuals.map(async (annual) => {
        const trackCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(releaseTracks)
          .where(eq(releaseTracks.releaseId, annual.id));

        return {
          ...annual,
          trackCount: trackCount[0]?.count || 0,
        };
      })
    );

    return NextResponse.json({ annuals: annualsWithTrackCounts });
  } catch (error) {
    console.error('Annuals GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch annuals' },
      { status: 500 }
    );
  }
}
