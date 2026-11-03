# Plan — Move Toast Notifications to `top-right`

**Status:** Complete  
**Date:** 2026-11-03  
**Estimated time:** 2 minutes  
**Risk:** None — cosmetic change only, zero logic impact

---

## Problem

`<Toaster position="bottom-right" />` stacks toasts at the bottom-right of the screen. The ContentDrawer panel lives on the right side and has its two most critical buttons at the very bottom:

- **"Hapus Post"** (destructive delete)
- **"Simpan Perubahan"** (primary save CTA)

During multi-file uploads, multiple toasts fire in sequence (`loading` → `success` per file) and pile up directly on top of those buttons, making them unclickable until all toasts auto-dismiss.

---

## Decision

Move to `position="top-right"`.

**Why top-right is safe:**
- No view in the app has primary action buttons at the top-right — it is always metadata, close buttons, or breadcrumbs
- Top-right is the most recognised toast position in SaaS tools (Notion, Linear, Vercel, GitHub)
- The drawer's top-right only has the `×` close button — a toast appearing nearby does not block any workflow since the drawer can still be closed after the toast dismisses
- All 212 `toast.*` call sites across the app use the global config — no per-call overrides exist, so this change applies everywhere instantly

---

## The Change

**File:** `src/app/layout.tsx`  
**Line:** 32

```tsx
// BEFORE:
<Toaster richColors position="bottom-right" />

// AFTER:
<Toaster richColors position="top-right" />
```

One word. That is the entire change.

---

## Execution Checklist

```
[x] 1. Open: src/app/layout.tsx
[x] 2. Line 32: change "bottom-right" → "top-right"
[x] 3. npm run build:check   → 0 TypeScript errors (no type change involved)
[x] 4. Manual test:
        → Open ContentDrawer
        → Upload a file → toast appears top-right ✓
        → Click "Simpan Perubahan" → success toast top-right, save button still clickable ✓
        → Click "Hapus Post" → confirm toast top-right, button remains accessible ✓
        → Check other views (Events, Projects, Inventory) → toasts appear top-right ✓
```

---

## No Other Files to Touch

All 212 `toast.*` calls in the codebase use the global `<Toaster>` instance. None override `position` individually. This single change propagates everywhere.
