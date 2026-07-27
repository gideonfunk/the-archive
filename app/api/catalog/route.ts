import { NextRequest, NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const catalog = await getCatalog({
      personaSlug: searchParams.get("persona"),
      releaseSlug: searchParams.get("release"),
      trackSlug: searchParams.get("track"),
      view: (searchParams.get("view") as "all" | "top" | null) || null,
      userId: searchParams.get("userId"),
    });
    return NextResponse.json(catalog);
  } catch (error) {
    console.error("Catalog API error:", error);
    return NextResponse.json({ error: "Failed to fetch catalog" }, { status: 500 });
  }
}
