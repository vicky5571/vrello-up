import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("BorrowSettlementModal & Settlement UI Invariants (ADR-0052)", () => {
  const root = process.cwd();

  it("BorrowSettlementModal provides dual-mode toggle (CASH_TRANSFER and ITEM_REPLACEMENT)", () => {
    const filePath = path.resolve(root, "src/components/views/InventoryView/BorrowSettlementModal.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    assert.ok(content.includes('"CASH_TRANSFER"'), "Must support CASH_TRANSFER mode");
    assert.ok(content.includes('"ITEM_REPLACEMENT"'), "Must support ITEM_REPLACEMENT mode");
    assert.ok(content.includes("Pembayaran Kas / Transfer"), "Must render cash payment label");
    assert.ok(content.includes("Penggantian Barang Fisik"), "Must render item replacement label");
    assert.ok(content.includes("totalAfkirUnits"), "Must calculate totalAfkirUnits");
  });

  it("BorrowSettlementModal enforces required notes and multi-proof upload deck", () => {
    const filePath = path.resolve(root, "src/components/views/InventoryView/BorrowSettlementModal.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    assert.ok(content.includes("settlementNotes"), "Must manage settlementNotes state");
    assert.ok(content.includes("inventory-proofs"), "Must upload to inventory-proofs kind");
    assert.ok(content.includes("proofUrls"), "Must manage proofUrls array state");
    assert.ok(content.includes("disabled={isSubmitting || proofUrls.length === 0 || !settlementNotes.trim()}"), "Must disable submit when proofs or notes are missing");
  });

  it("BorrowDetailModal integrates settlement trigger button and resolution summary card", () => {
    const filePath = path.resolve(root, "src/components/views/InventoryView/BorrowDetailModal.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    assert.ok(content.includes("BorrowSettlementModal"), "Must import BorrowSettlementModal");
    assert.ok(content.includes('record.compensationStatus === "PENDING_SETTLEMENT" && canManage'), "Must guard Selesaikan Ganti Rugi button");
    assert.ok(content.includes("Selesaikan Ganti Rugi"), "Must display Selesaikan Ganti Rugi button");
    assert.ok(content.includes('record.compensationStatus === "RESOLVED"'), "Must render resolution card when RESOLVED");
    assert.ok(content.includes("record.settlementType"), "Must display settlementType");
    assert.ok(content.includes("record.settledAt"), "Must display settledAt");
    assert.ok(content.includes("record.settledBy"), "Must display settledBy");
    assert.ok(content.includes("record.settlementNotes"), "Must display settlementNotes");
    assert.ok(content.includes("record.settlementProofUrls"), "Must display settlementProofUrls links");
  });

  it("SSOT domain types define CompensationSettlementType and settlement fields on BorrowRecord", () => {
    const filePath = path.resolve(root, "src/types/index.ts");
    const content = fs.readFileSync(filePath, "utf-8");

    assert.ok(content.includes("export type CompensationSettlementType"), "Must export CompensationSettlementType");
    assert.ok(content.includes("settlementType?: CompensationSettlementType;"), "BorrowRecord must include settlementType");
    assert.ok(content.includes("settledAmount?: number;"), "BorrowRecord must include settledAmount");
    assert.ok(content.includes("settledAt?: string | null;"), "BorrowRecord must include settledAt");
    assert.ok(content.includes("settledBy?: string;"), "BorrowRecord must include settledBy");
    assert.ok(content.includes("settlementNotes?: string;"), "BorrowRecord must include settlementNotes");
    assert.ok(content.includes("settlementProofUrls?: string[];"), "BorrowRecord must include settlementProofUrls");
  });
});

