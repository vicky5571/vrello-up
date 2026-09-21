/**
 * Utilities for parsing and validating geographic coordinates and shareloc links.
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function parseCoordinatesFromText(text: string): Coordinates | null {
  if (!text || typeof text !== "string") return null;
  const trimmed = text.trim();
  // Match "-6.2088, 106.8456" or "-6.2088,106.8456"
  const match = trimmed.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
  if (!match || !match[1] || !match[2]) return null;

  const lat = Number.parseFloat(match[1]);
  const lng = Number.parseFloat(match[2]);
  if (isValidCoordinate(lat, lng)) {
    return { latitude: lat, longitude: lng };
  }
  return null;
}

export function parseGoogleMapsUrl(url: string): Coordinates | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();

  // 1. Path format: /@-6.2087634,106.845599,15z or /@-6.2087634,106.845599
  const pathMatch = trimmed.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (pathMatch && pathMatch[1] && pathMatch[2]) {
    const lat = Number.parseFloat(pathMatch[1]);
    const lng = Number.parseFloat(pathMatch[2]);
    if (isValidCoordinate(lat, lng)) return { latitude: lat, longitude: lng };
  }

  // 2. Query param format: ?q=-6.2087634,106.845599 or ?ll=... or ?daddr=...
  const queryMatch = trimmed.match(/[?&](?:q|ll|daddr)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (queryMatch && queryMatch[1] && queryMatch[2]) {
    const lat = Number.parseFloat(queryMatch[1]);
    const lng = Number.parseFloat(queryMatch[2]);
    if (isValidCoordinate(lat, lng)) return { latitude: lat, longitude: lng };
  }

  // 3. Fallback: try raw coordinates if pasted without URL schema
  return parseCoordinatesFromText(trimmed);
}

export interface GoogleMapsLocationParams {
  address?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export function buildGoogleMapsUrl(lat: number, lng: number): string;
export function buildGoogleMapsUrl(params: GoogleMapsLocationParams): string;
export function buildGoogleMapsUrl(
  latOrParams: number | GoogleMapsLocationParams,
  lng?: number
): string {
  if (typeof latOrParams === "object" && latOrParams !== null) {
    const lat = latOrParams.latitude;
    const lon = latOrParams.longitude;
    if (
      typeof lat === "number" &&
      typeof lon === "number" &&
      isValidCoordinate(lat, lon)
    ) {
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    }
    const query = [latOrParams.address, latOrParams.city].filter(Boolean).join(", ").trim();
    if (query) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    }
    return "https://www.google.com/maps";
  }
  return `https://www.google.com/maps/search/?api=1&query=${latOrParams},${lng}`;
}

export const GEOFENCE_TOLERANCE_METERS = 100;

export interface GeofenceEvaluationResult {
  isValid: boolean;
  deviationMeters: number | null;
  message: string;
}

/**
 * Calculates great-circle distance between two points on a sphere using the Haversine formula.
 * Returns distance rounded to the nearest meter.
 * Zero external dependencies.
 */
export function calculateHaversineDistanceMeters(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  if (coord1.latitude === coord2.latitude && coord1.longitude === coord2.longitude) {
    return 0;
  }
  const R = 6371e3; // Earth's radius in meters
  const lat1Rad = (coord1.latitude * Math.PI) / 180;
  const lat2Rad = (coord2.latitude * Math.PI) / 180;
  const deltaLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));

  return Math.round(R * c);
}

/**
 * Evaluates whether sales GPS coordinates are within acceptable geofence tolerance of the outlet.
 * If outlet coordinates are missing, returns isValid: true (cannot enforce geofence).
 * If sales coordinates are missing, returns isValid: false.
 */
export function evaluateGeofenceStatus(
  outletCoords?: { latitude?: number | null; longitude?: number | null } | null,
  salesCoords?: { latitude?: number | null; longitude?: number | null } | null,
  toleranceMeters = GEOFENCE_TOLERANCE_METERS
): GeofenceEvaluationResult {
  if (
    outletCoords == null ||
    typeof outletCoords.latitude !== "number" ||
    typeof outletCoords.longitude !== "number" ||
    !isValidCoordinate(outletCoords.latitude, outletCoords.longitude)
  ) {
    return {
      isValid: true,
      deviationMeters: null,
      message: "Koordinat outlet belum terdaftar di sistem.",
    };
  }

  if (
    salesCoords == null ||
    typeof salesCoords.latitude !== "number" ||
    typeof salesCoords.longitude !== "number" ||
    !isValidCoordinate(salesCoords.latitude, salesCoords.longitude)
  ) {
    return {
      isValid: false,
      deviationMeters: null,
      message: "Lokasi GPS sales belum terdeteksi. Silakan aktifkan GPS.",
    };
  }

  const dist = calculateHaversineDistanceMeters(
    { latitude: outletCoords.latitude, longitude: outletCoords.longitude },
    { latitude: salesCoords.latitude, longitude: salesCoords.longitude }
  );

  const isValid = dist <= toleranceMeters;
  return {
    isValid,
    deviationMeters: dist,
    message: isValid
      ? `Valid: Berada di lokasi (${dist}m dari titik outlet terdaftar).`
      : `Peringatan: Posisi sales berjarak ${dist}m dari outlet (melebihi toleransi ${toleranceMeters}m).`,
  };
}

