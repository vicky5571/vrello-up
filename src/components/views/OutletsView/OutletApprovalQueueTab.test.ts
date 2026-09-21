import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  filterPendingOutlets,
  detectPotentialDuplicateOutlets,
  getApprovalStatusBadge,
} from "@/components/views/OutletsView/outletApprovalQueueHelpers";
import type { OutletItem } from "@/types";

describe("Outlet Approval Queue Helpers", () => {
  const mockOutlets: OutletItem[] = [
    {
      id: "out-1",
      code: "O-SMG-001",
      name: "Toko Sinar Abadi",
      type: "TRADITIONAL",
      tier: "TIER_1",
      address: "Jl. Pemuda 10",
      city: "Semarang",
      picName: "Budi",
      picPhone: "0812",
      active: true,
      branchId: "branch-smg",
      status: "APPROVED",
    },
    {
      id: "out-2",
      code: "DRAFT-SMG-101",
      name: "Sinar Abadi Cell",
      type: "TRADITIONAL",
      tier: "TIER_1",
      address: "Jl. Pemuda 12",
      city: "Semarang",
      picName: "Budi Santoso",
      picPhone: "0812",
      active: false,
      branchId: "branch-smg",
      status: "PENDING_APPROVAL",
      photoUrl: "https://example.com/photo2.jpg",
      submittedBy: "sales1@indosat.com",
    },
    {
      id: "out-3",
      code: "DRAFT-SOLO-202",
      name: "Konter Manahan Jaya",
      type: "MODERN_RETAIL",
      tier: "TIER_2",
      address: "Jl. Adi Sucipto",
      city: "Solo",
      picName: "Joko",
      picPhone: "0813",
      active: false,
      branchId: "branch-solo",
      status: "PENDING_APPROVAL",
      photoUrl: "https://example.com/photo3.jpg",
      submittedBy: "sales2@indosat.com",
    },
    {
      id: "out-4",
      code: "DRAFT-SMG-303",
      name: "Toko Ditolak",
      type: "TRADITIONAL",
      tier: "TIER_1",
      address: "Jl. Pahlawan",
      city: "Semarang",
      picName: "Agus",
      picPhone: "0814",
      active: false,
      branchId: "branch-smg",
      status: "REJECTED",
    },
  ];

  describe("filterPendingOutlets", () => {
    it("filters only outlets with status PENDING_APPROVAL", () => {
      const pending = filterPendingOutlets(mockOutlets);
      assert.equal(pending.length, 2);
      assert.ok(pending.every((o) => o.status === "PENDING_APPROVAL"));
    });

    it("handles empty or null outlets array gracefully", () => {
      assert.deepEqual(filterPendingOutlets([]), []);
    });
  });

  describe("detectPotentialDuplicateOutlets", () => {
    it("flags duplicate when store in same branch has substantially similar name", () => {
      const duplicates = detectPotentialDuplicateOutlets(
        "Sinar Abadi Cell",
        "branch-smg",
        mockOutlets,
        "out-2"
      );
      assert.equal(duplicates.length, 1);
      assert.equal(duplicates[0]?.id, "out-1");
    });

    it("ignores stores in different branches even with identical names", () => {
      const duplicates = detectPotentialDuplicateOutlets(
        "Sinar Abadi Cell",
        "branch-solo",
        mockOutlets,
        "out-new"
      );
      assert.equal(duplicates.length, 0);
    });

    it("does not match the candidate store against itself", () => {
      const duplicates = detectPotentialDuplicateOutlets(
        "Konter Manahan Jaya",
        "branch-solo",
        mockOutlets,
        "out-3"
      );
      assert.equal(duplicates.length, 0);
    });
  });

  describe("getApprovalStatusBadge", () => {
    it("returns correct badge details for PENDING_APPROVAL", () => {
      const badge = getApprovalStatusBadge("PENDING_APPROVAL");
      assert.equal(badge.label, "Menunggu ACC");
      assert.ok(badge.colorClass.includes("amber") || badge.colorClass.includes("orange"));
    });

    it("returns correct badge details for APPROVED", () => {
      const badge = getApprovalStatusBadge("APPROVED");
      assert.equal(badge.label, "Disetujui");
      assert.ok(badge.colorClass.includes("emerald") || badge.colorClass.includes("green"));
    });

    it("returns correct badge details for REJECTED", () => {
      const badge = getApprovalStatusBadge("REJECTED");
      assert.equal(badge.label, "Ditolak");
      assert.ok(badge.colorClass.includes("rose") || badge.colorClass.includes("red"));
    });
  });
});
