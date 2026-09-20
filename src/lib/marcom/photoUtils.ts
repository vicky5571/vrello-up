/**
 * Utilities for parsing, serializing, and client-side compressing
 * placement installation photos.
 */

export interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Parses placement photo data into an array of image URLs.
 * Gracefully handles legacy single URL strings, comma-separated URLs,
 * and JSON-encoded array strings.
 */
export function parsePlacementPhotos(photoUrl?: string | null): string[] {
  if (!photoUrl || typeof photoUrl !== "string") {
    return [];
  }

  const trimmed = photoUrl.trim();
  if (!trimmed) return [];

  // 1. Try parsing JSON array format (e.g. '["/url1.jpg", "/url2.jpg"]')
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
          .map((item) => item.trim());
      }
    } catch {
      // Fall through to other formats if JSON parsing fails
    }
  }

  // 2. Handle comma-separated URLs
  if (trimmed.includes(",")) {
    const list = trimmed
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean);
    if (list.length > 0) return list;
  }

  // 3. Single legacy URL
  return [trimmed];
}

/**
 * Serializes an array of photo URLs back into a single string for storage.
 * - Empty -> ""
 * - Exactly 1 photo -> "url" (retains backward compatibility with legacy consumers)
 * - Multiple photos -> JSON string array '["url1", "url2"]'
 */
export function serializePlacementPhotos(urls: (string | null | undefined)[]): string {
  const cleanList: string[] = [];
  const seen = new Set<string>();

  for (const item of urls) {
    if (typeof item === "string") {
      const t = item.trim();
      if (t && !seen.has(t)) {
        seen.add(t);
        cleanList.push(t);
      }
    }
  }

  if (cleanList.length === 0) return "";
  if (cleanList.length === 1) return cleanList[0];
  return JSON.stringify(cleanList);
}

/**
 * Client-side image compression using HTML5 Canvas.
 * Downscales images exceeding maxWidth/maxHeight and encodes to JPEG at specified quality.
 * Typical 8MB smartphone photos are reduced to ~250KB–450KB with virtually zero perceptible loss.
 */
export async function compressImage(
  file: File,
  options: CompressImageOptions = {},
): Promise<File> {
  const { maxWidth = 1600, maxHeight = 1600, quality = 0.82 } = options;

  // Safe fallback if called in an environment without DOM/Canvas (e.g. tests)
  if (typeof window === "undefined" || typeof document === "undefined" || !window.createImageBitmap) {
    return file;
  }

  // Only compress raster images
  if (!file.type.startsWith("image/") || file.type.includes("svg") || file.type.includes("gif")) {
    return file;
  }

  try {
    const imageBitmap = await createImageBitmap(file);
    let { width, height } = imageBitmap;

    // Determine target dimensions preserving aspect ratio
    if (width > maxWidth || height > maxHeight) {
      if (width / maxWidth > height / maxHeight) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      } else {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }
    } else if (file.size < 400 * 1024 && file.type === "image/jpeg") {
      // Already small enough JPEG, skip re-encoding
      imageBitmap.close();
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      imageBitmap.close();
      return file;
    }

    ctx.drawImage(imageBitmap, 0, 0, width, height);
    imageBitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", quality);
    });

    if (!blob || blob.size >= file.size) {
      // If compression somehow produced a larger file, keep original
      return file;
    }

    const newFilename = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newFilename, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch (err) {
    console.warn("Client-side image compression fallback to original:", err);
    return file;
  }
}
