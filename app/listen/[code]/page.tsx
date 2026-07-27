import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getDb } from '@/db';
import { qrLinks, releases, tracks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function QRRedirectPage({ params }: { params: Promise<{ code: string }> }) {
  const db = getDb();
  const { code } = await params;
  
  const qrLink = await db
    .select({
      destinationType: qrLinks.destinationType,
      destinationId: qrLinks.destinationId,
      destinationUrl: qrLinks.destinationUrl,
      campaign: qrLinks.campaign,
    })
    .from(qrLinks)
    .where(and(
      eq(qrLinks.shortCode, code),
      eq(qrLinks.active, true)
    ))
    .limit(1);

  if (!qrLink[0]) {
    return (
      <main>
        <div className="error-page">
          <h1>QR Code Not Found</h1>
          <p>This QR code is not active or does not exist.</p>
          <Link href="/">Return to The Archive</Link>
        </div>
      </main>
    );
  }

  const link = qrLink[0];
  let destination = '/';

  if (link.destinationType === 'release' && link.destinationId) {
    const release = await db
      .select({ slug: releases.slug })
      .from(releases)
      .where(eq(releases.id, link.destinationId))
      .limit(1);
    if (release[0]) {
      destination = `/release/${release[0].slug}`;
    }
  } else if (link.destinationType === 'track' && link.destinationId) {
    const track = await db
      .select({ slug: tracks.slug })
      .from(tracks)
      .where(eq(tracks.id, link.destinationId))
      .limit(1);
    if (track[0]) {
      destination = `/track/${track[0].slug}`;
    }
  } else if (link.destinationType === 'url' && link.destinationUrl) {
    redirect(link.destinationUrl.startsWith('/') ? link.destinationUrl : '/');
  }

  // Append campaign if present
  if (link.campaign) {
    destination += `?utm_source=qr&utm_campaign=${encodeURIComponent(link.campaign)}`;
  }

  redirect(destination);
}
