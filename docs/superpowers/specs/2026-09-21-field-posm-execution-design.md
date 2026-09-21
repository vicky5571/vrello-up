# Spesifikasi Desain: Modul Eksekusi POSM Lapangan & Geofencing (Fase 1)

**Tanggal:** 2026-09-21  
**Status:** Draf Terverifikasi (Siap Review)  
**Dokumen Referensi:** Transkrip Pembahasan PIC Regional Jateng & Tech Lead (`vrello-up`)

---

## 1. Latar Belakang & Tujuan Bisnis

Berdasarkan hasil diskusi teknis lapangan regional Jawa Tengah:
1. **Kebutuhan Lapangan (Sales):** Eksekusi cepat dengan alur 4 langkah sederhana: *Pilih Outlet* ➔ *Pasang Material* ➔ *Foto Bukti* ➔ *Upload & Validasi Lokasi*.
2. **Skala Master Data:** Terdapat ~25.000 outlet dan ~800 tenaga sales di Jawa Tengah. Dropdown `<select>` konvensional di browser tidak mampu menangani puluhan ribu data tanpa membeku (*freeze*). Dibutuhkan *server-side debounced search* yang mendukung pencarian presisi via ID Toko maupun pencarian nama outlet.
3. **Validasi Lokasi & Efisiensi Biaya ($0 Maps):** Pengambilan bukti foto wajib dilakukan di lokasi fisik outlet dengan toleransi deviasi GPS hingga 100 meter. Penggunaan Google Maps API ($7 / 1.000 request) dihindari demi efisiensi biaya operasional, digantikan oleh OpenStreetMap (Leaflet) bebas biaya lisensi.
4. **Klasifikasi 2 Dimensi:** Pemasangan materi promosi (POSM) harus tercatat berdasarkan:
   - **Jenis POSM:** Poster, Shop Blind (Penutup Toko), Stiker Etalase, Bottom Etalase, Shop Sign (Neonbox), Banner.
   - **Periode & Tema:** Kuartal alokasi (misal: *Q3 2026*) dan sub-tema kampanye (*Product Hero*, *Gemini*, dll.).
5. **Aturan Bisnis MOU:**
   - Jika pemasangan berbayar / ada biaya sewa (`cost > 0`), wajib memiliki dokumen MOU yang sah.
   - Jika material bernilai aset tinggi (Shop Sign / Neonbox), dianjurkan/diwajibkan MOU proteksi aset meskipun tanpa biaya sewa (`cost == 0`).
   - Material ringan tanpa biaya sewa (Poster, Stiker, Shop Blind standar) bebas tanpa kewajiban MOU.

---

## 2. Ruang Lingkup (Scope)

### Dalam Cakupan (Fase 1 - Core Field POSM Flow)
- Penambahan atribut `quarter`, `campaignTheme`, `isLocationValid`, dan `locationDeviation` pada model `Placement`.
- Standardisasi katalog materi promosi POSM di `Material` model dan frontend.
- Optimasi endpoint pencarian `GET /api/marcom/outlets?q=` (debounced, pencarian ganda `code` dan `name`, pagination limit 15).
- Komponen UI `OutletSearchCombobox` untuk pencarian outlet yang cepat, ringan, dan ramah mobile.
- Rumus Haversine murni (`calculateHaversineDistanceMeters`) dan penegakan batas toleransi 100m di `src/lib/marcom/locationUtils.ts`.
- Validasi aturan MOU dinamis berdasarkan nominal biaya (`cost > 0`) dan jenis material di `src/lib/marcom/placementMouBridge.ts`.
- Peta preview OpenStreetMap / Leaflet interaktif ($0 cost) dengan visualisasi titik outlet, titik sales, dan radius lingkaran 100m.
- Unit test komprehensif menggunakan native Node test runner (`node --test`).

### Di Luar Cakupan (Ditunda ke Fase Berikutnya)
- **Fase 2:** Alur pengajuan toko baru (*Draft Outlet*) oleh sales dan antarmuka persetujuan (*Approval*) oleh atasan/admin regional.
- **Fase 3:** Dashboard rekap laporan kuartal regional dan isolasi bucket penyimpanan media foto placement vs video berat marketing.
- **Fase 4:** Modul Field Event Management dan kalender terintegrasi (sesuai kesepakatan audio: *"fokus dulu ke POSM"*).

---

## 3. Desain Arsitektur & Model Data

### 3.1 Perubahan Skema Prisma (`prisma/schema.prisma`)
Pada model `Placement`:
```prisma
model Placement {
  id               String          @id @default(cuid())
  workspaceId      String          @default("ws-main")
  workspace        WorkspaceItem   @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  outletId         String
  outlet           Outlet          @relation(fields: [outletId], references: [id], onDelete: Cascade)
  materialId       String
  material         Material        @relation(fields: [materialId], references: [id])
  mouId            String?
  mou              Mou?            @relation(fields: [mouId], references: [id], onDelete: SetNull)
  status           PlacementStatus @default(NOT_STARTED)
  brand            String          @default("IM3")
  date             DateTime?
  picName          String          @default("")
  photoUrl         String          @default("")
  dimensions       String          @default("")
  cost             Float           @default(0)
  notes            String          @default("")

  // Koordinat aktual saat eksekusi sales
  latitude         Float?
  longitude        Float?
  shareLocationUrl String          @default("")
  locationNotes    String          @default("")

  // --- FIELD BARU (FASE 1) ---
  quarter          String          @default("Q3 2026")
  campaignTheme    String          @default("")
  isLocationValid  Boolean         @default(true)
  locationDeviation Float?

  @@index([workspaceId])
  @@index([mouId])
  @@index([outletId])
  @@index([materialId])
  @@index([quarter])
  @@index([campaignTheme])
}
```

### 3.2 Pembaruan Tipe Domain (`src/types/index.ts`)
Interface `Placement` dan `MarcomPlacement` disinkronkan:
```typescript
export interface MarcomPlacement {
  id: string;
  workspaceId?: string;
  outletId: string;
  materialId: string;
  mouId?: string | null;
  status: PlacementStatus;
  brand?: "IM3" | "3" | string;
  date: string | null;
  picName: string;
  photoUrl: string;
  dimensions: string;
  cost: number;
  notes: string;
  latitude?: number | null;
  longitude?: number | null;
  shareLocationUrl?: string;
  locationNotes?: string;
  
  // New domain attributes
  quarter?: string;
  campaignTheme?: string;
  isLocationValid?: boolean;
  locationDeviation?: number | null;

  outlet?: { id: string; code: string; name: string; brand?: string; latitude?: number | null; longitude?: number | null; address?: string };
  material?: { id: string; type: string; name: string; requiresMou?: boolean };
  mou?: { id: string; partnerName: string; status: string; compensationValue?: number } | null;
}
```

---

## 4. Logika Bisnis & Komponen Backend

### 4.1 Pencarian Outlet Server-Side (`src/app/api/marcom/outlets/route.ts`)
Mendukung pencarian cepat untuk basis data 25.000 outlet:
```typescript
const q = searchParams.get("q")?.trim();
const limit = Math.min(Number(searchParams.get("limit")) || 15, 50);

const where: Prisma.OutletWhereInput = {
  active: true,
  ...(branchId ? { branchId } : {}),
};

if (q) {
  where.OR = [
    { code: { contains: q, mode: "insensitive" } },
    { name: { contains: q, mode: "insensitive" } },
  ];
}

const outlets = await prisma.outlet.findMany({
  where,
  take: limit,
  orderBy: { name: "asc" },
  select: {
    id: true,
    code: true,
    name: true,
    address: true,
    city: true,
    latitude: true,
    longitude: true,
    brand: true,
    picName: true,
    branch: { select: { id: true, name: true } },
    placements: {
      select: { id: true, material: { select: { name: true } }, status: true },
      take: 5,
      orderBy: { id: "desc" },
    },
  },
});
```

### 4.2 Perhitungan Jarak & Toleransi Geofencing (`src/lib/marcom/locationUtils.ts`)
```typescript
export const GEOFENCE_TOLERANCE_METERS = 100;

export function calculateHaversineDistanceMeters(
  coord1: { latitude: number; longitude: number },
  coord2: { latitude: number; longitude: number }
): number {
  const R = 6371e3; // Radius bumi dalam meter
  const lat1Rad = (coord1.latitude * Math.PI) / 180;
  const lat2Rad = (coord2.latitude * Math.PI) / 180;
  const deltaLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export function evaluateGeofenceStatus(
  outletCoords?: { latitude?: number | null; longitude?: number | null } | null,
  salesCoords?: { latitude?: number | null; longitude?: number | null } | null,
  toleranceMeters = GEOFENCE_TOLERANCE_METERS
): {
  isValid: boolean;
  deviationMeters: number | null;
  message: string;
} {
  if (!outletCoords?.latitude || !outletCoords?.longitude) {
    return {
      isValid: true,
      deviationMeters: null,
      message: "Koordinat outlet belum terdaftar di sistem.",
    };
  }
  if (!salesCoords?.latitude || !salesCoords?.longitude) {
    return {
      isValid: false,
      deviationMeters: null,
      message: "Lokasi GPS sales belum terdeteksi. Silakan aktifkan GPS.",
    };
  }

  const dist = calculateHaversineDistanceMeters(
    { latitude: outletCoords.latitude, longitude: outletCoords.longitude },
    { latitude: salesCoords.latitude, longitude: salesCoords.longitude }
  );

  const isValid = dist <= toleranceMeters;
  return {
    isValid,
    deviationMeters: dist,
    message: isValid
      ? `Valid: Berada di lokasi (${dist}m dari titik outlet terdaftar).`
      : `Peringatan: Posisi sales berjarak ${dist}m dari outlet (melebihi toleransi ${toleranceMeters}m).`,
  };
}
```

### 4.3 Logika Validasi MOU Berdasarkan Biaya & Aset (`src/lib/marcom/placementMouBridge.ts`)
```typescript
export function validatePlacementMouRequirement(params: {
  materialName?: string | null;
  materialType?: string | null;
  requiresMou?: boolean | null;
  cost?: number | null;
  selectedMou?: MouSummaryInfo | null;
  outletMousCount?: number;
}): MouValidationResult {
  const cost = Number(params.cost) || 0;
  const isHighValue = isPermanentMaterial({
    name: params.materialName,
    type: params.materialType,
    requiresMou: params.requiresMou,
  });

  // Aturan 1: Setiap placement berbayar WAJIB memiliki MOU
  if (cost > 0) {
    if (!params.selectedMou) {
      return {
        severity: "warning",
        message: "Pemasangan dengan kompensasi sewa (> Rp 0) WAJIB menautkan dokumen MOU yang disetujui.",
        requiresMou: true,
      };
    }
    return {
      severity: "success",
      message: `Terhubung ke MOU Berbayar: ${params.selectedMou.partnerName || params.selectedMou.id}`,
      requiresMou: true,
    };
  }

  // Aturan 2: Material bernilai aset tinggi (Shop Sign) disarankan/memerlukan MOU proteksi aset
  if (isHighValue) {
    if (!params.selectedMou) {
      return {
        severity: "warning",
        message: "Material Shop Sign/Signboard bernilai tinggi dianjurkan memiliki MOU sebagai proteksi aset.",
        requiresMou: true,
      };
    }
    return {
      severity: "success",
      message: `MOU Proteksi Aset Terpasang: ${params.selectedMou.partnerName || params.selectedMou.id}`,
      requiresMou: true,
    };
  }

  // Aturan 3: Pemasangan material ringan gratis (Poster, Stiker, Bottom Etalase, Shopblind standar)
  return {
    severity: "none",
    message: "Material insidentil/ringan (bebas kewajiban MOU sewa).",
    requiresMou: false,
  };
}
```

---

## 5. Desain Komponen Antarmuka Pengguna (UI/UX)

1. **`OutletSearchCombobox.tsx`**:
   - Komponen pencarian khusus yang menerima `query`, melakukan `fetch` debounced 300ms ke `/api/marcom/outlets?q=...`.
   - Menampilkan badge ID Toko yang kontras dan nama toko yang menonjol.
   - Menampilkan preview riwayat pemasangan sebelumnya pada outlet terpilih.
2. **Restrukturisasi `PlacementFormModal.tsx`**:
   - Form responsif mobile dengan tab atau sekuens 4 langkah:
     1. Pilih Outlet.
     2. Pilih Material & Tema Kampanye.
     3. Unggah Foto Bukti.
     4. Verifikasi GPS & OpenStreetMap.
3. **Peta OpenStreetMap Bebas Biaya (`LocationPicker.tsx` / Leaflet Canvas)**:
   - Tile provider: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`.
   - Menggambar titik koordinat outlet resmi, titik posisi sales saat ini, dan lingkaran batas 100 meter.
   - Indikator warna dinamis: Hijau jika di dalam 100m, Kuning/Merah jika deviasi > 100m.

---

## 6. Rencana Verifikasi & Pengujian

### 6.1 Pengujian Unit Otomatis (`node --test`)
- **`src/lib/marcom/locationUtils.test.ts`**:
  - Test kalkulasi jarak Haversine (0m, 50m, 98m, 102m, 500m).
  - Test fungsi `evaluateGeofenceStatus` untuk skenario valid, deviasi, koordinat kosong.
- **`src/lib/marcom/placementMouBridge.test.ts`**:
  - Test rule biaya: `cost > 0` tanpa MOU -> warning wajib MOU.
  - Test rule material tinggi: `Shop Sign` dengan `cost == 0` -> warning anjuran MOU proteksi aset.
  - Test rule material ringan: `Poster` dengan `cost == 0` -> none (bebas MOU).
- **`src/app/api/marcom/outlets/outletsSearch.test.ts`**:
  - Test filter pencarian kode (ID) dan nama outlet.
  - Test limitasi jumlah data (max 15).

### 6.2 Verifikasi Regresi
- Menjalankan seluruh test suite proyek: `npm test`.
- Memastikan semua 328+ tes berstatus lulus (0 failures).
