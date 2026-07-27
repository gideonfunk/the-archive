import { getDb } from './index';
import { personas, tracks, trackVersions } from './schema';

export async function seedDatabase() {
  const db = getDb();

  // Seed personas
  const personaData = [
    {
      name: 'The War Scroll',
      slug: 'the-war-scroll',
      primaryColor: '#8B0000',
      description: 'Warfare worship and prayer-warrior devotional music. Drawing from biblical spiritual-warfare themes in Ephesians 6 and Revelation 12.',
      theologicalStatement: 'Isaiah 59:19; Psalm 57:8; Psalm 91:1; Revelation 12:11',
      status: 'active',
      sortOrder: 1,
    },
    {
      name: 'Echo Gray',
      slug: 'echo-gray',
      primaryColor: '#708090',
      description: 'Melancholic ambient work exploring memory, loss, distance, and hope.',
      theologicalStatement: null,
      status: 'active',
      sortOrder: 2,
    },
    {
      name: 'Chanokh',
      slug: 'chanokh',
      primaryColor: '#A67C00',
      description: 'Prophetic word, spoken-word performance, and beat-driven scripture meditation.',
      theologicalStatement: null,
      status: 'active',
      sortOrder: 3,
    },
    {
      name: 'Instrumental Band',
      slug: 'instrumental-band',
      primaryColor: '#2F4F4F',
      description: 'Instrumental compositions, ensemble studies, improvisations, and cinematic work without lead vocals.',
      theologicalStatement: null,
      status: 'active',
      sortOrder: 4,
    },
    {
      name: 'Gideon',
      slug: 'gideon',
      primaryColor: '#B8860B',
      description: 'Original works released under Gideon\'s own name when they do not belong to another persona.',
      theologicalStatement: null,
      status: 'active',
      sortOrder: 5,
    },
  ];

  const insertedPersonas = await db.insert(personas).values(personaData).returning({ id: personas.id, slug: personas.slug });
  
  const theWarScrollId = insertedPersonas.find((persona) => persona.slug === 'the-war-scroll')?.id;

  // Seed The War Scroll tracks (from spec)
  if (theWarScrollId) {
    const warScrollTracks = [
      {
        personaId: theWarScrollId,
        trackId: 'TWS-2026-001',
        title: 'Dawn Witness',
        slug: 'dawn-witness',
        status: 'public',
        genre: 'Warfare Worship',
        language: 'en',
        explicit: false,
        curatorTags: 'morning;witness;psalm',
        scriptureReferences: 'Psalm 57:8',
        rightsNote: 'Written and performed by Gideon Funk',
      },
      {
        personaId: theWarScrollId,
        trackId: 'TWS-2026-002',
        title: 'Standard Raised High',
        slug: 'standard-raised-high',
        status: 'public',
        genre: 'Warfare Worship',
        language: 'en',
        explicit: false,
        curatorTags: 'banner;victory;standard',
        scriptureReferences: 'Isaiah 59:19',
        rightsNote: 'Written and performed by Gideon Funk',
      },
      {
        personaId: theWarScrollId,
        trackId: 'TWS-2026-003',
        title: 'Threefold Cord',
        slug: 'threefold-cord',
        status: 'public',
        genre: 'Warfare Worship',
        language: 'en',
        explicit: false,
        curatorTags: 'unity;strength;cord',
        scriptureReferences: 'Ecclesiastes 4:9–12',
        rightsNote: 'Written and performed by Gideon Funk',
      },
      {
        personaId: theWarScrollId,
        trackId: 'TWS-2026-004',
        title: 'Steadfast Hearts',
        slug: 'steadfast-hearts',
        status: 'public',
        genre: 'Warfare Worship',
        language: 'en',
        explicit: false,
        curatorTags: 'steadfast;heart;faith',
        scriptureReferences: 'Colossians 3:12–14',
        rightsNote: 'Written and performed by Gideon Funk',
      },
      {
        personaId: theWarScrollId,
        trackId: 'TWS-2026-005',
        title: 'Blood and Mercy Morning',
        slug: 'blood-and-mercy-morning',
        status: 'public',
        genre: 'Warfare Worship',
        language: 'en',
        explicit: false,
        curatorTags: 'mercy;morning;blood',
        scriptureReferences: 'Lamentations 3:22–23',
        rightsNote: 'Written and performed by Gideon Funk',
      },
    ];

    const insertedTracks = await db.insert(tracks).values(warScrollTracks).returning({ id: tracks.id, trackId: tracks.trackId });

    // Add placeholder track versions (these would be replaced with actual audio uploads)
    for (const track of insertedTracks) {
      await db.insert(trackVersions).values({
        trackId: track.id,
        version: 'v01',
        purpose: 'web',
        duration: 180, // Placeholder duration
        objectKey: `audio/the-war-scroll/${track.trackId}/v01/stream.mp3`,
        publicUrl: null, // Will be set after R2 upload
        isPublic: false, // Set to true after audio upload
      });
    }
  }

  console.log('Database seeded successfully');
  return { personas: insertedPersonas };
}
