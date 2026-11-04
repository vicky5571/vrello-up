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
      content.includes("Google Drive"),
      "DocumentCreateModal must support Google Drive attachment fallback"
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
});

