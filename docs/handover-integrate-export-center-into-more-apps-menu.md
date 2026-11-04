# Handover: Integrate Export Center into More Apps Menu (ADR-0033)

- **Spec:** `docs/superpowers/specs/2026-11-05-integrate-export-center-into-more-apps-menu-design.md`
- **Plan:** `docs/superpowers/plans/2026-11-05-integrate-export-center-into-more-apps-menu.md`
- **ADR:** `docs/adr/0033-integrate-export-center-into-more-apps-menu.md`
- **Date:** 2026-11-05
- **Status:** READY FOR EXECUTION

## 1. Exact File Manifest & Purpose

1. `src/components/modals/MoreAppsMenu.test.ts`
   - *Purpose:* Automated test verifying that "Export Center" is rendered in Main Tools, binds `setExportCenterOpen`, and preserves `ReportsHeader` bindings.
2. `src/components/modals/MoreAppsMenu.tsx`
   - *Purpose:* Renders the Export Center trigger button inside the Main Tools section and dispatches `setExportCenterOpen(true)`.
3. `src/components/views/ReportsView/ReportsHeader.tsx`
   - *Purpose:* DO NOT TOUCH. Retains existing "Export Center" header button.

## 2. Exact Current Code Snippets

### A. `src/components/modals/MoreAppsMenu.tsx` (Imports & Store Hooks, Lines 5–34)
```tsx
import {
  Search,
  Sparkles,
  Database,
  Download,
  Upload,
  X,
  Grid3X3,
} from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useShallow } from "zustand/react/shallow";
import { toast } from "sonner";

interface MoreAppsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MoreAppsMenu({ isOpen, onClose }: MoreAppsMenuProps) {
  const { spaces, tasks, tags } = useWorkspaceStore(
    useShallow((s) => ({
      spaces: s.spaces,
      tasks: s.tasks,
      tags: s.tags,
    })),
  );
  const openCommandPalette = useWorkspaceStore((s) => s.openCommandPalette);
  const setAiDrawerOpen = useWorkspaceStore((s) => s.setAiDrawerOpen);
  const importBackup = useWorkspaceStore((s) => s.importBackup);
```

### B. `src/components/modals/MoreAppsMenu.tsx` (Main Tools Section, Lines 130–166)
```tsx
            {/* Main Tools */}
            <div className="py-2.5 space-y-1 border-b border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openCommandPalette();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Search className="w-4 h-4 text-[#0073ea]" />
                  <span className="font-semibold">Command Palette</span>
                </div>
                <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                  ⌘K
                </kbd>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  setAiDrawerOpen(true);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  <span className="font-semibold">Brain² AI Assistant</span>
                </div>
                <span className="text-[10px] font-bold text-violet-500 bg-violet-500/10 px-1.5 py-0.5 rounded">
                  AI
                </span>
              </button>
            </div>
```

## 3. Exact Change Instructions

### Change 1: In `src/components/modals/MoreAppsMenu.tsx`
1. **Import `FileSpreadsheet`**:
   Add `FileSpreadsheet` to `lucide-react` imports:
   ```diff
   --- a/src/components/modals/MoreAppsMenu.tsx
   +++ b/src/components/modals/MoreAppsMenu.tsx
   @@ -11,6 +11,7 @@ import {
      Download,
      Upload,
      X,
   +  FileSpreadsheet,
      Grid3X3,
    } from "lucide-react";
   ```

2. **Ingest `setExportCenterOpen` from Zustand store**:
   ```diff
   --- a/src/components/modals/MoreAppsMenu.tsx
   +++ b/src/components/modals/MoreAppsMenu.tsx
   @@ -33,6 +33,7 @@ export function MoreAppsMenu({ isOpen, onClose }: MoreAppsMenuProps) {
      const openCommandPalette = useWorkspaceStore((s) => s.openCommandPalette);
      const setAiDrawerOpen = useWorkspaceStore((s) => s.setAiDrawerOpen);
   +  const setExportCenterOpen = useWorkspaceStore((s) => s.setExportCenterOpen);
      const importBackup = useWorkspaceStore((s) => s.importBackup);
   ```

3. **Render Export Center Action in Main Tools Section**:
   Right after the Brain² AI Assistant button in the Main Tools container:
   ```diff
   --- a/src/components/modals/MoreAppsMenu.tsx
   +++ b/src/components/modals/MoreAppsMenu.tsx
   @@ -163,6 +163,22 @@ export function MoreAppsMenu({ isOpen, onClose }: MoreAppsMenuProps) {
                    AI
                  </span>
                </button>
   +
   +            <button
   +              type="button"
   +              onClick={() => {
   +                onClose();
   +                setExportCenterOpen(true);
   +              }}
   +              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
   +            >
   +              <div className="flex items-center gap-2.5">
   +                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
   +                <span className="font-semibold">Export Center</span>
   +              </div>
   +              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
   +                CSV / PDF
   +              </span>
   +            </button>
              </div>
   ```

### Change 2: In `src/components/modals/MoreAppsMenu.test.ts`
Add a new describe block or test case asserting the presence and wiring of Export Center:
```ts
  it("integrates Export Center into Main Tools section (ADR-0033)", () => {
    assert.ok(
      moreContent.includes("Export Center"),
      "Expected MoreAppsMenu to render 'Export Center'"
    );
    assert.ok(
      moreContent.includes("FileSpreadsheet"),
      "Expected MoreAppsMenu to import FileSpreadsheet"
    );
    assert.ok(
      moreContent.includes("setExportCenterOpen"),
      "Expected MoreAppsMenu to ingest setExportCenterOpen"
    );
    assert.ok(
      moreContent.includes("setExportCenterOpen(true)"),
      "Expected MoreAppsMenu to dispatch setExportCenterOpen(true)"
    );
  });

  it("preserves Export Center in ReportsHeader (ADR-0033 non-goal)", () => {
    const reportsHeaderPath = path.resolve(
      process.cwd(),
      "src/components/views/ReportsView/ReportsHeader.tsx"
    );
    const reportsHeaderContent = fs.readFileSync(reportsHeaderPath, "utf-8");
    assert.ok(
      reportsHeaderContent.includes("onOpenExportCenter"),
      "Expected ReportsHeader to retain onOpenExportCenter prop"
    );
    assert.ok(
      reportsHeaderContent.includes("Export Center"),
      "Expected ReportsHeader to retain Export Center button"
    );
  });
```

## 4. Explicit "Do Not Touch" List with Reasons

| File / Component | Reason |
| :--- | :--- |
| `src/components/views/ReportsView/ReportsHeader.tsx` | **Explicit User Requirement:** "no need to delete it from page Reports". Users on the Reports page rely on the header button to export data in context. |
| `src/components/views/ReportsView/ReportsView.tsx` | Manages Report views and passes `setExportCenterOpen` down to `ReportsHeader`. Must remain untouched. |
| `src/components/layout/ExportCenter.tsx` | The modal itself is completely functional and listens to `isExportCenterOpen`. No modal changes needed. |
| `src/lib/store/slices/createUiSlice.ts` | The Zustand action `setExportCenterOpen` already exists and functions correctly. |

## 5. Numbered Execution Order

1. **Step 1 (TDD Red):** Add the tests in `src/components/modals/MoreAppsMenu.test.ts`. Run:
   ```bash
   node --test --import ./test/register-alias.mjs src/components/modals/MoreAppsMenu.test.ts
   ```
   *Expected result: 1 failing test on MoreAppsMenu Export Center assertions.*

2. **Step 2 (Implementation Green):** Edit `src/components/modals/MoreAppsMenu.tsx`:
   - Import `FileSpreadsheet`.
   - Ingest `setExportCenterOpen`.
   - Render the button in Main Tools section.
   Run test again:
   ```bash
   node --test --import ./test/register-alias.mjs src/components/modals/MoreAppsMenu.test.ts
   ```
   *Expected result: All tests pass (0 failures).*

3. **Step 3 (Invariant & Build Verification):**
   ```bash
   npm run drift:check
   npm run build:check
   npm test
   ```
   *Expected result: All checks pass, 0 errors, 0 drift.*

4. **Step 4 (Documentation & State Updates):**
   - Update `docs/superpowers/specs/2026-11-05-integrate-export-center-into-more-apps-menu-design.md` status to `IMPLEMENTED`.
   - Update `docs/superpowers/plans/2026-11-05-integrate-export-center-into-more-apps-menu.md` checkboxes.
   - Update `CHANGELOG.md` and `docs/SESSION_STATE.md`.

## 6. Acceptance Criteria Checklist

- [ ] "Export Center" item is visible in More Apps Menu under Main Tools.
- [ ] Clicking "Export Center" in More Apps Menu closes the menu and opens the Export Center modal.
- [ ] Reports page retains its existing "Export Center" button without changes.
- [ ] `MoreAppsMenu.tsx` stays under 250 LOC (currently 209 LOC $\rightarrow$ ~225 LOC).
- [ ] Unit tests pass: `src/components/modals/MoreAppsMenu.test.ts`.
- [ ] `npm run drift:check` passes with no drift detected.
- [ ] `npm run build:check` passes with 0 errors.
- [ ] `npm test` passes with 0 failures.



