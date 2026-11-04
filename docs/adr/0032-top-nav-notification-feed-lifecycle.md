# ADR-0032: TopNav Notification Feed Lifecycle and Proactive Window Focus Synchronization

- **Status:** ACCEPTED
- **Date:** 2026-11-05
- **Deciders:** Senior Software Engineer, Lead Developer

## Context & Business Problem

The application provides a notification bell in the top navigation (`src/components/layout/NotificationCenter.tsx`) that aggregates task notifications (assignments, status updates, overdue alerts) and MOU notifications (approvals awaiting action and expiring MOUs).

However, users observed that the red dot / unread badge does NOT appear when the page first loads, appearing only after they click on the bell icon.

Upon investigation, line 126 of `NotificationCenter.tsx` enforced an early return guard:
```typescript
useEffect(() => {
  if (!isOpen) return; // Suppressed initial fetch
  fetch("/api/marcom/mous")
  ...
}, [isOpen]);
```

Because MOU notifications require server data from `/api/marcom/mous`, suppressing this fetch when `isOpen === false` caused `mouRows` to remain an empty array `[]` on initial page mount. As a result, the unread count was 0 and the badge remained invisible until the user opened the dropdown.

We need an architectural lifecycle pattern for notifications that provides immediate badge accuracy on page mount and keeps notification states fresh without polling or over-engineering.

## Options Considered

### Option 1: Direct Inline Fetch on Mount & Open in `NotificationCenter.tsx`
- Remove `if (!isOpen) return;` so `fetch("/api/marcom/mous")` fires on mount and re-fetches when `isOpen` becomes true.
- *Trade-offs:*
  - **Pros:** Minimal LOC diff, 0 new files.
  - **Cons:** If a user keeps the tab open in the background, new MOU approvals submitted by teammates will not update the badge until the user reloads the page or opens the panel.

### Option 2: Dedicated Hook with Window Focus Listener (`useNotificationFeed.ts`) (Chosen)
- Extract notification fetching, caching, and refresh logic into a modular hook `src/lib/productivity/useNotificationFeed.ts` mirroring the proven pattern of `src/lib/marcom/usePendingUsers.ts`.
- The hook fetches on initial mount, refreshes on `window.addEventListener("focus")`, and refreshes when the dropdown opens (`isOpen === true`).
- *Trade-offs:*
  - **Pros:**
    - Immediate unread badge accuracy on page load (eliminates the bug).
    - Proactive background synchronization: whenever the user switches back to the browser tab (`focus`), fresh MOU alerts update the badge immediately without a full page reload.
    - Clean separation of concerns: `NotificationCenter.tsx` remains a pure presentation component under the coordinator LOC limit (< 250 LOC).
  - **Cons:** Introduces one small utility hook file (`useNotificationFeed.ts`).

### Option 3: Global Polling / Zustand Synchronization
- Add periodic background interval polling (e.g., every 30 seconds) into a Zustand notification slice.
- *Trade-offs:*
  - **Pros:** Real-time push-like experience.
  - **Cons:** High battery/server overhead from constant polling on inactive tabs; introduces unnecessary global store complexity.

## Decision

We choose **Option 2: Dedicated Hook with Window Focus Listener (`useNotificationFeed.ts`)**.

We will extract notification data lifecycle management into `src/lib/productivity/useNotificationFeed.ts`. The hook will:
1. Fetch `/api/marcom/mous` immediately on mount.
2. Listen to `window.focus` events to proactively re-fetch fresh notifications when returning to the tab.
3. Expose a `refresh()` method that `NotificationCenter.tsx` can trigger when the panel opens.

## Consequences

### Positive Consequences
1. **Immediate Badge Visibility**: The red dot / unread badge renders accurately as soon as the user opens the application, solving the user-reported issue.
2. **Tab Re-focus Freshness**: When operational staff tab away to work in WhatsApp or email and return to vrello-up, new pending approvals reflect immediately on the bell icon without requiring an explicit browser refresh.
3. **Decoupled Architecture**: Keeps API data orchestration out of `NotificationCenter.tsx`, keeping `NotificationCenter.tsx` concise and easily testable.
4. **Architectural Consistency**: Adheres to the established convention used by `usePendingUsers.ts` for top-level operational badges.

### Negative Consequences / Accepted Debt
1. Adds `src/lib/productivity/useNotificationFeed.ts` (~50 LOC) and an accompanying unit test file.



