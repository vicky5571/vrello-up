# Design Specification — Scoping workspaceId pada Marcom Work Items

## 1. Latar Belakang & Masalah

Di arsitektur awal, seluruh entitas modul Marcom (`FieldEvent`, `ContentPost`, `Placement`, `Mou`, `MonthlyReport`, `DocumentItem`, `Branch`, `Outlet`, `Material`) dideklarasikan tanpa kolom `workspaceId`. 

Berdasarkan analisis klasifikasi data:
- **Master Data** (`Branch`, `Outlet`, `Material`) bersifat fondasi fisik/organisasi perusahaan yang berumur panjang dan statis, sehingga tetap di-share secara global.
- **Work Items** (`FieldEvent`, `ContentPost`, `Placement`, `Mou`, `MonthlyReport`, `DocumentItem`) adalah pekerjaan operasional yang memiliki *lifecycle* progres, tenggat waktu, PIC, dan anggaran. Work items ini **wajib memiliki `workspaceId`** agar data operasional terisolasi per workspace, dan pembersihan data (*cascading cleanup*) dapat berjalan bersih saat sebuah workspace dihapus.

---

## 2. Arsitektur Database & Model Prisma

### 2.1. Skema Prisma ([`prisma/schema.prisma`](file:///Users/mac/Web%20Development/vrello-up/prisma/schema.prisma))

Setiap model work item ditambahkan kolom `workspaceId String @default("ws-main")` dengan relasi foreign key ke `WorkspaceItem` dan aturan `onDelete: Cascade`:

1. **`WorkspaceItem`**:
   ```prisma
   model WorkspaceItem {
     id             String          @id @default(cuid())
     name           String
     avatar         String          @default("")
     members        Json            @default("[]")
     spaces         SpaceItem[]
     placements     Placement[]
     mous           Mou[]
     fieldEvents    FieldEvent[]
     marcomEvents   MarcomEvent[]
     contentPosts   ContentPost[]
     monthlyReports MonthlyReport[]
     documents      DocumentItem[]
     createdAt      DateTime        @default(now())
     updatedAt      DateTime        @updatedAt
   }
   ```

2. **Work Item Models (`Placement`, `Mou`, `FieldEvent`, `MarcomEvent`, `ContentPost`, `MonthlyReport`, `DocumentItem`)**:
   ```prisma
     workspaceId String        @default("ws-main")
     workspace   WorkspaceItem @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

     @@index([workspaceId])
   ```

3. **Migrasi / Sinkronisasi**:
   Diterapkan ke database PostgreSQL melalui `npx prisma db push`. Penggunaan `@default("ws-main")` menjamin tidak ada data eksisting yang hilang atau error saat migrasi.

---

## 3. Domain Types ([`src/types/index.ts`](file:///Users/mac/Web%20Development/vrello-up/src/types/index.ts))

Menambahkan properti opsional `workspaceId?: string;` pada tipe-tipe berikut:
- `Placement`
- `Mou`
- `FieldEventItem` / `FieldEvent` / `MarcomEvent`
- `ContentPost`
- `MonthlyReport`
- `DocumentItem`

---

## 4. API Endpoints & RBAC Authorization

Semua rute REST API di bawah `/api/marcom/*` untuk entitas work item menerapkan tenant scoping dan guard otorisasi terpusat via `requireWorkspaceAccess` dari [`src/lib/server/workspaceAuth.ts`](file:///Users/mac/Web%20Development/vrello-up/src/lib/server/workspaceAuth.ts):

### 4.1. Pola Handler `GET`
```typescript
const { searchParams } = new URL(request.url);
const workspaceId = searchParams.get("workspaceId") || "ws-main";

const authError = await requireWorkspaceAccess(workspaceId, {
  requiredRole: "viewer",
  request,
});
if (authError) return authError;

const items = await prisma.modelName.findMany({
  where: {
    workspaceId,
    ...otherFilters,
  },
});
```

### 4.2. Pola Handler `POST`
```typescript
const body = await request.json();
const workspaceId = body.workspaceId || "ws-main";

const authError = await requireWorkspaceAccess(workspaceId, {
  requiredRole: "staff",
  request,
});
if (authError) return authError;

const newItem = await prisma.modelName.create({
  data: {
    ...body,
    workspaceId,
  },
});
```

### 4.3. Pola Handler `PATCH` & `DELETE`
```typescript
const existing = await prisma.modelName.findUnique({ where: { id } });
if (!existing) {
  return NextResponse.json({ error: "Item not found" }, { status: 404 });
}

const authError = await requireWorkspaceAccess(existing.workspaceId, {
  requiredRole: "staff",
  request,
});
if (authError) return authError;
```

---

## 5. Integrasi Frontend UI Views

Setiap komponen tampilan Marcom mengaitkan data dengan workspace aktif dari Zustand store:

1. **Pengambilan Workspace Aktif**:
   ```typescript
   const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
   ```

2. **Fetching Data**:
   ```typescript
   fetch(`/api/marcom/events?workspaceId=${encodeURIComponent(activeWorkspaceId)}`)
   ```

3. **Pembuatan Item Baru**:
   ```typescript
   fetch(`/api/marcom/events`, {
     method: "POST",
     body: JSON.stringify({ ...eventData, workspaceId: activeWorkspaceId }),
   })
   ```

4. **Reaktivitas Antar-Workspace**:
   Menambahkan `activeWorkspaceId` ke dalam dependency array `useEffect` di setiap view (`EventsView`, `ContentPlannerView`, `PlacementsView`, `MousView`, `ReportsView`, `DocumentsView`), sehingga perpindahan workspace di `TopNav` langsung memperbarui data yang ditampilkan.

---

## 6. Rencana Verifikasi

1. **Database Push**:
   `npx prisma db push` berhasil diterapkan tanpa error constraint.
2. **Type Checking**:
   `npx tsc --noEmit` lolos tanpa error.
3. **Unit Tests**:
   Menambahkan unit test baru untuk memverifikasi isolasi query Marcom work items per `workspaceId` dan cascade delete saat workspace dihapus.
4. **Full Test Suite**:
   `npm test` lolos 100% untuk seluruh unit test di proyek.

