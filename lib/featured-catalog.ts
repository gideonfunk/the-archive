import type { CatalogData, PersonaCatalogItem, TrackCatalogItem } from "@/lib/types";

export const featuredPersonas: PersonaCatalogItem[] = [
  { id: 1, name: "The War Scroll", slug: "the-war-scroll", primaryColor: "#8B0000", description: "Warfare worship and prayer-warrior devotional music.", theologicalStatement: "Isaiah 59:19; Psalm 57:8; Psalm 91:1; Revelation 12:11", sortOrder: 1 },
  { id: 2, name: "Echo Gray", slug: "echo-gray", primaryColor: "#708090", description: "Melancholic ambient work exploring memory, loss, distance, and hope.", theologicalStatement: null, sortOrder: 2 },
  { id: 3, name: "Chanokh", slug: "chanokh", primaryColor: "#A67C00", description: "Prophetic word and scripture meditation.", theologicalStatement: null, sortOrder: 3 },
  { id: 4, name: "Instrumental Band", slug: "instrumental-band", primaryColor: "#2F4F4F", description: "Instrumental compositions and ensemble studies.", theologicalStatement: null, sortOrder: 4 },
  { id: 5, name: "Gideon", slug: "gideon", primaryColor: "#B8860B", description: "Original works released under Gideon's own name.", theologicalStatement: null, sortOrder: 5 },
];

const warScroll = featuredPersonas[0];

function track(index: number, title: string, slug: string): TrackCatalogItem {
  return {
    id: 1000 + index,
    trackId: `TWS-2026-${String(index).padStart(3, "0")}`,
    title,
    slug,
    genre: "Warfare Worship",
    explicit: false,
    curatorTags: "warfare;worship;devotional",
    scriptureReferences: null,
    personaId: warScroll.id,
    personaName: warScroll.name,
    personaSlug: warScroll.slug,
    personaColor: warScroll.primaryColor,
    versionId: 2000 + index,
    version: "v01",
    duration: null,
    publicUrl: `/audio/the-war-scroll/${slug}.mp3`,
    publishedAt: "2026-07-26T00:00:00.000Z",
    downloadEnabled: true,
    downloadUrl: `/audio/the-war-scroll/${slug}.mp3`,
    downloadFormat: "mp3",
    downloadSizeBytes: null,
    license: "CC BY-NC-SA 4.0 — attribution requested: Gideon Funk / The War Scroll",
    favoriteCount: 0,
    thumbsUp: 0,
    thumbsDown: 0,
    avgRating: null,
    ratingCount: 0,
    qualifiedPlays: 0,
    favorite: false,
    vote: 0,
    editorialScore: 0,
  };
}

export const featuredTracks: TrackCatalogItem[] = [
  track(1, "By the Flame and Blood", "by-the-flame-and-blood"),
  track(2, "By the Blood and Flame", "by-the-blood-and-flame"),
  track(3, "Kindness in the Street", "kindness-in-the-street"),
  track(4, "Soft Heart, Holy Fire", "soft-heart-holy-fire"),
  track(5, "Keeper of the Heart", "keeper-of-the-heart"),
];

export const featuredCatalog: CatalogData = {
  personas: featuredPersonas,
  tracks: featuredTracks,
  releases: [],
  artwork: [],
};
