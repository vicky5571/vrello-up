import { NextResponse } from "next/server";
import { parseGoogleMapsUrl, isValidCoordinate } from "@/lib/marcom/locationUtils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get("url");

    if (!targetUrl) {
      return NextResponse.json({ error: "URL query parameter is required" }, { status: 400 });
    }

    // 1. Try direct URL parse first
    const directCoords = parseGoogleMapsUrl(targetUrl);
    if (directCoords) {
      return NextResponse.json({
        latitude: directCoords.latitude,
        longitude: directCoords.longitude,
        resolvedUrl: targetUrl,
      });
    }

    // 2. Follow redirect for short URLs (maps.app.goo.gl, goo.gl/maps)
    try {
      const response = await fetch(targetUrl, {
        method: "HEAD",
        redirect: "follow",
      });

      const finalUrl = response.url || targetUrl;
      const resolvedCoords = parseGoogleMapsUrl(finalUrl);

      if (resolvedCoords && isValidCoordinate(resolvedCoords.latitude, resolvedCoords.longitude)) {
        return NextResponse.json({
          latitude: resolvedCoords.latitude,
          longitude: resolvedCoords.longitude,
          resolvedUrl: finalUrl,
        });
      }
    } catch {
      // Fall through to error if fetch fails or network blocked
    }

    return NextResponse.json(
      { error: "Could not extract coordinates from the provided URL" },
      { status: 422 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to resolve location URL" },
      { status: 500 },
    );
  }
}
