# Handover: TopNav Notification Feed Lifecycle (ADR-0032)

- **Spec:** `docs/superpowers/specs/2026-11-05-top-nav-notification-feed-lifecycle-design.md`
- **Plan:** `docs/superpowers/plans/2026-11-05-top-nav-notification-feed-lifecycle.md`
- **ADR:** `docs/adr/0032-top-nav-notification-feed-lifecycle.md`
- **Date:** 2026-11-05
- **Status:** READY FOR EXECUTION

## 1. Exact File Manifest & Purpose

1. `src/lib/productivity/useNotificationFeed.test.ts`
   - *Purpose:* Unit test suite verifying initial mount fetch, window focus event re-fetching, open-state sync, and unmount cleanup.
2. `src/lib/productivity/useNotificationFeed.ts`
   - *Purpose:* Custom React hook providing automated notification fetching on mount, focus listener, and panel refresh.
3. `src/components/layout/NotificationCenter.tsx`
   - *Purpose:* Top navigation notification bell and popover component; delegates data fetching to `useNotificationFeed`.

## 2. Exact Code Snippets & Change Instructions

### 2.1. File: `src/lib/productivity/useNotificationFeed.ts` (NEW FILE)

Create new file `src/lib/productivity/useNotificationFeed.ts` with exact contents:
```typescript
"use client";

import { useEffect, useState, useCallback } from "react";
import type { MouLike } from "./notifications";

export interface UseNotificationFeedOptions {
  isOpen?: boolean;
  endpoint?: string;
}

export interface UseNotificationFeedResult {
  mouRows: MouLike[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useNotificationFeed({
  isOpen = false,
  endpoint = "/api/marcom/mous",
}: UseNotificationFeedOptions = {}): UseNotificationFeedResult {
  const [mouRows, setMouRows] = useState<MouLike[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMous = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(endpoint);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          setMouRows(json.data);
        }
      }
    } catch {
      // Gracefully retain existing notification state on network error
    } finally {
      setIsLoading(false);
    }
  }, [endpoint]);

  // 1. Initial mount fetch + re-fetch when isOpen transitions to true
  useEffect(() => {
    let cancelled = false;
    fetchMous();
    return () => {
      cancelled = true;
    };
  }, [fetchMous, isOpen]);

  // 2. Proactive sync on window focus (when user returns to the tab)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onFocus = () => {
      fetchMous();
    };

    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchMous]);

  return {
    mouRows,
    isLoading,
    refresh: fetchMous,
  };
}
```

### 2.2. File: `src/components/layout/NotificationCenter.tsx` (MODIFICATION)

**A. Import Modification (Line 21):**
```typescript
// Replace:
import {
  countUnread,
  deriveMouNotifications,
  deriveTaskNotifications,
  type AppNotification,
  type NotificationKind,
} from "@/lib/productivity/notifications";

// With:
import {
  countUnread,
  deriveMouNotifications,
  deriveTaskNotifications,
  type AppNotification,
  type NotificationKind,
} from "@/lib/productivity/notifications";
import { useNotificationFeed } from "@/lib/productivity/useNotificationFeed";
```

**B. State Replacement (Lines 96-98):**
```typescript
// Delete:
  const [isOpen, setIsOpen] = useState(false);
  const [mouRows, setMouRows] = useState<{ id: string; partnerName: string; status: string }[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

// Replace with:
  const [isOpen, setIsOpen] = useState(false);
  const { mouRows } = useNotificationFeed({ isOpen });
  const panelRef = useRef<HTMLDivElement>(null);
```

**C. Remove Old Fetch Effect (Lines 124-137):**
```typescript
// DELETE ENTIRELY:
  // MOU approvals need server data: fetch lazily when the panel opens.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    fetch("/api/marcom/mous")
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json) => {
        if (!cancelled && Array.isArray(json.data)) setMouRows(json.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen]);
```

## 3. Explicit "Do Not Touch" List

1. **`src/lib/productivity/notifications.ts`**:
   - *Reason:* The pure calculation functions (`deriveMouNotifications`, `deriveTaskNotifications`, `countUnread`) are verified and work correctly. Do not alter notification derivation rules.
2. **`src/app/api/marcom/mous/route.ts`**:
   - *Reason:* The API endpoint contract is stable. Do not modify query parameters or serialization.
3. **`src/components/layout/TopNav.tsx`**:
   - *Reason:* TopNav only mounts `<NotificationCenter />`. No props or layout changes are necessary.

## 4. Numbered Execution Order

1. **Phase 1: Write Unit Test**
   - Create `src/lib/productivity/useNotificationFeed.test.ts` testing mount fetch, window focus sync, and unmount cancellation.
   - Run `node --test --import ./test/register-alias.mjs src/lib/productivity/useNotificationFeed.test.ts` to verify the red (failing) test state.
2. **Phase 2: Implement Hook**
   - Create `src/lib/productivity/useNotificationFeed.ts` with the code specified in Section 2.1.
   - Run the unit test to verify the green (passing) test state.
3. **Phase 3: Integrate into `NotificationCenter.tsx`**
   - Apply the edits from Section 2.2 to `src/components/layout/NotificationCenter.tsx`.
   - Run `npm run build:check` to confirm 0 TypeScript compilation errors.
4. **Phase 4: Run Verification Gates**
   - Run `npm run drift:check` (must report 0 drift).
   - Run `npm test` (full test suite, 0 failures).
5. **Phase 5: Commit & Handoff**
   - Update `CHANGELOG.md` and `docs/SESSION_STATE.md`.
   - Commit with message:
     ```
     fix(notifications): proactively fetch notification feed on mount and window focus

     Eliminate lazy open-only guard in NotificationCenter by delegating
     MOU notification lifecycle to useNotificationFeed hook.

     Spec: docs/superpowers/specs/2026-11-05-top-nav-notification-feed-lifecycle-design.md
     Plan: docs/superpowers/plans/2026-11-05-top-nav-notification-feed-lifecycle.md
     Refs: docs/adr/0032-top-nav-notification-feed-lifecycle.md
     ```

## 5. Acceptance Criteria Checklist

- [ ] Unread red dot / badge appears immediately on initial page mount when unread notifications exist.
- [ ] Switching away and returning to the browser tab triggers window focus sync.
- [ ] Opening the notification panel refreshes the list with live server data.
- [ ] `npm run drift:check` passes with no drift detected.
- [ ] `npm run build:check` passes with 0 TypeScript compilation errors.
- [ ] `npm test` passes with 0 failures across all suites.



