import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateDocumentKPIs,
  filterDocuments,
  formatFileSize,
  getDocumentTypeMeta,
  isCloudDocumentUrl,
} from "@/lib/marcom/documentWorkflow";
import type { MarcomDocument } from "@/components/views/DocumentsView/DocumentsView";

const mockDocs: MarcomDocument[] = [
  {
    id: "doc-1",
    name: "Brand Guidelines 2025",
    category: "Brand Guidelines",
    period: "2025",
    branchName: "Semarang",
    ownerPic: "Budi Studio",
    status: "Active",
    fileType: "PDF",
    fileSizeMb: 12.5,
    filePath: "/api/marcom/files/documents/new/brand-guide.pdf",
    description: "Official color palette and typography rules",
  },
  {
    id: "doc-2",
    name: "Master Video Launching IM3",
    category: "Creative Assets",
    period: "Q1 2025",
    branchName: "Solo",
    ownerPic: "Rian Video",
    status: "Active",
    fileType: "MP4",
    fileSizeMb: 1200.0,
    filePath: "https://drive.google.com/file/d/12345/view",
    description: "4K Master footage for LED billboard",
  },
  {
    id: "doc-3",
    name: "SOP Pemasangan Shopblind Outlet",
    category: "SOP & Kebijakan",
    period: "2024",
    branchName: "Yogyakarta",
    ownerPic: "Ahmad Vendor",
    status: "Draft",
    fileType: "DOCX",
    fileSizeMb: 4.2,
    filePath: "/api/marcom/files/documents/new/sop.docx",
    description: "Standar instalasi material toko",
  },
  {
    id: "doc-4",
    name: "Rekap Evaluasi Event Q4 2024",
    category: "Laporan & Evaluasi",
    period: "Q4 2024",
    branchName: "Semarang",
    ownerPic: "Siti Analyst",
    status: "Archived",
    fileType: "XLSX",
    fileSizeMb: 8.8,
    filePath: "https://docs.google.com/spreadsheets/d/abc/edit",
    description: "Data kehadiran dan konversi",
  },
];

test("formatFileSize converts MB to MB or GB properly", () => {
  assert.equal(formatFileSize(0), "0 MB");
  assert.equal(formatFileSize(12.5), "12.50 MB");
  assert.equal(formatFileSize(1024), "1.00 GB");
  assert.equal(formatFileSize(1536), "1.50 GB");
});

test("isCloudDocumentUrl identifies http/https URLs", () => {
  assert.equal(isCloudDocumentUrl("https://drive.google.com/file/d/1"), true);
  assert.equal(isCloudDocumentUrl("http://dropbox.com/shared/doc"), true);
  assert.equal(isCloudDocumentUrl("/api/marcom/files/documents/1.pdf"), false);
  assert.equal(isCloudDocumentUrl(""), false);
  assert.equal(isCloudDocumentUrl(null), false);
});

test("getDocumentTypeMeta returns valid color and label", () => {
  const pdfMeta = getDocumentTypeMeta("PDF");
  assert.equal(pdfMeta.label, "PDF Document");
  assert.equal(pdfMeta.type, "PDF");

  const mp4Meta = getDocumentTypeMeta("MP4");
  assert.equal(mp4Meta.label, "MP4 Video Master");
  assert.equal(mp4Meta.iconName, "film");
});

test("calculateDocumentKPIs computes storage, status, and category aggregates", () => {
  const emptyKPIs = calculateDocumentKPIs([]);
  assert.equal(emptyKPIs.totalDocuments, 0);
  assert.equal(emptyKPIs.formattedStorage, "0 MB");
  assert.equal(emptyKPIs.topCategory, "—");

  const kpis = calculateDocumentKPIs(mockDocs);
  assert.equal(kpis.totalDocuments, 4);
  assert.equal(kpis.activeCount, 2);
  assert.equal(kpis.draftCount, 1);
  assert.equal(kpis.archivedCount, 1);
  assert.equal(kpis.cloudDocsCount, 2);
  assert.equal(kpis.localDocsCount, 2);
  // Total MB: 12.5 + 1200 + 4.2 + 8.8 = 1225.5 MB => ~1.20 GB
  assert.equal(kpis.totalStorageMb, 1225.5);
  assert.equal(kpis.formattedStorage, "1.20 GB");
});

test("filterDocuments filters correctly by category, status, fileType, and query", () => {
  // Filter category
  const brandOnly = filterDocuments(mockDocs, { category: "Brand Guidelines" });
  assert.equal(brandOnly.length, 1);
  assert.equal(brandOnly[0].id, "doc-1");

  // Filter status
  const activeOnly = filterDocuments(mockDocs, { status: "Active" });
  assert.equal(activeOnly.length, 2);

  // Filter fileType
  const videoOnly = filterDocuments(mockDocs, { fileType: "MP4" });
  assert.equal(videoOnly.length, 1);
  assert.equal(videoOnly[0].id, "doc-2");

  // Search query by name, branch, or description
  const searchSolo = filterDocuments(mockDocs, { searchQuery: "Solo" });
  assert.equal(searchSolo.length, 1);
  assert.equal(searchSolo[0].id, "doc-2");

  const searchBillboard = filterDocuments(mockDocs, { searchQuery: "billboard" });
  assert.equal(searchBillboard.length, 1);
  assert.equal(searchBillboard[0].id, "doc-2");
});
