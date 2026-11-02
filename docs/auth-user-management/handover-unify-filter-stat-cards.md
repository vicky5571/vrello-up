# Handover — Unify Filter: Remove Pill Tabs, Promote Stat Cards

**ADR:** `docs/adr/0015-unify-filter-stat-cards-remove-pill-tabs.md`  
**Spec:** `docs/auth-user-management/spec-unify-filter-stat-cards.md`  
**Status:** Ready to Execute  
**Date:** 2026-11-02  

---

## Goal

Remove the pill tab bar from the User Management page. The stat cards already call the same `onTabChange` handler — they are already wired up. This is a **UI cleanup task**, not a logic rewrite.

---

## Codebase Map

```
src/app/admin/users/page.tsx                          → Server route guard → redirects to /?view=users
src/app/page.tsx                                      → SPA shell, calls useUrlStateSync()
src/components/views/ActiveViewStage.tsx              → case "users" → <UsersView />
src/components/views/UsersView/
  UsersView.tsx                                       → PRIMARY: local state (activeTab, counts, users)
  UsersHeader.tsx                                     → TARGET: pill tabs (inlined) + KPI cards wired
  usersFilterHelpers.ts                               → Pure filterUsers() — DO NOT TOUCH
  usersFilterHelpers.test.ts                          → Unit tests — no pill references
  userRoleSelect.test.ts                              → Role guard tests — no pill references
  userBranchAssignment.test.ts                        → Branch tests — no pill references
src/components/views/shared/KpiSummaryCards.tsx       → Reusable card component — DO NOT TOUCH
src/lib/router/urlState.ts                            → parseUrlNavState / serializeUrlNavState
src/lib/router/useUrlStateSync.ts                     → URL ↔ store sync hook
src/lib/store/slices/createUiSlice.ts                 → setActiveView (preserves appMode for "users")
```

---

## Current State (What Exists Today)

### Filter State — `UsersView.tsx`

```tsx
// Local state — single source of truth for the tab
const [activeTab, setActiveTab] = useState<UserStatus>(
  (initialCounts?.pending ?? 0) > 0 ? "PENDING" : "APPROVED"
);

// Tab change handler passed down as prop
onTabChange={(tab) => {
  setActiveTab(tab);
  setSearchQuery("");   // clears search on tab switch
}}
```

`UserStatus` values: `"PENDING"` | `"APPROVED"` | `"REJECTED"`

### KPI Cards — already interactive (`UsersHeader.tsx`)

```tsx
const kpiItems: KpiCardItem[] = [
  {
    label: "Total Pengguna",
    value: totalUsers,
    helper: "Terdaftar dalam database",
    icon: Users,
    color: "indigo",
    // no onClick — "All" reset state (currently informational only)
  },
  {
    label: "Menunggu Review",
    value: counts.pending,
    helper: counts.pending > 0 ? "Memerlukan persetujuan admin" : "Tidak ada antrean pending",
    icon: Clock,
    color: "amber",
    onClick: () => onTabChange("PENDING"),   // ← ALREADY WIRED
    active: activeTab === "PENDING",         // ← ALREADY HIGHLIGHTED
  },
  {
    label: "Pengguna Aktif",
    value: counts.active,
    helper: "Akses sistem diizinkan",
    icon: ShieldCheck,
    color: "emerald",
    onClick: () => onTabChange("APPROVED"),  // ← ALREADY WIRED
    active: activeTab === "APPROVED",        // ← ALREADY HIGHLIGHTED
  },
  {
    label: "Akun Ditolak / Nonaktif",
    value: counts.rejected,
    helper: "Akses akun diblokir",
    icon: UserX,
    color: "rose",
    onClick: () => onTabChange("REJECTED"),  // ← ALREADY WIRED
    active: activeTab === "REJECTED",        // ← ALREADY HIGHLIGHTED
  },
];

<KpiSummaryCards items={kpiItems} mobileStrip />
```

**The cards already do the job. The pills are fully redundant.**

### Pill Tab Bar — inlined in `UsersHeader.tsx`

The pill bar is NOT a separate component. It is inlined JSX inside `UsersHeader`. It uses:
- `framer-motion` `<motion.button>` per tab
- `layoutId="activeUsersTabPill"` for the sliding pill animation
- `onClick={() => onTabChange(tab.id)}`
- Same `counts` and `activeTab` props as the cards

The `tabs` array definition:
```tsx
const tabs: { id: UserStatus; label: string; icon: ...; count: number }[] = [
  { id: "PENDING",  label: "Pendaftaran Pending", icon: Clock,       count: counts.pending  },
  { id: "APPROVED", label: "Pengguna Aktif",      icon: ShieldCheck, count: counts.active   },
  { id: "REJECTED", label: "Ditolak / Nonaktif",  icon: UserX,       count: counts.rejected },
];
```

---

## Exact Changes Required

### 1. `src/components/views/UsersView/UsersHeader.tsx`

**A) Delete the `tabs` array** (the const declaration with the 3 tab objects)

**B) Delete the pill bar JSX block** — the entire `<div>` that renders `{tabs.map(...)}` including the wrapping container div with `bg-slate-100` / `rounded-xl` classes and the `<motion.div layoutId="activeUsersTabPill">` inside it.

**C) Add `onClick` to "Total Pengguna" card** so it acts as the "All / Reset" filter:
```tsx
// Change this card:
{
  label: "Total Pengguna",
  value: totalUsers,
  helper: "Terdaftar dalam database",
  icon: Users,
  color: "indigo",
  // ADD these two lines:
  onClick: () => onTabChange("ALL"),
  active: activeTab === "ALL",
}
```

> ⚠️ Only add "Total Pengguna" onClick if `UserStatus` type supports an `"ALL"` value and `UsersView` handles it. See note below.

**D) Clean up unused imports** — after removing the pill bar, check if any of these are now unused in `UsersHeader.tsx`:
- `motion` from `framer-motion`
- `useReducedMotion` from `framer-motion`
- `Clock`, `ShieldCheck`, `UserX` from `lucide-react` (they may still be used in `kpiItems`)
- `cn` utility (likely still used elsewhere in the file)

---

### 2. `src/components/views/UsersView/UsersView.tsx` (only if adding "ALL" state)

If you choose to wire "Total Pengguna" as a reset filter:

```tsx
// Change type from:
const [activeTab, setActiveTab] = useState<UserStatus>(...)

// To support "ALL":
type TabFilter = UserStatus | "ALL";
const [activeTab, setActiveTab] = useState<TabFilter>(...)

// Update conditional rendering:
{(activeTab === "PENDING")                        && <UsersPendingTab  ... />}
{(activeTab === "APPROVED" || activeTab === "ALL") && <UsersActiveTab  ... />}
// etc. — OR render all three tabs when activeTab === "ALL"
```

> This is **optional** for the first pass. The simplest safe change is to skip "Total Pengguna" onClick for now and only remove the pills.

---

## Props Interface Check

Before editing, verify `UsersHeader` props — the `onTabChange` signature:

```tsx
interface UsersHeaderProps {
  counts: { pending: number; active: number; rejected: number };
  activeTab: UserStatus;
  onTabChange: (tab: UserStatus) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
}
```

If adding `"ALL"`, update `UserStatus` type or create a `TabFilter` union locally.

---

## What NOT to Touch

| File | Reason |
|---|---|
| `KpiSummaryCards.tsx` | Already supports `onClick` and `active` — no changes needed |
| `usersFilterHelpers.ts` | Pure filter function — unrelated |
| `urlState.ts` / `useUrlStateSync.ts` | The `?view=users` URL param is for the **view** (users page), not the tab filter. Tab filter is local state only — no URL param needed |
| `createUiSlice.ts` | Store slice unrelated to tab filter |
| All test files | No pill tab references in any test — nothing to update |
| E2E tests | No user management e2e coverage exists — nothing to update |

---

## Execution Order

```
1. Open:  src/components/views/UsersView/UsersHeader.tsx
2. Find:  const tabs = [...]  → DELETE the entire const
3. Find:  <div className="flex items-center gap-1.5 ... bg-slate-100 ...">
            {tabs.map(...)}
          </div>
          → DELETE the entire block (including wrapper div)
4. Clean: Remove any now-unused imports (motion, useReducedMotion if pill-only)
5. Build: npm run build  →  confirm no TypeScript errors
6. Test:  npm test       →  all existing unit tests must pass
7. Visual: Load /?view=users → confirm cards still filter table correctly
```

---

## Acceptance Criteria

- [ ] Pill tab bar is gone from the DOM
- [ ] KPI cards still filter the table (PENDING / APPROVED / REJECTED)
- [ ] No TypeScript errors
- [ ] All existing unit tests pass
- [ ] `KpiSummaryCards` active state (border highlight) still works per card
- [ ] Search clears on card click (same behavior as before)
- [ ] No console errors / warnings introduced

---

## Risk: Low

The cards already call `onTabChange` — this is a **delete-only** change to `UsersHeader.tsx`. No logic is being rewritten, no state is being moved. The only risk is leaving a stale import or missing a wrapper `<div>` boundary when deleting the pill block.
