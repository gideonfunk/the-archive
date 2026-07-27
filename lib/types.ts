export type PersonaCatalogItem = {
  id: number;
  name: string;
  slug: string;
  primaryColor: string;
  description: string | null;
  theologicalStatement: string | null;
  sortOrder: number;
};

export type TrackCatalogItem = {
  id: number;
  trackId: string;
  title: string;
  slug: string;
  genre: string | null;
  explicit: boolean;
  curatorTags: string | null;
  scriptureReferences: string | null;
  personaId: number;
  personaName: string;
  personaSlug: string;
  personaColor: string;
  versionId: number;
  version: string;
  duration: number | null;
  publicUrl: string | null;
};

export type ReleaseCatalogItem = {
  id: number;
  title: string;
  slug: string;
  type: string;
  description: string | null;
  releaseDate: string | null;
  publishedAt: string | null;
  personaId: number;
  personaName: string;
  personaSlug: string;
  personaColor: string;
  tracks: Array<TrackCatalogItem & { position: number }>;
};

export type ArtworkCatalogItem = {
  entityType: string;
  entityId: number;
  purpose: string;
  publicUrl: string | null;
  width: number | null;
  height: number | null;
};

export type CatalogData = {
  personas: PersonaCatalogItem[];
  tracks: TrackCatalogItem[];
  releases: ReleaseCatalogItem[];
  artwork: ArtworkCatalogItem[];
};

export type ApprovedTag = {
  id: number;
  displayLabel: string;
  normalizedSlug: string;
};
