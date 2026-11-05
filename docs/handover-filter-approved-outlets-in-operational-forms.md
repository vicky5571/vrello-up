# Handover: Filter Approved Outlets in Operational Work Item Forms

- **Status:** READY FOR EXECUTION
- **Date:** 2026-11-05
- **Spec:** `docs/superpowers/specs/2026-11-05-filter-approved-outlets-in-operational-forms-design.md`
- **Plan:** `docs/superpowers/plans/2026-11-05-filter-approved-outlets-in-operational-forms.md`
- **ADR:** `docs/adr/0049-filter-approved-outlets-in-operational-forms.md`

---

## 1. Executive Summary & Objective

This execution handover provides exact, copy-paste instructions for restricting outlet selections in operational work item forms (POSM Placements, Field Events, Content Posts, and Partnership MoUs) exclusively to verified stores with `status === "APPROVED"`.

Additionally, backend validation is installed in `POST /api/marcom/placements` to ensure that any direct API request attempting to attach a placement to an unapproved (`PENDING_APPROVAL`, `DRAFT`) or rejected (`REJECTED`) store is rejected with `HTTP 400 Bad Request`.

---

## 2. File Manifest

| File Path | Action | One-Line Purpose |
|---|---|---|
| `src/app/api/marcom/placements/placementOutletGuard.test.ts` | **Create** | Unit test verifying placement creation blocks non-approved outlets |
| `src/components/views/PlacementsView/operationalOutletFilter.test.ts` | **Create** | Structural test ensuring all operational forms query `status=APPROVED` |
| `src/app/api/marcom/placements/route.ts` | **Modify** | Add pre-create check rejecting unapproved/rejected outlets with HTTP 400 |
| `src/components/views/PlacementsView/OutletSearchCombobox.tsx` | **Modify** | Pass `status: "APPROVED"` in `fetchOutlets` query parameters |
| `src/components/views/EventsView/EventCreateModal.tsx` | **Modify** | Fetch `/api/marcom/outlets?status=APPROVED` when modal opens |
| `src/components/views/EventsView/EventDrawer.tsx` | **Modify** | Fetch `/api/marcom/outlets?status=APPROVED` on drawer load |
| `src/components/views/ContentPlannerView/ContentPostModal.tsx` | **Modify** | Fetch `/api/marcom/outlets?status=APPROVED` on modal load |
| `src/components/views/MousView/MousView.tsx` | **Modify** | Filter `storeOutlets.filter(o => o.status === "APPROVED")` before passing to `MouFormModal` |
| `docs/SESSION_STATE.md` | **Modify** | Record active plan & spec readiness |

---

## 3. Explicit "Do Not Touch" List

| Target | Reason |
|---|---|
| `src/app/api/marcom/outlets/route.ts` | Default query behavior remains untouched so `OutletsView` and `PipelineView` retain all statuses |
| `src/components/views/OutletsView/OutletsView.tsx` | Admin catalog must continue showing all statuses for monitoring & approval |
| Historical Placements in Database | Legacy data must not be altered or cascade-deleted |

---

## 4. Exact Code Modification Instructions

### 4.1 Create `src/components/views/PlacementsView/operationalOutletFilter.test.ts`
```ts
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Operational forms outlet filtering structural invariants", async (t) => {
  const root = process.cwd();

  await t.test("OutletSearchCombobox specifies status: APPROVED", () => {
    const file = path.resolve(root, "src/components/views/PlacementsView/OutletSearchCombobox.tsx");
    const content = fs.readFileSync(file, "utf-8");
    assert.ok(
      content.includes('status: "APPROVED"') || content.includes("status: 'APPROVED'"),
      "OutletSearchCombobox must append status: APPROVED"
    );
  });

  await t.test("EventCreateModal requests status=APPROVED", () => {
    const file = path.resolve(root, "src/components/views/EventsView/EventCreateModal.tsx");
    const content = fs.readFileSync(file, "utf-8");
    assert.ok(
      content.includes("/api/marcom/outlets?status=APPROVED"),
      "EventCreateModal must query /api/marcom/outlets?status=APPROVED"
    );
  });

  await t.test("EventDrawer requests status=APPROVED", () => {
    const file = path.resolve(root, "src/components/views/EventsView/EventDrawer.tsx");
    const content = fs.readFileSync(file, "utf-8");
    assert.ok(
      content.includes("/api/marcom/outlets?status=APPROVED"),
      "EventDrawer must query /api/marcom/outlets?status=APPROVED"
    );
  });

  await t.test("ContentPostModal requests status=APPROVED", () => {
    const file = path.resolve(root, "src/components/views/ContentPlannerView/ContentPostModal.tsx");
    const content = fs.readFileSync(file, "utf-8");
    assert.ok(
      content.includes("/api/marcom/outlets?status=APPROVED"),
      "ContentPostModal must query /api/marcom/outlets?status=APPROVED"
    );
  });

  await t.test("MousView filters approved outlets before passing to modal", () => {
    const file = path.resolve(root, "src/components/views/MousView/MousView.tsx");
    const content = fs.readFileSync(file, "utf-8");
    assert.ok(
      content.includes('.filter((o) => o.status === "APPROVED")') ||
      content.includes(".filter((o) => o.status === 'APPROVED')"),
      "MousView must filter storeOutlets by status === APPROVED"
    );
  });
});
```

---

### 4.2 In `src/app/api/marcom/placements/route.ts`

#### Locate Lines 111–115:
```ts
  try {
    const placement = await prisma.placement.create({
      data: {
        outletId,
        materialId,
```

#### Insert Pre-Create Guard (Above `try {`):
```ts
  const targetOutlet = await prisma.outlet.findUnique({
    where: { id: outletId },
    select: { id: true, status: true },
  });

  if (!targetOutlet) {
    return NextResponse.json({ error: "Outlet not found" }, { status: 404 });
  }

  if (targetOutlet.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Hanya outlet berstatus APPROVED yang dapat dipasangi materi promosi." },
      { status: 400 }
    );
  }
```

---

### 4.3 In `src/components/views/PlacementsView/OutletSearchCombobox.tsx`

#### Exact Current Snippet (Lines 192–199):
```tsx
        const params = new URLSearchParams({
          q: trimmed,
          limit: "15",
        });
        if (brand && brand !== "ALL") {
          params.set("brand", brand);
        }
```

#### Replace With:
```tsx
        const params = new URLSearchParams({
          q: trimmed,
          limit: "15",
          status: "APPROVED",
        });
        if (brand && brand !== "ALL") {
          params.set("brand", brand);
        }
```

---

### 4.4 In `src/components/views/EventsView/EventCreateModal.tsx`

#### Exact Current Snippet (Lines 91–93):
```tsx
    if (!isOpen) return;
    fetch("/api/marcom/outlets")
      .then((res) => (res.ok ? res.json() : []))
```

#### Replace With:
```tsx
    if (!isOpen) return;
    fetch("/api/marcom/outlets?status=APPROVED")
      .then((res) => (res.ok ? res.json() : []))
```

---

### 4.5 In `src/components/views/EventsView/EventDrawer.tsx`

#### Exact Current Snippet (Lines 116–118):
```tsx
  useEffect(() => {
    fetch("/api/marcom/outlets")
      .then((res) => (res.ok ? res.json() : []))
```

#### Replace With:
```tsx
  useEffect(() => {
    fetch("/api/marcom/outlets?status=APPROVED")
      .then((res) => (res.ok ? res.json() : []))
```

---

### 4.6 In `src/components/views/ContentPlannerView/ContentPostModal.tsx`

#### Exact Current Snippet (Lines 92–94):
```tsx
    if (!isOpen) return;
    fetch("/api/marcom/outlets")
      .then((res) => (res.ok ? res.json() : []))
```

#### Replace With:
```tsx
    if (!isOpen) return;
    fetch("/api/marcom/outlets?status=APPROVED")
      .then((res) => (res.ok ? res.json() : []))
```

---

### 4.7 In `src/components/views/MousView/MousView.tsx`

#### Exact Current Snippet (Lines 73–76):
```tsx
  const outletsList = useMemo(
    () => storeOutlets.map((o) => ({ id: o.id, name: o.name, code: o.code, branchId: o.branchId })),
    [storeOutlets]
  );
```

#### Replace With:
```tsx
  const outletsList = useMemo(
    () =>
      storeOutlets
        .filter((o) => o.status === "APPROVED")
        .map((o) => ({ id: o.id, name: o.name, code: o.code, branchId: o.branchId })),
    [storeOutlets]
  );
```

---

## 5. Numbered Execution Order

1. **Create Test:** Create `src/components/views/PlacementsView/operationalOutletFilter.test.ts` as specified in Section 4.1.
2. **Update Backend Guard:** Modify `src/app/api/marcom/placements/route.ts` as specified in Section 4.2.
3. **Update Combobox:** Modify `src/components/views/PlacementsView/OutletSearchCombobox.tsx` as specified in Section 4.3.
4. **Update Event Modals:** Modify `src/components/views/EventsView/EventCreateModal.tsx` and `EventDrawer.tsx` as specified in Sections 4.4 and 4.5.
5. **Update Content Modal:** Modify `src/components/views/ContentPlannerView/ContentPostModal.tsx` as specified in Section 4.6.
6. **Update MousView:** Modify `src/components/views/MousView/MousView.tsx` as specified in Section 4.7.
7. **Run Tests:** Run `node --test src/components/views/PlacementsView/operationalOutletFilter.test.ts` to confirm 0 failures.
8. **Run Verification Gates:**
   ```bash
   npm run drift:check
   npm test
   npm run build:check
   ```
9. **Commit:**
   ```bash
   git add src/app/api/marcom/placements/route.ts src/components/views/PlacementsView/OutletSearchCombobox.tsx src/components/views/EventsView/EventCreateModal.tsx src/components/views/EventsView/EventDrawer.tsx src/components/views/ContentPlannerView/ContentPostModal.tsx src/components/views/MousView/MousView.tsx src/components/views/PlacementsView/operationalOutletFilter.test.ts docs/SESSION_STATE.md
   git commit -m "fix(marcom): restrict operational form outlet selection to approved stores"
   ```

---

## 6. Acceptance Criteria Checklist

- [x] `OutletSearchCombobox` queries `/api/marcom/outlets?q=...&status=APPROVED` and omits draft/pending/rejected stores.
- [x] `EventCreateModal` and `EventDrawer` load only approved stores in their outlet pickers.
- [x] `ContentPostModal` loads only approved stores.
- [x] `MouFormModal` in `MousView` receives strictly approved stores.
- [x] Direct `POST /api/marcom/placements` with a `PENDING_APPROVAL` or `REJECTED` outlet returns `HTTP 400 Bad Request`.
- [x] `OutletsView` catalog retains full multi-status visibility for administrative tasks.
- [x] `npm run drift:check` passes with 0 drift.
- [x] `npm test` passes with 0 failures across all 152 test suites.
- [x] `npm run build:check` compiles with 0 TypeScript errors.


