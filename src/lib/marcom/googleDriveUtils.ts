export interface GoogleDriveParsedUrl {
  isValid: boolean;
  id: string | null;
  kind: "file" | "folder" | null;
  embedUrl: string | null;
  viewUrl: string;
}

const FILE_REGEXES = [
  /\/file\/d\/([a-zA-Z0-9_-]+)/,
  /[?&]id=([a-zA-Z0-9_-]+)/,
  /\/uc\?id=([a-zA-Z0-9_-]+)/,
];

const FOLDER_REGEXES = [
  /\/drive(?:\/u\/\d+)?\/folders\/([a-zA-Z0-9_-]+)/,
];

export function parseGoogleDriveUrl(rawUrl: string): GoogleDriveParsedUrl {
  const trimmed = (rawUrl || "").trim();
  if (!trimmed.includes("drive.google.com")) {
    return { isValid: false, id: null, kind: null, embedUrl: null, viewUrl: trimmed };
  }

  for (const regex of FOLDER_REGEXES) {
    const match = trimmed.match(regex);
    if (match && match[1]) {
      return {
        isValid: true,
        id: match[1],
        kind: "folder",
        embedUrl: null,
        viewUrl: trimmed,
      };
    }
  }

  for (const regex of FILE_REGEXES) {
    const match = trimmed.match(regex);
    if (match && match[1]) {
      const fileId = match[1];
      return {
        isValid: true,
        id: fileId,
        kind: "file",
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        viewUrl: trimmed,
      };
    }
  }

  return { isValid: false, id: null, kind: null, embedUrl: null, viewUrl: trimmed };
}

export function getGoogleDriveMimeCategory(
  mimeType: string,
  filename?: string
): "video" | "image" | "document" | "other" {
  const mime = (mimeType || "").toLowerCase();
  const name = (filename || "").toLowerCase();

  if (mime.startsWith("video/") || name.endsWith(".mp4") || name.endsWith(".mov") || name.endsWith(".mkv")) {
    return "video";
  }
  if (mime.startsWith("image/") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png") || name.endsWith(".webp")) {
    return "image";
  }
  if (mime.includes("pdf") || mime.includes("document") || mime.includes("spreadsheet") || name.endsWith(".pdf")) {
    return "document";
  }
  return "other";
}
