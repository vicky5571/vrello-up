# Implementation Plan: Global Rail Pending Users Notification Badge

**Date:** 2026-11-02  
**Author:** Critical Senior Software Engineer (Pair Programmer)  
**Status:** Approved  
**Related Spec:** `docs/superpowers/specs/2026-11-02-global-rail-pending-users-badge-design.md`  
**ADR:** `docs/adr/0012-global-rail-pending-users-badge.md`  

---

## 1. Overview & File Manifest

| File | Est. LOC | Purpose |
|------|----------|---------|
| `src/lib/marcom/pendingUsersHelpers.ts` | ~40 | Pure helpers for formatting badge count and fetching API count safely |
| `src/lib/marcom/pendingUsersHelpers.test.ts` | ~70 | Unit tests for formatting logic and API fetch resilience |
| `src/lib/store/slices/types.ts` | +4 | Add `pendingUsersCount` and `setPendingUsersCount` to `DataSlice` |
| `src/lib/store/slices/createDataSlice.ts` | +6 | Implement `pendingUsersCount` state and `setPendingUsersCount` action |
| `src/lib/marcom/usePendingUsers.ts` | ~45 | React hook managing admin polling, focus revalidation, and store synchronization |
| `src/components/views/UsersView/UsersView.tsx` | +3 | Sync store `pendingUsersCount` on tab fetch and approval/rejection actions |
| `src/components/layout/GlobalRail.tsx` | ~230 (≤250) | Wire hook and render badge over Users icon |

---

## 2. Phased Tasks

### Phase 1: Pure Logic & Unit Tests (TDD)
- [ ] Create `src/lib/marcom/pendingUsersHelpers.ts`:
  - `formatPendingBadgeCount(count: number): string | null`
  - `fetchPendingUsersCountApi(fetcher): Promise<number>`
- [ ] Create `src/lib/marcom/pendingUsersHelpers.test.ts`:
  - Test zero and negative counts return null
  - Test 1-99 return exact string
  - Test >99 return "99+"
  - Test successful API fetch extracts `data.total`
  - Test API error or non-200 returns 0 safely without throwing
- [ ] Run test: `node --test --import ./test/register-alias.mjs src/lib/marcom/pendingUsersHelpers.test.ts`

### Phase 2: Zustand Store Integration
- [ ] In `src/lib/store/slices/types.ts`:
  - Add `pendingUsersCount: number;`
  - Add `setPendingUsersCount: (count: number) => void;`
- [ ] In `src/lib/store/slices/createDataSlice.ts`:
  - Add initial state `pendingUsersCount: 0`
  - Add action `setPendingUsersCount: (count) => set({ pendingUsersCount: count })`

### Phase 3: Client Hook & View Sync
- [ ] Create `src/lib/marcom/usePendingUsers.ts`:
  - Reads `pendingUsersCount` and `setPendingUsersCount` from `useWorkspaceStore`
  - When `isAdmin === true`: fetches on mount, binds `window.addEventListener("focus", ...)`, sets 60s interval
  - Cleans up interval and listeners on unmount
- [ ] Update `src/components/views/UsersView/UsersView.tsx`:
  - In `fetchUsers`: call `setPendingUsersCount(pData.total || 0)`

### Phase 4: GlobalRail UI Rendering
- [ ] In `src/components/layout/GlobalRail.tsx`:
  - Call `usePendingUsers({ isAdmin })`
  - Add `badge: pendingUsersCount` to Users item in `NAV_ITEMS`
  - Render red badge with `formatPendingBadgeCount(item.badge)` on the Icon container
  - Ensure `GlobalRail.tsx` LOC remains strictly $\le 250$ LOC

### Phase 5: Verification & Verification Gates
- [ ] Run `npm run drift:check`
- [ ] Run `npm run test:smoke`
- [ ] Run `npm test`
- [ ] Run `npm run build:check`
- [ ] Run `npm run build`
- [ ] Update `docs/SESSION_STATE.md`
