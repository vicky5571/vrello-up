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
 * Determines whether Next.js image optimization pipeline should be bypassed.
 * Returns true for blob:, data:, SVG vectors, or invalid/empty URLs.
 */
export function shouldBypassOptimization(src?: string | null): boolean {
  if (!src) return true;
  const trimmed = src.trim().toLowerCase();
  if (!trimmed) return true;
  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:")) return true;
  if (trimmed.endsWith(".svg") || trimmed.includes(".svg?")) return true;
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
