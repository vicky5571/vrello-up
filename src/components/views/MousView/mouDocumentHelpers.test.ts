import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  extractCleanFilename,
  getFileExtension,
  parseMouDocumentSource,
  formatDocumentLabel,
} from "@/components/views/MousView/mouDocumentHelpers";

describe("MOU Document Helpers", () => {
  describe("extractCleanFilename", () => {
    it("strips standard 36-char UUID prefix from stored filename", () => {
      const stored = "12345678-1234-1234-1234-123456789abc-surat_perjanjian_sewa.pdf";
      assert.equal(extractCleanFilename(stored), "surat_perjanjian_sewa.pdf");
    });

    it("extracts filename from full api path and strips uuid", () => {
      const fullPath =
        "/api/marcom/files/documents/mou-123/a1b2c3d4-e5f6-7890-abcd-ef1234567890-kontrak_2026.pdf?download=1";
      assert.equal(extractCleanFilename(fullPath), "kontrak_2026.pdf");
    });

    it("returns raw filename if no uuid is present", () => {
      assert.equal(extractCleanFilename("simple_document.pdf"), "simple_document.pdf");
    });

    it("handles empty or blank string gracefully", () => {
      assert.equal(extractCleanFilename(""), "");
      assert.equal(extractCleanFilename("   "), "");
    });
  });

  describe("getFileExtension", () => {
    it("returns lowercase extension without leading dot", () => {
      assert.equal(getFileExtension("doc.PDF"), "pdf");
      assert.equal(getFileExtension("/path/to/scan.JPEG?v=1"), "jpeg");
      assert.equal(getFileExtension("no-extension"), "");
    });
  });

  describe("parseMouDocumentSource", () => {
    it("returns EMPTY type for null, undefined, blank or dash strings", () => {
      const empty1 = parseMouDocumentSource(null);
      assert.equal(empty1.type, "EMPTY");
      assert.equal(empty1.filename, "");

      const empty2 = parseMouDocumentSource("   ");
      assert.equal(empty2.type, "EMPTY");

      const empty3 = parseMouDocumentSource("—");
      assert.equal(empty3.type, "EMPTY");
    });

    it("parses internal PDF document with download url and clean filename", () => {
      const docPath =
        "/api/marcom/files/documents/mou-999/e52e505e-856d-4958-b118-2ad1b65db912-surat_mou_berkah.pdf";
      const result = parseMouDocumentSource(docPath, "Toko Berkah");

      assert.equal(result.type, "INTERNAL_PDF");
      assert.equal(result.filename, "surat_mou_berkah.pdf");
      assert.equal(result.previewUrl, docPath);
      assert.equal(result.downloadUrl, `${docPath}?download=1`);
      assert.equal(result.label, "Dokumen PDF");
    });

    it("parses internal image (photo proof/scan) correctly", () => {
      const docPath =
        "/api/marcom/files/documents/mou-888/a1b2c3d4-e5f6-7890-abcd-ef1234567890-scan_materai.jpg";
      const result = parseMouDocumentSource(docPath);

      assert.equal(result.type, "INTERNAL_IMAGE");
      assert.equal(result.filename, "scan_materai.jpg");
      assert.equal(result.downloadUrl, `${docPath}?download=1`);
      assert.equal(result.label, "Gambar Scan");
    });

    it("parses Supabase Storage CDN URL as internal PDF", () => {
      const storageUrl =
        "https://test.supabase.co/storage/v1/object/public/mou-documents/mou-documents/mou-123/12345678-1234-1234-1234-123456789abc-kontrak.pdf";
      const result = parseMouDocumentSource(storageUrl, "Kontrak Mitra");

      assert.equal(result.type, "INTERNAL_PDF");
      assert.equal(result.filename, "kontrak.pdf");
      assert.equal(result.downloadUrl, `${storageUrl}?download=1`);
      assert.equal(result.label, "Dokumen PDF");
    });
  });

  describe("formatDocumentLabel", () => {
    it("returns correct formatted label for each document type", () => {
      assert.equal(formatDocumentLabel(null), "Tidak ada berkas");
      assert.equal(formatDocumentLabel("/api/marcom/files/doc.pdf"), "Dokumen PDF");
      assert.equal(formatDocumentLabel("/api/marcom/files/scan.png"), "Gambar Scan");
      assert.equal(
        formatDocumentLabel("https://test.supabase.co/storage/v1/object/public/mou-documents/mou/doc.pdf"),
        "Dokumen PDF"
      );
    });
  });
});
