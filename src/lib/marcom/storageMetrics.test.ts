import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  formatBytes,
  scanDirectoryMetrics,
  checkIsWritable,
  getStorageStatus,
} from "@/lib/marcom/storageMetrics";

describe("Storage Metrics Helpers", () => {
  describe("formatBytes", () => {
    it("formats 0 and negative bytes gracefully", () => {
      assert.equal(formatBytes(0), "0 B");
      assert.equal(formatBytes(-100), "0 B");
    });

    it("formats bytes, kilobytes, megabytes and gigabytes accurately", () => {
      assert.equal(formatBytes(512), "512 B");
      assert.equal(formatBytes(1024), "1.00 KB");
      assert.equal(formatBytes(1536), "1.50 KB");
      assert.equal(formatBytes(1024 * 1024 * 5.25), "5.25 MB");
      assert.equal(formatBytes(1024 * 1024 * 1024 * 2.5), "2.50 GB");
    });
  });

  describe("scanDirectoryMetrics & getStorageStatus", () => {
    it("returns zero counts for non-existent directory without throwing", async () => {
      const result = await scanDirectoryMetrics("/path/that/definitely/does/not/exist");
      assert.equal(result.count, 0);
      assert.equal(result.sizeBytes, 0);
    });

    it("accurately scans files across partitions and reports total size", async () => {
      const tempRoot = await mkdtemp(path.join(tmpdir(), "vrello-storage-test-"));

      try {
        // Setup mock partitions
        const placementDir = path.join(tempRoot, "placements", "p-1");
        const docDir = path.join(tempRoot, "documents", "d-1");
        await mkdir(placementDir, { recursive: true });
        await mkdir(docDir, { recursive: true });

        // Write sample files (100 bytes and 250 bytes)
        await writeFile(path.join(placementDir, "photo1.jpg"), Buffer.alloc(100));
        await writeFile(path.join(placementDir, "photo2.jpg"), Buffer.alloc(150));
        await writeFile(path.join(docDir, "mou.pdf"), Buffer.alloc(250));

        const isWritable = await checkIsWritable(tempRoot);
        assert.equal(isWritable, true);

        const status = await getStorageStatus(tempRoot, ["placements", "documents", "events", "tasks"]);

        assert.equal(status.isWritable, true);
        assert.equal(status.totalFiles, 3);
        assert.equal(status.totalSizeBytes, 500);
        assert.equal(status.totalSizeFormatted, "500 B");

        assert.equal(status.partitions.placements.count, 2);
        assert.equal(status.partitions.placements.sizeBytes, 250);
        assert.equal(status.partitions.documents.count, 1);
        assert.equal(status.partitions.documents.sizeBytes, 250);
        assert.equal(status.partitions.events.count, 0);
        assert.equal(status.partitions.tasks.count, 0);
      } finally {
        await rm(tempRoot, { recursive: true, force: true });
      }
    });
  });
});
