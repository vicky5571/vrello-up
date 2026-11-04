# Implementation Plan: TopNav Notification Feed Lifecycle and Proactive Window Focus Synchronization

- **Spec:** `docs/superpowers/specs/2026-11-05-top-nav-notification-feed-lifecycle-design.md`
- **ADR:** `docs/adr/0032-top-nav-notification-feed-lifecycle.md`
- **Date:** 2026-11-05
- **Status:** DRAFT

## 1. File Manifest & Blast Radius

| File Path | Action | Estimated LOC | Description / Responsibility |
| :--- | :--- | :--- | :--- |
| `src/lib/productivity/useNotificationFeed.test.ts` | Create | ~80 LOC | Automated unit tests asserting mount fetch, focus refresh, and cleanup |
| `src/lib/productivity/useNotificationFeed.ts` | Create | ~55 LOC | Reusable hook orchestrating notification server fetching and focus lifecycle |
| `src/components/layout/NotificationCenter.tsx` | Modify | -20 LOC (net) | Ingest `useNotificationFeed({ isOpen })`, remove inline fetch and `!isOpen` guard |
| `CHANGELOG.md` | Modify | +10 LOC | Document ADR-0032 notification lifecycle improvement |
| `docs/SESSION_STATE.md` | Modify | +15 LOC | Update session status and active feature |
| `docs/superpowers/plans/2026-11-05-top-nav-notification-feed-lifecycle.md` | Track | - | Phased execution tracking |
| `docs/superpowers/specs/2026-11-05-top-nav-notification-feed-lifecycle-design.md` | Modify | - | Update spec status to IMPLEMENTED upon completion |

## 2. Phased Implementation Tasks

### Phase 1: Test-First Harness (`useNotificationFeed.test.ts`)
- [ ] Task 1.1: Create `src/lib/productivity/useNotificationFeed.test.ts` asserting:
  - Mock global `fetch` returning sample submitted/expiring MOUs.
  - Mount fetch fires immediately upon hook invocation.
  - Calling `refresh()` re-fetches the latest MOU payload.
  - `window.dispatchEvent(new Event("focus"))` triggers background synchronization.
  - When component unmounts, abort/cancelled logic prevents setting state.
- [ ] Task 1.2: Run `node --test --import ./test/register-alias.mjs src/lib/productivity/useNotificationFeed.test.ts` to confirm failing (red) state.

### Phase 2: Hook Implementation (`useNotificationFeed.ts`)
- [ ] Task 2.1: Implement `src/lib/productivity/useNotificationFeed.ts`:
  - Define `UseNotificationFeedOptions` (`isOpen?`, `endpoint?`).
  - Define `UseNotificationFeedResult` (`mouRows`, `isLoading`, `refresh`).
  - Implement mount `useEffect` fetching `/api/marcom/mous`.
  - Implement `window.addEventListener("focus", onFocus)` with SSR safety (`typeof window !== "undefined"`).
  - Implement `refresh` callback and re-trigger when `isOpen` becomes `true`.
- [ ] Task 2.2: Run `node --test --import ./test/register-alias.mjs src/lib/productivity/useNotificationFeed.test.ts` to confirm passing (green) state.

### Phase 3: Integration into `NotificationCenter.tsx`
- [ ] Task 3.1: In `src/components/layout/NotificationCenter.tsx`:
  - Import `useNotificationFeed` from `@/lib/productivity/useNotificationFeed`.
  - Remove local `const [mouRows, setMouRows] = useState(...)`.
  - Remove old `useEffect` with `if (!isOpen) return;` fetch block.
  - Ingest `const { mouRows } = useNotificationFeed({ isOpen });`.
- [ ] Task 3.2: Verify `NotificationCenter.tsx` component renders smoothly and keeps line count low.

### Phase 4: Full Verification Gates & Session Handoff
- [ ] Task 4.1: Run `npm run drift:check` (must pass 100%, 59/59 spec-plan pairs, <=250 LOC coordinator limit).
- [ ] Task 4.2: Run `npm run build:check` (must compile with 0 TypeScript errors).
- [ ] Task 4.3: Run `npm test` (must pass with 0 failures across all suites).
- [ ] Task 4.4: Update `docs/superpowers/specs/2026-11-05-top-nav-notification-feed-lifecycle-design.md` to IMPLEMENTED.
- [ ] Task 4.5: Update `CHANGELOG.md` and `docs/SESSION_STATE.md`.
- [ ] Task 4.6: Create execution-ready handover artifact `docs/handover-top-nav-notification-feed-lifecycle.md`.

## 3. Verification Checklist

- [ ] `npm run drift:check` passes with no drift detected.
- [ ] `npm run build:check` passes with 0 TypeScript errors.
- [ ] `npm test` passes with 0 failures.



