/**
 * src/lib/marcom/driveUploadHelpers.ts
 *
 * Pure helpers for Google Drive resumable upload sessions, file name sanitization,
 * and attachment construction.
 */

import type { TaskAttachment } from "@/types";
import { getGoogleDriveMimeCategory } from "@/lib/marcom/googleDriveUtils";

export interface ResumableSessionHeadersParams {
  accessToken: string;
  mimeType: string;
  sizeBytes: number;
}

export interface BuildDriveAttachmentParams {
  fileId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
}

/**
 * Builds HTTP headers required by Google Drive to initiate a resumable upload session.
 */
export function buildResumableSessionHeaders(
  params: ResumableSessionHeadersParams
): Record<string, string> {
  const { accessToken, mimeType, sizeBytes } = params;

  if (!accessToken || !accessToken.trim()) {
    throw new Error("accessToken is required to initiate upload session");
  }

  return {
    Authorization: `Bearer ${accessToken.trim()}`,
    "Content-Type": "application/json; charset=UTF-8",
    "X-Upload-Content-Type": mimeType || "application/octet-stream",
    "X-Upload-Content-Length": String(sizeBytes >= 0 ? sizeBytes : 0),
  };
}

/**
 * Extracts and validates the Google Drive resumable upload session URL from the Location header.
 */
export function extractUploadUrl(locationHeader: string | null | undefined): string {
  if (!locationHeader || !locationHeader.trim()) {
    throw new Error("Missing Location header from Google Drive initiation response");
  }
  return locationHeader.trim();
}

/**
 * Cleans user-provided file names to prevent control character injection and directory traversal.
 */
export function sanitizeUploadFileName(rawName: string): string {
  if (!rawName || !rawName.trim()) {
    return "unnamed-file";
  }

  // Strip path traversal prefixes (../ or ..\)
  const basename = rawName.split(/[/\\]/).pop() || "";
  // Strip control characters, keep standard printable characters
  const clean = basename.replace(/[\x00-\x1F\x7F]/g, "").replace(/\s+/g, " ").trim();

  return clean || "unnamed-file";
}

/**
 * Generates an ID with safe fallback.
 */
function generateAttachmentId(): string {
  const uuid =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  return `gdrive-${uuid}`;
}

/**
 * Constructs a canonical TaskAttachment SSOT domain object from uploaded Google Drive file attributes.
 */
export function buildDriveAttachment(
  params: BuildDriveAttachmentParams
): TaskAttachment {
  const { fileId, name, mimeType, sizeBytes } = params;
  const cleanName = sanitizeUploadFileName(name);
  const type = getGoogleDriveMimeCategory(mimeType, cleanName);

  return {
    id: generateAttachmentId(),
    name: cleanName,
    sizeBytes: sizeBytes >= 0 ? sizeBytes : 0,
    type,
    url: `https://drive.google.com/file/d/${fileId}/view`,
    embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
    source: "gdrive",
    driveFileId: fileId,
    uploadedAt: new Date().toISOString(),
  };
}
