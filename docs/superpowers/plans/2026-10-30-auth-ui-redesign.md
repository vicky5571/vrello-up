# Auth UI Redesign — Implementation Plan

**Date:** 2026-10-30
**Spec:** `docs/superpowers/specs/2026-10-30-auth-ui-redesign-design.md`

---

## Phase 1 — Token Foundation

- [x] Add `@theme inline` mapping to `src/app/globals.css`.
- [x] Add `auth-float` keyframes for the board preview chip.
- [x] Verify semantic utilities compile via PostCSS.

## Phase 2 — Auth Primitives

- [x] `AuthCard.tsx` — card surface, header, divider.
- [x] `AuthField.tsx` — label, leading icon, password toggle, error/hint.
- [x] `AuthAlert.tsx` — error / warning / info banner.
- [x] `AuthSubmitButton.tsx` — blue CTA with loading state.
- [x] `GoogleButton.tsx` — Google OAuth button + logo.
- [x] `PasswordStrength.tsx` — 4-segment strength meter.

## Phase 3 — Brand Panel

- [x] `AuthBoardPreview.tsx` — decorative kanban board.
- [x] `AuthBrandPanel.tsx` — dark split-panel brand story.

## Phase 4 — Screens

- [x] Rewrite `src/app/(auth)/layout.tsx` as the responsive split shell.
- [x] Rewrite `LoginForm.tsx` on the new primitives.
- [x] Rewrite `RegisterForm.tsx` with field-level validation.
- [x] Rewrite `RegisterSuccess.tsx` with the approval timeline.

## Phase 5 — Verification

- [x] `npm run drift:check`.
- [x] `npm test`.
- [x] `npm run build:check`.
- [x] Visual QA at 375 / 768 / 1440 px, light + dark.
- [x] Update `CHANGELOG.md` and `docs/SESSION_STATE.md`.

---

## File Manifest

| File | Est. LOC | Change |
| --- | ---: | --- |
| `src/app/globals.css` | +35 | `@theme inline`, keyframes |
| `src/components/auth/AuthCard.tsx` | ~80 | new |
| `src/components/auth/AuthField.tsx` | ~115 | new |
| `src/components/auth/AuthAlert.tsx` | ~60 | new |
| `src/components/auth/AuthSubmitButton.tsx` | ~40 | new |
| `src/components/auth/GoogleButton.tsx` | ~65 | new |
| `src/components/auth/PasswordStrength.tsx` | ~75 | new |
| `src/components/auth/AuthBoardPreview.tsx` | ~130 | new |
| `src/components/auth/AuthBrandPanel.tsx` | ~120 | new |
| `src/app/(auth)/layout.tsx` | ~75 | rewrite |
| `src/components/auth/LoginForm.tsx` | ~210 | rewrite |
| `src/components/auth/RegisterForm.tsx` | ~240 | rewrite |
| `src/components/auth/RegisterSuccess.tsx` | ~140 | rewrite |

---

## Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Enabling semantic utilities changes `UsersView` / `UserMenuDropdown`. | Those files already intend semantic styling; they are currently broken. Verify them after the token fix. |
| `RegisterForm` grows past 250 LOC. | Extract `PasswordStrength`, `AuthField`, and validation helpers. |
| `--color-primary` / `--color-border` collision. | `@theme inline` keeps utilities on HSL; base-layer hex tokens still win for direct `var(--color-*)` usage. Verify with PostCSS. |
| Form height on short desktop screens. | Brand panel is decorative and clipped; form column scrolls independently. |
| Motion sensitivity. | `useReducedMotion` in card/success; `motion-safe:` on the floating chip. |

---

## Dependencies

- Tailwind CSS 4 (`@theme inline`, `@source`).
- `framer-motion` (already installed).
- `lucide-react` (already installed).
- `next-themes` via `ThemeToggle` (already installed).

---

## Verification Gates

```bash
npm run drift:check
npm test
npm run build:check
```

All three must pass before the work is reported complete.
