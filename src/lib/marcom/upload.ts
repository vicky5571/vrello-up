import path from "node:path";

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export const ALLOWED_UPLOAD_EXTENSIONS = [
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "mp4",
] as const;
export type AllowedUploadExtension =
  (typeof ALLOWED_UPLOAD_EXTENSIONS)[number];

export interface ValidateUploadInput {
  filename: string;
  sizeBytes: number;
}

export type ValidateUploadResult =
  | { ok: true }
  | { ok: false; error: string };

export function validateUpload({
  filename,
  sizeBytes,
}: ValidateUploadInput): ValidateUploadResult {
  if (
    !filename ||
    filename.includes("\0") ||
    filename.includes("..") ||
    filename.includes("/") ||
    filename.includes("\\")
  ) {
    return { ok: false, error: "Invalid filename" };
  }
  const dot = filename.lastIndexOf(".");
  const ext = dot === -1 ? "" : filename.slice(dot + 1).toLowerCase();
  if (!(ALLOWED_UPLOAD_EXTENSIONS as readonly string[]).includes(ext)) {
    return { ok: false, error: `Unsupported file type: .${ext || "(none)"}` };
  }
  if (!Number.isFinite(sizeBytes) || sizeBytes < 0) {
    return { ok: false, error: "Invalid file size" };
  }
  if (sizeBytes > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "File exceeds 25 MB limit" };
  }
  return { ok: true };
}

export function sanitizeFilename(filename: string): string {
  const base = filename.split(/[\\/]/).pop() ?? filename;
  const cleaned = base
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.{2,}/g, ".")
    .replace(/^\.+/, "")
    .slice(0, 180);
  return cleaned || "file";
}

// Local upload storage root (dirname) and the authenticated URL prefix that
// serves it back via GET /api/marcom/files/[...path]. Document/event rows
// must only reference files under this prefix — never external URLs.
export const UPLOAD_ROOT_DIRNAME = "uploads";
export const FILES_URL_PREFIX = "/api/marcom/files/";

// Defense-in-depth write confinement: resolves the destination against the
// uploads root and returns null when it escapes (mirrors the read side).
// Pure (rootDir is injected) so it is unit-testable.
export function resolveUploadPath(
  rootDir: string,
  kind: string,
  id: string,
  filename: string,
): string | null {
  const resolved = path.resolve(rootDir, kind, id, filename);
  const root = path.resolve(rootDir);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null;
  return resolved;
}

// Accepts only paths served by the authenticated files route. Rejects
// external URLs, other API prefixes, and embedded traversal/backslashes.
export function isServableFilePath(filePath: string): boolean {
  if (typeof filePath !== "string") return false;
  if (!filePath.startsWith(FILES_URL_PREFIX)) return false;
  const rest = filePath.slice(FILES_URL_PREFIX.length);
  if (!rest) return false;
  if (
    rest.includes("..") ||
    rest.includes("\\") ||
    rest.includes("\0")
  ) {
    return false;
  }
  return true;
}
