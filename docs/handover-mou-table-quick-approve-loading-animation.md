# Handover: Row-Scoped Loading Animation & State Guard for MOU Quick Approve

- **Date:** 2026-11-05
- **Status:** READY FOR EXECUTION
- **Spec:** `docs/superpowers/specs/2026-11-05-mou-table-quick-approve-loading-animation-design.md`
- **Plan:** `docs/superpowers/plans/2026-11-05-mou-table-quick-approve-loading-animation.md`
- **ADR:** `docs/adr/0038-mou-table-quick-approve-loading-animation.md`

## 1. File Paths & Purpose

| File Path | One-Line Purpose |
|---|---|
| `src/components/views/MousView/mouColumns.test.ts` | Unit tests asserting column contract, spinner markup, label, and disabled state |
| `src/components/views/MousView/mouColumns.tsx` | Column definition file where Quick Approve button markup and icon are rendered |
| `src/components/views/MousView/MousView.tsx` | View coordinator tracking `approvingMouId` state and handling status transition mutations |

## 2. Explicit "Do Not Touch" List

- **`src/components/views/shared/MarcomTableShell.tsx`**: Do not modify table styling or sticky logic. This was already fixed in ADR-0030 followup for solid hover backgrounds.
- **`src/components/mous/MouDetailDrawer.tsx`**: Do not modify drawer status transitions or action buttons. This change is strictly table row-scoped.
- **`src/components/views/MousView/mouApi.ts`**: Do not alter `transitionMouStatus` signatures or backend payload. The API layer is already asynchronous and stable.
- **Multi-Tenant Scaffolding / `workspaceId`**: Invariant. Do not introduce workspace scoping or tenant parameters.

## 3. Current Code Snippets & Exact Change Instructions

### 3.1 `src/components/views/MousView/mouColumns.tsx`

#### Exact Current Snippet (Lines 1-8):
```tsx
import React from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { MarcomMou, MouStatus } from "@/types";
import { FileText, Download, ChevronRight, Check, AlertTriangle, Clock } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ViewMode } from "@/types";
import { PermissionAction } from "@/lib/auth/permissions";
```

#### Change Instruction (Import):
Import `RefreshCw` from `lucide-react`.

#### Exact Current Snippet (Lines 19-27):
```tsx
export interface MouColumnDeps {
  navigateToMarcom: (view: ViewMode, search?: string) => void;
  setMarcomFilter: (view: string, query: string) => void;
  setSelectedBranchId: (id: string | null) => void;
  setViewingDocMou: (mou: MarcomMou) => void;
  onQuickApprove?: (mou: MarcomMou) => void;
  onOpenDrawer?: (mou: MarcomMou) => void;
  can: (action: PermissionAction, targetBranchId?: string) => boolean;
}
```

#### Change Instruction (Interface):
Add `approvingMouId?: string | null;` to `MouColumnDeps`.

#### Exact Current Snippet (Lines 403-414):
```tsx
            {canApprove && onQuickApprove && (
              <button
                type="button"
                onClick={() => onQuickApprove(row.original)}
                aria-label={`Quick Approve MOU ${row.original.partnerName}`}
                className="inline-flex items-center gap-1 px-2 py-1 min-h-[30px] rounded-md text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-2xs transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                title="Quick Approve MOU (PIC Cabang / Admin)"
              >
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden xl:inline">Approve</span>
              </button>
            )}
```

#### Change Instruction (Cell Markup):
Replace with:
```tsx
            {canApprove && onQuickApprove && (
              <button
                type="button"
                onClick={() => !isApproving && onQuickApprove(row.original)}
                disabled={isApproving}
                aria-label={`Quick Approve MOU ${row.original.partnerName}`}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-1 min-h-[30px] rounded-md text-[11px] font-bold text-white shadow-2xs transition-colors shrink-0 whitespace-nowrap",
                  isApproving
                    ? "bg-emerald-600/70 cursor-not-allowed opacity-80"
                    : "bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                )}
                title={isApproving ? "Sedang memproses persetujuan..." : "Quick Approve MOU (PIC Cabang / Admin)"}
              >
                {isApproving ? (
                  <RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="hidden xl:inline">
                  {isApproving ? "Menyetujui..." : "Approve"}
                </span>
              </button>
            )}
```

---

### 3.2 `src/components/views/MousView/MousView.tsx`

#### Exact Current Snippet (Lines 141-163):
```tsx
  const handleStatusTransition = useCallback(
    async (mou: MarcomMou, nextStatus: MouStatus) => {
      try {
        await transitionMouStatus(mou.id, nextStatus);
        toast.success(`MOU status updated to ${nextStatus}`);
        updateCachedMou({ id: mou.id, status: nextStatus });
        invalidatePlacements();
        if (nextStatus === "APPROVED") {
          const triggered = await useWorkspaceStore.getState().runAutomationsForTrigger("mou:approved", {
            mouId: mou.id,
            partnerName: mou.partnerName,
            branchId: mou.branchId,
          });
          if (triggered > 0) toast.info(`Automations triggered: created setup task for ${mou.partnerName}`);
        }
        fetchMous(true);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update status");
      }
    },
    [updateCachedMou, invalidatePlacements, fetchMous],
  );
```

#### Change Instruction:
Add state:
```tsx
  const [approvingMouId, setApprovingMouId] = useState<string | null>(null);
```
Wrap in `try ... finally`:
```tsx
  const handleStatusTransition = useCallback(
    async (mou: MarcomMou, nextStatus: MouStatus) => {
      if (nextStatus === "APPROVED") {
        setApprovingMouId(mou.id);
      }
      try {
        await transitionMouStatus(mou.id, nextStatus);
        toast.success(`MOU status updated to ${nextStatus}`);
        updateCachedMou({ id: mou.id, status: nextStatus });
        invalidatePlacements();
        if (nextStatus === "APPROVED") {
          const triggered = await useWorkspaceStore.getState().runAutomationsForTrigger("mou:approved", {
            mouId: mou.id,
            partnerName: mou.partnerName,
            branchId: mou.branchId,
          });
          if (triggered > 0) toast.info(`Automations triggered: created setup task for ${mou.partnerName}`);
        }
        fetchMous(true);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update status");
      } finally {
        setApprovingMouId(null);
      }
    },
    [updateCachedMou, invalidatePlacements, fetchMous],
  );
```

And in `columns` definition:
```tsx
  const columns = useMemo(
    () =>
      buildMouColumns({
        navigateToMarcom,
        setMarcomFilter,
        setSelectedBranchId,
        setViewingDocMou,
        onQuickApprove: (mou) => handleStatusTransition(mou, "APPROVED"),
        approvingMouId,
        onOpenDrawer: (mou) => setSelectedMou(mou),
        can,
      }),
    [navigateToMarcom, setMarcomFilter, setSelectedBranchId, setViewingDocMou, handleStatusTransition, approvingMouId, can],
  );
```

## 4. Numbered Execution Order

1. **Step 1:** Add unit test in `src/components/views/MousView/mouColumns.test.ts` testing the `approvingMouId` contract. Run test with `node --test src/components/views/MousView/mouColumns.test.ts` to verify failure (Red).
2. **Step 2:** Edit `src/components/views/MousView/mouColumns.tsx` to add `RefreshCw` icon import, `approvingMouId` to `MouColumnDeps`, and conditional spinner + disabled state.
3. **Step 3:** Edit `src/components/views/MousView/MousView.tsx` to add `approvingMouId` state, pass to `buildMouColumns`, and wrap `handleStatusTransition` in `try ... finally`.
4. **Step 4:** Run `node --test src/components/views/MousView/mouColumns.test.ts` to verify pass (Green).
5. **Step 5:** Run full verification suite (`npm run drift:check`, `npm run build:check`, `npm test`).
6. **Step 6:** Update `docs/SESSION_STATE.md`, `CHANGELOG.md`, and git commit.

## 5. Acceptance Criteria Checklist

- [ ] `MouColumnDeps` exports `approvingMouId?: string | null`
- [ ] Tombol Quick Approve menampilkan spinner `<RefreshCw className="... animate-spin" />` saat `approvingMouId === row.original.id`
- [ ] Tombol Quick Approve menampilkan teks "Menyetujui..." pada viewport `xl` saat loading
- [ ] Tombol Quick Approve ter-disable (`disabled={isApproving}`) dan mencegah double submit
- [ ] Tombol Quick Approve kembali normal jika server merespons sukses maupun melempar error (`try ... finally`)
- [ ] Seluruh invariant sistem lulus (`npm run drift:check`, `npm run build:check`, `npm test`)



