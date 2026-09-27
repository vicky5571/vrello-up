import type { PrismaClient, Prisma } from "@prisma/client";
// @ts-expect-error Node strip-types requires explicit .ts extension
import { isValidCoordinate, parseGoogleMapsUrl, type Coordinates } from "./locationUtils.ts";

export type { Coordinates };

/**
 * Supported Prisma client types for outlet backfill.
 *
 * Accepts either the standard singleton `PrismaClient` (or any object exposing
 * just the `outlet` delegate) or an interactive `$transaction` client, so the
 * backfill can run standalone or inside a caller-managed transaction.
 */
export type OutletBackfillPrismaClient =
  | Pick<PrismaClient, "outlet">
  | Prisma.TransactionClient;

export interface AutoBackfillPlacementInput {
  outletId: string;
  status: string;
  latitude?: number | null;
  longitude?: number | null;
  shareLocationUrl?: string | null;
}

/**
 * Extracts and validates GPS coordinates from numeric values or Google Maps share URLs.
 * Rejects Null Island (0, 0) and out-of-bounds coordinates.
 */
export function extractValidCoordinates(source: {
  latitude?: number | null;
  longitude?: number | null;
  shareLocationUrl?: string | null;
}): Coordinates | null {
  if (
    typeof source.latitude === "number" &&
    typeof source.longitude === "number" &&
    isValidCoordinate(source.latitude, source.longitude) &&
    !(source.latitude === 0 && source.longitude === 0)
  ) {
    return {
      latitude: source.latitude,
      longitude: source.longitude,
    };
  }

  if (source.shareLocationUrl && typeof source.shareLocationUrl === "string") {
    const parsed = parseGoogleMapsUrl(source.shareLocationUrl);
    if (parsed && isValidCoordinate(parsed.latitude, parsed.longitude) && !(parsed.latitude === 0 && parsed.longitude === 0)) {
      return parsed;
    }
  }

  return null;
}

/**
 * Determines whether an outlet requires coordinate backfill from a placement.
 * Returns true only when:
 * 1. Placement status is terminal DONE
 * 2. Valid coordinates are present
 * 3. Outlet latitude or longitude is null
 */
export function shouldBackfillOutlet(
  outlet: { latitude?: number | null; longitude?: number | null },
  status: string,
  coords: Coordinates | null
): boolean {
  if (status !== "DONE" || !coords) {
    return false;
  }
  return outlet.latitude == null || outlet.longitude == null;
}

export interface BackfillResult {
  backfilled: boolean;
  outletId?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Automatically backfills outlet master coordinates from a completed placement if the outlet lacks GPS.
 */
export async function autoBackfillOutletGps(
  prismaClient: OutletBackfillPrismaClient,
  placement: AutoBackfillPlacementInput
): Promise<BackfillResult> {
  if (!placement || placement.status !== "DONE" || !placement.outletId) {
    return { backfilled: false };
  }

  const coords = extractValidCoordinates(placement);
  if (!coords) {
    return { backfilled: false };
  }

  try {
    const outlet = await prismaClient.outlet.findUnique({
      where: { id: placement.outletId },
      select: { id: true, latitude: true, longitude: true },
    });

    if (!outlet || !shouldBackfillOutlet(outlet, placement.status, coords)) {
      return { backfilled: false };
    }

    await prismaClient.outlet.update({
      where: { id: outlet.id },
      data: {
        latitude: coords.latitude,
        longitude: coords.longitude,
      },
    });

    return {
      backfilled: true,
      outletId: outlet.id,
      latitude: coords.latitude,
      longitude: coords.longitude,
    };
  } catch (err) {
    console.error("[outletBackfill] Failed to backfill outlet GPS:", err);
    return { backfilled: false };
  }
}
