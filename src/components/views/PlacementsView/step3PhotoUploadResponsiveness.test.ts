import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Step 3 Direct Physical Photo Upload Enforcement and Tautan URL Removal (ADR-0079)", () => {
  const uploaderPath = path.resolve(
    process.cwd(),
    "src/components/views/PlacementsView/PlacementPhotoUploader.tsx"
  );

  describe("Tautan URL & Manual Input Removal Invariants", () => {
    it("verifies 'Tautan URL' button and label are completely eliminated", () => {
      const content = fs.readFileSync(uploaderPath, "utf-8");
      assert.ok(
        !content.includes("Tautan URL"),
        "PlacementPhotoUploader must not contain 'Tautan URL' text or button"
      );
    });

    it("verifies manual URL state and handlers are completely eliminated", () => {
      const content = fs.readFileSync(uploaderPath, "utf-8");
      assert.ok(
        !content.includes("showManualUrl"),
        "PlacementPhotoUploader must not contain showManualUrl state"
      );
      assert.ok(
        !content.includes("manualUrlInput"),
        "PlacementPhotoUploader must not contain manualUrlInput state"
      );
      assert.ok(
        !content.includes("handleAddManualUrl"),
        "PlacementPhotoUploader must not contain handleAddManualUrl function"
      );
    });

    it("verifies manual URL input container with type='url' is eliminated", () => {
      const content = fs.readFileSync(uploaderPath, "utf-8");
      assert.ok(
        !content.includes('type="url"'),
        "PlacementPhotoUploader must not contain manual URL text input"
      );
      assert.ok(
        !content.includes("Tempel tautan gambar https://..."),
        "PlacementPhotoUploader must not contain URL paste placeholder"
      );
    });

    it("verifies unused Lucide icons (LinkIcon, ChevronDown, ChevronUp, Plus) are pruned", () => {
      const content = fs.readFileSync(uploaderPath, "utf-8");
      assert.ok(
        !content.includes("Link as LinkIcon") && !content.includes("LinkIcon"),
        "Link icon must be pruned from imports"
      );
      assert.ok(
        !content.includes("ChevronDown") && !content.includes("ChevronUp"),
        "ChevronDown and ChevronUp must be pruned from imports"
      );
      assert.ok(
        !content.includes("Plus,"),
        "Plus icon must be pruned from imports"
      );
    });
  });

  describe("Physical File Upload Preservation & Header Cleanliness", () => {
    it("verifies camera file input with capture='environment' is preserved", () => {
      const content = fs.readFileSync(uploaderPath, "utf-8");
      assert.ok(
        content.includes('capture="environment"'),
        "Camera input must retain capture='environment' for direct mobile capture"
      );
      assert.ok(
        content.includes("Ambil Foto (Kamera)"),
        "Camera action button must be preserved"
      );
    });

    it("verifies gallery file input with multiple selection is preserved", () => {
      const content = fs.readFileSync(uploaderPath, "utf-8");
      assert.ok(
        content.includes("multiple") && content.includes('ref={galleryInputRef}'),
        "Gallery input must retain multiple selection capability"
      );
      assert.ok(
        content.includes("Pilih dari Galeri"),
        "Gallery action button must be preserved"
      );
    });

    it("verifies clean header row: label on left, count badge on right when photos exist", () => {
      const content = fs.readFileSync(uploaderPath, "utf-8");
      assert.ok(
        content.includes("Foto Bukti Pemasangan"),
        "Header must retain section label"
      );
      assert.ok(
        content.includes("{photos.length} Foto Terlampir"),
        "Header must retain count badge when photos exist"
      );
    });
  });
});
