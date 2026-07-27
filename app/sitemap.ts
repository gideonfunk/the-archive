import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://the-archive.workers.dev").replace(/\/$/, "");
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  try {
    const catalog = await getCatalog();
    return [
      ...staticRoutes,
      ...catalog.personas.map((persona) => ({
        url: `${baseUrl}/persona/${persona.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...catalog.releases.map((release) => ({
        url: `${baseUrl}/release/${release.slug}`,
        lastModified: release.publishedAt ? new Date(release.publishedAt) : new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
      ...catalog.tracks.map((track) => ({
        url: `${baseUrl}/track/${track.slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
