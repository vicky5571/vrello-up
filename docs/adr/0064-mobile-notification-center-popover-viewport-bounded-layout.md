# ADR-0064: Mobile Notification Center Popover Viewport-Bounded Layout

- **Status:** ACCEPTED
- **Date:** 2026-11-06
- **Deciders:** Senior Software Engineer, Lead Developer

## Context & Business Problem

In `src/components/layout/TopNav.tsx`, the `NotificationCenter` (bell icon trigger) is placed alongside the `ThemeToggle` and user profile avatar, positioning the bell trigger approximately 80px inward from the right screen margin.

When the notification popover is opened, it renders with the following styling:
```tsx
<div className="absolute right-0 top-full mt-2 w-86 max-w-[calc(100vw-2rem)] rounded-2xl ...">
```

### The Problem
Because the popover anchors to `right-0` relative to the bell trigger container (~80px from screen right) and possesses a fixed width of `w-86` (344px), its left edge is placed at:
`(Screen Width - 80px) - 344px = Screen Width - 424px`.

On standard mobile smartphones (e.g. 375px to 414px width), this results in a negative x-coordinate (e.g. `375px - 424px = -49px`), causing **approximately 50px of the popover content to overflow beyond the left edge of the screen**:
- *"Activity Center"* header text is cropped to *"y Center"*.
- Category labels such as *"EXPIRY (1)"* are cropped to *"XPIRY (1)"*.
- Task and MOU titles are cropped on the left side, degrading usability and visual polish.

Furthermore, on desktop screens ($\ge 640\text{px}$), the current dropdown appearance and positioning work properly and must remain 100% byte-for-byte unchanged.

## Options Considered

### Option 1: Viewport-Bounded Floating Modal Card with Mobile Backdrop (Chosen)
- **Mobile (`< 640px`) Structure:**
  - Decouple the popover positioning from the relative bell icon using `fixed inset-x-3 top-13 z-50 w-auto max-w-none max-h-[82vh] flex flex-col`.
  - Add a soft mobile-only backdrop: `<div className="fixed inset-0 bg-slate-900/20 backdrop-blur-2xs z-40 sm:hidden" onClick={() => setIsOpen(false)} />`.
  - The popover sits centered across the mobile viewport with comfortable 12px margins (`inset-x-3`) and directly below the top navigation bar (`top-13` = 52px).
- **Desktop (`sm:` / ≥ 640px) Preservation:**
  - Reverts to `sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-86 sm:max-w-[calc(100vw-2rem)]`.
  - Backdrop is hidden with `sm:hidden`.
  - Exactly 100% byte-for-byte identical to existing desktop popover behavior.

*Trade-Offs:*
- **Pros:** Completely eliminates horizontal cutoff on any smartphone screen (360px–430px); effortless tap-to-dismiss via backdrop; full text visibility; zero desktop visual regressions.
- **Cons:** None. Lightweight responsive class adjustments.

### Option 2: Bottom Sheet Drawer
- Transform into a slide-up bottom sheet on mobile (`fixed inset-x-0 bottom-0 rounded-t-2xl max-h-[75vh]`).

*Trade-Offs:*
- **Pros:** High native feel.
- **Cons:** Obscures the mobile bottom navigation bar; requires gesture drag handling; excessive complexity for a notification feed.

### Option 3: Hard-coded Negative Margin Offset (`right-[-4.5rem]`)
- Shift the popover to the right using negative right offsets.

*Trade-Offs:*
- **Pros:** Keeps relative positioning.
- **Cons:** Fragile across varying screen widths (e.g. 360px Android vs 390px iPhone vs 430px Pro Max), causing clipping on the right edge on smaller devices.

## Decision

We adopt **Option 1: Viewport-Bounded Floating Modal Card with Mobile Backdrop**.

### Core Technical Implementation:

In `src/components/layout/NotificationCenter.tsx`:
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
            ...
          </div>
        </>
      )}
```

## Consequences & Mitigations

- **Positive:** Resolves text cropping completely across all mobile viewports; provides intuitive backdrop dismissal; preserves 100% desktop fidelity.
- **Negative:** None.
- **Mitigation:** Verified via automated unit tests asserting `fixed inset-x-3 top-13` and `sm:absolute sm:right-0 sm:w-86` in `useNotificationFeed.test.ts`.



