# Spec: Registration Branch Selection via Server-Rendered CustomDropdown

- **Status:** APPROVED
- **Date:** 2026-11-05
- **Refs:** `docs/adr/0043-registration-branch-selection-custom-dropdown.md` (ADR-0043)
- **Author:** Senior Software Engineer & Principal Systems Architect

---

## 1. Executive Summary & Goals

This specification details the addition of mandatory operational branch assignment (*Cabang Penugasan*) during user registration (`/register`). 

### Core Objectives:
1. **Direct Server-Side Data Pre-fetching (RSC):** In `RegisterPage` (`src/app/(auth)/register/page.tsx`), pre-fetch active branches directly from the database and supply them as props to `RegisterForm`, eliminating client-side network waterfalls and the need for public API endpoints.
2. **Canonical CustomDropdown Integration:** Equip `RegisterForm` with `CustomDropdown<string>` (`size="md"`, `searchable={true}`) so applicants can search across nationwide branches by name or city.
3. **Strict Validation & Initial Assignment:** Enforce client-side and server-side Zod validation on `branchId`, creating new pending user records with `assignedBranchIds: [branchId]`.
4. **Approval Acceleration:** Ensure newly registered users immediately display their proposed branch in `UsersPendingTab` for immediate, context-rich administrator review.

---

## 2. User Experience Flow & Form Interaction

### 2.1 Candidate Registration Journey
1. Candidate navigates to `http://localhost:3000/register`.
2. The page renders server-side with the list of active operational branches already populated.
3. In `RegisterForm`, between the Email and Password fields, the candidate encounters a new field:
   - **Label:** `CABANG PENUGASAN *`
   - **Trigger:** A styled button with chevron icon (`min-h-[36px]`, `text-xs`) displaying `"Pilih cabang penugasan..."` or the selected branch.
4. Clicking or focusing the trigger opens the floating `CustomDropdown` menu.
5. Candidate types in the embedded search input (e.g. `"Bandung"` or `"Surabaya"`). The options filter in real-time.
6. Candidate selects their branch; the dropdown closes and displays `"{branch.name} ({branch.city})"`.
7. Candidate fills in passwords and clicks **"Kirim pendaftaran ->"**.
8. **Client Validation Guard:** If the candidate forgets to select a branch, submission halts, focusing the dropdown and rendering inline error: `"Cabang penugasan wajib dipilih."`.
9. **Submission & Pending Status:** Form submits `branchId` alongside `name`, `email`, and `password`. Upon success, the registration confirmation screen displays: `"Pendaftaran Terkirim. Menunggu persetujuan admin."`

### 2.2 Administrator Approval Queue
1. Administrator navigates to `UsersView` -> **"Menunggu Persetujuan"** tab.
2. The pending user row displays the applicant's proposed branch name in the branch column.
3. Clicking **"Setujui"** opens `ApproveUserModal` with the applicant's proposed branch pre-selected, allowing instant 1-click confirmation or supervisory adjustments.

---

## 3. Data Contracts & Architecture Invariants

### 3.1 Type Definitions
```typescript
export interface BranchOption {
  id: string;
  name: string;
  city: string;
}

export interface RegisterFormProps {
  branches: BranchOption[];
}
```

### 3.2 Registration API Contract (`POST /api/auth/register`)
- **Request Body (JSON):**
  ```typescript
  {
    name: string;       // min 1 character
    email: string;      // valid email format
    password: string;   // min 8 characters
    branchId: string;   // valid existing Branch.id
  }
  ```
- **Zod Validation Schema:**
  ```typescript
  const registerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    branchId: z.string().min(1, "Branch is required"),
  });
  ```
- **Prisma User Creation:**
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
- **Response Contracts:**
  - `201 Created`: `{ message: "Registration submitted. Awaiting admin approval." }`
  - `409 Conflict`: `{ error: "An account with this email already exists." }`
  - `422 Unprocessable Entity`: `{ error: "Validation failed.", issues: [...] }`
  - `400 Bad Request`: `{ error: "Selected branch does not exist." }`

---

## 4. Pure Logic & Validation Rules

### 4.1 Client Validation Extension
```typescript
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

function validateRegistration(values: RegistrationValues): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.name.trim()) errors.name = "Nama lengkap wajib diisi.";
  if (!values.email.trim()) {
    errors.email = "Email wajib diisi.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Format email tidak valid.";
  }
  if (!values.branchId) errors.branchId = "Cabang penugasan wajib dipilih.";
  if (values.password.length < 8) errors.password = "Password minimal 8 karakter.";
  if (!values.confirmPassword) {
    errors.confirmPassword = "Konfirmasi password wajib diisi.";
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Konfirmasi password tidak cocok.";
  }

  return errors;
}
```

### 4.2 Dropdown Markup & Wiring
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

## 5. Acceptance Criteria & Non-Goals

### Acceptance Criteria
- [ ] `RegisterPage` pre-fetches active branches from Prisma and passes them to `RegisterForm` as `branches` prop.
- [ ] `RegisterForm` displays the "CABANG PENUGASAN" field using `CustomDropdown<string>`.
- [ ] `CustomDropdown` supports real-time text searching across branch names and cities.
- [ ] Submitting the form without selecting a branch halts submission and displays inline error `"Cabang penugasan wajib dipilih."`.
- [ ] `POST /api/auth/register` requires and validates `branchId`.
- [ ] Newly registered user records are created with `assignedBranchIds: [branchId]` and status `PENDING`.
- [ ] Admin / Supervisor viewing `UsersPendingTab` sees the applicant's selected branch displayed.
- [ ] Automated tests in `registerRoute.test.ts` pass with 100% assertions green.

### Non-Goals
- Modifying Google OAuth callback registration.
- Adding a public unauthenticated `/api/auth/branches` endpoint.
- Database schema changes (uses existing `assignedBranchIds String[] @default([])`).

---

## 6. Verification Plan

```bash
# Targeted test verifying Register Route and branch validation
npx tsx --test src/app/api/auth/register/registerRoute.test.ts

# Invariant drift verification
npm run drift:check

# TypeScript type check
npm run build:check

# Full test suite
npm test
```


