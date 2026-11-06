# Handover: Mobile Bottom Navigation — Replace Home with Pipeline & Status

- **Status:** READY FOR EXECUTION
- **Date:** 2026-11-07
- **Spec:** `docs/superpowers/specs/2026-11-07-mobile-bottom-nav-pipeline-design.md`
- **Plan:** `docs/superpowers/plans/2026-11-07-mobile-bottom-nav-pipeline.md`
- **ADR:** `docs/adr/0066-mobile-bottom-nav-replace-home-with-pipeline.md`

## 1. Target Files & Purpose

1. `src/components/layout/MobileBottomNav.tsx` — Mobile bottom navigation bar; replaces `Home` tab with `Pipeline`.
2. `src/components/layout/MobileBottomNav.test.ts` — Unit test suite; asserts canonical 5-tab composition (`Pipeline`, `Outlets`, `Placements`, `Events`, `Menu`).

---

## 2. Exact Current Code Snippets

### File: `src/components/layout/MobileBottomNav.tsx` (Lines 6–13)
```tsx
import {
  Home,
  Store,
  MapPin,
  CalendarDays,
  Menu,
} from "lucide-react";
```

### File: `src/components/layout/MobileBottomNav.tsx` (Lines 29–37)
```tsx
const BOTTOM_TABS: BottomTabItem[] = [
  {
    id: "home",
    label: "Home",
    icon: Home,
    activeColor: "text-blue-500 dark:text-blue-400",
    isActive: (view, isSidebarOpen) => !isSidebarOpen && view === "home",
    onClick: ({ setActiveView }) => setActiveView("home"),
  },
```

### File: `src/components/layout/MobileBottomNav.test.ts` (Lines 56–63)
```ts
  it("verifies MobileBottomNav contains 5 canonical tabs and no rigid blue border box", () => {
    const bottomNavContent = fs.readFileSync(bottomNavPath, "utf-8");
    assert.ok(bottomNavContent.includes("Home"), "Must include Home tab");
    assert.ok(bottomNavContent.includes("Outlets"), "Must include Outlets tab");
    assert.ok(bottomNavContent.includes("Placements"), "Must include Placements tab");
    assert.ok(bottomNavContent.includes("Events"), "Must include Events tab");
    assert.ok(bottomNavContent.includes("Menu"), "Must include Menu tab");
```

---

## 3. Exact Change Instructions

### Step 1: `src/components/layout/MobileBottomNav.test.ts`
- **Replace:**
  ```ts
    assert.ok(bottomNavContent.includes("Home"), "Must include Home tab");
  ```
- **With:**
  ```ts
    assert.ok(bottomNavContent.includes("Pipeline"), "Must include Pipeline tab");
  ```

### Step 2: `src/components/layout/MobileBottomNav.tsx`
- **Replace:**
  ```tsx
  import {
    Home,
    Store,
    MapPin,
    CalendarDays,
    Menu,
  } from "lucide-react";
  ```
- **With:**
  ```tsx
  import {
    Layers,
    Store,
    MapPin,
    CalendarDays,
    Menu,
  } from "lucide-react";
  ```

- **Replace:**
  ```tsx
    {
      id: "home",
      label: "Home",
      icon: Home,
      activeColor: "text-blue-500 dark:text-blue-400",
      isActive: (view, isSidebarOpen) => !isSidebarOpen && view === "home",
      onClick: ({ setActiveView }) => setActiveView("home"),
    },
  ```
- **With:**
  ```tsx
    {
      id: "pipeline",
      label: "Pipeline",
      icon: Layers,
      activeColor: "text-indigo-500 dark:text-indigo-400",
      isActive: (view, isSidebarOpen) => !isSidebarOpen && view === "pipeline",
      onClick: ({ setActiveView, setAppMode }) => {
        setAppMode("marcom");
        setActiveView("pipeline");
      },
    },
  ```

---

## 4. Explicit "Do Not Touch" List

- **`src/components/layout/GlobalRail.tsx`:** Do NOT touch desktop rail navigation. Desktop `Home` button must remain 100% untouched.
- **`src/components/layout/Sidebar.tsx`:** Do NOT add new buttons to the drawer navigation.
- **`src/components/layout/MobileBottomNav.tsx` (Tabs 2–5):** Do NOT modify `outlets`, `placements`, `events`, or `menu` tabs.
- **`src/components/views/PipelineView/PipelineView.tsx`:** Do NOT touch internal page views or API integrations.

---

## 5. Numbered Execution Order

1. **Update Unit Test:** Edit `src/components/layout/MobileBottomNav.test.ts` to assert `"Pipeline"`.
2. **Verify RED State:** Run `npx tsx --test src/components/layout/MobileBottomNav.test.ts` (expect failure on missing "Pipeline").
3. **Implement Feature:** Edit `src/components/layout/MobileBottomNav.tsx` with `Layers` import and `pipeline` tab definition.
4. **Verify GREEN State:** Run `npx tsx --test src/components/layout/MobileBottomNav.test.ts` (expect 100% pass).
5. **Run Drift Check:** `npm run drift:check` (verify 93/93 spec-plan pairing).
6. **Run Build Check:** `npm run build:check` (TypeScript `tsc --noEmit`).
7. **Run Smoke Test:** `npm run test:smoke` (150/150 smoke tests).
8. **Run Full Test Suite:** `npm test` (verify 0 failures).
9. **Update Documentation:** Update `CHANGELOG.md` and `docs/SESSION_STATE.md`.
10. **Git Commit:** Commit changes following the standard commit message format.

---

## 6. Acceptance Criteria Checklist

- [ ] Mobile bottom navigation shows **Pipeline** in Slot 1 with `Layers` icon.
- [ ] Active tab state properly highlights Pipeline in indigo when `activeView === "pipeline"`.
- [ ] Tapping Pipeline switches `appMode` to `"marcom"` and navigates to the Pipeline view.
- [ ] Desktop layout (`GlobalRail.tsx`) remains 100% byte-for-byte unaffected.
- [ ] `MobileBottomNav.tsx` remains <= 150 LOC.
- [ ] All 4 verification gates pass with 0 errors/failures.



