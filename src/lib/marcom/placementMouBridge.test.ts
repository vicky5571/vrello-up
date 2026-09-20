import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's strip-types runner requires an explicit TypeScript extension.
import { isPermanentMaterial, findAvailableMousForOutlet, validatePlacementMouRequirement, calculateMouPlacementRealization, type MouSummaryInfo, type PlacementSummaryInfo, type OutletSearchCriteria } from "./placementMouBridge.ts";

test("isPermanentMaterial identifies permanent and temporary materials across 3 tiers", () => {
  // --- Tier 1: Explicit DB governance flag (requiresMou) takes absolute precedence ---
  assert.equal(isPermanentMaterial({ requiresMou: true, name: "Any Normal Flyer" }), true);
  assert.equal(isPermanentMaterial({ requiresMou: true, type: "POSTER", name: "Special Rented Poster" }), true);
  assert.equal(isPermanentMaterial({ requiresMou: false, name: "Neon Box Giant" }), false);
  assert.equal(isPermanentMaterial({ requiresMou: false, type: "BRANDING_SIGNBOARD", name: "Signboard Free Gift" }), false);

  // --- Tier 2: Domain Taxonomy enum mapping (Prisma MaterialType) ---
  // Real Prisma enum values without requiresMou flag
  assert.equal(isPermanentMaterial({ type: "BRANDING_SIGNBOARD", name: "Custom LED Acrylic Display" }), true);
  assert.equal(isPermanentMaterial({ type: "SHOPBLIND", name: "Tenda Kanopi Merah" }), true);
  // Temporary Prisma enum values immune to deceptive keywords in name
  assert.equal(isPermanentMaterial({ type: "POSTER", name: "Signboard Promo Launching" }), false);
  assert.equal(isPermanentMaterial({ type: "BANNER", name: "Sewa Tempat Standee" }), false);

  // Legacy tokens
  assert.equal(isPermanentMaterial("PERMANENT"), true);
  assert.equal(isPermanentMaterial("TEMPORARY"), false);
  assert.equal(isPermanentMaterial({ type: "PERMANENT", name: "Totem Gate Custom" }), true);
  assert.equal(isPermanentMaterial({ type: "TEMPORARY", name: "Spanduk Sosialisasi Sewa Gedung" }), false);
  assert.equal(isPermanentMaterial({ type: "TEMPORARY", name: "Stiker Permanen Anti Air" }), false);
  assert.equal(isPermanentMaterial({ type: "TEMPORARY", name: "Mini Neon Box Standee" }), false);

  // --- Tier 3: Keyword fallback on material name for unclassified items or strings ---
  assert.equal(isPermanentMaterial({ type: "OTHER_MATERIALS", name: "Totem Pylon 4 Meter" }), true);
  assert.equal(isPermanentMaterial({ type: "OTHER_MATERIALS", name: "Tent Card Akrilik Meja" }), false);
  assert.equal(isPermanentMaterial({ name: "Signboard Toko" }), true);
  assert.equal(isPermanentMaterial({ name: "Brosur Lipat" }), false);

  // String keyword fallback tests
  assert.equal(isPermanentMaterial("Signboard Toko 3x1"), true);
  assert.equal(isPermanentMaterial("Shopblind Outdoor"), true);
  assert.equal(isPermanentMaterial("Neon Box Utama"), true);
  assert.equal(isPermanentMaterial("Pylon Pole Sign"), true);
  assert.equal(isPermanentMaterial("Sewa Branding Facade"), true);

  assert.equal(isPermanentMaterial("Poster A3"), false);
  assert.equal(isPermanentMaterial("Flyer Brosur"), false);
  assert.equal(isPermanentMaterial("Sticker Etalase"), false);
  assert.equal(isPermanentMaterial("Tent Card Meja"), false);
  assert.equal(isPermanentMaterial(null), false);
  assert.equal(isPermanentMaterial(undefined), false);
});

test("findAvailableMousForOutlet matches by direct outletId and falls back to outletName", () => {
  const sampleMous: MouSummaryInfo[] = [
    { id: "mou-1", outletId: "outlet-101", outletName: "Toko Berkah", status: "APPROVED", partnerName: "H. Berkah" },
    { id: "mou-2", outletId: "outlet-102", outletName: "Cellular Jaya", status: "DRAFT", partnerName: "Budi Jaya" },
    { id: "mou-3", outletId: null, outletName: "Toko Makmur", status: "APPROVED", partnerName: "Pak Makmur" },
  ];

  const foundById = findAvailableMousForOutlet(sampleMous, "outlet-101", "Different Name");
  assert.equal(foundById.length, 1);
  assert.equal(foundById[0].id, "mou-1");

  // Supports OutletSearchCriteria object
  const foundByCriteria = findAvailableMousForOutlet(sampleMous, { id: "outlet-101", name: "Different Name" });
  assert.equal(foundByCriteria.length, 1);
  assert.equal(foundByCriteria[0].id, "mou-1");

  const foundByName = findAvailableMousForOutlet(sampleMous, "unknown-outlet", " toko makmur ");
  assert.equal(foundByName.length, 1);
  assert.equal(foundByName[0].id, "mou-3");

  assert.deepEqual(findAvailableMousForOutlet([], "outlet-999"), []);
  assert.deepEqual(findAvailableMousForOutlet(sampleMous, "outlet-999", "Unknown"), []);
});

test("findAvailableMousForOutlet enforces anti-name-collision and branch scoping", () => {
  const mous: MouSummaryInfo[] = [
    // mou-1 belongs strictly to outlet-smg-1 ("Berkah Cell" in Semarang)
    {
      id: "mou-1",
      outletId: "outlet-smg-1",
      outletName: "Berkah Cell",
      branchId: "branch-smg",
      status: "APPROVED",
    },
    // mou-legacy has no outletId, but named "Berkah Cell" in Semarang
    {
      id: "mou-legacy",
      outletId: null,
      outletName: "Berkah Cell",
      branchId: "branch-smg",
      status: "APPROVED",
    },
  ];

  // Outlet 2 has the same name "Berkah Cell", but ID is outlet-slo-2 in Solo
  const outletSolo: OutletSearchCriteria = {
    id: "outlet-slo-2",
    name: "Berkah Cell",
    branchId: "branch-slo",
  };

  const matchesForSolo = findAvailableMousForOutlet(mous, outletSolo);
  // mou-1 must NOT match because it belongs to outlet-smg-1 (Anti-collision guard)
  // mou-legacy must NOT match because branch-slo !== branch-smg (Branch scoping)
  assert.equal(matchesForSolo.length, 0);

  // Unlinked legacy outlet in Solo without ID
  const legacySoloWithoutId: OutletSearchCriteria = {
    name: "Berkah Cell",
    branchId: "branch-slo",
  };
  const matchesForLegacySolo = findAvailableMousForOutlet(mous, legacySoloWithoutId);
  assert.equal(matchesForLegacySolo.length, 0);

  // Unlinked legacy outlet in Semarang with matching branch
  const legacySemarang: OutletSearchCriteria = {
    name: "Berkah Cell",
    branchId: "branch-smg",
  };
  const matchesForSemarang = findAvailableMousForOutlet(mous, legacySemarang);
  assert.equal(matchesForSemarang.length, 1);
  assert.equal(matchesForSemarang[0].id, "mou-legacy");
});

test("validatePlacementMouRequirement handles temporary materials correctly", () => {
  const generalNoMou = validatePlacementMouRequirement({
    materialName: "Poster Dinding A2",
    selectedMou: null,
  });
  assert.equal(generalNoMou.severity, "none");
  assert.equal(generalNoMou.requiresMou, false);

  const generalWithMou = validatePlacementMouRequirement({
    materialName: "Poster Dinding A2",
    selectedMou: { id: "mou-1", status: "APPROVED", partnerName: "Mitra A" },
  });
  assert.equal(generalWithMou.severity, "success");
  assert.equal(generalWithMou.requiresMou, false);

  // Temporary type with deceptive keyword name must not require MoU
  // Explicit requiresMou: false takes precedence even if name contains permanent keyword
  const explicitFalseWithKeyword = validatePlacementMouRequirement({
    materialName: "Neon Box Depan Toko",
    requiresMou: false,
    selectedMou: null,
  });
  assert.equal(explicitFalseWithKeyword.severity, "none");
  assert.equal(explicitFalseWithKeyword.requiresMou, false);

  // Explicit requiresMou: true takes precedence even for standard poster
  const explicitTruePoster = validatePlacementMouRequirement({
    materialName: "Poster Dinding A2",
    requiresMou: true,
    selectedMou: null,
    outletMousCount: 0,
  });
  assert.equal(explicitTruePoster.severity, "warning");
  assert.equal(explicitTruePoster.requiresMou, true);
});

test("validatePlacementMouRequirement flags permanent materials lacking approved MoUs", () => {
  const permWithAvailableMous = validatePlacementMouRequirement({
    materialName: "Signboard Utama 4x1.2m",
    selectedMou: null,
    outletMousCount: 1,
  });
  assert.equal(permWithAvailableMous.severity, "warning");
  assert.equal(permWithAvailableMous.requiresMou, true);
  assert.ok(permWithAvailableMous.message.includes("Tersedia MoU"));

  const permWithoutAnyMous = validatePlacementMouRequirement({
    materialName: "Neon Box Depan Toko",
    selectedMou: null,
    outletMousCount: 0,
  });
  assert.equal(permWithoutAnyMous.severity, "warning");
  assert.equal(permWithoutAnyMous.requiresMou, true);
  assert.ok(permWithoutAnyMous.message.includes("Belum ada MoU"));

  const permWithApprovedMou = validatePlacementMouRequirement({
    materialName: "Shopblind Depan",
    selectedMou: { id: "mou-10", status: "APPROVED", partnerName: "Toko Sinar" },
  });
  assert.equal(permWithApprovedMou.severity, "success");
  assert.equal(permWithApprovedMou.requiresMou, true);
  assert.ok(permWithApprovedMou.message.includes("MoU Terverifikasi (APPROVED)"));

  const permWithDraftMou = validatePlacementMouRequirement({
    materialName: "Shopblind Depan",
    selectedMou: { id: "mou-10", status: "SUBMITTED", partnerName: "Toko Sinar" },
  });
  assert.equal(permWithDraftMou.severity, "warning");
  assert.equal(permWithDraftMou.requiresMou, true);
  assert.ok(permWithDraftMou.message.includes("SUBMITTED"));
});

test("calculateMouPlacementRealization aggregates linked placements and costs", () => {
  const targetMou = { id: "mou-target", compensationValue: 5000000 };
  const placements: PlacementSummaryInfo[] = [
    { id: "p1", mouId: "mou-target", status: "DONE", cost: 1500000 },
    { id: "p2", mouId: "mou-target", status: "ON_PROGRESS", cost: 1000000 },
    { id: "p3", mouId: "mou-target", status: "NOT_STARTED", cost: 500000 },
    { id: "p4", mouId: "other-mou", status: "DONE", cost: 2000000 },
  ];

  const result = calculateMouPlacementRealization(targetMou, placements);
  assert.equal(result.totalLinked, 3);
  assert.equal(result.doneCount, 1);
  assert.equal(result.inProgressCount, 1);
  assert.equal(result.notStartedCount, 1);
  assert.equal(result.totalCost, 3000000);
  assert.equal(result.compensationValue, 5000000);
  assert.equal(result.budgetUtilizationRate, 60);
  assert.equal(result.isOverBudget, false);

  // Over-budget realization test
  const overBudgetMou = { id: "mou-over", compensationValue: 2000000 };
  const overPlacements: PlacementSummaryInfo[] = [
    { id: "p1", mouId: "mou-over", status: "DONE", cost: 1500000 },
    { id: "p2", mouId: "mou-over", status: "DONE", cost: 1000000 },
  ];
  const overResult = calculateMouPlacementRealization(overBudgetMou, overPlacements);
  assert.equal(overResult.totalLinked, 2);
  assert.equal(overResult.totalCost, 2500000);
  assert.equal(overResult.budgetUtilizationRate, 125);
  assert.equal(overResult.isOverBudget, true);

  // Unlinked placements must NOT trigger false over-budget
  const unlinkedMou = { id: "mou-new", compensationValue: 10000000 };
  const unlinkedPlacements: PlacementSummaryInfo[] = [
    { id: "p1", mouId: null, status: "DONE", cost: 15000000 },
    { id: "p2", mouId: undefined, status: "DONE", cost: 20000000 },
    { id: "p3", mouId: "different-mou", status: "DONE", cost: 5000000 },
  ];
  const unlinkedResult = calculateMouPlacementRealization(unlinkedMou, unlinkedPlacements);
  assert.equal(unlinkedResult.totalLinked, 0);
  assert.equal(unlinkedResult.totalCost, 0);
  assert.equal(unlinkedResult.budgetUtilizationRate, 0);
  assert.equal(unlinkedResult.isOverBudget, false);

  const emptyResult = calculateMouPlacementRealization({ id: "mou-empty", compensationValue: 0 }, []);
  assert.equal(emptyResult.totalLinked, 0);
  assert.equal(emptyResult.totalCost, 0);
  assert.equal(emptyResult.budgetUtilizationRate, 0);
  assert.equal(emptyResult.isOverBudget, false);
});
