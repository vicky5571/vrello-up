# Handover: Event Preparation Checklist Checkbox Center-Left Alignment

- **Status:** Execution-Ready
- **Date:** 2026-11-07
- **Author:** Critical Senior Software Engineer (Pair Programmer)
- **ADR Reference:** `docs/adr/0083-event-checklist-checkbox-center-left-alignment.md`
- **Spec Reference:** `docs/superpowers/specs/2026-11-07-event-checklist-checkbox-center-left-design.md`
- **Plan Reference:** `docs/superpowers/plans/2026-11-07-event-checklist-checkbox-center-left.md`

---

## 1. Target Files & Purpose

| File Path | Purpose |
| :--- | :--- |
| `src/components/views/EventsView/EventChecklistSection.tsx` | Refine checklist row container, label, and checkbox input from top-left to center-left |
| `src/components/views/EventsView/eventChecklistResponsiveness.test.ts` | Update unit assertions for center-left alignment and absence of `mt-0.5` |

---

## 2. Exact Current Code Snippets & Modifications

### In `src/components/views/EventsView/EventChecklistSection.tsx`:

#### Lines 97–108:
**Current:**
```tsx
          {eventSubtasks.map((s, idx) => (
            <div
              key={s.id || idx}
              className="flex items-start justify-between gap-2.5 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            >
              <label className="flex items-start gap-2.5 flex-1 min-w-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(s.completed)}
                  onChange={(e) => handleToggleSubtask(idx, e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 mt-0.5 shrink-0"
                />
```

**Change:**
1. Replace `items-start` with `items-center` on the row `<div>`.
2. Replace `items-start` with `items-center` on `<label>`.
3. Remove `mt-0.5` from `<input type="checkbox">`.

**Result:**
```tsx
          {eventSubtasks.map((s, idx) => (
            <div
              key={s.id || idx}
              className="flex items-center justify-between gap-2.5 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            >
              <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(s.completed)}
                  onChange={(e) => handleToggleSubtask(idx, e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 shrink-0"
                />
```

---

### In `src/components/views/EventsView/eventChecklistResponsiveness.test.ts`:

#### Lines 41–51:
**Current:**
```ts
  it("verifies checkbox and task item containers align to top on multi-line text", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    assert.ok(
      content.includes("items-start justify-between"),
      "Task item container must use items-start to anchor checkbox on multi-line wrap"
    );
    assert.ok(
      content.includes("mt-0.5 shrink-0"),
      "Checkbox must use mt-0.5 shrink-0 to prevent vertical squishing"
    );
  });
```

**Change:**
```ts
  it("verifies checkbox and task item containers use center-left vertical alignment", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    assert.ok(
      content.includes("items-center justify-between"),
      "Task item container must use items-center for center-left alignment on multi-line wrap"
    );
    assert.ok(
      content.includes("items-center gap-2.5"),
      "Item label must use items-center for center-left alignment"
    );
    assert.ok(
      content.includes("w-4 h-4 shrink-0") && !content.includes("mt-0.5 shrink-0"),
      "Checkbox must use w-4 h-4 shrink-0 without mt-0.5 top offset"
    );
  });
```

---

## 3. Explicit "Do Not Touch" List

1. **Subtask logic & state**: `handleToggleSubtask`, `handleRemoveSubtask`, `handleAddSubtask`, `handleResetTemplate` must NOT be touched.
2. **Text multi-line wrapping**: `<span className="break-words text-xs leading-snug flex-1 min-w-0">` must NOT be touched.
3. **Coordinator Budgets**: `EventChecklistSection.tsx` must stay strictly $\le 250$ LOC (currently 159 LOC).

---

## 4. Numbered Execution Order

1. **Step 1**: Update unit test in `src/components/views/EventsView/eventChecklistResponsiveness.test.ts`. Run to verify RED failure.
2. **Step 2**: Apply changes to `src/components/views/EventsView/EventChecklistSection.tsx`.
3. **Step 3**: Re-run unit test to verify GREEN.
4. **Step 4**: Run `npm run build:check` (0 errors).
5. **Step 5**: Run `npm run drift:check` (110/110 pairs, 0 drift).
6. **Step 6**: Run `npm run test:smoke` and full `npm test`.
7. **Step 7**: Update `CHANGELOG.md` and `docs/SESSION_STATE.md`.
8. **Step 8**: Commit git changes.

---

## 5. Acceptance Criteria Checklist

- [ ] Checkbox input aligns vertically in the center on the left of each card row (*center-left*).
- [ ] Label wrapper uses `items-center gap-2.5`.
- [ ] Row container uses `items-center justify-between`.
- [ ] No `mt-0.5` remains on the checkbox input.
- [ ] Multi-line text wrapping remains fully functional without clipping.
- [ ] All verification commands (`drift:check`, `build:check`, `test:smoke`, `npm test`) pass with 0 errors.

