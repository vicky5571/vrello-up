# Design Specification — Fitur Maps & Shareloc pada Placement Marketing

## 1. Latar Belakang & Masalah

Pada modul operasional Marcom di **vrello-up**, tim lapangan memasang berbagai materi promosi/branding (*placements*) di berbagai outlet fisik (spanduk, neon box, banner, tent card, poster).

* **Ketiadaan Data Lokasi Akurat**: Data placement sebelumnya hanya mengacu pada nama outlet tanpa titik koordinat geografis presisi (latitude & longitude) dari posisi instalasi materi promosi tersebut.
* **Kebutuhan Monitoring Lapangan**: Supervisor dan tim Marcom membutuhkan kemampuan melihat sebaran seluruh titik penempatan (*placements*) dalam satu tampilan peta interaktif (*Map View*).
* **Kemudahan Input dari Lapangan (Shareloc)**: PIC lapangan sering membagikan lokasi via WhatsApp atau Google Maps share link saat survei atau pemasangan. Sistem harus mampu menerima link shareloc tersebut, mengekstrak koordinatnya secara otomatis, atau mengambil koordinat GPS perangkat langsung dengan 1 klik.

---

## 2. Arsitektur Solusi (Leaflet + OpenStreetMap)

1. **Leaflet & OpenStreetMap (Zero API Cost & Frictionless)**:
   * Menggunakan library Leaflet dan tile layer OpenStreetMap yang 100% open-source dan gratis tanpa memerlukan kartu kredit atau konfigurasi API Key Google Cloud Console.
   * Dimuat secara dinamis via Next.js Dynamic Import (`ssr: false`) untuk mencegah error rendering server (*window is not defined*).
2. **Multi-Channel Input Shareloc**:
   * **Paste Link**: Mendeteksi link Google Maps panjang, koordinat teks (`lat, lng`), serta URL pendek (`maps.app.goo.gl` via resolver endpoint serverless).
   * **Device GPS**: Tombol *"Ambil Lokasi GPS Saat Ini"* memanfaatkan `navigator.geolocation` berakurasi tinggi (± meter).
   * **Interactive Mini-Picker**: Mini-map interaktif di dalam modal untuk menggeser atau mengklik titik pin lokasi dengan presisi visual.
3. **Placements Map View**:
   * Toggle tab di bagian header `PlacementsView`: `[ Table View ]` dan `[ Map View ]`.
   * Peta otomatis memusatkan dan menyesuaikan zoom (*auto-fit bounds*) ke seluruh marker placement yang aktif.
   * Marker kustom dengan kode warna status:
     * `NOT_STARTED` = Abu-abu (Slate)
     * `ON_PROGRESS` = Oranye / Amber
     * `DONE` = Hijau (Emerald)
     * `ISSUE` = Merah (Rose)
   * Sinkronisasi penuh dengan chip filter status (`ALL`, `NOT_STARTED`, `ON_PROGRESS`, `DONE`, `ISSUE`) dan kotak pencarian (*search bar*).
   * Popup interaktif saat marker diklik: Nama Outlet, Nama Material, Status, PIC, Dimensi, Biaya, Foto Proof, tombol **Edit**, tombol **Track as Task**, dan tombol **Buka Rute Google Maps**.
   * Panel / Tray *"Placements Tanpa Lokasi"* untuk mempermudah identifikasi dan melengkapi data penempatan yang belum memiliki titik peta.

---

## 3. Perubahan Schema & Database

### A. Prisma Schema ([`prisma/schema.prisma`](file:///Users/mac/Web%20Development/vrello-up/prisma/schema.prisma))
Menambahkan kolom koordinat dan lokasi pada model `Placement`:
```prisma
model Placement {
  id               String          @id @default(cuid())
  workspaceId      String          @default("ws-main")
  workspace        WorkspaceItem   @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  outletId         String
  outlet           Outlet          @relation(fields: [outletId], references: [id], onDelete: Cascade)
  materialId       String
  material         Material        @relation(fields: [materialId], references: [id])
  status           PlacementStatus @default(NOT_STARTED)
  date             DateTime?
  picName          String          @default("")
  photoUrl         String          @default("")
  dimensions       String          @default("")
  cost             Float           @default(0)
  notes            String          @default("")

  // Ekstensi Peta & Shareloc:
  latitude         Float?
  longitude        Float?
  shareLocationUrl String          @default("")
  locationNotes    String          @default("")

  @@index([workspaceId])
}
```

### B. TypeScript Interface ([`src/types/index.ts`](file:///Users/mac/Web%20Development/vrello-up/src/types/index.ts))
```typescript
export interface Placement {
  id: string;
  workspaceId?: string;
  outletId: string;
  materialId: string;
  status: PlacementStatus;
  date?: string | null;
  picName?: string;
  photoUrl?: string;
  dimensions?: string;
  cost?: number;
  notes?: string;
  latitude?: number | null;
  longitude?: number | null;
  shareLocationUrl?: string;
  locationNotes?: string;
  outlet?: { id: string; code: string; name: string };
  material?: { id: string; type: string; name: string };
}
```

---

## 4. Utilitas Pure Functions ([`src/lib/marcom/locationUtils.ts`](file:///Users/mac/Web%20Development/vrello-up/src/lib/marcom/locationUtils.ts))

Modul utilitas terisolasi yang dapat diuji secara deterministik:
1. **`parseCoordinatesFromText(text: string)`**:
   * Mendeteksi format koordinat angka mentah (contoh: `"-6.2087634, 106.845599"`).
2. **`parseGoogleMapsUrl(url: string)`**:
   * Mengekstrak latitude dan longitude dari pola URL Google Maps:
     * `/@(-?\d+\.\d+),(-?\d+\.\d+)`
     * `[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)`
     * `[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)`
     * `[?&]daddr=(-?\d+\.\d+),(-?\d+\.\d+)`
3. **`isValidCoordinate(lat: number, lng: number)`**:
   * Memvalidasi batas geografis dunia (`-90 <= lat <= 90` dan `-180 <= lng <= 180`).
4. **`buildGoogleMapsUrl(lat: number, lng: number, label?: string)`**:
   * Menghasilkan URL navigasi Google Maps: `https://www.google.com/maps/search/?api=1&query={lat},{lng}`.

---

## 5. API Endpoints

1. **`POST /api/marcom/placements` & `PATCH /api/marcom/placements/[id]`**:
   * Menerima payload: `latitude`, `longitude`, `shareLocationUrl`, `locationNotes`.
   * Memvalidasi koordinat sebelum persistensi ke Prisma.
2. **`GET /api/marcom/resolve-location?url=...`**:
   * Endpoint server-side ringan untuk menyelesaikan URL pendek (`maps.app.goo.gl` / `goo.gl/maps`) dengan mengikuti HTTP redirect 301/302 tanpa terkena batasan CORS browser, mengembalikan koordinat yang terurai.

---

## 6. Komponen Antarmuka Pengguna (UI Components)

1. **`LocationPickerModal` / `LocationFieldGroup`** (`src/components/views/PlacementsView/LocationPicker.tsx`):
   * Input teks untuk paste URL shareloc / koordinat manual.
   * Tombol *"Gunakan GPS Saat Ini"* dengan indikator akurasi dan status loading.
   * Mini-map Leaflet interaktif untuk menggeser pin lokasi visual.
   * Input catatan patokan lokasi ("Lantai 1 dekat pintu masuk").
2. **`PlacementsMapView`** (`src/components/views/PlacementsView/PlacementsMapView.tsx`):
   * Peta utama Leaflet (OpenStreetMap tiles) dengan kontrol zoom dan tombol *"Center to All Pins"*.
   * Marker SVG kustom berwarna status (`NOT_STARTED` = Slate, `ON_PROGRESS` = Amber, `DONE` = Emerald, `ISSUE` = Rose).
   * Popup interaktif: Nama Outlet, Material, Dimensi, PIC, Foto Bukti, tombol Buka Navigasi, Edit, dan Track as Task.
   * Drawer samping / Tray *"Placements Tanpa Lokasi"* yang dapat dibuka/tutup dengan tombol aksi cepat *"Set Lokasi"*.
3. **`PlacementsView`** (`src/components/views/PlacementsView/PlacementsView.tsx`):
   * Integrasi tombol toggle tab di header: `Table View` dan `Map View`.
   * Sinkronisasi filter status dan pencarian antara kedua tampilan.

---

## 7. Rencana Pengujian & Verifikasi

1. **Unit Test Otomatis (`src/lib/marcom/locationUtils.test.ts`)**:
   * Test parsing koordinat string langsung.
   * Test parsing berbagai variasi URL Google Maps.
   * Test validasi koordinat valid vs tidak valid.
   * Test pembuatan URL Google Maps navigasi.
   * Jalankan `npm test` untuk memverifikasi seluruh 105+ unit test lulus tanpa regresi.
2. **Verifikasi Fungsional UI**:
   * Tes penambahan placement dengan paste link shareloc.
   * Tes tombol GPS saat ini pada modal.
   * Tes klik pin di mini map picker.
   * Tes peralihan antara Table View dan Map View.
   * Tes filter status pada Map View.
   * Tes aksi popup marker (Buka Google Maps, Edit Placement, Track as Task).
   * Tes tray placement tanpa lokasi.
