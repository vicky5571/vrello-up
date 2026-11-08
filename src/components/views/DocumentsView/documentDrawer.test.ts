import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import type { DocumentItem, DocFileType } from "@/types";
import {
  getDocumentTypeMeta,
  formatFileSize,
  isCloudDocumentUrl,
} from "@/lib/marcom/documentWorkflow";

describe("Documents Detail & Edit Drawer with Focused Creation Modal (ADR-0024)", () => {
  const docsDir = path.resolve(
    process.cwd(),
    "src/components/views/DocumentsView"
  );

  it("verifies DocumentPreviewModal is eliminated from codebase", () => {
    const files = fs.readdirSync(docsDir);
    assert.ok(
      !files.includes("DocumentPreviewModal.tsx"),
      "DocumentPreviewModal.tsx must be completely deleted"
    );
  });

  it("verifies DocumentCreateModal and DocumentDrawer files exist", () => {
    const files = fs.readdirSync(docsDir);
    assert.ok(
      files.includes("DocumentCreateModal.tsx"),
      "DocumentCreateModal.tsx must exist"
    );
    assert.ok(
      files.includes("DocumentDrawer.tsx"),
      "DocumentDrawer.tsx must exist"
    );
  });

  it("verifies DocumentsView.tsx wires DocumentCreateModal and DocumentDrawer", () => {
    const coordinatorPath = path.join(docsDir, "DocumentsView.tsx");
    const content = fs.readFileSync(coordinatorPath, "utf-8");

    assert.ok(
      content.includes("DocumentCreateModal"),
      "DocumentsView must import and render DocumentCreateModal"
    );
    assert.ok(
      content.includes("DocumentDrawer"),
      "DocumentsView must import and render DocumentDrawer"
    );
    assert.ok(
      !content.includes("DocumentPreviewModal"),
      "DocumentsView must have zero references to DocumentPreviewModal"
    );
    assert.ok(
      content.includes("isCreateModalOpen"),
      "DocumentsView must manage isCreateModalOpen state"
    );
    assert.ok(
      content.includes("selectedDrawerDoc"),
      "DocumentsView must manage selectedDrawerDoc state"
    );
    assert.ok(
      content.includes("setSelectedDrawerDoc"),
      "DocumentsView must update selectedDrawerDoc on row and card clicks"
    );
  });

  it("verifies DocumentDrawer implementation details", () => {
    const drawerPath = path.join(docsDir, "DocumentDrawer.tsx");
    const content = fs.readFileSync(drawerPath, "utf-8");

    assert.ok(
      content.includes("damping: 28, stiffness: 300"),
      "DocumentDrawer must use spring physics damping 28, stiffness 300"
    );
    assert.ok(
      content.includes("Escape"),
      "DocumentDrawer must handle Escape key for closing"
    );
    assert.ok(
      content.includes("bg-slate-50/50 dark:bg-slate-900/40"),
      "DocumentDrawer must wrap metadata in standardized grey container"
    );
    assert.ok(
      content.includes("Simpan Perubahan"),
      "DocumentDrawer must have primary Simpan Perubahan save button"
    );
    assert.ok(
      content.includes("Hapus Dokumen"),
      "DocumentDrawer must have Hapus Dokumen delete button"
    );
    assert.ok(
      content.includes("Ganti File Dokumen"),
      "DocumentDrawer must support file replacement"
    );
  });

  it("verifies DocumentCreateModal implementation details", () => {
    const createModalPath = path.join(docsDir, "DocumentCreateModal.tsx");
    const content = fs.readFileSync(createModalPath, "utf-8");

    assert.ok(
      content.includes("Unggah Dokumen Aset Baru"),
      "DocumentCreateModal must render clean creation modal header"
    );
    assert.ok(
      content.includes("/api/marcom/uploads"),
      "DocumentCreateModal must upload local files to /api/marcom/uploads"
    );
    assert.ok(
      content.includes("/api/marcom/documents"),
      "DocumentCreateModal must dispatch POST to /api/marcom/documents"
    );
    assert.ok(
      !content.includes("Pilih dari Google Drive") &&
        !content.includes("useGoogleDrivePicker") &&
        !content.includes("GoogleDriveLinkModal"),
      "DocumentCreateModal must not include Pilih dari Google Drive option (ADR-0090)"
    );
  });

  it("verifies DocumentCreateModal upload mode toggle, Choose File Type placeholder, and CustomDropdown integration (ADR-0090)", () => {
    const createModalPath = path.join(docsDir, "DocumentCreateModal.tsx");
    const content = fs.readFileSync(createModalPath, "utf-8");

    assert.ok(
      content.includes('useState<"local" | "url">("local")') &&
        content.includes("handleModeChange"),
      "DocumentCreateModal must implement uploadMode toggle ('local' | 'url') and handleModeChange"
    );
    assert.ok(
      content.includes('key="upload-local-mode"') &&
        content.includes('key="upload-url-mode"'),
      "DocumentCreateModal must assign distinct keys to upload mode branches to prevent uncontrolled-to-controlled input reconciliation errors"
    );
    assert.ok(
      content.includes('useState<DocFileType | "">("")') &&
        content.includes('placeholder="Choose File Type"'),
      "DocumentCreateModal must initialize/reset fileType to empty string and display 'Choose File Type' placeholder"
    );
    assert.ok(
      content.includes("CustomDropdown") &&
        content.includes("DOCUMENT_CATEGORY_OPTIONS") &&
        content.includes("FILE_TYPE_OPTIONS") &&
        content.includes('className="w-full"') &&
        content.includes("min-w-0"),
      "DocumentCreateModal must use full-width CustomDropdown inside min-w-0 grid cells for category, branch, and fileType"
    );
    assert.ok(
      !content.includes("Contoh: 2026, Q1") &&
        !content.includes("Ukuran File (MB)"),
      "DocumentCreateModal must not render manual Periode or editable Ukuran File (MB) inputs (ADR-0090 Amendment 2)"
    );
  });

  it("verifies DocumentCreateModal real branch store binding, auto-filled Owner/PIC, LINK fileType on URL mode, and upload submit lock (ADR-0091)", () => {
    const createModalPath = path.join(docsDir, "DocumentCreateModal.tsx");
    const content = fs.readFileSync(createModalPath, "utf-8");

    assert.ok(
      content.includes("useMarcomDataStore") &&
        content.includes('placeholder="Choose"') &&
        !content.includes("HQ / Nasional (Semua Branch)"),
      "DocumentCreateModal must bind real branches from useMarcomDataStore with placeholder='Choose' and omit synthetic HQ option"
    );
    assert.ok(
      content.includes("useSession") &&
        content.includes("defaultOwnerName") &&
        content.includes("setOwnerPic(defaultOwnerName)"),
      "DocumentCreateModal must auto-fill Owner / PIC with active user's name"
    );
    assert.ok(
      content.includes('{ value: "LINK", label: "Link" }') &&
        content.includes('setFileType(nextMode === "url" ? "LINK" : "")'),
      "DocumentCreateModal must auto-select 'LINK' fileType in URL mode and reset to '' in local mode"
    );
    assert.ok(
      content.includes("disabled={isSaving || isUploading}") &&
        content.includes('isUploading ? "Mengunggah..." : "Simpan Dokumen"'),
      "DocumentCreateModal must disable and show loading state on Simpan Dokumen while isUploading is true"
    );
  });

  it("verifies DocumentCardsView card item clickability", () => {
    const cardsPath = path.join(docsDir, "DocumentCardsView.tsx");
    const content = fs.readFileSync(cardsPath, "utf-8");

    assert.ok(
      content.includes("onSelectDocument(doc)"),
      "DocumentCardsView card click must call onSelectDocument"
    );
    assert.ok(
      content.includes("cursor-pointer"),
      "DocumentCardsView card must have cursor-pointer style"
    );
  });

  it("verifies status field is completely eliminated from Documents module (ADR-0025)", () => {
    const drawerPath = path.join(docsDir, "DocumentDrawer.tsx");
    const drawerContent = fs.readFileSync(drawerPath, "utf-8");
    assert.ok(!drawerContent.includes("DOCUMENT_STATUSES"), "Drawer must not have DOCUMENT_STATUSES");
    assert.ok(!drawerContent.includes("setStatus("), "Drawer must not have setStatus");

    const createPath = path.join(docsDir, "DocumentCreateModal.tsx");
    const createContent = fs.readFileSync(createPath, "utf-8");
    assert.ok(!createContent.includes("setStatus("), "CreateModal must not have setStatus");

    const cardsPath = path.join(docsDir, "DocumentCardsView.tsx");
    const cardsContent = fs.readFileSync(cardsPath, "utf-8");
    assert.ok(!cardsContent.includes("doc.status"), "CardsView must not render status");

    const viewPath = path.join(docsDir, "DocumentsView.tsx");
    const viewContent = fs.readFileSync(viewPath, "utf-8");
    assert.ok(!viewContent.includes('accessor("status"'), "Table must not have status column");
  });

  it("verifies legacy Drive/Cloud and Server Local badges are eliminated", () => {
    const cardsPath = path.join(docsDir, "DocumentCardsView.tsx");
    const cardsContent = fs.readFileSync(cardsPath, "utf-8");
    assert.ok(!cardsContent.includes("Drive / Cloud"), "CardsView must not contain 'Drive / Cloud'");
    assert.ok(!cardsContent.includes("Server Local"), "CardsView must not contain 'Server Local'");

    const viewPath = path.join(docsDir, "DocumentsView.tsx");
    const viewContent = fs.readFileSync(viewPath, "utf-8");
    assert.ok(!viewContent.includes("Google Drive / Cloud"), "DocumentsView table must not contain 'Google Drive / Cloud'");

    const drawerPath = path.join(docsDir, "DocumentDrawer.tsx");
    const drawerContent = fs.readFileSync(drawerPath, "utf-8");
    assert.ok(!drawerContent.includes("Internal Server Storage"), "Drawer must not contain 'Internal Server Storage'");
    assert.ok(!drawerContent.includes("Lokasi:"), "Drawer must not contain 'Lokasi:'");
    assert.ok(!viewContent.includes("Ragam Kategori"), "DocumentsView must not contain redundant 'Ragam Kategori' card");
    assert.ok(!viewContent.includes("Penyimpanan Cloud"), "DocumentsView must not contain redundant 'Penyimpanan Cloud' card");
  });

  it("verifies DocumentsView and cards wire buildShareableDocumentUrl", () => {
    const viewPath = path.join(docsDir, "DocumentsView.tsx");
    const viewContent = fs.readFileSync(viewPath, "utf-8");
    assert.ok(viewContent.includes("buildShareableDocumentUrl"), "DocumentsView must use buildShareableDocumentUrl");
    assert.ok(viewContent.includes("docId"), "DocumentsView must handle docId URL parameter");

    const cardsPath = path.join(docsDir, "DocumentCardsView.tsx");
    const cardsContent = fs.readFileSync(cardsPath, "utf-8");
    assert.ok(cardsContent.includes("buildShareableDocumentUrl"), "CardsView must use buildShareableDocumentUrl");
  });

  it("verifies DocumentItem conforms to SSOT and helpers handle all formats", () => {
    const mockDoc: DocumentItem = {
      id: "doc-test-1",
      name: "Brand Guidelines 2026",
      category: "Brand Guidelines",
      fileType: "PDF" as DocFileType,
      filePath: "/api/marcom/files/guidelines.pdf",
      fileSizeMb: 12.5,
      branchName: "HQ",
      description: "Official brand guidelines",
    };

    assert.equal(mockDoc.name, "Brand Guidelines 2026");
    assert.equal(formatFileSize(mockDoc.fileSizeMb || 0), "12.50 MB");
    assert.equal(isCloudDocumentUrl(mockDoc.filePath), false);
    assert.equal(isCloudDocumentUrl("https://drive.google.com/file/d/123"), true);

    const pdfMeta = getDocumentTypeMeta("PDF");
    assert.equal(pdfMeta.type, "PDF");
    assert.equal(pdfMeta.iconName, "file-text");

    const mp4Meta = getDocumentTypeMeta("MP4");
    assert.equal(mp4Meta.type, "MP4");
    assert.equal(mp4Meta.iconName, "film");
  });

  it("verifies DocumentDrawer guards empty preview src and renders placeholder (ADR-0092)", () => {
    const drawerPath = path.join(docsDir, "DocumentDrawer.tsx");
    const drawerContent = fs.readFileSync(drawerPath, "utf-8");

    assert.ok(
      drawerContent.includes("resolvePreviewSrc"),
      "DocumentDrawer must import and call resolvePreviewSrc"
    );
    assert.ok(
      drawerContent.includes("Belum ada file untuk dipratinjau"),
      "DocumentDrawer must render placeholder when previewSrc is null for media formats"
    );
    assert.ok(
      drawerContent.includes("src={previewSrc}"),
      "DocumentDrawer must pass previewSrc to preview elements"
    );
    assert.ok(
      !drawerContent.includes("<iframe\n                      src={filePath}"),
      "DocumentDrawer must not render iframe with unguarded filePath"
    );
  });

  it("verifies DocumentDrawer file replacement upload mode toggle, safe URL draft state, and metadata alignment (ADR-0093)", () => {
    const drawerPath = path.join(docsDir, "DocumentDrawer.tsx");
    const drawerContent = fs.readFileSync(drawerPath, "utf-8");

    assert.ok(
      !drawerContent.includes("useGoogleDrivePicker") &&
        !drawerContent.includes("GoogleDriveLinkModal") &&
        !drawerContent.includes("<span>Google Drive</span>"),
      "DocumentDrawer must not include Google Drive picker or button (ADR-0093)"
    );
    assert.ok(
      drawerContent.includes('useState<"local" | "url">("local")') &&
        drawerContent.includes("urlInput") &&
        drawerContent.includes("handleModeChange") &&
        drawerContent.includes("handleUrlInputChange"),
      "DocumentDrawer must implement uploadMode toggle, urlInput draft state, handleModeChange, and handleUrlInputChange"
    );
    assert.ok(
      drawerContent.includes('key="drawer-upload-local-mode"') &&
        drawerContent.includes('key="drawer-upload-url-mode"') &&
        drawerContent.includes('key="drawer-url-text-input"'),
      "DocumentDrawer must assign distinct keys to upload mode branches and URL input"
    );
    assert.ok(
      drawerContent.includes("CustomDropdown") &&
        drawerContent.includes("useMarcomDataStore") &&
        drawerContent.includes('placeholder="Choose"') &&
        !drawerContent.includes("HQ / Nasional (Semua Branch)"),
      "DocumentDrawer must use CustomDropdown and real branches from useMarcomDataStore with placeholder='Choose'"
    );
    assert.ok(
      !drawerContent.includes("Periode Dokumen") &&
        !drawerContent.includes("Ukuran File (MB)"),
      "DocumentDrawer must not render manual Periode Dokumen or editable Ukuran File (MB) inputs"
    );
    assert.ok(
      drawerContent.includes("disabled={isSaving || isDeleting || isUploading}") &&
        drawerContent.includes('isUploading ? "Mengunggah..." : "Simpan Perubahan"'),
      "DocumentDrawer must lock footer buttons and show Mengunggah... on Simpan Perubahan while isUploading is true"
    );
  });
});

