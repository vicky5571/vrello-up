# ADR-0015 — Unify Filter Mechanism: Remove Pill Tabs, Promote Stat Cards

**Status:** Proposed  
**Date:** 2026-11-02  
**Area:** User Management — Filter UI  
**Deciders:** Frontend Team  

---

## Context

The User Management page (`?mode=tasks&view=users`) currently has **two UI elements that both filter the user table**:

| Element | Type | Values |
|---|---|---|
| Pill Tab Bar | Tab row (top) | Pendaftaran Pending · Pengguna Aktif · Ditolak / Nonaktif |
| Stat Cards | KPI card row | Total Pengguna · Menunggu Review · Pengguna Aktif · Akun Ditolak / Nonaktif |

Both control the same underlying table filter state. The cards already show richer context (icon + label + count + subtitle). The pills duplicate the count with no additional information. This creates:

- **Dual interaction paths** for the same outcome
- **Redundant state** that must be kept in sync
- **Visual noise** — two filter mechanisms visible at once
- **Extra maintenance surface** — changes to filter logic must be reflected in both

---

## Decision

**Remove the pill tab bar entirely. Promote stat cards as the sole filter mechanism.**

The "Total Pengguna" card (which has no pill equivalent) becomes the natural **"All / Reset"** state.

---

## Options Considered

| # | Option | Pro | Con |
|---|---|---|---|
| A | Keep both as-is | No change cost | Redundant, confusing state sync |
| B | **Remove pills → cards as only filter** ✅ | Single mechanism, richer context, fewer elements | Cards need confirmed interactive styling |
| C | Remove card interactivity → pills as only filter | Simpler card component | Loses count+description context on cards |
| D | Merge into single row of compact stat-pills | One row, one element | Requires new component, higher design cost |

---

## Rationale for Option B

1. Stat cards already render **count + label + subtitle + icon** — more informative than pills
2. "Pengguna Aktif" card already has an **active/selected visual state** (border highlight) in the current design
3. Removing the pill row **reduces vertical height**, giving more space to the table
4. "Total Pengguna" card filling the "All" role is intuitive and requires zero new UI
5. Clickable KPI cards are a **widely understood dashboard pattern**

---

## Consequences

### Positive
- Single source of truth for `activeFilter` state
- Fewer components to maintain
- Cleaner layout — pill row removed, more table real estate
- "Total Pengguna" card gains utility (currently purely informational)

### Negative / Risks
- Users familiar with pill tabs need to re-learn filter interaction (low risk — same page, visual affordance on cards)
- Cards are larger than pills — accidental clicks on mobile need consideration (mitigated by clear hover/active state)

### Neutral
- URL `?view=` param behavior unchanged — cards write to the same param pills currently use

---

## Related

- ADR-0007 — Integrate User Management into Workspace Stage  
- ADR-0012 — Global Rail Pending Users Badge  
- ADR-0013 — Supervisor Guarded User Management Access  
- ADR-0014 — User Management Branch Assignment  
- Spec: `docs/auth-user-management/spec-unify-filter-stat-cards.md`
