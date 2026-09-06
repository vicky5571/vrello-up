export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export const ALLOWED_UPLOAD_EXTENSIONS = ["pdf", "png", "jpg", "mp4"] as const;
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
