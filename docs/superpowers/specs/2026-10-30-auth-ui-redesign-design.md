# Auth UI Redesign — Design Spec

**Date:** 2026-10-30
**Status:** Approved for implementation
**Scope:** `src/app/(auth)/*`, `src/components/auth/*`, `src/app/globals.css`

---

## 1. Executive Summary

Redesign the login, register, and registration-success screens as a split-screen
experience that mirrors the product shell: a dark rail-like brand panel on the
left and a light workspace panel on the right. Fix the root-cause styling bug
(missing Tailwind `@theme` mapping) so semantic utilities used by auth and admin
screens render as designed.

---

## 2. Problem Statement

1. `globals.css` defines shadcn-style HSL tokens (`--background`, `--card`,
   `--border`, ...) but never maps them into Tailwind's theme. As a result,
   `bg-card`, `bg-primary`, `border-border`, `text-foreground`, and
   `text-muted-foreground` compile to nothing. Auth cards are transparent,
   borders are missing, and the primary submit button is effectively invisible.
2. The auth shell is a generic centered card. Its black-gradient `CheckSquare`
   logo does not match the emerald→teal "V" mark used by `Sidebar`.
3. Login and register lack field-level feedback, password visibility, password
   strength, and confirm-match indicators. The success state is a single
   paragraph with no explanation of what happens next.

---

## 3. Design Direction

- **Split shell:** `#0F1115` brand panel (the `GlobalRail` color) on the left,
  `#F0F1F4` / `#0C0D0F` workspace panel on the right. This is the same rhythm
  as `src/app/page.tsx` (dark rail + white/dark rounded workspace).
- **Brand mark:** emerald→teal "V" + `v2.0` badge, identical to `Sidebar`.
- **Board preview:** CSS/HTML kanban illustration using the app's blue, purple,
  emerald, and amber label language. No external images.
- **Form surface:** `#FFFFFF` / `#18191B`, `rounded-2xl`, border `#E5E7EB` /
  `#2A2B2D`, subtle layered shadow. Same surface language as the workspace.
- **Accent:** ClickUp blue (`--secondary` = `#0073ea` light / `#0080ff` dark)
  for primary CTAs. Teal focus rings tie back to the brand mark.
- **Typography:** system sans, tight bold headings, 10–11px uppercase tracked
  labels — consistent with `UsersView`, `Sidebar`, and `TopNav`.

### 3.1 Token fix

Add a Tailwind 4 `@theme inline` block that maps:

`background`, `foreground`, `card`, `card-foreground`, `popover`,
`popover-foreground`, `primary`, `primary-foreground`, `secondary`,
`secondary-foreground`, `muted`, `muted-foreground`, `accent`,
`accent-foreground`, `destructive`, `destructive-foreground`, `border`,
`input`, `ring`

to `hsl(var(--token))`.

`inline` is required because the existing ClickUp tokens also define
`--color-primary` and `--color-border` as hex values for direct `var(--color-*)`
usage. With `inline`, semantic utilities compile to `hsl(var(--primary))` /
`hsl(var(--border))`, while the base-layer hex tokens continue to win for direct
variable references. No token is renamed and no existing CSS usage breaks.

---

## 4. UX Flow

### 4.1 Login (`/login`)

1. Optional Google sign-in.
2. Email + password with leading icons and password visibility toggle.
3. PENDING / REJECTED / credentials / OAuth banners (`role="alert"`),
   deduplicated when the query error repeats the status banner.
4. Submit → spinner + "Memproses..." → `/`.
5. Cross-link to `/register`.

### 4.2 Register (`/register`)

1. Info banner: every account is reviewed by an admin.
2. Optional Google sign-up.
3. Name, email, password, confirm — field-level validation.
4. Password strength meter (4 segments) and live confirm-match indicator.
5. Submit → success screen with a 3-step approval timeline and the registered
   email address.
6. Cross-link to `/login`.

### 4.3 Success

- Animated check, "Akun Anda sedang ditinjau".
- Timeline: Akun dibuat → Menunggu persetujuan admin → Akses workspace aktif.
- Registered email note + "Kembali ke halaman masuk".

---

## 5. Component Inventory

| File | Responsibility |
| --- | --- |
| `src/components/auth/AuthCard.tsx` | Card surface, header, divider |
| `src/components/auth/AuthField.tsx` | Label, icon, input, password toggle, error/hint |
| `src/components/auth/AuthAlert.tsx` | Error / warning / info banner |
| `src/components/auth/AuthSubmitButton.tsx` | Blue CTA with loading state |
| `src/components/auth/GoogleButton.tsx` | Google OAuth button + logo |
| `src/components/auth/PasswordStrength.tsx` | 4-segment strength meter |
| `src/components/auth/AuthBoardPreview.tsx` | Decorative kanban board |
| `src/components/auth/AuthBrandPanel.tsx` | Dark split-panel brand story |
| `src/app/(auth)/layout.tsx` | Responsive split shell + theme toggle |
| `src/components/auth/LoginForm.tsx` | Login screen |
| `src/components/auth/RegisterForm.tsx` | Register screen |
| `src/components/auth/RegisterSuccess.tsx` | Approval-pending success state |

---

## 6. Accessibility

- Every input has a visible `<label>` and a stable `id`.
- `aria-invalid` and `aria-describedby` are set from error/hint state.
- Password toggle exposes `aria-label` and `aria-pressed`.
- Alerts use `role="alert"` (errors/warnings) or `role="status"` (info).
- Visible `focus-visible` rings on all interactive elements.
- Reduced motion respected via `useReducedMotion` and `motion-safe:`.
- The decorative board preview is `aria-hidden="true"`.

---

## 7. Responsive Behavior

- **< lg:** brand panel hidden; compact brand row + theme toggle at the top;
  form full width; page scrolls naturally.
- **lg+:** two-column split; brand panel sticky and full height.
- Form max width `440px`; controls `44px` tall.
- No horizontal overflow at 375, 768, or 1440 px.

---

## 8. Non-Goals

- No new auth providers, password reset, or email verification flow.
- No changes to the auth API, middleware, or session logic.
- No global rebrand; only the token mapping and auth surfaces.

---

## 9. Acceptance Criteria

- [ ] `bg-card`, `bg-primary`, `border-border`, `text-foreground`,
      `bg-secondary`, and `ring-primary` compile.
- [ ] Login, register, and success screens match the split shell in light and
      dark mode.
- [ ] PENDING / REJECTED / credentials / OAuth behavior from B1–B5 is preserved.
- [ ] No horizontal overflow at 375 / 768 / 1440 px.
- [ ] `npm run drift:check`, `npm test`, and `npm run build:check` pass.

---

## 10. Verification Checklist

1. PostCSS compile check for the semantic utility list.
2. `npm run drift:check`.
3. `npm test`.
4. `npm run build:check`.
5. Playwright screenshots at 375 / 768 / 1440 px in light and dark mode, if
   browsers are available.
