import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("BorrowTrackingBoard Button Loader & Mutation Guards (ADR-0107)", () => {
  const root = process.cwd();
  const filePath = path.resolve(root, "src/components/views/InventoryView/BorrowTrackingBoard.tsx");
  const content = fs.readFileSync(filePath, "utf-8");

  it("defines mutatingBorrowId and mutatingAction in BorrowTrackingBoardProps", () => {
    assert.ok(content.includes("mutatingBorrowId?: string | null;"), "Must define mutatingBorrowId in props");
    assert.ok(content.includes("mutatingAction?: string | null;"), "Must define mutatingAction in props");
  });

  it("imports Loader2 spinner from lucide-react", () => {
    assert.ok(content.includes("Loader2"), "Must import Loader2");
  });

  it("renders spinner and 'Approving...' label when PENDING card is mutating", () => {
    assert.ok(content.includes('isThisMutating ? ('), "Must check isThisMutating");
    assert.ok(content.includes('<Loader2 className="w-3.5 h-3.5 animate-spin" />'), "Must render Loader2 spinner");
    assert.ok(content.includes('"Approving..."'), "Must render Approving... label");
    assert.ok(content.includes('"Approve Request"'), "Must render default Approve Request label");
  });

  it("renders spinner and 'Picking Up...' label when APPROVED card is mutating", () => {
    assert.ok(content.includes('"Picking Up..."'), "Must render Picking Up... label");
    assert.ok(content.includes('"Mark as Picked Up"'), "Must render default Mark as Picked Up label");
  });

  it("locks buttons with disabled condition and styling during board mutation", () => {
    assert.ok(content.includes("disabled={isBoardMutating}"), "Must disable buttons when board is mutating");
    assert.ok(content.includes("disabled:opacity-60 disabled:cursor-not-allowed"), "Must apply disabled styles");
  });
});
