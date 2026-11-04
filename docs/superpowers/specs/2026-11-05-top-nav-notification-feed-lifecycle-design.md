# Technical Specification: TopNav Notification Feed Lifecycle and Proactive Window Focus Synchronization

- **Status:** IMPLEMENTED (ADR-0032)
- **Date:** 2026-11-05
- **Author:** Senior Software Engineer
- **References:** `docs/adr/0032-top-nav-notification-feed-lifecycle.md`

## 1. Executive Summary

This specification establishes a robust data lifecycle for the TopNav notification feed in `NotificationCenter.tsx`. By introducing the `useNotificationFeed` hook, notifications are fetched immediately upon initial mount, automatically synchronized when returning to the application tab (`window.focus`), and refreshed when opening the activity panel. This resolves the bug where the unread red dot failed to appear until the bell icon was clicked.

## 2. Background & Problem Statement

In `src/components/layout/NotificationCenter.tsx`:
- Unread badge calculation evaluates both local tasks (`taskNotifs`) and server-derived MOUs (`mouNotifs`).
- MOUs require server data from `/api/marcom/mous`.
- Previously, the fetch effect was guarded by `if (!isOpen) return;`.
- Consequently, on initial page load (`isOpen === false`), `/api/marcom/mous` was never called, `mouRows` remained `[]`, and the unread count calculated as 0, rendering no red badge.
- When the user clicked the bell icon, `isOpen` became `true`, triggering the fetch, updating `mouRows`, and causing the red badge to suddenly appear after the fact.

## 3. Architecture & Lifecycle Sequence

```
[Page Load / TopNav Mount]
     │
     ▼
[useNotificationFeed Mount]
     ├─ 1. Fire fetch("/api/marcom/mous") immediately
     │        │
     │        ▼
     │   setMouRows(json.data) ──► deriveMouNotifications() ──► countUnread() > 0
     │                                                               │
     │                                                               ▼
     │                                             [🔴 Red Badge Appears Immediately]
     │
     ├─ 2. window.addEventListener("focus", onFocus)
     │        │
     │        ▼ (User switches tabs and returns to vrello-up)
     │   Re-fetch fresh MOUs in background
     │
     └─ 3. isOpen Changes to true (User clicks bell icon)
              │
              ▼
         Re-fetch fresh MOUs to ensure live state
```

## 4. Hook Interface Contract & Implementation

### 4.1. Hook Signature (`src/lib/productivity/useNotificationFeed.ts`)

```typescript
export interface UseNotificationFeedOptions {
  isOpen?: boolean;
  endpoint?: string;
}

export interface UseNotificationFeedResult {
  mouRows: Array<{
    id: string;
    partnerName: string;
    status: string;
    submissionDate?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    updatedAt?: string | null;
  }>;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useNotificationFeed(
  options: UseNotificationFeedOptions = {}
): UseNotificationFeedResult
```

### 4.2. Implementation Responsibilities
1. **Initial Mount**: Automatically triggers `fetchMous()` on mount.
2. **Focus Listener**: Attaches `window.addEventListener("focus", onFocus)` with appropriate unmount cleanup.
3. **Panel Open Sync**: Triggers `refresh()` when `options.isOpen` transitions to `true`.
4. **Cancellation Safety**: Flags `cancelled` on unmount to prevent setting state on unmounted components.

### 4.3. Refactoring `src/components/layout/NotificationCenter.tsx`
- Replace internal `useState` for `mouRows` and internal `useEffect` for fetching with:
  ```typescript
  const { mouRows } = useNotificationFeed({ isOpen });
  ```
- Eliminate `if (!isOpen) return;` block completely.
- Keep `NotificationCenter.tsx` under coordinator file size limits (< 250 LOC).

## 5. Acceptance Criteria

1. **AC-1 (Immediate Badge on Mount)**:
   - When the page loads and unread MOU notifications exist in the database, the red dot badge appears immediately on the bell icon without requiring the user to click it first.
2. **AC-2 (Tab Re-Focus Sync)**:
   - Returning to the application tab triggers a window focus re-fetch of `/api/marcom/mous`.
3. **AC-3 (Panel Open Freshness)**:
   - Clicking to open the notification panel refreshes the notification list to guarantee live data.
4. **AC-4 (Clean Lifecycle & Invariants)**:
   - No memory leaks or unmounted state updates (proper listener cleanup on unmount).
   - `npm run drift:check` passes with 0 drift.
   - `npm run build:check` compiles with 0 TypeScript errors.
   - `npm test` passes all tests with 0 failures.

## 6. Non-Goals

- Implementing WebSockets, SSE, or push notification infrastructure.
- Modifying backend `/api/marcom/mous` query logic or payload schema.
- Changing `deriveTaskNotifications` or `deriveMouNotifications` logic.

## 7. Verification Checklist

- [x] `node --test --import ./test/register-alias.mjs src/lib/productivity/useNotificationFeed.test.ts` passes.
- [x] `npm run drift:check` passes with no drift detected.
- [x] `npm run build:check` passes with 0 TypeScript errors.
- [x] `npm test` passes with 0 failures across all test suites.



