# ADR-0071: Mobile Outlet Form GPS Layout & Toast Touch Resilience

- **Status:** ACCEPTED
- **Date:** 2026-11-07
- **Deciders:** Senior Software Engineer, Lead Developer

## Context & Business Problem

Creating and editing retail outlets on mobile devices (`OutletFormModal.tsx`) is a core field operation for marketing coordinators visiting physical retail sites. Two major usability bottlenecks were identified on smartphone screens (< 640px):

1. **GPS Header Crowding & Link Wrapping:** In `OutletFormModal.tsx`, the GPS picker header combined the section title (`📍 GPS Coordinates`), subtitle, accuracy indicator, and an external `View on Maps` link into a single row. On 360px–390px screens, the title wrapped onto multiple lines and collided with the map link, breaking card aesthetics and making coordinates difficult to inspect.
2. **Sonner Toast Touch Blocking Defect:** When coordinates were detected or copied, a Sonner notification toast appeared at the top of the mobile screen. On touch devices, tapping the toast (or tapping near it) triggered Sonner's internal `hover-pause` mechanism, leaving the toast permanently frozen on the screen. Worse, the Sonner container (`[data-sonner-toaster]`) captured pointer events across its full stacking region, completely blocking user taps on the modal's top-right `Close` (X) button and freezing modal dismissal.

We need an architectural solution that restructures the GPS picker row responsively on mobile, eliminates header text wrapping, and guarantees that Sonner toast notifications never capture touch interactions or block modal dismissal.

## Options Considered

### Option 1: 2-Row Responsive GPS Header + Pass-Through Toast Container (Chosen)
- In `OutletFormModal.tsx`:
  - Enforce `whitespace-nowrap` on the GPS title.
  - Split the `View on Maps` link: on desktop keep inline (`hidden sm:inline-flex`), on mobile render a dedicated second link row (`sm:hidden`).
  - Assign a stable identifier `const GPS_TOAST_ID = "outlet-gps-toast"` and configure toast options with `style: { pointerEvents: "none" }`.
  - Add an unmount cleanup effect: `useEffect(() => () => toast.dismiss(GPS_TOAST_ID), [])`.
- In `src/app/globals.css`:
  - Set `[data-sonner-toaster] { pointer-events: none; }` so the empty toaster stack does not block clicks.
  - Set `[data-sonner-toast] { pointer-events: auto; }` so individual interactive toasts remain clickable by default.
- *Trade-Offs:*
  - *Pros:* Completely prevents toast freeze on mobile touch; taps pass straight through to the modal close button; GPS header stays compact without text wrapping; 100% desktop pixel parity preserved.
  - *Cons:* Requires a 4-line global CSS rule.

### Option 2: Remove GPS Toast Completely
- Eliminate notification feedback when GPS coordinates are captured.
- *Trade-Offs:*
  - *Pros:* Zero toast interaction issues.
  - *Cons:* Poor field UX; operators cannot tell if geolocation succeeded without visually scrutinizing the latitude/longitude inputs.

## Decision

We adopt **Option 1: 2-Row Responsive GPS Header + Pass-Through Toast Container**.

Specifically:
1. **Responsive GPS Link Row:** Render desktop link inline (`hidden sm:inline-flex`) and mobile link on a dedicated second row (`sm:hidden`).
2. **Whitespace Protection:** Apply `whitespace-nowrap` on `GPS Coordinates`.
3. **Toast Pass-Through & Dismissal Invariant:** Use `GPS_TOAST_ID` with `pointerEvents: "none"` on detection toasts, and dismiss on modal unmount.
4. **Global Toaster Pointer Rules:** Configure `[data-sonner-toaster]` with `pointer-events: none` and `[data-sonner-toast]` with `pointer-events: auto`.

## Consequences

### Positive Consequences
1. **Unblocked Modal Dismissal:** The top-right modal close button remains 100% tappable at all times on mobile devices.
2. **Zero Stuck Toasts:** Touch gestures no longer indefinitely trigger Sonner's hover-pause mechanism.
3. **Clean GPS Header:** Titles and external links remain legible on 360px–390px screens without visual wrapping.
4. **Desktop Preservation:** Screens $\ge 640\text{px}$ maintain the unified single-row header.

### Negative Consequences / Accepted Technical Debt
1. None. Pure layout and interaction resilience fix backed by automated regression tests in `src/components/views/OutletsView/outletFormModalMobileUx.test.ts`.



