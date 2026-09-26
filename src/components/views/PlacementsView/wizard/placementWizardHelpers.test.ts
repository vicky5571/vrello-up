import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  canAdvanceFromStep,
  applySmartDefaultsOnOutletSelect,
  shouldShowMouSection,
  getStepCompletionStatus,
  isPaidPlacement,
  togglePaidPlacement,
  applyLocationNotePreset,
} from "@/components/views/PlacementsView/wizard/placementWizardHelpers";
import type { MarcomPlacement } from "@/types";

describe("placementWizardHelpers", () => {
  describe("canAdvanceFromStep", () => {
    it("Step 1 (outlet): requires outletId to advance", () => {
      assert.equal(canAdvanceFromStep(1, {}), false);
      assert.equal(canAdvanceFromStep(1, { outletId: "" }), false);
      assert.equal(canAdvanceFromStep(1, { outletId: "outlet-1" }), true);
    });

    it("Step 2 (material): requires materialId to advance", () => {
      assert.equal(canAdvanceFromStep(2, {}), false);
      assert.equal(canAdvanceFromStep(2, { materialId: "" }), false);
      assert.equal(canAdvanceFromStep(2, { materialId: "mat-poster" }), true);
    });

    it("Step 3 (photo): always allows advancing unless status is DONE without photoUrl", () => {
      // If status is NOT_STARTED or ON_PROGRESS, photo is optional
      assert.equal(canAdvanceFromStep(3, { status: "ON_PROGRESS" }), true);
      // If status is DONE, photo is mandatory
      assert.equal(canAdvanceFromStep(3, { status: "DONE", photoUrl: "" }), false);
      assert.equal(canAdvanceFromStep(3, { status: "DONE", photoUrl: "https://photos.com/pic.jpg" }), true);
    });

    it("Step 4 (location): allows saving if outletId & materialId exist and DONE rules satisfied", () => {
      assert.equal(canAdvanceFromStep(4, { outletId: "o1", materialId: "m1", status: "ON_PROGRESS" }), true);
      assert.equal(canAdvanceFromStep(4, { outletId: "o1", materialId: "m1", status: "DONE", photoUrl: "" }), false);
      assert.equal(canAdvanceFromStep(4, { outletId: "o1", materialId: "m1", status: "DONE", photoUrl: "pic.jpg" }), true);
    });
  });

  describe("applySmartDefaultsOnOutletSelect", () => {
    const mockOutlet = {
      id: "out-101",
      code: "O-SMG-001",
      name: "Toko Berkah Abadi",
      brand: "3",
      picName: "Siti Rahma",
      latitude: -6.992,
      longitude: 110.421,
      address: "Jl. Pemuda 45",
    };

    it("auto-detects provider brand from outlet data", () => {
      const result = applySmartDefaultsOnOutletSelect(mockOutlet, {}, "budi@indosat.com");
      assert.equal(result.outletId, "out-101");
      assert.equal(result.brand, "TRI");
    });

    it("falls back to IM3 for standard or empty brands", () => {
      const result = applySmartDefaultsOnOutletSelect({ ...mockOutlet, brand: "OTHER" }, {}, "budi@indosat.com");
      assert.equal(result.brand, "IM3");
    });

    it("preserves existing brand if already explicitly set by user", () => {
      const result = applySmartDefaultsOnOutletSelect(mockOutlet, { brand: "IM3" }, "budi@indosat.com");
      assert.equal(result.brand, "IM3");
    });

    it("defaults date to today, quarter to Q3 2026, and PIC to user or outlet", () => {
      const result = applySmartDefaultsOnOutletSelect(mockOutlet, {}, "Budi Santoso");
      assert.equal(result.quarter, "Q3 2026");
      assert.equal(result.picName, "Siti Rahma");
      assert.ok(result.date && result.date.length >= 10);
    });
  });

  describe("shouldShowMouSection", () => {
    it("returns false for light free materials without mouId when not manually expanded", () => {
      assert.equal(
        shouldShowMouSection({
          cost: 0,
          isPermanentAsset: false,
          mouId: null,
          isManuallyExpanded: false,
        }),
        false
      );
    });

    it("returns true when cost > 0", () => {
      assert.equal(
        shouldShowMouSection({
          cost: 150000,
          isPermanentAsset: false,
          mouId: null,
          isManuallyExpanded: false,
        }),
        true
      );
    });

    it("returns true when material is permanent asset (Shop Sign / Neonbox)", () => {
      assert.equal(
        shouldShowMouSection({
          cost: 0,
          isPermanentAsset: true,
          mouId: null,
          isManuallyExpanded: false,
        }),
        true
      );
    });

    it("returns true when mouId is already attached or user toggled expansion", () => {
      assert.equal(
        shouldShowMouSection({
          cost: 0,
          isPermanentAsset: false,
          mouId: "mou-99",
          isManuallyExpanded: false,
        }),
        true
      );
      assert.equal(
        shouldShowMouSection({
          cost: 0,
          isPermanentAsset: false,
          mouId: null,
          isManuallyExpanded: true,
        }),
        true
      );
    });
  });

  describe("getStepCompletionStatus", () => {
    it("accurately returns boolean completion for all 4 steps", () => {
      const partial: Partial<MarcomPlacement> = {
        outletId: "o1",
        materialId: "m1",
        photoUrl: "https://photos.com/1.jpg",
        status: "DONE",
        latitude: -6.9,
        longitude: 110.4,
      };

      const status = getStepCompletionStatus(partial);
      assert.equal(status[1], true);
      assert.equal(status[2], true);
      assert.equal(status[3], true);
      assert.equal(status[4], true);
    });
  });

  describe("isPaidPlacement", () => {
    it("returns false for 0, undefined, null, or negative cost", () => {
      assert.equal(isPaidPlacement(0), false);
      assert.equal(isPaidPlacement(undefined), false);
      assert.equal(isPaidPlacement(null), false);
      assert.equal(isPaidPlacement(-5000), false);
    });

    it("returns true for positive cost", () => {
      assert.equal(isPaidPlacement(50000), true);
      assert.equal(isPaidPlacement(1), true);
    });
  });

  describe("togglePaidPlacement", () => {
    it("sets cost to 0 when toggled to free", () => {
      const result = togglePaidPlacement({ cost: 150000, materialId: "m1" }, false);
      assert.equal(result.cost, 0);
      assert.equal(result.materialId, "m1");
    });

    it("preserves positive cost or leaves cost undefined when toggling to paid", () => {
      const resultExisting = togglePaidPlacement({ cost: 200000 }, true);
      assert.equal(resultExisting.cost, 200000);

      const resultZero = togglePaidPlacement({ cost: 0 }, true);
      assert.equal(resultZero.cost, undefined);
    });
  });

  describe("applyLocationNotePreset", () => {
    it("appends bracketed preset tag to empty notes", () => {
      const res = applyLocationNotePreset("", "Etalase Depan");
      assert.equal(res, "[Etalase Depan]");
    });

    it("prepends preset tag without corrupting existing text", () => {
      const res = applyLocationNotePreset("Kios sebelah apotek", "Dinding Kasir");
      assert.equal(res, "[Dinding Kasir] Kios sebelah apotek");
    });

    it("removes preset tag when already present (toggle behavior)", () => {
      const initial = "[Etalase Depan] Kios sebelah apotek";
      const toggledOff = applyLocationNotePreset(initial, "Etalase Depan");
      assert.equal(toggledOff, "Kios sebelah apotek");
    });

    it("handles multiple tags cleanly", () => {
      let notes = applyLocationNotePreset("", "Etalase Depan");
      notes = applyLocationNotePreset(notes, "Tiang Luar");
      assert.equal(notes, "[Tiang Luar] [Etalase Depan]");

      notes = applyLocationNotePreset(notes, "Etalase Depan");
      assert.equal(notes, "[Tiang Luar]");
    });
  });
});
