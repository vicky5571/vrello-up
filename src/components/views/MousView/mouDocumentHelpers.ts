/**
 * Helper murni untuk parsing, klasifikasi, dan penanganan berkas dokumen MOU.
 * Mengikuti Strangler Pattern: logika bebas dependensi DOM & UI framework.
 */

export type MouDocumentType =
  | "INTERNAL_PDF"
  | "INTERNAL_IMAGE"
  | "EMPTY";

export interface ParsedMouDocument {
  type: MouDocumentType;
  rawPath: string;
  previewUrl: string;
  downloadUrl: string;
  filename: string;
  label: string;
}

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "bmp"]);

/**
 * Membersihkan awalan UUID standar (36 karakter) dari nama berkas tersimpan.
 */
export function extractCleanFilename(rawPath: string): string {
  if (!rawPath) return "";
  const cleaned = rawPath.trim();
  const segments = cleaned.split(/[/\\]/);
  const base = segments[segments.length - 1] || "";
  const withoutQuery = base.split("?")[0] || "";
  const strippedUuid = withoutQuery.replace(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i,
    "",
  );
  return strippedUuid || withoutQuery;
}

/**
 * Mengambil ekstensi berkas dalam huruf kecil tanpa titik.
 */
export function getFileExtension(pathOrUrl: string): string {
  if (!pathOrUrl) return "";
  const cleanPath = pathOrUrl.split("?")[0] || "";
  const lastDot = cleanPath.lastIndexOf(".");
  if (lastDot === -1) return "";
  return cleanPath.slice(lastDot + 1).toLowerCase();
}

/**
 * Menganalisis path dokumen MOU dan mengembalikan metadata terstruktur untuk preview dan download.
 */
export function parseMouDocumentSource(
  docPath: string | null | undefined,
  fallbackTitle?: string,
): ParsedMouDocument {
  if (!docPath || typeof docPath !== "string") {
    return {
      type: "EMPTY",
      rawPath: "",
      previewUrl: "",
      downloadUrl: "",
      filename: "",
      label: "Tidak ada berkas",
    };
  }

  const raw = docPath.trim();
  if (!raw || raw === "—" || raw === "-") {
    return {
      type: "EMPTY",
      rawPath: "",
      previewUrl: "",
      downloadUrl: "",
      filename: "",
      label: "Tidak ada berkas",
    };
  }

  const ext = getFileExtension(raw);
  const cleanName =
    extractCleanFilename(raw) || fallbackTitle || "dokumen-mou";

  // Bangun download URL dengan query parameter download=1
  const downloadUrl = raw.includes("?")
    ? `${raw}&download=1`
    : `${raw}?download=1`;

  if (IMAGE_EXTENSIONS.has(ext)) {
    return {
      type: "INTERNAL_IMAGE",
      rawPath: raw,
      previewUrl: raw,
      downloadUrl,
      filename: cleanName,
      label: "Gambar Scan",
    };
  }

  return {
    type: "INTERNAL_PDF",
    rawPath: raw,
    previewUrl: raw,
    downloadUrl,
    filename: cleanName.endsWith(".pdf") ? cleanName : `${cleanName}.pdf`,
    label: "Dokumen PDF",
  };
}

/**
 * Format label dokumen ramah pengguna.
 */
export function formatDocumentLabel(docPath: string | null | undefined): string {
  const parsed = parseMouDocumentSource(docPath);
  return parsed.label;
}
