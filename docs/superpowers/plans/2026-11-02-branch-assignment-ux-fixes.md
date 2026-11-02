# Implementation Plan: Branch Assignment UX Fixes

**Date:** 2026-11-02
**Author:** Critical Senior Software Engineer (Pair Programmer)
**Status:** Completed
**Refs:** Commit `85bf341` — Post-review findings
**Parent Feature:** `docs/superpowers/plans/2026-11-02-user-branch-assignment.md`

---

## 1. Background

Review pasca-merge commit `85bf341` (`feat(users): implement branch assignment and area supervisor
scoping`) mengidentifikasi tiga masalah minor yang tidak berdampak pada correctness atau keamanan,
namun perlu diperbaiki untuk kualitas produksi:

| # | Kategori | Lokasi | Dampak |
|---|----------|--------|--------|
| FIX-1 | Aksesibilitas | `ApproveUserModal.tsx`, `UserBranchSelectModal.tsx` | `<label onClick>` tanpa `<input>` native — tidak bisa diakses via keyboard/screen reader |
| FIX-2 | Race condition UX | `UsersActiveTab.tsx` | `isBusy` global menyebabkan modal cabang tampak terkunci saat row lain sedang diproses |
| FIX-3 | Silent failure | `UsersView.tsx` | Fetch `/api/marcom/branches` gagal senyap tanpa loading state, feedback, atau retry |

Semua fix bersifat UI/UX only — tidak ada perubahan pada API, guard, atau skema data.

---

## 2. File Manifest

| File | Status | Alasan Perubahan |
|------|--------|-----------------|
| `src/components/views/UsersView/ApproveUserModal.tsx` | ✏️ Edit | FIX-1: ganti fake checkbox dengan `<input type="checkbox" className="sr-only">` |
| `src/components/views/UsersView/UserBranchSelectModal.tsx` | ✏️ Edit | FIX-1: idem |
| `src/components/views/UsersView/UsersActiveTab.tsx` | ✏️ Edit | FIX-2: pisah state `isBranchSaving` dari `processingId` |
| `src/components/views/UsersView/UsersView.tsx` | ✏️ Edit | FIX-3: tambah `branchesStatus` state + pesan error + retry |
| `src/components/views/UsersView/userBranchAssignment.test.ts` | ✏️ Edit | Update test LOC invariant — file tetap ≤ 250 LOC |

Semua file coordinator wajib tetap ≤ 250 LOC (Strangler Pattern Invariant — ADR-0014).

---

## 3. Detail Per Fix

---

### FIX-1 — Aksesibilitas Checkbox (`ApproveUserModal` & `UserBranchSelectModal`)

**Masalah saat ini:**

```tsx
// Kedua modal — pola yang sama
<label
  key={branch.id}
  onClick={() => toggleBranch(branch.id)}   // ← onClick pada <label> tanpa input
  className="..."
>
  <div className="w-4 h-4 rounded border ..."> {/* fake checkbox */}
    {isChecked && <Check className="w-3 h-3" />}
  </div>
  <span>{branch.name}</span>
</label>
```

Masalah:
- `<label>` tanpa `<input>` tidak meneruskan fokus keyboard.
- Screen reader tidak mengumumkan state checked/unchecked.
- `onClick` pada `<label>` akan fire dua kali jika ada `<input>` di dalamnya — perlu pola yang benar.

**Solusi — Native checkbox + visual override:**

```tsx
<label
  key={branch.id}
  className={`flex items-center justify-between p-2 rounded-md text-xs cursor-pointer
    transition-colors ${isChecked ? "bg-primary/10 text-foreground font-medium"
    : "hover:bg-muted/50 text-muted-foreground"}`}
>
  {/* Input native disembunyikan secara visual, tetap accessible */}
  <input
    type="checkbox"
    className="sr-only"
    checked={isChecked}
    onChange={() => toggleBranch(branch.id)}
  />
  <div className="flex items-center gap-2">
    <div
      className={`w-4 h-4 rounded border flex items-center justify-center
        transition-colors pointer-events-none ${isChecked
          ? "bg-primary border-primary text-white"
          : "border-muted-foreground/30 bg-card"}`}
    >
      {isChecked && <Check className="w-3 h-3" />}
    </div>
    <span>{branch.name}</span>
    {branch.code && (
      <span className="text-[10px] text-muted-foreground uppercase">
        ({branch.code})
      </span>
    )}
  </div>
  {branch.region && (
    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
      {branch.region}
    </span>
  )}
</label>
```

Perubahan kunci:
- Hapus `onClick` dari `<label>` → ganti dengan `onChange` di `<input>`.
- `<input type="checkbox" className="sr-only">` tersembunyi secara visual tapi terdaftar di accessibility tree.
- Custom visual box mendapat `pointer-events-none` agar click diteruskan ke `<input>` melalui `<label>`.
- Handler `toggleBranch` tidak berubah — tetap pure, hanya binding yang berubah.

File yang diubah:
- `ApproveUserModal.tsx` baris 155–191 (blok `assignableBranches.map`)
- `UserBranchSelectModal.tsx` baris 132–168 (blok `assignableBranches.map`)

---

### FIX-2 — Race Condition `isBusy` Modal (`UsersActiveTab`)

**Masalah saat ini:**

```tsx
// UsersActiveTab.tsx baris 30–31
const [processingId, setProcessingId] = useState<string | null>(null);
const [editingBranchUser, setEditingBranchUser] = useState<AppUser | null>(null);

// baris 160–169: isBusy dikirim sebagai !!processingId (global)
<UserBranchSelectModal
  user={editingBranchUser}
  isOpen={!!editingBranchUser}
  isBusy={!!processingId}   // ← True jika ROW MANA PUN sedang diproses
  onSave={handleBranchSave}
  onClose={() => setEditingBranchUser(null)}
/>
```

Jika User A sedang di-deactivate (`processingId = "user-a-id"`), lalu user membuka modal cabang
User B, tombol "Simpan" di modal akan terdisable padahal tidak sedang menyimpan apapun.

**Solusi — Pisah state `isBranchSaving`:**

```tsx
// Tambah state dedicated untuk modal cabang
const [processingId, setProcessingId] = useState<string | null>(null);
const [isBranchSaving, setIsBranchSaving] = useState(false);   // ← NEW
const [editingBranchUser, setEditingBranchUser] = useState<AppUser | null>(null);

// handleBranchSave menggunakan setIsBranchSaving, bukan setProcessingId
const handleBranchSave = async (assignedBranchIds: string[]) => {
  if (!editingBranchUser) return;
  setIsBranchSaving(true);   // ← isolated
  try {
    const res = await fetch(`/api/admin/users/${editingBranchUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedBranchIds }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Gagal mengubah cabang");
    }
    toast.success(`Cabang penugasan ${editingBranchUser.name} berhasil diperbarui`);
    setEditingBranchUser(null);
    onAction();
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Gagal mengubah penugasan cabang.");
  } finally {
    setIsBranchSaving(false);  // ← isolated
  }
};

// Modal menerima isBranchSaving, bukan !!processingId
<UserBranchSelectModal
  user={editingBranchUser}
  isOpen={!!editingBranchUser}
  isBusy={isBranchSaving}   // ← fix
  onSave={handleBranchSave}
  onClose={() => setEditingBranchUser(null)}
/>
```

Baris `UserActiveRow` untuk `isBusy` tetap menggunakan `processingId === user.id` (tidak berubah).

---

### FIX-3 — Silent Failure Fetch Branches (`UsersView`)

**Masalah saat ini:**

```tsx
// UsersView.tsx baris 41–57
useEffect(() => {
  fetch("/api/marcom/branches")
    .then((r) => (r.ok ? r.json() : { data: [] }))
    .then((res) => {
      if (Array.isArray(res.data)) {
        setBranches(res.data.map(...));
      }
    })
    .catch((err) => console.error("[UsersView] Failed to fetch branches:", err));
    // ← Gagal senyap, tidak ada feedback ke user
}, []);
```

Masalah:
- Jika API lambat/gagal: kolom Cabang kosong, modal tidak menampilkan branch apapun.
- Supervisor tidak bisa melakukan penugasan sama sekali — sudah terkunci oleh scope check.
- Tidak ada cara user untuk memicu retry tanpa full page reload.

**Solusi — `branchesStatus` state + banner error + retry inline:**

```tsx
// Tambah type dan state
type FetchStatus = "idle" | "loading" | "ok" | "error";

const [branches, setBranches] = useState<BranchLookupItem[]>([]);
const [branchesStatus, setBranchesStatus] = useState<FetchStatus>("idle");  // ← NEW

// Ekstrak ke fungsi yang dapat di-retry
const fetchBranches = useCallback(() => {
  setBranchesStatus("loading");
  fetch("/api/marcom/branches")
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((res) => {
      if (Array.isArray(res.data)) {
        setBranches(
          res.data.map((b: { id: string; name: string; code?: string; region?: string }) => ({
            id: b.id,
            name: b.name,
            code: b.code,
            region: b.region,
          }))
        );
        setBranchesStatus("ok");
      } else {
        setBranchesStatus("error");
      }
    })
    .catch((err) => {
      console.error("[UsersView] Failed to fetch branches:", err);
      setBranchesStatus("error");
    });
}, []);

useEffect(() => {
  fetchBranches();
}, [fetchBranches]);
```

Tampilkan banner error di atas tab content jika `branchesStatus === "error"`:

```tsx
{/* Letakkan di dalam <div className="p-4 sm:p-6 ..."> sebelum tab content */}
{branchesStatus === "error" && (
  <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg
    bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
    <span>
      Data cabang gagal dimuat. Penugasan cabang mungkin tidak tersedia.
    </span>
    <button
      type="button"
      onClick={fetchBranches}
      className="shrink-0 font-semibold underline hover:no-underline"
    >
      Coba Lagi
    </button>
  </div>
)}
```

Ukuran file `UsersView.tsx` sesudah perubahan: estimasi ~175 LOC (tetap ≤ 250 ✅).

---

## 4. Urutan Implementasi

```
FIX-1 (Aksesibilitas)       → paralel bisa dikerjakan bersamaan
FIX-2 (Race condition)      → paralel bisa dikerjakan bersamaan
FIX-3 (Silent failure)      → independen, dikerjakan terakhir
Test update                 → setelah semua fix selesai
```

Tidak ada ketergantungan antar fix — ketiganya dapat dikerjakan secara independen atau bersamaan.

---

## 5. Phased Checklist

### Phase 1 — FIX-1: Aksesibilitas Checkbox

- [x] Edit `ApproveUserModal.tsx`:
  - Hapus `onClick` dari setiap `<label>` dalam blok `assignableBranches.map`
  - Tambah `<input type="checkbox" className="sr-only" checked={isChecked} onChange={() => toggleBranch(branch.id)} />`
  - Tambah `pointer-events-none` pada custom visual checkbox `<div>`
  - Verifikasi file ≤ 250 LOC

- [x] Edit `UserBranchSelectModal.tsx`:
  - Pola perubahan identik dengan `ApproveUserModal.tsx`
  - Verifikasi file ≤ 250 LOC

- [x] Verifikasi manual: Tab key dapat berpindah antar checkbox, Space key dapat toggle state

### Phase 2 — FIX-2: Race Condition `isBusy`

- [x] Edit `UsersActiveTab.tsx`:
  - Tambah `const [isBranchSaving, setIsBranchSaving] = useState(false)`
  - Ganti `setProcessingId(editingBranchUser.id)` → `setIsBranchSaving(true)` di `handleBranchSave`
  - Ganti `setProcessingId(null)` → `setIsBranchSaving(false)` di finally block `handleBranchSave`
  - Ganti prop `isBusy={!!processingId}` → `isBusy={isBranchSaving}` pada `<UserBranchSelectModal>`
  - Verifikasi file ≤ 250 LOC

- [x] Verifikasi: `isBusy` baris (`processingId === user.id`) tidak terpengaruh perubahan ini

### Phase 3 — FIX-3: Silent Failure Branches

- [x] Edit `UsersView.tsx`:
  - Tambah type `FetchStatus = "idle" | "loading" | "ok" | "error"`
  - Tambah state `const [branchesStatus, setBranchesStatus] = useState<FetchStatus>("idle")`
  - Ekstrak fetch menjadi fungsi `fetchBranches` dengan `useCallback([], [])`
  - Tambah setter `setBranchesStatus` di `.then` dan `.catch`
  - Tambah banner error + tombol "Coba Lagi" di JSX
  - Verifikasi file ≤ 250 LOC

### Phase 4 — Test & Verification

- [x] Jalankan seluruh test suite: `npm test`
  - Pastikan `userBranchAssignment.test.ts` LOC invariant masih pass untuk semua file
- [x] Jalankan lint: `npm run lint`
- [x] Jalankan build: `npm run build`
- [x] Verifikasi tidak ada regresi: 733 tests pass, 0 fail

---

## 6. Acceptance Criteria

| # | Kriteria | Cara Verifikasi |
|---|----------|-----------------|
| AC-1 | Checkbox branch dapat di-toggle dengan tombol Space dan dikunjungi dengan Tab | Manual browser + axe DevTools |
| AC-2 | Screen reader mengumumkan "checked"/"unchecked" saat toggle | VoiceOver / NVDA test |
| AC-3 | Membuka modal cabang saat row lain sedang diproses tidak memblokir tombol Simpan | Manual: deactivate user A, buka modal user B |
| AC-4 | Jika fetch `/api/marcom/branches` gagal, banner error muncul dengan tombol "Coba Lagi" | Mock network failure di DevTools |
| AC-5 | Klik "Coba Lagi" memicu ulang fetch dan menutup banner jika berhasil | Manual setelah jaringan dipulihkan |
| AC-6 | Semua file coordinator tetap ≤ 250 LOC | `npm test` (LOC invariant test) |
| AC-7 | Full test suite: 733 pass, 0 fail | `npm test` |
| AC-8 | ESLint: 0 error, 0 warning | `npm run lint` |
| AC-9 | Build: sukses tanpa error | `npm run build` |
