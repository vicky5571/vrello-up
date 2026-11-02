# Spec & Plan — Unify Filter: Stat Cards Replace Pill Tabs

**ADR:** [ADR-0015](../adr/0015-unify-filter-stat-cards-remove-pill-tabs.md)  
**Status:** Proposed  
**Date:** 2026-11-02  

---

## Problem Summary

The User Management page has two elements that filter the same table:

```
[Pendaftaran Pending 1] [Pengguna Aktif 6] [Ditolak / Nonaktif 1]   ← Pill Tabs (redundant)

[ Total: 8 ]  [ Menunggu Review: 1 ]  [ Pengguna Aktif: 6 ]  [ Ditolak: 1 ]  ← Stat Cards
```

The pill tabs are a subset of the stat cards — same data, same action, less context.  
**Goal:** Remove pills, make cards the single filter mechanism.

---

## Filter State Map

| Filter Value | Pill Tab Label | Stat Card Label | Table Shows |
|---|---|---|---|
| `all` | *(none)* | Total Pengguna | All 8 users |
| `pending` | Pendaftaran Pending | Menunggu Review | Users awaiting admin approval |
| `active` | Pengguna Aktif | Pengguna Aktif | Users with active system access |
| `rejected` | Ditolak / Nonaktif | Akun Ditolak / Nonaktif | Blocked / rejected accounts |

Default on page load: `active`

---

## Functional Requirements

| ID | Requirement |
|---|---|
| FR-01 | Each stat card acts as a **clickable filter toggle** for the user table |
| FR-02 | "Total Pengguna" card sets filter to `all` (show all users, reset) |
| FR-03 | Only **one card active at a time** (single-select) |
| FR-04 | Active card renders a **distinct selected visual state** |
| FR-05 | Pill tab bar is **removed from the layout entirely** |
| FR-06 | Active filter is synced to URL param `?view=` for deep-linking |
| FR-07 | Filter state is **restored from URL** on page load / refresh |
| FR-08 | Count on each card **updates in real-time** when data refreshes |
| FR-09 | Clicking the already-active card does **nothing** (no toggle-off to empty) |

---

## Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-01 | Filter state change must **not cause a full page reload** |
| NFR-02 | Default active state on first load = `active` (current behavior preserved) |
| NFR-03 | Cards must be **keyboard accessible** (Tab to focus, Enter/Space to activate) |
| NFR-04 | Cards must be **screen-reader accessible** (`role`, `aria-pressed`, `aria-label`) |
| NFR-05 | Mobile layout — cards stack/wrap gracefully, remain comfortably tappable |

---

## Visual States per Card

| State | Appearance |
|---|---|
| **Default** | Neutral background, no border, cursor default |
| **Hover** | Subtle border ring, slight background tint, cursor pointer |
| **Active / Selected** | Colored border (matches card icon accent color), light background tint, slightly elevated shadow |
| **Loading** | Skeleton shimmer on count number only |

> Reference: "Pengguna Aktif" card in current design already demonstrates the active state — replicate that pattern for all cards.

---

## Accessibility Spec

```html
<!-- Each stat card -->
<button
  role="button"
  aria-pressed="true | false"
  aria-label="Filter: Pengguna Aktif (6 users)"
  tabindex="0"
>
  ...card content...
</button>
```

- Focus ring must be visible (2px outline, brand color)
- `aria-pressed="true"` on the currently active card
- `aria-live="polite"` on table container to announce row count change

---

## Removed Elements

| Element | Action |
|---|---|
| `<PillFilterBar />` component (or equivalent) | **Delete** |
| `activeTab` state (if separate from card filter state) | **Merge into `activeFilter`** |
| Pill-specific URL param handling | **Consolidate into single param handler** |

---

## Implementation Plan

### Phase 0 — Audit (No code changes)
- [ ] Locate `PillFilterBar` component (or inline pill tab implementation)
- [ ] Locate stat card components — identify which are already interactive vs purely display
- [ ] Check if pills and cards share a single `activeFilter` state or have separate states
- [ ] Map all places that read/write `?view=` URL param
- [ ] Note any tests (unit / e2e) that reference pill tabs — flag for update

---

### Phase 1 — State Unification
- [ ] Consolidate into a single `activeFilter` hook/atom (if not already unified)
- [ ] Ensure stat cards **read from and write to** this single state
- [ ] Remove any pill-specific state, setter, or derived state

---

### Phase 2 — Make Cards Interactive
- [ ] Add `onClick` handler to each stat card → sets `activeFilter`
- [ ] Add `role="button"` + `tabIndex={0}` + `onKeyDown` (Enter/Space) to cards
- [ ] Apply **hover** CSS state (border ring, cursor pointer)
- [ ] Apply **active/selected** CSS state (colored border, tint) — driven by `activeFilter === thisCard`
- [ ] Add `aria-pressed` and `aria-label` attributes

---

### Phase 3 — Remove Pill Tab Bar
- [ ] Remove `<PillFilterBar />` (or equivalent) from the page layout
- [ ] Delete the component file if no longer used elsewhere
- [ ] Clean up unused imports and props

---

### Phase 4 — URL Param Sync
- [ ] Ensure clicking a card updates `?view=` param (pushState / replaceState)
- [ ] On page load, read `?view=` param and set `activeFilter` accordingly
- [ ] Fallback to `active` if `?view=` is absent or invalid

---

### Phase 5 — QA Checklist
- [ ] **All 4 filter states** correctly filter the table (all / pending / active / rejected)
- [ ] **Count badges** match table row count for each filter
- [ ] **URL deep-link** — navigating to `?view=pending` loads with pending filter active
- [ ] **Refresh persistence** — filter survives page reload via URL param
- [ ] **Keyboard nav** — Tab through cards, Enter/Space activates, focus ring visible
- [ ] **Screen reader** — `aria-pressed` toggles correctly, table updates announced
- [ ] **No flicker** on filter state change
- [ ] **Mobile** — cards stack/wrap cleanly, tap targets adequate (min 44px height)
- [ ] **Real-time update** — refresh button updates counts on cards, table row count stays consistent
- [ ] **Existing tests** updated to remove any pill tab references

---

## Out of Scope

- Changing the card layout (grid columns, card size, icon design)
- Multi-select filtering (e.g., pending + rejected at once)
- Adding new filter values beyond the current 4
- Search bar behavior (unchanged)
