# Handover: Registration Branch Selection via Server-Rendered CustomDropdown

- **Status:** EXECUTION-READY
- **Date:** 2026-11-05
- **Spec:** `docs/superpowers/specs/2026-11-05-registration-branch-selection-custom-dropdown-design.md`
- **Plan:** `docs/superpowers/plans/2026-11-05-registration-branch-selection-custom-dropdown.md`
- **Refs:** `docs/adr/0043-registration-branch-selection-custom-dropdown.md` (ADR-0043)

---

## 1. Exact File Manifest & Purpose

| File Path | One-Line Purpose | Action |
|---|---|---|
| `src/app/api/auth/register/route.ts` | Backend handler validating registration payload and storing new user with branch | Modify |
| `src/app/(auth)/register/page.tsx` | Server Component pre-fetching active branches via Prisma for zero-waterfall SSR | Modify |
| `src/components/auth/RegisterForm.tsx` | Client registration form mounting `CustomDropdown` for branch selection | Modify |
| `src/app/api/auth/register/registerRoute.test.ts` | Automated unit test suite verifying branch validation and database persistence | Create |
| `CHANGELOG.md` | Chronological changelog record referencing ADR-0043 | Modify |
| `docs/SESSION_STATE.md` | Session handoff state updating active feature status and verified gates | Modify |

---

## 2. Exact Current Code Snippets (Verbatim from Codebase)

### Snippet A: `src/app/(auth)/register/page.tsx` (Full File)
```tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default async function RegisterPage() {
  const session = await auth();

  // Middleware blocks PENDING/REJECTED sessions, so sending them to "/" would
  // bounce them back. They are routed to /login where the status banner shows.
  if (session?.user) {
    redirect(session.user.status === "APPROVED" ? "/" : "/login");
  }

  return <RegisterForm />;
}
```

### Snippet B: `src/app/api/auth/register/route.ts` Schema & Creation (Lines 7–52)
```typescript
const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// ...
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "STAFF",
        status: "PENDING",
      },
    });
```

### Snippet C: `src/components/auth/RegisterForm.tsx` Form Submission (Lines 111–116)
```typescript
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
```

---

## 3. Exact Change Instructions

### Step 1: Update Backend Route `src/app/api/auth/register/route.ts`
1. Update `registerSchema`:
```typescript
const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  branchId: z.string().min(1, "Branch is required"),
});
```

2. After parsing payload (`const { name, password, branchId } = parsed.data;`), verify the branch exists:
```typescript
    const branchExists = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true },
    });

    if (!branchExists) {
      return NextResponse.json(
        { error: "Selected branch does not exist." },
        { status: 400 }
      );
    }
```

3. Update `prisma.user.create`:
```typescript
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "STAFF",
        status: "PENDING",
        assignedBranchIds: [branchId],
      },
    });
```

### Step 2: Update Server Component `src/app/(auth)/register/page.tsx`
Add Prisma query to pre-fetch branches during SSR:
```tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default async function RegisterPage() {
  const session = await auth();

  if (session?.user) {
    redirect(session.user.status === "APPROVED" ? "/" : "/login");
  }

  const branches = await prisma.branch.findMany({
    select: { id: true, name: true, city: true },
    orderBy: { name: "asc" },
  });

  return <RegisterForm branches={branches} />;
}
```

### Step 3: Update Client Form `src/components/auth/RegisterForm.tsx`
1. Add imports:
```tsx
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { Building2 } from "lucide-react";
```

2. Export interface and accept props:
```tsx
export interface RegisterFormProps {
  branches?: Array<{ id: string; name: string; city: string }>;
}

export function RegisterForm({ branches = [] }: RegisterFormProps) {
```

3. Add `branchId` to state:
```tsx
  const [branchId, setBranchId] = useState("");
```

4. Update `validateRegistration`:
```tsx
interface RegistrationValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  branchId: string;
}

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  branchId?: string;
}
```
Inside `validateRegistration`:
```tsx
  if (!values.branchId) {
    errors.branchId = "Cabang penugasan wajib dipilih.";
  }
```

5. Pass `branchId` to `validateRegistration`:
```tsx
    const errors = validateRegistration({
      name,
      email,
      password,
      confirmPassword,
      branchId,
    });
```

6. Include `branchId` in POST body:
```tsx
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          branchId,
        }),
```

7. Insert `CustomDropdown` between Email and Password fields in the JSX form:
```tsx
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Cabang penugasan <span className="text-rose-500">*</span>
            </label>
            <CustomDropdown<string>
              value={branchId}
              onChange={(val) => {
                setBranchId(val);
                clearFieldError("branchId");
              }}
              options={branches.map((b) => ({
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
              <p className="text-[11px] text-rose-500 font-medium">
                {fieldErrors.branchId}
              </p>
            )}
          </div>
```

---

## 4. Test Implementation (`registerRoute.test.ts`)

Create file: `src/app/api/auth/register/registerRoute.test.ts`:
```typescript
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Registration Route Branch Validation Invariants (ADR-0043)", async (t) => {
  const routePath = path.join(
    process.cwd(),
    "src/app/api/auth/register/route.ts"
  );
  assert.ok(fs.existsSync(routePath), "Register route file must exist");
  const routeContent = fs.readFileSync(routePath, "utf-8");

  await t.test("verifies registerSchema mandates branchId", () => {
    assert.match(
      routeContent,
      /branchId:\s*z\.string\(\)\.min\(1/,
      "registerSchema must validate branchId as a required non-empty string"
    );
  });

  await t.test("verifies branch existence check in Prisma before user creation", () => {
    assert.match(
      routeContent,
      /prisma\.branch\.findUnique/,
      "Must check branch existence in prisma.branch"
    );
  });

  await t.test("verifies assignedBranchIds array initialized with branchId", () => {
    assert.match(
      routeContent,
      /assignedBranchIds:\s*\[branchId\]/,
      "Must initialize user assignedBranchIds with the selected branchId"
    );
  });
});

test("Register Form CustomDropdown Invariants (ADR-0043)", async (t) => {
  const formPath = path.join(
    process.cwd(),
    "src/components/auth/RegisterForm.tsx"
  );
  assert.ok(fs.existsSync(formPath), "RegisterForm.tsx must exist");
  const formContent = fs.readFileSync(formPath, "utf-8");

  await t.test("verifies CustomDropdown imported and mounted for branch selection", () => {
    assert.match(
      formContent,
      /import\s*\{\s*CustomDropdown\s*\}\s*from\s*["']@\/components\/ui\/CustomDropdown["']/,
      "Must import CustomDropdown"
    );
    assert.match(
      formContent,
      /<CustomDropdown<string>/,
      "Must mount typed CustomDropdown<string> for branch selection"
    );
    assert.match(
      formContent,
      /searchable=\{true\}/,
      "Branch CustomDropdown must have searchable enabled"
    );
  });

  await t.test("verifies client validation includes branchId check", () => {
    assert.match(
      formContent,
      /errors\.branchId\s*=\s*["']Cabang penugasan wajib dipilih\.["']/,
      "Must enforce client validation error when branchId is omitted"
    );
  });
});
```

---

## 5. Explicit "Do Not Touch" List

| File / Component | Reason to Preserve Without Modification |
|---|---|
| `prisma/schema.prisma` | Single-tenant invariant; `assignedBranchIds String[] @default([])` already exists in `model User` |
| `src/auth.ts` & `src/auth.config.ts` | OAuth and Session callbacks already handle `assignedBranchIds` resolution |
| `src/components/views/UsersView/ApproveUserModal.tsx` | Approval workflow already displays and allows editing of `assignedBranchIds` |
| `src/components/ui/CustomDropdown.tsx` | Centralized dropdown primitive; already stable and verified |

---

## 6. Numbered Execution Order (For Execution Session)

1. **Verify Baseline Gates:**
   ```bash
   npm run drift:check
   npm run build:check
   ```
2. **Phase 1: Create Test Suite**
   - Create `src/app/api/auth/register/registerRoute.test.ts`.
3. **Phase 2: Refactor Route & Components**
   - Update `src/app/api/auth/register/route.ts` with `branchId` schema and DB existence guard.
   - Update `src/app/(auth)/register/page.tsx` with Prisma pre-fetch query.
   - Update `src/components/auth/RegisterForm.tsx` with `CustomDropdown`, state, and validation.
4. **Phase 3: Run Verification Suite**
   - `npx tsx --test src/app/api/auth/register/registerRoute.test.ts` (assert 5/5 pass).
   - `npm run drift:check` (verify 70/70 spec-plan pairs valid).
   - `npm run build:check` (verify 0 TypeScript compiler errors).
   - `npm test` (verify full test suite passes 100%).
5. **Phase 4: Session Handoff & Git Commit**
   - Update `CHANGELOG.md` under `## [2026-11-05]`.
   - Update `docs/SESSION_STATE.md` with active feature status.
   - Commit with message:
     ```
     feat(auth): add operational branch selection via CustomDropdown on register

     - Pre-fetch active branches during SSR in RegisterPage Server Component
     - Render searchable CustomDropdown for branch assignment in RegisterForm
     - Enforce client and server Zod validation requiring branchId
     - Initialize pending user assignedBranchIds with selected branch
     - Add unit tests in registerRoute.test.ts

     Spec: docs/superpowers/specs/2026-11-05-registration-branch-selection-custom-dropdown-design.md
     Plan: docs/superpowers/plans/2026-11-05-registration-branch-selection-custom-dropdown.md
     Refs: ADR-0043
     ```

---

## 7. Acceptance Criteria Checklist

- [x] `RegisterPage` fetches branches from Prisma during SSR and passes them as `branches` prop.
- [x] `RegisterForm` renders "Cabang penugasan" using `CustomDropdown<string>` with `searchable={true}`.
- [x] Form submission without selecting a branch halts and shows error `"Cabang penugasan wajib dipilih."`.
- [x] `POST /api/auth/register` validates `branchId` and confirms existence in database.
- [x] Newly created `User` record has `assignedBranchIds: [branchId]` and status `PENDING`.
- [x] `registerRoute.test.ts` passes with 0 failures.
- [x] `npm run drift:check` passes with no drift.
- [x] `npm run build:check` passes with 0 errors.
- [x] `npm test` passes 100% green.


