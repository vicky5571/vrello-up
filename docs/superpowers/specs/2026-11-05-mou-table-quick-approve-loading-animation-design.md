# Design Specification: Row-Scoped Loading Animation & State Guard for MOU Quick Approve

- **Date:** 2026-11-05
- **Status:** IMPLEMENTED
- **ADR Reference:** `docs/adr/0038-mou-table-quick-approve-loading-animation.md`

## 1. Executive Summary & Goals

This specification details the addition of tactile visual feedback and double-submission protection to the **Quick Approve** button within the MOUs table view (`src/components/views/MousView/MousView.tsx` and `src/components/views/MousView/mouColumns.tsx`).

### Core Objectives:
1. **Immediate Visual Feedback:** Swap the static checkmark icon with a spinning `<RefreshCw />` icon and "Menyetujui..." status text upon click.
2. **Double-Submission Prevention:** Disable the button during network transit (`disabled={approvingMouId === row.original.id}`) with visual disabled styling.
3. **Resilient Recovery:** Clear the loading state cleanly in a `try ... finally` block, ensuring the button unlocks if the mutation fails or succeeds.
4. **Layout Stability:** Maintain the existing `130px` width of the sticky actions column without horizontal overflow or layout shifting.

## 2. Interaction Flow & State Machine

```
┌────────────────────────────────┐
│  State: IDLE                   │
│  Button: [✓ Approve]           │
└───────────────┬────────────────┘
                │ User clicks Approve
                ▼
┌────────────────────────────────┐
│  State: APPROVING              │
│  approvingMouId = mou.id       │
│  Button: [⟳ Menyetujui...]     │
│  disabled: true                │
└───────────────┬────────────────┘
                │
     ┌──────────┴──────────┐
     ▼                     ▼
[Success: 200]       [Error: 500/400]
Toast success        Toast error
Update cache         Re-enable button
approvingMouId=null  approvingMouId=null
```

## 3. Technical Contracts & Implementation

### 3.1 `MouColumnDeps` Interface Update (`mouColumns.tsx`)
```ts
export interface MouColumnDeps {
  navigateToMarcom: (view: ViewMode, search?: string) => void;
  setMarcomFilter: (view: string, query: string) => void;
  setSelectedBranchId: (id: string | null) => void;
  setViewingDocMou: (mou: MarcomMou) => void;
  onQuickApprove?: (mou: MarcomMou) => void;
  approvingMouId?: string | null; // NEW
  onOpenDrawer?: (mou: MarcomMou) => void;
  can: (action: PermissionAction, targetBranchId?: string) => boolean;
}
```

### 3.2 Action Cell Button Markup (`mouColumns.tsx`)
```tsx
const isApproving = approvingMouId === row.original.id;

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

### 3.3 State Management in Coordinator (`MousView.tsx`)
```ts
const [approvingMouId, setApprovingMouId] = useState<string | null>(null);

const handleStatusTransition = useCallback(
  async (mou: MarcomMou, nextStatus: MouStatus) => {
    if (nextStatus === "APPROVED") {
      setApprovingMouId(mou.id);
    }
    try {
      await transitionMouStatus(mou.id, nextStatus);
      // ... cache updates & toasts ...
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      if (nextStatus === "APPROVED") {
        setApprovingMouId(null);
      }
    }
  },
  [transitionMouStatus, updateCachedMou, invalidatePlacements, fetchMous]
);
```

## 4. Acceptance Criteria Checklist

- [ ] `MouColumnDeps` supports `approvingMouId?: string | null`.
- [ ] Clicking Quick Approve immediately sets `approvingMouId` and triggers spinner animation (`RefreshCw` + `animate-spin`).
- [ ] Button text updates to "Menyetujui..." on `xl` viewport during loading.
- [ ] Button is strictly `disabled` while request is in flight.
- [ ] Button state restores gracefully upon completion or failure.
- [ ] Full test suite passes: `npm test` has 0 failures.
- [ ] `npm run drift:check` passes with all specs paired.
- [ ] `npm run build:check` has 0 TypeScript errors.


