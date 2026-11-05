# ADR-0038: Row-Scoped Loading Animation & State Guard for MOU Quick Approve

- **Status:** APPROVED
- **Date:** 2026-11-05
- **Deciders:** Senior Software Engineer, Principal Systems Architect, Product Owner
- **Consulted:** Marcom Lead, Branch Operations Manager
- **Informed:** Core Development Team

## 1. Context & Business Problem

In the **MOUs** view (`src/components/views/MousView/MousView.tsx`), users with the `APPROVE_MOU` permission (such as Branch PICs or Admins) can perform a 1-click status transition on partner agreements via the **Quick Approve** button rendered in the sticky action column (`src/components/views/MousView/mouColumns.tsx`).

Currently, clicking the Approve button calls `onQuickApprove(row.original)`, which triggers `handleStatusTransition(mou, "APPROVED")`. This performs an asynchronous server mutation (`transitionMouStatus`), automated task generation (`runAutomationsForTrigger`), and cache invalidation.

However, there is no loading state tracked for the row being approved:
1. **Lack of Visual Feedback:** The button continues to show a static checkmark icon (`<Check />`) and "Approve" text while the network request is in flight.
2. **Double-Click Vulnerability:** Users on high-latency or unstable mobile networks frequently tap the button multiple times, causing race conditions or duplicate network calls.
3. **Cognitive Ambiguity:** The user cannot determine whether the click registered until the server mutation finishes and the toast appears.

## 2. Options Considered

### Option 1: Row-Scoped Loading Spinner & Disabled State via `approvingMouId` — [CHOSEN]
- **Concept:** Introduce an `approvingMouId: string | null` state in `MousView.tsx`. Pass `approvingMouId` through `MouColumnDeps` to `mouColumns.tsx`. When active, conditionally swap `<Check />` for `<Loader2 className="animate-spin" />` (or `<RefreshCw />`), update label to "Menyetujui...", and set `disabled={isApproving}` with `disabled:opacity-60 cursor-not-allowed`. Clear state in `finally` block of `handleStatusTransition`.
- **Pros:**
  - Scoped visual feedback directly on the active target row.
  - Zero disruption to surrounding table rows or scroll position.
  - Guarantees idempotency on the client by disabling double submission.
  - Idiomatic with existing codebase patterns (`isDeletingId` in Reports).
- **Cons:** Adds 1 optional prop to `MouColumnDeps`.

### Option 2: Optimistic UI Transition with Rollback
- **Concept:** Immediately mutate local cache to `status: "APPROVED"` before server response, rolling back on error.
- **Pros:** Instant 0ms perceived response.
- **Cons:** MOUs involve significant financial compensation commitments (hundreds of millions of IDR) and legal obligations. Optimistically marking an agreement as approved before database confirmation risks operational confusion if server validation fails.

### Option 3: Table-Wide Global Dimmer/Overlay
- **Concept:** Cover the entire table with a semi-transparent backdrop and central spinner.
- **Pros:** Locks all inputs globally.
- **Cons:** Heavy-handed over-engineering (YAGNI) that degrades UX by blocking inspection of other rows during network transit.

## 3. Decision

We adopt **Option 1: Row-Scoped Loading Spinner & Disabled State via `approvingMouId`**.

### Architectural Directives:
1. **State Ownership in `MousView.tsx`:**
   - Define `const [approvingMouId, setApprovingMouId] = useState<string | null>(null);`.
   - Wrap the mutation inside `try ... finally { setApprovingMouId(null); }`.
2. **Column Contract in `mouColumns.tsx`:**
   - Add `approvingMouId?: string | null;` to `MouColumnDeps`.
   - Compute `const isApproving = approvingMouId === row.original.id;`.
   - If `isApproving`:
     - Render `<RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin" />` (matching Lucide icon conventions in the project).
     - Render `<span className="hidden xl:inline">Menyetujui...</span>`.
     - Disable the button: `disabled={isApproving}`.
3. **Double Submission Prevention:**
   - Guard `onClick` with `if (isApproving) return;`.

## 4. Consequences & Invariants

### Positive:
- Immediate tactile feedback upon clicking Quick Approve.
- Total elimination of duplicate approval network calls.
- Smooth visual recovery even if server throws an error (handled in `finally`).

### Verification:
- Unit test in `src/components/views/MousView/mouColumns.test.ts` verifying `approvingMouId` prop, spinner rendering, and disabled state.
- `npm run drift:check`, `npm run build:check`, `npm test` passing with 0 failures.


