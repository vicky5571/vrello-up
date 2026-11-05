# Handover: Relocate Export Center from TopNav to More Apps Menu

- **Status:** READY FOR EXECUTION
- **Date:** 2026-11-05
- **Spec:** `docs/superpowers/specs/2026-11-05-relocate-export-center-to-more-apps-menu-design.md`
- **Plan:** `docs/superpowers/plans/2026-11-05-relocate-export-center-to-more-apps-menu.md`
- **ADR:** `docs/adr/0047-relocate-export-center-to-more-apps-menu.md`

---

## 1. Executive Summary & Objective

This execution-ready handover guide documents the instructions to remove the redundant Export Center button from the top navigation bar (`src/components/layout/TopNav.tsx`) while keeping its global access point inside the Global Rail's "More" popover (`src/components/modals/MoreAppsMenu.tsx`).

---

## 2. File Manifest

| File Path | Action | One-Line Purpose |
|---|---|---|
| `src/components/layout/TopNav.tsx` | **Modify** | Remove Export Center button, `Download` icon import, and `setExportCenterOpen` selector |
| `src/components/modals/MoreAppsMenu.test.ts` | **Modify** | Add automated regression assertions verifying TopNav does NOT render the button |
| `docs/SESSION_STATE.md` | **Modify** | Record active plan & spec readiness |

---

## 3. Explicit "Do Not Touch" List

| Target | Reason |
|---|---|
| `src/components/modals/MoreAppsMenu.tsx` | Export Center is already correctly integrated into the Main Tools section under ADR-0033 |
| `src/components/layout/ExportCenter.tsx` | Core modal and CSV/PDF export generation logic remain untouched |
| `src/components/views/ReportsView/ReportsHeader.tsx` | Contextual export button on Reports page must remain intact |
| `src/components/views/MousView/MousHeader.tsx` | Contextual export button on Mous page must remain intact |
| `src/components/views/PlacementsView/PlacementsHeader.tsx` | Contextual export button on Placements page must remain intact |
| Database / Prisma Schema | Zero database schema migrations required |

---

## 4. Exact Code Modification Instructions

### 4.1 In `src/components/layout/TopNav.tsx`

#### Change 1: Remove `Download` from Lucide icon imports (Line 14)
**Current Snippet:**
```tsx
import { Search, Download } from "lucide-react";
```

**Replace With:**
```tsx
import { Search } from "lucide-react";
```

#### Change 2: Remove `setExportCenterOpen` selector (Line 24)
**Current Snippet:**
```tsx
  const openCommandPalette = useWorkspaceStore((s) => s.openCommandPalette);
  const setExportCenterOpen = useWorkspaceStore((s) => s.setExportCenterOpen);

  const me = users.find((u) => u.id === currentUserId) ?? users[0];
```

**Replace With:**
```tsx
  const openCommandPalette = useWorkspaceStore((s) => s.openCommandPalette);

  const me = users.find((u) => u.id === currentUserId) ?? users[0];
```

#### Change 3: Remove the Export Center button from Right Actions (Lines 98–109)
**Current Snippet:**
```tsx
        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setExportCenterOpen(true)}
            title="Export Center"
            className="p-2 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <NotificationCenter />
          <ThemeToggle />
```

**Replace With:**
```tsx
        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <NotificationCenter />
          <ThemeToggle />
```

---

### 4.2 In `src/components/modals/MoreAppsMenu.test.ts`

#### Add Test Case: Verify TopNav does not render Export Center (at end of describe block)
**Add:**
```ts
  it("verifies TopNav does not render redundant Export Center button (ADR-0047)", () => {
    const topNavPath = path.resolve(
      process.cwd(),
      "src/components/layout/TopNav.tsx"
    );
    const topNavContent = fs.readFileSync(topNavPath, "utf-8");
    assert.strictEqual(
      topNavContent.includes('title="Export Center"'),
      false,
      "Expected TopNav not to render button with title='Export Center'"
    );
    assert.strictEqual(
      topNavContent.includes("setExportCenterOpen"),
      false,
      "Expected TopNav not to select setExportCenterOpen from store"
    );
  });
```

---

## 5. Numbered Execution Order

1. **Update TopNav:** Modify `src/components/layout/TopNav.tsx` as specified in Section 4.1.
2. **Update Unit Tests:** Modify `src/components/modals/MoreAppsMenu.test.ts` as specified in Section 4.2.
3. **Verify Unit Tests:** Run `node --test src/components/modals/MoreAppsMenu.test.ts` to confirm tests pass.
4. **Execute Verification Suite:**
   ```bash
   npm run drift:check
   npm run build:check
   npm test
   ```
5. **Commit:**
   ```bash
   git add src/components/layout/TopNav.tsx src/components/modals/MoreAppsMenu.test.ts docs/SESSION_STATE.md
   git commit -m "style(layout): remove redundant export center button from top nav"
   ```

---

## 6. Acceptance Criteria Checklist

- [x] `TopNav.tsx` does not render a button with `title="Export Center"`.
- [x] `TopNav.tsx` does not import `Download` from `lucide-react`.
- [x] `TopNav.tsx` does not call `useWorkspaceStore((s) => s.setExportCenterOpen)`.
- [x] `MoreAppsMenu.tsx` retains the Export Center button in Main Tools with `FileSpreadsheet` icon.
- [x] `ReportsHeader.tsx`, `MousHeader.tsx`, and `PlacementsHeader.tsx` retain their contextual export triggers.
- [x] `npm run drift:check` passes with 0 drift (74/74 paired specs/plans).
- [x] `npm run build:check` compiles with 0 TypeScript errors.
- [x] `npm test` passes with 0 failures across all 152 test suites.


