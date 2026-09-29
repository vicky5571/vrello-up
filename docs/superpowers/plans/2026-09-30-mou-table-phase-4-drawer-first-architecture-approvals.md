# MOU Table Phase 4: Drawer-First Architecture & Approval Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace heavy accordion row expansion with a modern, high-performance `MouDetailDrawer`, bind clean drawer-first row selection, surface inline approval actions for authorized PICs, and ensure WCAG 44px touch targets.

**Architecture:** Create `src/components/mous/MouDetailDrawer.tsx` (mirroring `BranchDetailDrawer.tsx`) with `overscroll-contain`, accessible keyboard navigation, and full partnership lifecycle actions. Bind `onRowClick={(mou) => setSelectedMouId(mou.id)}` to `MarcomTableShell` to eliminate the "click target minefield". Surface a 1-click inline "Approve" button on `SUBMITTED` rows for users with `APPROVE_MOU` permission.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Tailwind CSS v4, Lucide React, Framer Motion / UI transitions, Node test runner (`node:test`).

**Spec:** [`docs/audit-mous-table-ui-ux.md`](file:///Users/mac/Web%20Development/vrello-up/docs/audit-mous-table-ui-ux.md)

## Global Constraints

- Single Source of Truth: Core domain entities (`MarcomMou`, `MouStatus`, `Branch`, `Outlet`) MUST be imported from `@/types`.
- State Machine Integrity: Transitions must strictly respect `canTransitionMou` from `src/lib/marcom/mouMachine.ts`.
- Permissions & Tenancy: Respect `useMarcomPermissions` and `userBranchIds` tenancy checks.
- Dual-Persistence: Cache updates (`updateCachedMou`, `invalidatePlacements`) must be preserved.

---

## File Structure

```text
src/components/mous/
└── MouDetailDrawer.tsx        # New: Slide-over drawer with overscroll-contain, approval actions, & POSM realization
src/components/views/MousView/
├── mouColumns.tsx             # Modified: Inline quick-approve action & clean action column
└── MousView.tsx               # Modified: Drawer state (selectedMouId), onRowClick binding
```

---

### Task 1: Create `MouDetailDrawer.tsx` Component

**Files:**
- Create: `src/components/mous/MouDetailDrawer.tsx`

**Interfaces:**
- Consumes:
  - `mou: MarcomMou | null`
  - `isOpen: boolean`
  - `onClose: () => void`
  - `onStatusTransition: (mou: MarcomMou, nextStatus: MouStatus) => Promise<void>`
  - `onEdit: (mou: MarcomMou) => void`
  - `onRenew: (mou: MarcomMou) => void`
  - `onViewDoc: (mou: MarcomMou) => void`
- Produces: Accessible slide-over drawer with `overscroll-contain`.

- [ ] **Step 1: Implement `MouDetailDrawer.tsx`**

```tsx
// src/components/mous/MouDetailDrawer.tsx
"use client";

import { useEffect, useRef } from "react";
import {
  X,
  FileText,
  Building2,
  Store,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Download,
  Eye,
  Layers,
  Edit2,
  Plus,
  ShieldAlert,
  Coins,
  Phone,
  User,
} from "lucide-react";
import { cn, formatIDR } from "@/lib/utils";
import { calculateMouPlacementRealization } from "@/lib/marcom/placementMouBridge";
import { parseMouDocumentSource } from "@/components/views/MousView/mouDocumentHelpers";
import { calculateMouValidity, formatMouDateRange } from "@/components/views/MousView/mouDateHelpers";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import type { MarcomMou, MouStatus, ViewMode } from "@/types";

export interface MouDetailDrawerProps {
  mou: MarcomMou | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusTransition: (mou: MarcomMou, nextStatus: MouStatus) => Promise<void>;
  onEdit: (mou: MarcomMou) => void;
  onRenew: (mou: MarcomMou) => void;
  onViewDoc: (mou: MarcomMou) => void;
  navigateToMarcom: (view: ViewMode, search?: string) => void;
  setSelectedBranchId: (id: string | null) => void;
}

export function MouDetailDrawer({
  mou,
  isOpen,
  onClose,
  onStatusTransition,
  onEdit,
  onRenew,
  onViewDoc,
  navigateToMarcom,
  setSelectedBranchId,
}: MouDetailDrawerProps) {
  const { can } = useMarcomPermissions();
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mou) return null;

  const validity = calculateMouValidity(mou.startDate, mou.endDate);
  const periodStr = formatMouDateRange(mou.startDate, mou.endDate);
  const parsedDoc = parseMouDocumentSource(mou.docPath, mou.partnerName);
  const realization = calculateMouPlacementRealization(mou, mou.placements || []);
  const comp = mou.compensationValue || 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-2xs animate-in fade-in duration-150">
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={`MOU Details: ${mou.partnerName}`}
        className="w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200 overscroll-contain"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-950/60 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center shrink-0 border border-fuchsia-200 dark:border-fuchsia-800/60">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                {mou.partnerName}
              </h2>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                <span className="font-semibold text-fuchsia-600 dark:text-fuchsia-400">{mou.mouType}</span>
                <span>•</span>
                <span>{mou.branch?.name || "Branch"}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 overscroll-contain">
          {/* Expired / Urgency Warning Banner */}
          {validity.isExpired && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-rose-700 dark:text-rose-300">
                  Perjanjian Kadaluwarsa ({validity.badgeText})
                </div>
                <div className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
                  Masa berlaku kemitraan telah lewat. Disarankan perpanjangan dokumen atau penyelesaian administrasi.
                </div>
              </div>
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <div className="text-[11px] font-semibold text-slate-500 mb-1">Status Kemitraan</div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{mou.status}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
              <div className="text-[11px] font-semibold text-slate-500 mb-1">Plafon Kompensasi</div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatIDR(comp)}</div>
            </div>
          </div>

          {/* Validity Period */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Periode Perjanjian</h3>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{periodStr}</span>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-700">
                {validity.badgeText}
              </span>
            </div>
          </div>

          {/* Associated Entities */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Entitas Terkait</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="w-4 h-4 text-cyan-500 shrink-0" />
                  <span className="text-xs font-semibold truncate">{mou.branch?.name || "Cabang"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBranchId(mou.branchId)}
                  className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-semibold cursor-pointer shrink-0"
                >
                  Detail →
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Store className="w-4 h-4 text-orange-500 shrink-0" />
                  <span className="text-xs font-semibold truncate">{mou.outletName || "Outlet Standalone"}</span>
                </div>
                {mou.outletName && (
                  <button
                    type="button"
                    onClick={() => navigateToMarcom("outlets", mou.outletName)}
                    className="text-xs text-orange-600 dark:text-orange-400 hover:underline font-semibold cursor-pointer shrink-0"
                  >
                    Buka →
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Document Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Berkas Perjanjian</h3>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-5 h-5 text-fuchsia-600 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">{parsedDoc.label}</div>
                  <div className="text-[11px] text-slate-400 truncate">{parsedDoc.filename}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {parsedDoc.type !== "EMPTY" && (
                  <>
                    <button
                      type="button"
                      onClick={() => onViewDoc(mou)}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-fuchsia-50 dark:bg-fuchsia-950/60 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-800 hover:bg-fuchsia-100 cursor-pointer flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                    <a
                      href={parsedDoc.downloadUrl}
                      download={parsedDoc.filename}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Realisasi Fisik & Anggaran */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Realisasi Titik Fisik</h3>
              <button
                type="button"
                onClick={() => navigateToMarcom("placements", mou.partnerName)}
                className="text-xs text-lime-600 hover:underline font-semibold cursor-pointer"
              >
                Lihat di Placements →
              </button>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {realization.totalLinked} Titik Terpasang ({realization.doneCount} Selesai)
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {realization.budgetUtilizationRate}% Serapan
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-lime-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, realization.budgetUtilizationRate)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Total Biaya: {formatIDR(realization.totalCost)}</span>
                <span>Plafon: {formatIDR(comp)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {can("CREATE_MOU", mou.branchId) && (
              <button
                type="button"
                onClick={() => onRenew(mou)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-fuchsia-700 dark:text-fuchsia-300 bg-fuchsia-50 dark:bg-fuchsia-950/40 border border-fuchsia-200 dark:border-fuchsia-800 hover:bg-fuchsia-100 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Perpanjang (Renew)</span>
              </button>
            )}
            {can("CREATE_MOU", mou.branchId) && (
              <button
                type="button"
                onClick={() => onEdit(mou)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {mou.status === "SUBMITTED" && can("APPROVE_MOU", mou.branchId) && (
              <button
                type="button"
                onClick={() => onStatusTransition(mou, "APPROVED")}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer shadow-xs"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Approve MOU</span>
              </button>
            )}
            {mou.status === "APPROVED" && can("CREATE_MOU", mou.branchId) && (
              <button
                type="button"
                onClick={() => onStatusTransition(mou, "DONE")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 cursor-pointer"
              >
                <span>Tandai Selesai (DONE)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit `MouDetailDrawer.tsx`**

```bash
git add src/components/mous/MouDetailDrawer.tsx
git commit -m "feat(mou): create MouDetailDrawer with overscroll containment and approval workflow"
```

---

### Task 2: Bind `onRowClick` & Quick Approve Action

**Files:**
- Modify: `src/components/views/MousView/mouColumns.tsx`
- Modify: `src/components/views/MousView/MousView.tsx`

**Interfaces:**
- Consumes: `MouDetailDrawer`, `onRowClick` on `MarcomTableShell`.

- [ ] **Step 1: Add quick-approve icon in `mouColumns.tsx` for `SUBMITTED` agreements**

For authorized PICs / Admins viewing `SUBMITTED` rows, surface an actionable green checkmark button in the table so approvals can be done directly from the table row without opening modals or expanding accordions.

- [ ] **Step 2: Bind `selectedMouId` and `onRowClick` in `MousView.tsx`**

1. Replace `renderExpanded` with `onRowClick={(mou) => setSelectedMou(mou)}`.
2. Render `<MouDetailDrawer mou={selectedMou} isOpen={Boolean(selectedMou)} onClose={() => setSelectedMou(null)} ... />`.

- [ ] **Step 3: Run complete verification**

Run:
```bash
npm run typecheck
npm test
```

- [ ] **Step 4: Commit**

```bash
git add src/components/views/MousView/mouColumns.tsx src/components/views/MousView/MousView.tsx
git commit -m "feat(mou): bind drawer-first row click and quick approval actions"
```
