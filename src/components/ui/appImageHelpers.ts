// src/components/ui/appImageHelpers.ts

export type ImageSizePreset = "avatar" | "thumbnail" | "card" | "lightbox" | "full";

const SIZE_PRESETS: Record<ImageSizePreset, string> = {
  avatar: "36px",
  thumbnail: "(max-width: 640px) 64px, 96px",
  card: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  lightbox: "(max-width: 1024px) 100vw, 1200px",
  full: "100vw",
};

/**
 * Normalizes image source URLs.
 * Converts Google Drive viewer links (/file/d/{id}/view) to direct thumbnail URLs.
 */
export function normalizeImageSrc(src?: string | null): string | null {
  if (!src) return null;
  const trimmed = src.trim();
  if (!trimmed) return null;

  if (trimmed.includes("drive.google.com")) {
    const fileIdMatch =
      trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
      trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
      trimmed.match(/\/uc\?id=([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://drive.google.com/thumbnail?id=${fileIdMatch[1]}&sz=w800`;
    }
  }

  return trimmed;
}

/**
 * Checks if a remote image URL's hostname is configured in next.config.ts images.remotePatterns.
 * Local paths, blob:, and data: URIs are always valid for Next.js Image.
 */
export function isConfiguredRemoteHost(src?: string | null): boolean {
  if (!src) return true;
  const trimmed = src.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith("/") || trimmed.startsWith("blob:") || trimmed.startsWith("data:")) {
    return true;
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();
    return (
      host === "images.unsplash.com" ||
      host === "drive.google.com" ||
      host === "docs.google.com" ||
      host === "google.com" ||
      host.endsWith(".google.com") ||
      host === "googleusercontent.com" ||
      host.endsWith(".googleusercontent.com") ||
      host === "supabase.co" ||
      host.endsWith(".supabase.co")
    );
  } catch {
    return false;
  }
}

/**
 * Determines whether Next.js image optimization pipeline should be bypassed.
 * Returns true for blob:, data:, SVG vectors, Google Drive thumbnails, or invalid/empty URLs.
 */
export function shouldBypassOptimization(src?: string | null): boolean {
  if (!src) return true;
  const trimmed = src.trim().toLowerCase();
  if (!trimmed) return true;
  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:")) return true;
  if (trimmed.endsWith(".svg") || trimmed.includes(".svg?")) return true;
  if (trimmed.includes("drive.google.com")) return true;
  return false;
}

/**
 * Resolves standard responsive sizes attributes based on component layout context.
 */
export function resolveImageSizes(preset?: ImageSizePreset | string): string {
  if (!preset) return "100vw";
  if (preset in SIZE_PRESETS) {
    return SIZE_PRESETS[preset as ImageSizePreset];
  }
  return preset;
}
