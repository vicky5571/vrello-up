import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getAssignableBranches,
  canAssignBranchToUser,
  formatUserBranchBadges,
  type BranchLookupItem,
} from "./branchAssignmentHelpers";

describe("branchAssignmentHelpers", () => {
  const mockBranches: BranchLookupItem[] = [
    { id: "branch-sby", name: "Surabaya", code: "SUB", region: "EAST" },
    { id: "branch-mlg", name: "Malang", code: "MLG", region: "EAST" },
    { id: "branch-jkt", name: "Jakarta", code: "JKT", region: "WEST" },
    { id: "branch-bdg", name: "Bandung", code: "BDG", region: "WEST" },
  ];

  describe("getAssignableBranches", () => {
    it("returns all branches for admin", () => {
      const res = getAssignableBranches("admin", [], mockBranches);
      assert.equal(res.length, 4);
    });

    it("returns only assigned branches for supervisor", () => {
      const res = getAssignableBranches("supervisor", ["branch-sby", "branch-mlg"], mockBranches);
      assert.equal(res.length, 2);
      assert.deepEqual(
        res.map((b) => b.id),
        ["branch-sby", "branch-mlg"]
      );
    });

    it("returns empty array for supervisor with no assigned branches", () => {
      const res = getAssignableBranches("supervisor", [], mockBranches);
      assert.equal(res.length, 0);
    });

    it("returns empty array for staff or viewer", () => {
      assert.equal(getAssignableBranches("staff", ["branch-sby"], mockBranches).length, 0);
      assert.equal(getAssignableBranches("viewer", ["branch-sby"], mockBranches).length, 0);
    });
  });

  describe("canAssignBranchToUser", () => {
    it("allows admin to assign any branches", () => {
      assert.equal(canAssignBranchToUser("admin", [], ["branch-sby", "branch-jkt"]), true);
      assert.equal(canAssignBranchToUser("admin", [], []), true);
    });

    it("allows supervisor to assign branches strictly within their scope", () => {
      const supervisorBranches = ["branch-sby", "branch-mlg"];
      assert.equal(canAssignBranchToUser("supervisor", supervisorBranches, ["branch-sby"]), true);
      assert.equal(canAssignBranchToUser("supervisor", supervisorBranches, ["branch-sby", "branch-mlg"]), true);
      assert.equal(canAssignBranchToUser("supervisor", supervisorBranches, []), true);
    });

    it("blocks supervisor from assigning branches outside their scope", () => {
      const supervisorBranches = ["branch-sby", "branch-mlg"];
      // One valid, one invalid
      assert.equal(canAssignBranchToUser("supervisor", supervisorBranches, ["branch-sby", "branch-jkt"]), false);
      // Entirely invalid
      assert.equal(canAssignBranchToUser("supervisor", supervisorBranches, ["branch-jkt"]), false);
    });

    it("blocks supervisor with no assigned branches from assigning any branch", () => {
      assert.equal(canAssignBranchToUser("supervisor", [], ["branch-sby"]), false);
    });

    it("blocks staff and viewer from assigning branches", () => {
      assert.equal(canAssignBranchToUser("staff", ["branch-sby"], ["branch-sby"]), false);
      assert.equal(canAssignBranchToUser("viewer", ["branch-sby"], ["branch-sby"]), false);
    });
  });

  describe("formatUserBranchBadges", () => {
    it("returns Semua Cabang (Nasional) for admin regardless of assignedBranchIds", () => {
      assert.deepEqual(formatUserBranchBadges("admin", [], mockBranches), [
        "Semua Cabang (Nasional)",
      ]);
      assert.deepEqual(formatUserBranchBadges("admin", ["branch-sby"], mockBranches), [
        "Semua Cabang (Nasional)",
      ]);
    });

    it("returns Belum Ada Cabang when array is empty or undefined", () => {
      assert.deepEqual(formatUserBranchBadges("staff", [], mockBranches), [
        "Belum Ada Cabang",
      ]);
      assert.deepEqual(formatUserBranchBadges("supervisor", undefined, mockBranches), [
        "Belum Ada Cabang",
      ]);
    });

    it("maps branch IDs to branch names", () => {
      assert.deepEqual(
        formatUserBranchBadges("staff", ["branch-sby", "branch-mlg"], mockBranches),
        ["Surabaya", "Malang"]
      );
    });

    it("falls back to raw ID if branch is not found in lookup", () => {
      assert.deepEqual(
        formatUserBranchBadges("staff", ["branch-unknown"], mockBranches),
        ["branch-unknown"]
      );
    });
  });
});

