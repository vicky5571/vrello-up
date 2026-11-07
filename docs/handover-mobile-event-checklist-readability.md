# Execution Handover: Mobile Field Event Checklist Readability & Header Layout Enhancement

- **Target ADR:** `docs/adr/0072-mobile-event-checklist-readability-enhancement.md`
- **Target Spec:** `docs/superpowers/specs/2026-11-07-mobile-event-checklist-readability-design.md`
- **Target Plan:** `docs/superpowers/plans/2026-11-07-mobile-event-checklist-readability.md`
- **Status:** EXECUTION-READY

## 1. File Manifest

| File Path | Purpose |
| :--- | :--- |
| `src/components/views/EventsView/eventChecklistResponsiveness.test.ts` | Unit & structural regression test suite for mobile checklist readability |
| `src/components/views/EventsView/EventChecklistSection.tsx` | Atomic component rendering event preparation subtasks checklist |

---

## 2. Current Code Snippets

From `src/components/views/EventsView/EventChecklistSection.tsx`:

### Current Header (Lines 68–87):
```tsx
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
          <ListTodo className="w-4 h-4 text-blue-500" />
          <span>Event Preparation Checklist (Task Subtasks)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-mono">
            {completedCount}/{eventSubtasks.length} completed
          </span>
          <button
            type="button"
            onClick={handleResetTemplate}
            className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            title="Reload checklist template for this event type"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Template {eventType}</span>
          </button>
        </div>
      </div>
```

### Current Subtask Item Row (Lines 96–126):
```tsx
            <div
              key={s.id || idx}
              className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            >
              <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(s.completed)}
                  onChange={(e) => handleToggleSubtask(idx, e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span
                  className={
                    s.completed
                      ? "truncate text-slate-400 dark:text-slate-500 line-through"
                      : "truncate text-slate-800 dark:text-slate-200"
                  }
                >
                  {s.title}
                </span>
              </label>
              <button
                type="button"
                onClick={() => handleRemoveSubtask(idx)}
                className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer transition-colors"
                title="Remove checklist item"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
```

### Current Add-Item Input (Lines 132–136):
```tsx
        <input
          type="text"
          placeholder="Add new checklist item... (e.g. Rent 10kVA generator)"
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}

---

## 3. Exact Change Instructions

### Change 1: In `src/components/views/EventsView/EventChecklistSection.tsx`
Replace the header block:
```tsx
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
          <ListTodo className="w-4 h-4 text-blue-500 shrink-0" />
          <span>Event Preparation Checklist</span>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2.5">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
            {completedCount}/{eventSubtasks.length} selesai
          </span>
          <button
            type="button"
            onClick={handleResetTemplate}
            className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            title="Reload checklist template for this event type"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Template {eventType}</span>
          </button>
        </div>
      </div>
```

Replace the checklist item loop:
```tsx
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
                <span
                  className={cn(
                    "break-words text-xs leading-snug flex-1 min-w-0",
                    s.completed
                      ? "text-slate-400 dark:text-slate-500 line-through"
                      : "text-slate-800 dark:text-slate-200"
                  )}
                >
                  {s.title}
                </span>
              </label>
              <button
                type="button"
                onClick={() => handleRemoveSubtask(idx)}
                className="text-slate-400 hover:text-rose-500 p-1 shrink-0 cursor-pointer transition-colors"
                title="Remove checklist item"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
```

Replace the input placeholder:
```tsx
        <input
          type="text"
          placeholder="Tambah item checklist baru..."
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
```

---

## 4. Explicit "Do Not Touch" List

1. **`src/components/views/EventsView/EventCreateModal.tsx`:** Do NOT modify the coordinator modal wrapper or parent form logic.
2. **`src/lib/marcom/eventChecklist.ts`:** Do NOT alter the checklist template generator or subtask data structure.
3. **Desktop Presentation ($\ge 640\text{px}$):** Do NOT break the single-line desktop presentation established with `sm:flex-row sm:items-center sm:justify-between`.
4. **State Hooks:** Do NOT alter `handleToggleSubtask`, `handleRemoveSubtask`, `handleAddSubtask`, or `handleResetTemplate`.

---

## 5. Numbered Execution Order

1. **Phase 1 (Test Suite):** Create `src/components/views/EventsView/eventChecklistResponsiveness.test.ts` asserting responsive breakpoints, multi-line wrap (`break-words`), absence of `truncate`, and $\le 250$ LOC limit. Verify RED status.
2. **Phase 2 (Implementation):** Apply the exact changes to `src/components/views/EventsView/EventChecklistSection.tsx`. Verify GREEN status.
3. **Phase 3 (Quality Gates):**
   - Run `npx tsx --test src/components/views/EventsView/eventChecklistResponsiveness.test.ts`
   - Run `npm run drift:check` (99/99 pairs)
   - Run `npm run build:check` (0 errors)
   - Run `npm run test:smoke` (150/150 pass)
   - Run `npm test` (0 failures)
   - Update `CHANGELOG.md` and `docs/SESSION_STATE.md`.

---

## 6. Acceptance Criteria Checklist

- [ ] Mobile (< 640px) header stacks vertically in 2 clean rows with 0 title text collision.
- [ ] Desktop ($\ge 640\text{px}$) header resets to 1 inline horizontal row (`sm:flex-row`).
- [ ] Subtask items wrap without truncation (`break-words text-xs leading-snug`).
- [ ] Checkbox stays aligned to first line of text (`items-start mt-0.5 shrink-0`).
- [ ] Add item input displays full placeholder `"Tambah item checklist baru..."`.
- [ ] `EventChecklistSection.tsx` coordinator remains $\le 250$ LOC.

```

