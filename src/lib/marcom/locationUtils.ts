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
