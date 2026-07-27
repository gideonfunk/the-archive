import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { tracks, personas } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// Obsidian-approved public manifest import boundary
// Validates and processes manifest imports from Obsidian vaults
interface ManifestTrack {
  title: string;
  persona?: string;
  duration?: number;
  genre?: string;
  explicit?: boolean;
}

interface ObsidianManifest {
  version: string;
  source: 'obsidian';
  tracks: ManifestTrack[];
  metadata?: {
    vaultName?: string;
    exportDate?: string;
  };
}

// POST /api/manifest/import - Import manifest from Obsidian
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ObsidianManifest;

    // Validate manifest structure
    if (!body.version || body.source !== 'obsidian' || !Array.isArray(body.tracks)) {
      return NextResponse.json(
        { error: 'Invalid manifest structure' },
        { status: 400 }
      );
    }

    // Validate each track
    for (const track of body.tracks) {
      if (!track.title || typeof track.title !== 'string') {
        return NextResponse.json(
          { error: 'Each track must have a valid title' },
          { status: 400 }
        );
      }
    }

    // Check if personas exist for tracks with persona specified
    const db = getDb();
    const existingPersonas = await db.select({ name: personas.name }).from(personas);
    const personaNames = new Set(existingPersonas.map((p) => p.name));

    const validationErrors: string[] = [];
    const validatedTracks: Array<{ title: string; persona?: string; personaExists: boolean }> = [];

    for (const track of body.tracks) {
      if (track.persona && !personaNames.has(track.persona)) {
        validationErrors.push(`Persona "${track.persona}" does not exist for track "${track.title}"`);
      }
      validatedTracks.push({
        title: track.title,
        persona: track.persona,
        personaExists: track.persona ? personaNames.has(track.persona) : true,
      });
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({
        error: 'Manifest validation failed',
        validationErrors,
        validatedTracks,
      }, { status: 400 });
    }

    // Return successful validation
    return NextResponse.json({
      success: true,
      message: 'Manifest validated successfully',
      trackCount: body.tracks.length,
      metadata: body.metadata,
      validatedTracks,
    });
  } catch (error) {
    console.error('Manifest import error:', error);
    return NextResponse.json(
      { error: 'Failed to process manifest' },
      { status: 500 }
    );
  }
}
