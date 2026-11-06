# Technical Specification: Mobile Notification Center Popover Viewport-Bounded Layout

- **Date:** 2026-11-06
- **Status:** DRAFT
- **Refs:** ADR-0064
- **Target File:** `src/components/layout/NotificationCenter.tsx`

---

## 1. Executive Summary

This specification addresses the horizontal clipping defect of the notification popover (`Activity Center`) on mobile smartphones (< 640px). By decoupling the popover from the relative bell icon trigger on mobile and anchoring it to the viewport with `fixed inset-x-3 top-13`, the popover is guaranteed to render with symmetrical 12px margins, eliminating all left-edge overflow. On desktop screens ($\ge 640\text{px}$), the component retains its exact current anchor and dimensions (`sm:absolute sm:right-0 sm:w-86`) with zero visual regression.

---

## 2. Problem Statement & User Experience Flow

### 2.1 Current Defect
- **Bell Trigger Inset:** The bell trigger button in `TopNav.tsx` sits ~80px inward from the right screen boundary, flanked by the theme toggle and profile avatar.
- **Left-Edge Clipping on Mobile:** The popover currently specifies `absolute right-0 top-full mt-2 w-86` (344px width). Because `right-0` is relative to the bell trigger, the left edge of the popover calculates to `(Viewport Width - 80px) - 344px = Viewport Width - 424px`. On a standard 375px mobile screen, this results in `-49px` overflow past the left screen edge.
- **Degraded Readability:** Header text (*"Activity Center"*), category titles (*"EXPIRY"*), and notification titles are severely clipped on the left.

### 2.2 Desired User Experience Flow
1. **Smartphone Viewport (< 640px):**
   - User taps the bell icon in `TopNav`.
   - A soft backdrop (`fixed inset-0 bg-slate-900/20 backdrop-blur-2xs`) fades in behind the popover.
   - The popover opens as a centered floating card with 12px margins from both edges (`fixed inset-x-3`), positioned 52px from the top (`top-13`), directly beneath the 44px top navigation bar.
   - All text (*"Activity Center"*, *"Mark all read"*, notification rows) is completely readable and symmetrically framed.
   - Tapping anywhere on the backdrop or inside a notification immediately dismisses the popover.
2. **Desktop Viewport ($\ge 640\text{px}$):**
   - User clicks the bell icon in `TopNav`.
   - Popover anchors directly beneath the bell icon: `sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-86`.
   - The backdrop is hidden (`sm:hidden`).
   - Desktop layout and behavior remain 100% byte-for-byte unchanged.

---

## 3. Component Architecture & CSS Token Contracts

### 3.1 DOM Structure Transformation in `NotificationCenter.tsx`

```tsx
      {isOpen && (
        <>
          {/* Mobile Backdrop Overlay for easy tap-dismissal */}
          <div
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-2xs z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Responsive Popover Panel */}
          <div
            className={cn(
              "fixed inset-x-3 top-13 z-50 max-h-[82vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-100",
              "sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-86 sm:max-w-[calc(100vw-2rem)] sm:max-h-none sm:block",
            )}
          >
            {/* Header: Title and Mark All Read */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Activity Center
                {unread > 0 && (
                  <span className="ml-1.5 text-[10px] font-semibold text-rose-500">
                    {unread} new
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => setLastSeenNotificationsAt(new Date().toISOString())}
                disabled={allNotifs.length === 0}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer disabled:opacity-40"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            </div>

            {/* Scrollable Notification List */}
            <div className="flex-1 max-h-96 sm:max-h-96 overflow-y-auto p-2 space-y-3">
              ...
            </div>
          </div>
        </>
      )}
```

### 3.2 Responsive Token Mapping Matrix

| Element | Mobile Class (< 640px) | Desktop Class ($\ge 640\text{px}$) | Rationale |
| :--- | :--- | :--- | :--- |
| **Backdrop** | `fixed inset-0 bg-slate-900/20 z-40` | `sm:hidden` | Provides click-outside dismissal on mobile; invisible on desktop |
| **Popover Shell** | `fixed inset-x-3 top-13 z-50 max-h-[82vh]` | `sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-86` | Centered 12px from viewport on mobile; right-anchored 344px card on desktop |
| **Notification List** | `flex-1 overflow-y-auto max-h-96` | `sm:max-h-96` | Constrained scroll on short mobile displays; normal max-height on desktop |

---

## 4. Acceptance Criteria & Non-Goals

### 4.1 Acceptance Criteria
- [ ] On mobile screens (< 640px), the *Activity Center* popover does not overflow past the left screen edge.
- [ ] On mobile screens (< 640px), the popover renders with symmetrical 12px margins (`inset-x-3`) and directly beneath the header (`top-13`).
- [ ] A mobile backdrop overlay renders when the popover is open, and tapping it immediately closes the popover (`setIsOpen(false)`).
- [ ] On desktop screens ($\ge 640\text{px}$), the popover reverts to `sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-86` with identical original styling and zero backdrop overlay (`sm:hidden`).
- [ ] Notification feed derivation, click navigation (opening task or MOU), and *"Mark all read"* functionality remain 100% operational.
- [ ] Coordinator line limits remain strictly $\le 250$ LOC (`NotificationCenter.tsx` monitored).
- [ ] All unit tests pass with 0 failures.

### 4.2 Non-Goals
- Altering the notification aggregation logic in `useNotificationFeed.ts` or `notifications.ts`.
- Modifying other popovers in `TopNav.tsx` (`UserMenuDropdown`).

---

## 5. Verification Checklist

```bash
# 1. Targeted Unit Tests
npx tsx --test src/lib/productivity/useNotificationFeed.test.ts

# 2. Invariant & Coordinator LOC Verification
npm run drift:check

# 3. TypeScript Compilation
npm run build:check

# 4. Smoke Test Suite
npm run test:smoke
```



