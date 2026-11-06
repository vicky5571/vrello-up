# Handover: Mobile Notification Center Popover Viewport-Bounded Layout

- **Date:** 2026-11-06
- **Status:** READY FOR EXECUTION
- **Spec:** docs/superpowers/specs/2026-11-06-mobile-notification-center-popover-viewport-bounded-design.md
- **Plan:** docs/superpowers/plans/2026-11-06-mobile-notification-center-popover-viewport-bounded.md
- **Refs:** ADR-0064

---

## 1. Overview & Objective

This handover document provides execution-ready instructions to resolve the horizontal text clipping defect on the *Activity Center* notification popover (`NotificationCenter.tsx`) on mobile smartphones (< 640px) using viewport-bounded positioning (`fixed inset-x-3 top-13`) and mobile backdrop dismissal, while **strictly preserving 100% of the desktop layout unchanged**.

---

## 2. File Manifest

1. `src/lib/productivity/useNotificationFeed.test.ts` — Unit test suite verifying responsive popover classes, mobile backdrop, and desktop preservation invariants.
2. `src/components/layout/NotificationCenter.tsx` — Notification center component containing the popover.

---

## 3. Explicit "Do Not Touch" List

- **Desktop Breakpoints (`sm:` & `md:`)**: DO NOT modify or remove `sm:absolute`, `sm:right-0`, `sm:w-86`, or `sm:hidden`. Desktop appearance must remain 100% byte-for-byte unaffected.
- **Notification Aggregation & Store**: DO NOT alter `useNotificationFeed.ts`, `deriveTaskNotifications`, or `deriveMouNotifications`.
- **SSOT Domain Entities**: DO NOT alter types in `src/types/index.ts`.

---

## 4. Numbered Step-by-Step Execution Instructions

### Step 1: Update Unit Test `src/lib/productivity/useNotificationFeed.test.ts`

**Path:** `src/lib/productivity/useNotificationFeed.test.ts`

Append the following test at the end of the file:

```ts
  it("verifies NotificationCenter employs viewport-bounded mobile positioning with desktop preservation (ADR-0064)", () => {
    const filePath = path.resolve(process.cwd(), "src/components/layout/NotificationCenter.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    assert.ok(
      content.includes("fixed inset-x-3 top-13"),
      "NotificationCenter must use 'fixed inset-x-3 top-13' on mobile to avoid left clipping"
    );
    assert.ok(
      content.includes("fixed inset-0 bg-slate-900/20") && content.includes("sm:hidden"),
      "NotificationCenter must render a mobile-only backdrop for tap dismissal"
    );
    assert.ok(
      content.includes("sm:absolute") && content.includes("sm:right-0") && content.includes("sm:w-86"),
      "NotificationCenter must preserve desktop classes 'sm:absolute sm:right-0 sm:w-86'"
    );
  });
```

---

### Step 2: Update Component in `src/components/layout/NotificationCenter.tsx`

**Lines to replace (approx. lines 184–206 in `NotificationCenter.tsx`):**

```tsx
// BEFORE:
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-86 max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
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

          <div className="max-h-96 overflow-y-auto p-2 space-y-3">

// AFTER:
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

            <div className="flex-1 max-h-96 sm:max-h-96 overflow-y-auto p-2 space-y-3">
```

And update the closing tag at line 273:
```tsx
// BEFORE:
        </div>
      )}

// AFTER:
          </div>
        </>
      )}
```

---

## 5. Non-Negotiable Verification Protocol

Run the following commands in exact order to confirm zero regressions:

```bash
# 1. Targeted Unit Test (Ensure Green Phase)
npx tsx --test src/lib/productivity/useNotificationFeed.test.ts

# 2. Invariant & Coordinator LOC Verification (Must pass 90/90)
npm run drift:check

# 3. TypeScript Compilation (0 errors required)
npm run build:check

# 4. Smoke Test Suite (0 failures)
npm run test:smoke

# 5. Full Test Suite (0 failures)
npm test
```

---

## 6. Acceptance Criteria Checklist

- [ ] On mobile screens (< 640px), the *Activity Center* popover renders with symmetrical 12px margins (`inset-x-3`) directly below the top nav bar (`top-13`).
- [ ] No text, titles, or categories are clipped on the left edge on any smartphone screen width (360px–430px).
- [ ] Tapping the mobile backdrop overlay immediately closes the popover.
- [ ] On desktop screens ($\ge 640\text{px}$), the popover reverts strictly to `sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-86` with identical original styling and zero backdrop overlay (`sm:hidden`).
- [ ] Notification feed derivation, click navigation (opening task or MOU), and *"Mark all read"* functionality remain 100% operational.
- [ ] Coordinator line limits remain strictly $\le 250$ LOC.
- [ ] `npm run drift:check` passes with 90/90 pairs and 0 drift.
- [ ] `npm run build:check` exits with code 0.
- [ ] `npm run test:smoke` passes with 0 failures.



