import { readdir, stat, access, constants } from "node:fs/promises";
import path from "node:path";

export interface FolderMetrics {
  count: number;
  sizeBytes: number;
  sizeFormatted: string;
}

export interface StorageStatusResult {
  rootDir: string;
  isWritable: boolean;
  totalFiles: number;
  totalSizeBytes: number;
  totalSizeFormatted: string;
  partitions: Record<string, FolderMetrics>;
}

/**
 * Format ukuran bita (bytes) menjadi string yang mudah dibaca manusia (B, KB, MB, GB).
 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

/**
 * Memindai direktori secara rekursif untuk menghitung jumlah berkas dan total ukuran.
 * Menangani folder yang belum ada dengan aman (mengembalikan count 0 dan size 0).
 */
export async function scanDirectoryMetrics(
  dirPath: string,
): Promise<{ count: number; sizeBytes: number }> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    let count = 0;
    let sizeBytes = 0;

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const sub = await scanDirectoryMetrics(fullPath);
        count += sub.count;
        sizeBytes += sub.sizeBytes;
      } else if (entry.isFile()) {
        try {
          const fileStat = await stat(fullPath);
          count += 1;
          sizeBytes += fileStat.size;
        } catch {
          // File mungkin dihapus saat proses pemindaian berjalan
        }
      }
    }

    return { count, sizeBytes };
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === "ENOENT") {
      return { count: 0, sizeBytes: 0 };
    }
    throw err;
  }
}

/**
 * Memeriksa apakah suatu folder dapat ditulis (writable).
 */
export async function checkIsWritable(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath, constants.W_OK);
    return true;
  } catch {
    // Jika folder belum dibuat, periksa parent directory
    try {
      const parent = path.dirname(targetPath);
      await access(parent, constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Mengambil ringkasan metrik penggunaan storage per partisi kategori.
 */
export async function getStorageStatus(
  rootDir: string,
  partitions: string[] = ["placements", "documents", "events", "tasks"],
): Promise<StorageStatusResult> {
  const isWritable = await checkIsWritable(rootDir);
  const partitionMetrics: Record<string, FolderMetrics> = {};

  let totalFiles = 0;
  let totalSizeBytes = 0;

  for (const part of partitions) {
    const partPath = path.join(rootDir, part);
    const { count, sizeBytes } = await scanDirectoryMetrics(partPath);
    partitionMetrics[part] = {
      count,
      sizeBytes,
      sizeFormatted: formatBytes(sizeBytes),
    };
    totalFiles += count;
    totalSizeBytes += sizeBytes;
  }

  return {
    rootDir,
    isWritable,
    totalFiles,
    totalSizeBytes,
    totalSizeFormatted: formatBytes(totalSizeBytes),
    partitions: partitionMetrics,
  };
}
