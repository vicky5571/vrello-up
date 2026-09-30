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
  POSM_MATERIALS,
  DEFAULT_FALLBACK_MATERIALS,
  resolvePosmChipMaterial,
  getActivePosmChipLabel,
} from "@/components/views/PlacementsView/wizard/placementWizardHelpers";
import type { MarcomPlacement, Brand } from "@/types";


describe("placementWizardHelpers", () => {
  describe("canAdvanceFromStep", () => {
    it("Step 1 (outlet): requires outletId to advance", () => {
      assert.equal(canAdvanceFromStep(1, {}), false);
      assert.equal(canAdvanceFromStep(1, { outletId: "" }), false);
      assert.equal(canAdvanceFromStep(1, { outletId: "   " }), false);
      assert.equal(canAdvanceFromStep(1, { outletId: "outlet-1" }), true);
    });

    it("Step 1 (outlet): fresh new placement state cannot advance until user chooses store", () => {
      const freshNewPlacement: Partial<MarcomPlacement> = {
        outletId: "",
        status: "NOT_STARTED",
        brand: "IM3",
        date: new Date().toISOString().slice(0, 10),
      };
      assert.equal(canAdvanceFromStep(1, freshNewPlacement), false);

      const chosenPlacement = { ...freshNewPlacement, outletId: "out-chosen-001" };
      assert.equal(canAdvanceFromStep(1, chosenPlacement), true);
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

    it("preserves existing brand when outlet has no brand specified", () => {
      const result = applySmartDefaultsOnOutletSelect({ ...mockOutlet, brand: undefined }, { brand: "IM3" }, "budi@indosat.com");
      assert.equal(result.brand, "IM3");
    });

    it("updates placement brand to match outlet's explicit brand when selected", () => {
      const triOutlet = {
        id: "out-tri-01",
        name: "Tri Store Express",
        brand: "TRI",
      };

      const initialIM3Placement = {
        brand: "IM3" as Brand,
      };

      const result = applySmartDefaultsOnOutletSelect(triOutlet, initialIM3Placement);
      assert.equal(result.brand, "TRI");
      assert.equal(result.outlet?.brand, "TRI");
    });

    it("preserves latitude, longitude, and address in placement.outlet when provided", () => {
      const draftOutlet = {
        id: "draft-999",
        code: "DRAFT-001",
        name: "Toko Baru Draft",
        brand: "IM3",
        address: "Jl. Kaliurang KM 5",
        latitude: -7.7554,
        longitude: 110.3781,
      };

      const result = applySmartDefaultsOnOutletSelect(draftOutlet, {});
      assert.equal(result.outlet?.id, "draft-999");
      assert.equal(result.outlet?.address, "Jl. Kaliurang KM 5");
      assert.equal(result.outlet?.latitude, -7.7554);
      assert.equal(result.outlet?.longitude, 110.3781);
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

    it("marks Step 3 incomplete if photoUrl is empty or not provided", () => {
      const partial: Partial<MarcomPlacement> = {
        outletId: "o1",
        status: "NOT_STARTED",
      };
      const status = getStepCompletionStatus(partial);
      assert.equal(status[3], false);
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

  describe("Step 2 POSM materials and chips", () => {
    it("DEFAULT_FALLBACK_MATERIALS contains all 7 standard POSM materials", () => {
      assert.equal(DEFAULT_FALLBACK_MATERIALS.length, 7);
      const ids = DEFAULT_FALLBACK_MATERIALS.map((m) => m.id);
      assert.ok(ids.includes("material-poster"));
      assert.ok(ids.includes("material-shopblind"));
      assert.ok(ids.includes("material-sticker"));
      assert.ok(ids.includes("material-bottom"));
      assert.ok(ids.includes("material-signboard"));
      assert.ok(ids.includes("material-banner"));
      assert.ok(ids.includes("material-other"));
    });

    it("every POSM chip resolves to a valid material in catalogue via resolvePosmChipMaterial", () => {
      for (const chip of POSM_MATERIALS) {
        const match = resolvePosmChipMaterial(chip, DEFAULT_FALLBACK_MATERIALS);
        assert.ok(
          match,
          `POSM chip "${chip.label}" should resolve to a material in catalogue`
        );
      }
    });

    it("Stiker Etalase and Bottom Etalase resolve to distinct materials", () => {
      const stickerChip = POSM_MATERIALS.find((c) => c.label === "Stiker Etalase");
      const bottomChip = POSM_MATERIALS.find((c) => c.label === "Bottom Etalase");
      assert.ok(stickerChip);
      assert.ok(bottomChip);

      const stickerMatch = resolvePosmChipMaterial(stickerChip, DEFAULT_FALLBACK_MATERIALS);
      const bottomMatch = resolvePosmChipMaterial(bottomChip, DEFAULT_FALLBACK_MATERIALS);

      assert.equal(stickerMatch?.id, "material-sticker");
      assert.equal(bottomMatch?.id, "material-bottom");
      assert.notEqual(stickerMatch?.id, bottomMatch?.id);
    });

    it("getActivePosmChipLabel correctly identifies the active pill for each material", () => {
      assert.equal(getActivePosmChipLabel("material-poster", DEFAULT_FALLBACK_MATERIALS), "Poster");
      assert.equal(getActivePosmChipLabel("material-shopblind", DEFAULT_FALLBACK_MATERIALS), "Shopblind");
      assert.equal(getActivePosmChipLabel("material-sticker", DEFAULT_FALLBACK_MATERIALS), "Stiker Etalase");
      assert.equal(getActivePosmChipLabel("material-bottom", DEFAULT_FALLBACK_MATERIALS), "Bottom Etalase");
      assert.equal(getActivePosmChipLabel("material-signboard", DEFAULT_FALLBACK_MATERIALS), "Shop Sign / Neonbox");
      assert.equal(getActivePosmChipLabel("material-banner", DEFAULT_FALLBACK_MATERIALS), "Banner");
      assert.equal(getActivePosmChipLabel("material-other", DEFAULT_FALLBACK_MATERIALS), "Other");
    });

    it("handles empty or unmatched materials gracefully", () => {
      assert.equal(getActivePosmChipLabel(undefined, DEFAULT_FALLBACK_MATERIALS), null);
      assert.equal(getActivePosmChipLabel("", DEFAULT_FALLBACK_MATERIALS), null);
      assert.equal(getActivePosmChipLabel("unknown-id", DEFAULT_FALLBACK_MATERIALS), null);
      assert.equal(getActivePosmChipLabel("material-poster", []), null);

      const posterChip = POSM_MATERIALS[0];
      assert.equal(resolvePosmChipMaterial(posterChip, []), null);
    });
  });
});

