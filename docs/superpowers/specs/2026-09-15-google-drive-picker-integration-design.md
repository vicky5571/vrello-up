# Design Specification — Integrasi Google Drive & Picker untuk Footage & Aset Marcom

## 1. Latar Belakang & Masalah

Pada modul operasional Marcom dan manajemen Task:
* **Ukuran File Footage Besar**: Video footage acara (B-roll, liputan mall roadshow, aset media sosial) umumnya berukuran besar (ratusan MB hingga puluhan GB).
* **Keterbatasan Serverless / Hosting**:
  * Mengunggah langsung ke server aplikasi via multipart upload dibatasi oleh batas payload serverless hosting (misal: limit 4.5 MB di Vercel).
  * Menyimpan file di disk lokal server (`uploads/`) tidak *persistent* di platform serverless (*ephemeral filesystem*) dan memakan biaya disk/bandwidth (*egress fee*) yang mahal di VPS.
* **Solusi Organisasi**: Tim kantor sudah memiliki akun **Google Workspace** (dengan kuota Shared Drive terpusat). Diperlukan integrasi yang memungkinkan tim menautkan dan mengunggah footage langsung ke Google Drive perusahaan tanpa membebani server aplikasi.

---

## 2. Arsitektur Solusi (Pendekatan Hybrid)

Menggunakan pola arsitektur **Modular Hybrid**:
1. **Google Picker API Resmi**:
   * Jika kredensial terkonfigurasi (`NEXT_PUBLIC_GOOGLE_CLIENT_ID` & `NEXT_PUBLIC_GOOGLE_API_KEY`), aplikasi menampilkan dialog pop-up resmi Google Picker.
   * Mendukung browsing **Shared Drive kantor** (`Feature.SUPPORT_DRIVES`).
   * Mendukung **Direct Drag-and-Drop Upload** (`DocsUploadView`) yang mengunggah file langsung dari browser user ke infrastruktur Google (0 bytes membebani server Next.js).
2. **Smart Fallback Link Modal**:
   * Jika kredensial Google Cloud belum dipasang, tombol secara anggun membuka modal mini penempelan link Google Drive.
   * Dilengkapi parser real-time yang memvalidasi link file/folder dan mengekstrak ID unik Google Drive.
3. **In-App Embedded Player**:
   * Memungkinkan pemutaran video footage 1080p langsung di dalam Task Drawer menggunakan player embed resmi Google (`https://drive.google.com/file/d/{id}/preview`).

---

## 3. Model Data & Tipe Domain ([`src/types/index.ts`](file:///Users/mac/Web%20Development/vrello-up/src/types/index.ts))

Memperluas interface `TaskAttachment` untuk menyimpan atribut Google Drive secara opsional:

```typescript
export interface TaskAttachment {
  id: string;
  name: string;
  sizeBytes: number;
  type: "video" | "image" | "document" | "other";
  url: string;             // Web view link atau URL embed
  uploadedAt: string;
  // Ekstensi Google Drive:
  source?: "local" | "gdrive";
  driveFileId?: string;    // ID unik file Google Drive
  thumbnailUrl?: string;   // URL thumbnail resmi dari Google
  isSharedFolder?: boolean;// Menandakan tautan berupa satu folder penuh B-roll
}
```

---

## 4. Utilitas Pure Functions ([`src/lib/marcom/googleDriveUtils.ts`](file:///Users/mac/Web%20Development/vrello-up/src/lib/marcom/googleDriveUtils.ts))

Menyediakan fungsi terisolasi yang dapat diuji secara deterministik:

1. **`parseGoogleDriveUrl(url: string)`**:
   * Mendeteksi format URL file:
     * `https://drive.google.com/file/d/{id}/view...`
     * `https://drive.google.com/open?id={id}`
     * `https://drive.google.com/uc?id={id}`
   * Mendeteksi format URL folder:
     * `https://drive.google.com/drive/folders/{id}`
     * `https://drive.google.com/drive/u/0/folders/{id}`
   * Mengembalikan:
     ```typescript
     {
       isValid: boolean;
       id: string | null;
       kind: "file" | "folder" | null;
       embedUrl: string | null; // https://drive.google.com/file/d/{id}/preview
       viewUrl: string;
     }
     ```

2. **`getGoogleDriveMimeCategory(mimeType: string, filename?: string)`**:
   * Memetakan Google MIME type (`video/mp4`, `image/png`, `application/pdf`, `application/vnd.google-apps.folder`) ke tipe standar `"video" | "image" | "document" | "other"`.

---

## 5. Hook Integrasi: `src/lib/marcom/useGoogleDrivePicker.ts`

Hook React modular yang mengelola siklus hidup Google API:
* **State & Deteksi**:
  * Mengevaluasi `isConfigured = Boolean(clientId && apiKey)`.
* **Dynamic Script Loader**:
  * Memuat script `https://apis.google.com/js/api.js` (`gapi`) dan `https://accounts.google.com/gsi/client` (`google.accounts.oauth2`) hanya saat user pertama kali memicu tombol Google Drive.
* **Picker Builder Setup**:
  * Mengatur scope `https://www.googleapis.com/auth/drive.file`.
  * `.enableFeature(google.picker.Feature.SUPPORT_DRIVES)`
  * `.addView(new google.picker.DocsView(google.picker.ViewId.DOCS))`
  * `.addView(new google.picker.DocsUploadView())` *(dengan opsi `.setParent(folderId)` jika `NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID` diisi)*.
  * Callback pemilih memetakan dokumen ke `TaskAttachment[]`.
* **Fallback Trigger**:
  * Jika `!isConfigured`, mengaktifkan modal fallback state.

---

## 6. Komponen Antarmuka Pengguna (UI)

### 6.1. Modal Fallback ([`src/components/ui/GoogleDriveLinkModal.tsx`](file:///Users/mac/Web%20Development/vrello-up/src/components/ui/GoogleDriveLinkModal.tsx))
* Input field untuk menempelkan URL file atau folder Google Drive.
* Validasi visual real-time (ikon tipe file, status validasi).
* Input kustom judul lampiran (opsional).
* Tip informatif cara mengaktifkan pop-up Google Picker resmi via `.env`.

### 6.2. Modal Pemutar Video / Pratinjau ([`src/components/ui/GoogleDrivePreviewModal.tsx`](file:///Users/mac/Web%20Development/vrello-up/src/components/ui/GoogleDrivePreviewModal.tsx))
* Modal responsif dengan aspek rasio 16:9 untuk memutar video atau membaca dokumen PDF.
* Menggunakan iframe `https://drive.google.com/file/d/{driveFileId}/preview` dengan izin `allow="autoplay; fullscreen"`.
* Tombol aksi: "Buka di Google Drive" dan tombol "Tutup".

### 6.3. Integrasi Task Drawer ([`src/components/tasks/TaskDrawer.tsx`](file:///Users/mac/Web%20Development/vrello-up/src/components/tasks/TaskDrawer.tsx))
* Di samping area dropzone lokal, menambahkan tombol aksi: **"Google Drive / Shared Drive"** (dengan ikon Google Drive).
* Pada daftar lampiran:
  * Lampiran dari Google Drive menampilkan badge identitas `Google Drive`.
  * Tombol Play (▶️) langsung membuka `GoogleDrivePreviewModal` untuk memutar video.
  * Tetap mendukung aksi "Set as Cover" dan "Hapus".

### 6.4. Integrasi Content Planner ([`src/components/views/ContentPlannerView/ContentPlannerView.tsx`](file:///Users/mac/Web%20Development/vrello-up/src/components/views/ContentPlannerView/ContentPlannerView.tsx))
* Pada modal Create/Edit Postingan, menambahkan tombol pintas **"Ambil dari Google Drive"** di sebelah field "Media / Thumbnail URL".
* Mengisi `mediaUrl` secara instan dari file atau thumbnail yang dipilih.

---

## 7. Variabel Lingkungan ([`.env.example`](file:///Users/mac/Web%20Development/vrello-up/.env.example))

```bash
# Google Drive & Picker Integration (Optional, enables native Drive pop-up)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=""
NEXT_PUBLIC_GOOGLE_API_KEY=""
NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID=""
```

---

## 8. Rencana Verifikasi & Pengujian

1. **Unit Test Pure Functions**:
   * Berkas: `src/lib/marcom/googleDriveUtils.test.ts`.
   * Menguji parsing berbagai format URL Google Drive (file standard, share link, uc link, folder link, invalid link).
   * Menguji mapping MIME type ke kategori lampiran.
2. **Regression Test Suite**:
   * Menjalankan `npm test` untuk memastikan 152 test eksisting tetap lolos tanpa regresi.
3. **Type Checking**:
   * Menjalankan `npx tsc --noEmit` untuk memastikan tipe data `TaskAttachment` dan komponen UI 100% type-safe.
