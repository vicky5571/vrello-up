# Implementation Plan: Registration Branch Selection via Server-Rendered CustomDropdown

- **Status:** READY FOR IMPLEMENTATION
- **Date:** 2026-11-05
- **Spec:** `docs/superpowers/specs/2026-11-05-registration-branch-selection-custom-dropdown-design.md`
- **Refs:** `docs/adr/0043-registration-branch-selection-custom-dropdown.md` (ADR-0043)

---

## 1. Executive Summary & Objective

This implementation plan defines the step-by-step engineering roadmap to introduce mandatory operational branch selection (*Cabang Penugasan*) into the public registration workflow (`/register`). 

The key objectives are:
1. Pre-fetch operational branches during SSR in `RegisterPage` Server Component, eliminating client network waterfalls.
2. Integrate canonical `CustomDropdown<string>` (`size="md"`, `searchable={true}`) into `RegisterForm` between Email and Password fields.
3. Validate `branchId` at the client and server levels, saving new users with `assignedBranchIds: [branchId]` and status `PENDING`.
4. Ensure administrator approval workflows immediately reflect the candidate's proposed branch.

---

## 2. File Manifest & Estimated Surface Area

| Action | File Path | Estimated LOC | Responsibility |
|---|---|---|---|
| Create | `src/app/api/auth/register/registerRoute.test.ts` | ~80 LOC | Automated test suite verifying branch validation, missing branch 422, invalid branch 400, and successful assignedBranchIds storage |
| Modify | `src/app/api/auth/register/route.ts` | ~15 LOC modified | Add `branchId` to Zod schema, verify branch existence, and assign to user creation payload |
| Modify | `src/app/(auth)/register/page.tsx` | ~12 LOC modified | Pre-fetch active branches via Prisma and pass as `branches` prop |
| Modify | `src/components/auth/RegisterForm.tsx` | ~35 LOC modified | Accept `branches` prop, track `branchId`, wire `CustomDropdown`, add validation |
| Create | `docs/handover-registration-branch-selection-custom-dropdown.md` | ~200 LOC | Execution-ready handover guide with verbatim code diffs and safety rules |
| Modify | `CHANGELOG.md` | ~15 LOC | Chronological feature change record |
| Modify | `docs/SESSION_STATE.md` | ~30 LOC | Session handoff state update |

---

## 3. Phased Implementation Roadmap

### Phase 1: Test Scaffold & Invariant Suite (Test-First)
- [ ] Create `src/app/api/auth/register/registerRoute.test.ts` using Node.js native test runner (`node:test`, `node:assert/strict`).
- [ ] Test 1: Assert `POST /api/auth/register` rejects payload without `branchId` with HTTP 422.
- [ ] Test 2: Assert `POST /api/auth/register` rejects non-existent `branchId` with HTTP 400.
- [ ] Test 3: Assert `POST /api/auth/register` creates user with `assignedBranchIds: [branchId]` and status `PENDING` when valid.
- [ ] Run test: verify it fails initially before implementation.

### Phase 2: Route Hardening (`src/app/api/auth/register/route.ts`)
- [ ] Update `registerSchema`:
  ```typescript
  const registerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    branchId: z.string().min(1, "Branch is required"),
  });
  ```
- [ ] Extract `branchId` from `parsed.data`.
- [ ] Check branch existence:
  ```typescript
  const branchExists = await prisma.branch.findUnique({
    where: { id: branchId },
    select: { id: true },
  });
  if (!branchExists) {
    return NextResponse.json({ error: "Selected branch does not exist." }, { status: 400 });
  }
  ```
- [ ] In `prisma.user.create`:
  ```typescript
  data: {
    name,
    email,
    password: hashedPassword,
    role: "STAFF",
    status: "PENDING",
    assignedBranchIds: [branchId],
  }
  ```

### Phase 3: Server Component Data Pre-fetch (`src/app/(auth)/register/page.tsx`)
- [ ] Import `prisma` from `@/lib/db`.
- [ ] Query active branches before rendering:
  ```typescript
  const branches = await prisma.branch.findMany({
    select: { id: true, name: true, city: true },
    orderBy: { name: "asc" },
  });
  ```
- [ ] Pass `branches` prop: `<RegisterForm branches={branches} />`.

### Phase 4: Frontend UI Integration (`src/components/auth/RegisterForm.tsx`)
- [ ] Import `CustomDropdown` from `@/components/ui/CustomDropdown`.
- [ ] Define prop interface:
  ```typescript
  export interface RegisterFormProps {
    branches?: Array<{ id: string; name: string; city: string }>;
  }
  ```
- [ ] Add state: `const [branchId, setBranchId] = useState("");`.
- [ ] Update `validateRegistration`: add check for `branchId`:
  ```typescript
  if (!values.branchId) {
    errors.branchId = "Cabang penugasan wajib dipilih.";
  }
  ```
- [ ] Mount `CustomDropdown` between Email and Password fields:
  ```tsx
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
      CABANG PENUGASAN <span className="text-rose-500">*</span>
    </label>
    <CustomDropdown<string>
      value={branchId}
      onChange={(val) => {
        setBranchId(val);
        clearFieldError("branchId");
      }}
      options={(branches || []).map((b) => ({
        value: b.id,
        label: `${b.name} (${b.city})`,
      }))}
      placeholder="Pilih cabang penugasan..."
      searchable={true}
      searchPlaceholder="Cari nama cabang atau kota..."
      size="md"
      direction="auto"
      className="w-full"
      buttonClassName="w-full bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-xs text-left"
      menuClassName="w-full min-w-full max-h-60"
    />
    {fieldErrors.branchId && (
      <p className="text-[11px] text-rose-500 font-medium">{fieldErrors.branchId}</p>
    )}
  </div>
  ```
- [ ] In `handleSubmit`, send `branchId` in POST body:
  ```typescript
  body: JSON.stringify({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    branchId,
  }),
  ```

### Phase 5: Non-Negotiable Verification & Handover
- [ ] Run targeted tests: `npx tsx --test src/app/api/auth/register/registerRoute.test.ts`.
- [ ] Run invariant drift check: `npm run drift:check` (verify 70/70 spec-plan pairs valid).
- [ ] Run TypeScript type check: `npm run build:check` (0 errors required).
- [ ] Run full smoke test suite: `npm run test:smoke` (0 failures required).
- [ ] Run complete regression test suite: `npm test` (0 failures required).
- [ ] Author execution-ready handover guide `docs/handover-registration-branch-selection-custom-dropdown.md`.
- [ ] Update `CHANGELOG.md` and `docs/SESSION_STATE.md`.

---

## 4. Risks & Mitigations

| Risk | Impact | Mitigation Strategy |
|---|---|---|
| Existing tests call register without branchId | Test regression in full suite | Update any legacy register test fixtures to pass a mock branchId. |
| Dropdown overflow on mobile screen | Popover clipped by viewport | `CustomDropdown` natively configures `direction="auto"` and `menuClassName="w-full min-w-full max-h-60"`. |
| Unauthenticated public access to branch data | Unauthorized data scraping | Query runs inside Server Component and exposes only `{ id, name, city }` without financial or internal metrics. |

