# SESSION_STATE.md — vrello-up

> **Update this file BEFORE ending every session.** Next session reads this first.

---

## Current Status

**Date:** 2026-11-07  
**Active Branch:** `vicky`  
**Active Feature:** Step 4 Location Verification Emoji Sanitization and Map Label Simplification (ADR-0081) — **PLANNING COMPLETE**  
**Previous Feature:** Wizard Step Transition Submission Guard and Placement Date Sanitization (ADR-0080) — **IMPLEMENTATION COMPLETE**  
**Previous Feature:** Wizard Step Transition Submission Guard and Placement Date Sanitization (ADR-0080) — **PLANNING COMPLETE**  
**Previous Feature:** Step 3 Direct Physical Photo Upload Enforcement and Tautan URL Removal (ADR-0079) — **PLANNING COMPLETE**  
**Previous Feature:** Step 2 POSM Material Selector Unification with CustomDropdown and Emoji Sanitization (ADR-0078) — **IMPLEMENTATION COMPLETE**  
**Previous Feature:** Step 2 POSM Material Selector Unification with CustomDropdown and Emoji Sanitization (ADR-0078) — **PLANNING COMPLETE**  
**Previous Feature:** Mobile Wizard Stepper Header Dynamic Accordion Expansion (ADR-0077) — **PLANNING COMPLETE**  
**Previous Feature:** Mobile Placement Modal Viewport Height Stabilization and Search Results Expansion (ADR-0076) — **PLANNING COMPLETE**  
**Previous Feature:** Mobile Outlet Search Results and Selected Card Readability (ADR-0075) — **PLANNING COMPLETE & AMENDED**  
**Previous Feature:** Placement Form Selected Outlet GPS and Address Data Propagation (ADR-0074) — **IMPLEMENTATION COMPLETE**  
**Previous Feature:** Placement Form Selected Outlet GPS and Address Data Propagation (ADR-0074) — **PLANNING COMPLETE**  
**Previous Feature:** Mobile Field Event Media Section Upload Action Layout (ADR-0073) — **IMPLEMENTATION COMPLETE**  
**Previous Feature:** Mobile Field Event Media Section Upload Action Layout (ADR-0073) — **PLANNING COMPLETE**  
**Previous Feature:** Mobile Field Event Checklist Readability & Header Layout Enhancement (ADR-0072) — **IMPLEMENTATION COMPLETE**  
**Previous Feature:** Retrospective Documentation Backfill for Mobile Responsiveness (ADR-0068, ADR-0069, ADR-0070, ADR-0071) — **DOCUMENTATION COMPLETE**  
**Previous Feature:** Mobile Bottom Navigation — Fluid Sliding Pill Animation & Layout Isolation (ADR-0067) — **IMPLEMENTATION COMPLETE**  
**Previous Feature:** Mobile Bottom Navigation — Fluid Sliding Pill Animation & Layout Isolation (ADR-0067) — **PLANNING COMPLETE**  
**Previous Feature:** Mobile Bottom Navigation — Replace Home with Pipeline & Status (ADR-0066) — **IMPLEMENTATION COMPLETE**  
**Previous Feature:** Mobile Bottom Navigation — Replace Home with Pipeline & Status (ADR-0066) — **PLANNING COMPLETE**  
**Previous Feature:** Placements Mobile View Switcher Pill Height Equalization — **IMPLEMENTATION COMPLETE**  
**Previous Feature:** Outlets Mobile View Switcher Pill Height Equalization — **IMPLEMENTATION COMPLETE**  
**Previous Feature:** Mobile Analytics ROI Header Layout and Horizontal KPI Carousel (ADR-0065) — **IMPLEMENTATION COMPLETE**  
**Previous Feature:** Reports Header Mobile Action Alignment — **IMPLEMENTATION COMPLETE**  
**Latest Fix:** Documents Header Mobile Action Alignment — **IMPLEMENTATION COMPLETE**  
**Previous Fix:** Equipment Inventory Mobile Responsiveness & Layout Optimization — **IMPLEMENTATION COMPLETE**  
**Previous Fix:** Branches Header Anti-Shift Reset Filters & Mobile Full-Width Search — **IMPLEMENTATION COMPLETE**  
**Previous Fix:** Branches Header Mobile Action Alignment & Full-Width Search — **IMPLEMENTATION COMPLETE**  
**Previous Fix:** Mobile Sidebar Non-Overshooting Tween Refinement (ADR-0063 Amendment) — **IMPLEMENTATION COMPLETE**  
**Previous Feature:** Mobile Create Outlet Form GPS Layout & Toast Resilience — **IMPLEMENTATION COMPLETE**  
**Previous Feature:** Mobile Placements Table Header Deduplication & Brand Filter Toolbar Unification (ADR-0062) — **IMPLEMENTATION COMPLETE**  
**Previous Feature:** Mobile View Switcher Full-Width & Action Row Right Alignment (ADR-0061) — **IMPLEMENTATION COMPLETE**  
**Previous Feature:** Mobile Filter & Search Proportional Grid Layout (ADR-0060) — **IMPLEMENTATION COMPLETE**  
**Previous Feature:** Mobile Typographical Scale and Visual Hierarchy Standardization (ADR-0059) — **IMPLEMENTATION COMPLETE**  
**Previous Feature:** Mobile Shell UI/UX Polish and Viewport Optimization (ADR-0058) — **IMPLEMENTATION COMPLETE**  
**Previous Feature:** Mobile Responsiveness Chassis and Navigation Architecture (ADR-0057) — **IMPLEMENTATION COMPLETE**  
**Previous Feature:** Hide Brain² AI Assistant from User-Facing Navigation Surfaces (ADR-0056) — **IMPLEMENTATION COMPLETE**  

---

## What Was Completed This Session

1. **Perencanaan Arsitektur Sanitasi Emoji Langkah 4 & Simplifikasi Label Peta (ADR-0081 — Planning Complete):**
   - **Diagnosis Masalah UX Lapangan & Inkonsistensi Visual:**
     - Pada Langkah 4 wizard POSM (`Step4LocationVerification.tsx` dan `LocationPicker.tsx`), ditemukan 6 emoji mentah (`👆`, `🔒`, `ℹ️`, `⚠️`, `📍`, `🗺️`) yang merender secara tidak konsisten antar sistem operasi seluler dan bertentangan dengan standar design system platform (Lucide SVG).
     - Tombol toggle Leaflet map menyertakan teks bertele-tele dan jargon pengembang:
       - Saat peta terbuka: `"Tutup Peta Interaktif (Mode Hemat RAM/Data)"` memuat jargon teknis internal yang membingungkan petugas.
       - Saat peta tertutup: `"🗺️ Sesuaikan Titik di Peta (Preview Radius 100m)"` terlalu panjang dan memicu *line wrapping* / teks terlipat pada layar ponsel 360px–390px, padahal radius 100m sudah dijelaskan di banner status geofence.
   - **Solusi Desain Responsif & Eliminasi Emoji:**
     - Menggantikan seluruh 6 emoji mentah dengan icon SVG Lucide (`MousePointerClick`, `Lock`, `Info`, `AlertTriangle`, `MapPin`, `Map`).
     - Menyederhanakan string tombol toggle peta:
       - Saat peta terbuka: `"Tutup Peta Interaktif"` (menghapus `(Mode Hemat RAM/Data)`).
       - Saat peta tertutup: `"Sesuaikan Titik di Peta"` (menghapus `🗺️` dan `(Preview Radius 100m)`) atau `"Buka Peta Pinpoint (Opsional)"`.
   - **Artefak Perencanaan & Handover:**
     - ADR: [`docs/adr/0081-step4-emoji-sanitization-and-map-label-simplification.md`](file:///Users/mac/Web%20Development/vrello-up/docs/adr/0081-step4-emoji-sanitization-and-map-label-simplification.md)
     - Spec: [`docs/superpowers/specs/2026-11-07-step4-emoji-sanitization-and-map-label-simplification-design.md`](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/specs/2026-11-07-step4-emoji-sanitization-and-map-label-simplification-design.md)
     - Plan: [`docs/superpowers/plans/2026-11-07-step4-emoji-sanitization-and-map-label-simplification.md`](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/plans/2026-11-07-step4-emoji-sanitization-and-map-label-simplification.md)
     - Handover: [`docs/handover-step4-emoji-sanitization-and-map-label-simplification.md`](file:///Users/mac/Web%20Development/vrello-up/docs/handover-step4-emoji-sanitization-and-map-label-simplification.md)
     - Invarian Verifikasi: `npm run drift:check` ✅ (108/108 spec-plan pairs).

2. **Implementasi Guard Transisi Langkah Wizard & Normalisasi Tanggal Placement (ADR-0080 — Implementation Complete):**
   - **TDD Test Suite (`src/app/api/marcom/placements/placementDateSanitization.test.ts` & `src/components/views/PlacementsView/placementStepTransitionGuard.test.ts`):**
     - Dibuat test suite mencakup 5 pengujian date sanitization (penerimaan format `"YYYY-MM-DD"`, ISO string, handling null/omitted date, serta static invariant helper check).
     - Dibuat test suite mencakup 3 pengujian UI submission guard (verifikasi atribut `key="wizard-btn-next"` dan `key="wizard-btn-submit"`, verifikasi guard `handleFormSubmit` yang mengecek `currentStep !== 4`, serta batasan koordinator `PlacementFormModal.tsx` $\le 350$ LOC).
     - Siklus TDD terverifikasi: Baseline RED (PrismaClientValidationError pada `"YYYY-MM-DD"` dan assertion failure pada tombol/guard) -> GREEN setelah perbaikan.
   - **Pencegahan Premature Submission di UI Layer:**
     - Menambahkan `key="wizard-btn-next"` pada tombol `"Lanjut"` (`type="button"`) dan `key="wizard-btn-submit"` pada tombol submit (`type="submit"`) di [`WizardFooter.tsx`](file:///Users/mac/Web%20Development/vrello-up/src/components/views/PlacementsView/wizard/WizardFooter.tsx). Hal ini memaksa React melakukan unmount elemen DOM lama sehingga touch event / synthetic click tidak bocor ke tombol baru yang bermutasi menjadi `type="submit"`.
     - Mengimplementasikan guard `handleFormSubmit(e)` pada [`PlacementFormModal.tsx`](file:///Users/mac/Web%20Development/vrello-up/src/components/views/PlacementsView/PlacementFormModal.tsx) yang secara tegas menolak pemanggilan `onSave` jika `currentStep !== 4`.
     - File `PlacementFormModal.tsx` terjaga pada 318 LOC ($\le 350$ LOC coordinator budget).
   - **Normalisasi Tanggal di API Layer:**
     - Menambahkan fungsi helper `parsePlacementDate(rawDate: unknown): Date | null` pada `POST /api/marcom/placements` (`route.ts`) dan `PATCH /api/marcom/placements/[id]` (`[id]/route.ts`).
     - Mengonversi format tanggal string `"YYYY-MM-DD"`, ISO string, atau nullish secara aman menjadi objek native JavaScript `Date` sebelum Prisma query dieksekusi, meniadakan error HTTP 500 `PrismaClientValidationError`.
   - **Verifikasi Kualitas & Invarian:**
     - `npm run drift:check`: ✅ 0 drift (107/107 spec-plan pairs).
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run test:smoke`: ✅ 160/160 tests passing.
     - `npm test`: ✅ 1024/1024 tests passing across 188 suites.

2. **Perencanaan Arsitektur Guard Transisi Langkah Wizard & Normalisasi Tanggal Placement (ADR-0080 — Planning Complete):**
   - **Diagnosis Masalah UX Lapangan & Server Error:**
     - Menavigasi dari Langkah 3 ke Langkah 4 via tombol `"Lanjut"` pada modal wizard POSM (`PlacementFormModal.tsx`) secara prematur memicu pengiriman form (*auto-saving*), mengunci modal ke `"Menyimpan..."` sebelum petugas lapangan melakukan verifikasi titik koordinat/geofencing.
     - Teridentifikasi akar masalah UI: *React DOM reconciliation* menggunakan kembali (*reuses*) elemen `<button>` yang sama saat transisi dari `!isFinalStep` (`type="button"`) ke `isFinalStep` (`type="submit"`) karena ketiadaan atribut `key`. Pada siklus event layar sentuh / emulasi mobile, synthetic `click` event menyelesaikan aksinya pada tombol yang baru bermutasi menjadi `type="submit"`, memicu submit form langsung.
     - Teridentifikasi akar masalah API: Request `POST /api/marcom/placements` mengalami crash HTTP 500 `PrismaClientValidationError` karena Prisma `Placement.date DateTime?` menolak string tanggal parsial `"YYYY-MM-DD"` (misal `"2026-11-07"`) yang dilewatkan langsung tanpa dikonversi ke objek JavaScript `Date`.
   - **Solusi Desain Pertahanan Ganda (Dual Defense):**
     - Di sisi UI: Memberikan `key="wizard-btn-next"` dan `key="wizard-btn-submit"` yang terisolasi pada [`WizardFooter.tsx`](file:///Users/mac/Web%20Development/vrello-up/src/components/views/PlacementsView/wizard/WizardFooter.tsx), memaksa React melakukan *unmount* tombol lama dan membatalkan in-flight click event.
     - Di sisi Modal: Memasang guard `handleFormSubmit(e)` pada [`PlacementFormModal.tsx`](file:///Users/mac/Web%20Development/vrello-up/src/components/views/PlacementsView/PlacementFormModal.tsx) yang secara tegas menolak pemanggilan `onSave` jika `currentStep !== 4`.
     - Di sisi API: Menambahkan fungsi helper `parsePlacementDate` pada `POST /api/marcom/placements/route.ts` dan `PATCH /api/marcom/placements/[id]/route.ts` untuk mengonversi string tanggal menjadi `new Date(date)` yang aman untuk Prisma.
   - **Artefak Perencanaan & Handover:**
     - ADR: [`docs/adr/0080-wizard-step-transition-guard-and-date-sanitization.md`](file:///Users/mac/Web%20Development/vrello-up/docs/adr/0080-wizard-step-transition-guard-and-date-sanitization.md)
     - Spec: [`docs/superpowers/specs/2026-11-07-wizard-step-transition-guard-and-date-sanitization-design.md`](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/specs/2026-11-07-wizard-step-transition-guard-and-date-sanitization-design.md)
     - Plan: [`docs/superpowers/plans/2026-11-07-wizard-step-transition-guard-and-date-sanitization.md`](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/plans/2026-11-07-wizard-step-transition-guard-and-date-sanitization.md)
     - Handover: [`docs/handover-wizard-step-transition-guard-and-date-sanitization.md`](file:///Users/mac/Web%20Development/vrello-up/docs/handover-wizard-step-transition-guard-and-date-sanitization.md)
     - Invarian Verifikasi: `npm run drift:check` ✅ (107/107 spec-plan pairs).

2. **Implementasi Penegakan Bukti Foto Fisik & Penghapusan Tautan URL Langkah 3 (ADR-0079 — Implementation Complete):**
   - **TDD Test Suite (`src/components/views/PlacementsView/step3PhotoUploadResponsiveness.test.ts`):**
     - Dibuat test suite 7 pengujian memverifikasi eliminasi total tombol `"Tautan URL"`, state `showManualUrl`/`manualUrlInput`, fungsi `handleAddManualUrl`, kontainer input URL `type="url"`, pembersihan icon Lucide (`LinkIcon`, `ChevronDown`, `ChevronUp`, `Plus`), serta preservasi tombol kamera dan galeri.
     - Terverifikasi baseline RED (4 pengujian gagal sebelum refactor) dan GREEN setelah perbaikan.
   - **Refactor Komponen Uploader (`src/components/views/PlacementsView/PlacementPhotoUploader.tsx`):**
     - Menghapus tombol toggle `"Tautan URL"` dan kontainer input manual URL, mereduksi file sebanyak 63 baris kode (dari 333 LOC menjadi 270 LOC).
     - Menstabilkan baris header: menampilkan label `"Foto Bukti Pemasangan"` di kiri dan badge counter `"{photos.length} Foto Terlampir"` di kanan saat foto terlampir di semua viewport.
     - Mempertahankan 100% upload fisik kamera (`capture="environment"`), galeri (`multiple`), kompresi client-side (`compressImage`), endpoint `/api/marcom/uploads`, thumbnail grid preview, dan modal lightbox.
   - **Verifikasi Kualitas & Invarian:**
     - `npm run drift:check`: ✅ 0 drift (106/106 spec-plan pairs).
     - `npm run build:check`: ✅ 0 TypeScript errors.

2. **Perencanaan Arsitektur Penegakan Bukti Foto Fisik & Penghapusan Tautan URL Langkah 3 (ADR-0079 — Planning Complete):**
   - **Diagnosis Masalah UX & Integritas Operasional:**
     - Pada Langkah 3 wizard POSM (`Step3PhotoNotes.tsx` / `PlacementPhotoUploader.tsx`), tombol pemicu `"🔗 Tautan URL v"` memungkinkan pengguna menempelkan link gambar eksternal manual (`https://...`).
     - Alur ini merupakan *legacy dead UI* yang membypass kompresi berkas otomatis client-side (`compressImage`) dan penyimpanan cloud tersentralisir (`/api/marcom/uploads`), memicu risiko *broken images* (link kedaluwarsa atau hotlink blocking), serta mengacaukan kerapian baris header foto di semua viewport.
     - Di operasional lapangan nyata, petugas selalu mengambil foto fisik via kamera (`Ambil Foto (Kamera)`) atau galeri perangkat (`Pilih dari Galeri`).
   - **Solusi Desain Responsif & Eliminasi Dead Code:**
     - Menghapus tombol toggle `"Tautan URL"`, kontainer input manual URL (`showManualUrl && (...)`), state `showManualUrl`/`manualUrlInput`, fungsi `handleAddManualUrl`, serta impor icon Lucide yang tidak lagi terpakai (`LinkIcon`, `ChevronDown`, `ChevronUp`, `Plus`).
     - Baris header foto direfaktor menjadi bersih: label `"Foto Bukti Pemasangan"` di sisi kiri dan badge counter `"{photos.length} Foto Terlampir"` di sisi kanan saat foto ada.
     - Mempertahankan 100% kapabilitas upload foto fisik asli, preview grid thumbnail, penghapusan foto, dan modal lightbox perbesaran.
   - **Artefak Perencanaan & Handover:**
     - ADR: [`docs/adr/0079-step3-tautan-url-removal.md`](file:///Users/mac/Web%20Development/vrello-up/docs/adr/0079-step3-tautan-url-removal.md)
     - Spec: [`docs/superpowers/specs/2026-11-07-step3-tautan-url-removal-design.md`](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/specs/2026-11-07-step3-tautan-url-removal-design.md)
     - Plan: [`docs/superpowers/plans/2026-11-07-step3-tautan-url-removal.md`](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/plans/2026-11-07-step3-tautan-url-removal.md)
     - Handover: [`docs/handover-step3-tautan-url-removal.md`](file:///Users/mac/Web%20Development/vrello-up/docs/handover-step3-tautan-url-removal.md)
     - Invarian Verifikasi: `npm run drift:check` ✅ (106/106 spec-plan pairs).

2. **Implementasi Unifikasi Selektor Material POSM dengan CustomDropdown & Pembersihan Emoji (ADR-0078 — Implementation Complete):**
   - **TDD Test Suite (`src/components/views/PlacementsView/step2MaterialResponsiveness.test.ts`):**
     - Dibuat test suite 6 pengujian memverifikasi integrasi `CustomDropdown`, eliminasi pills redundan `POSM_MATERIALS.map(...)`, eliminasi native `<select>` untuk material, dan sanitasi emoji mentah.
     - Terverifikasi baseline RED (6/6 pengujian gagal sebelum perbaikan) dan GREEN setelah perbaikan.
   - **Refactor Komponen Langkah 2 (`src/components/views/PlacementsView/wizard/Step2MaterialTheme.tsx`):**
     - Mengeliminasi container pills kategori hardcoded `POSM_MATERIALS.map(...)` dan handler `handleSelectPosmChip`/`activeChipLabel`, menghemat ~80px ruang vertikal modal.
     - Menggantikan native HTML `<select>` dengan standar platform [`CustomDropdown`](file:///Users/mac/Web%20Development/vrello-up/src/components/ui/CustomDropdown.tsx) yang mendukung pencarian langsung (`searchable={true}`).
     - Mensanitasi tombol skema biaya dari emoji mentah (`🏷️`, `💰`) menjadi icon SVG Lucide `<Tag />` dan `<CreditCard />`.
     - Integritas data & validasi MoU: Seleksi material via `CustomDropdown` memperbarui `placement.materialId` dan mengevaluasi aturan MoU identik dengan perilaku sebelumnya.
   - **Verifikasi Kualitas & Invarian:**
     - `npm run drift:check`: ✅ 0 drift (105/105 spec-plan pairs).
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run test:smoke`: ✅ 156/156 tests passing.

2. **Perencanaan Arsitektur Unifikasi Selektor Material POSM dengan CustomDropdown & Pembersihan Emoji (ADR-0078 — Planning Complete):**
   - **Diagnosis Masalah UX Lapangan:**
     - Pada Langkah 2 wizard POSM (`Step2MaterialTheme.tsx`), terdapat redundansi ganda antara 7 tombol pills kategori (`Poster`, `Shopblind`, dll.) dan dropdown native HTML `<select>`. Keduanya sama-sama memanipulasi `placement.materialId`, membingungkan pengguna, dan memakan ~80px tinggi modal vertikal.
     - Native `<select>` tidak memiliki fitur pencarian/filter teks dan tampil tidak konsisten antar-OS.
     - Bagian "Skema Biaya & Legalitas" menggunakan emoji mentah: `🏷️ Bebas Biaya (Rp 0)` dan `💰 Pemasangan Berbayar` yang tidak selaras dengan sistem icon Lucide platform.
   - **Solusi Desain Responsif & Unifikasi Selektor:**
     - Menghapus deretan pills `POSM_MATERIALS.map(...)` yang redundan di Langkah 2.
     - Menggantikan native `<select>` dengan komponen standar platform [`CustomDropdown`](file:///Users/mac/Web%20Development/vrello-up/src/components/ui/CustomDropdown.tsx) di **semua viewport (mobile & desktop)**, dilengkapi fitur pencarian internal (`searchable={true}`).
     - Menghapus seluruh emoji mentah dari Langkah 2 dan menggantikannya dengan icon Lucide `<Tag />` dan `<CreditCard />`.
     - Menghemat ~80px tinggi vertikal di Langkah 2, memastikan bagian Kuartal, Tema Kampanye, dan Skema Biaya langsung terlihat tanpa scroll berlebih.
   - **Artefak Perencanaan:**
     - ADR: [`docs/adr/0078-step2-material-selector-unification-and-emoji-sanitization.md`](file:///Users/mac/Web%20Development/vrello-up/docs/adr/0078-step2-material-selector-unification-and-emoji-sanitization.md)
     - Spec: [`docs/superpowers/specs/2026-11-07-step2-material-selector-unification-design.md`](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/specs/2026-11-07-step2-material-selector-unification-design.md)
     - Plan: [`docs/superpowers/plans/2026-11-07-step2-material-selector-unification.md`](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/plans/2026-11-07-step2-material-selector-unification.md)
     - Handover: [`docs/handover-step2-material-selector-unification.md`](file:///Users/mac/Web%20Development/vrello-up/docs/handover-step2-material-selector-unification.md)
   - **Verifikasi Invarian Drift:**
     - 105/105 spec-plan pairing lulus 100% tanpa drift (`npm run drift:check`).

2. **Perencanaan Arsitektur Stepper Header Dynamic Accordion di Mobile (ADR-0077 — Planning Complete):**
   - **TDD Test Suite (`src/components/views/PlacementsView/wizardStepperResponsiveness.test.ts`):**
     - Dibuat test suite mencakup 6 pengujian invariant tata letak responsif accordion, penghapusan subtitle redundan, dan integritas metadata langkah wizard.
     - Terverifikasi baseline RED (pengujian gagal sebelum refactor) dan GREEN setelah perbaikan.
   - **Refactor Komponen Stepper (`src/components/views/PlacementsView/wizard/WizardStepperHeader.tsx`):**
     - Container diubah dari grid kaku `grid grid-cols-4` menjadi dynamic accordion `flex items-center gap-1 sm:grid sm:grid-cols-4 sm:gap-2`.
     - **Penyatuan Label Ringkas (`s.shortLabel`):** Menggunakan `shortLabel` ringkas (`"Outlet"`, `"Materi"`, `"Foto"`, `"Lokasi"`) pada mobile dan desktop, mencegah terpotongnya teks menjadi `"Pilih ..."` pada layar mobile sempit.
     - **Penghapusan Subtitle Redundan:** Menghapus teks `"Langkah {s.step}"` (`"Langkah 1"`, `"Langkah 2"`, dst.) pada **semua viewport** (mobile dan desktop) karena nomor langkah sudah jelas terpampang pada badge lingkaran angka.
     - Langkah aktif (`isCurrent`): Memanfaatkan `flex-1 min-w-0 px-2.5 justify-start`, menampilkan lingkaran nomor, icon langkah, dan teks label aktif ringkas (`<span className="truncate text-xs font-bold min-w-0 inline text-lime-900 dark:text-lime-200">{s.shortLabel}</span>`).
     - Langkah tidak aktif (`!isCurrent`): Menyusut rapi `shrink-0 px-2 sm:px-2.5 justify-center sm:justify-start` menampilkan nomor/centang dan icon tanpa label teks di mobile.
     - Desktop invariant: Dipertahankan sebagai 4-kolom setara dengan label 1-baris yang bersih dan rapi (`hidden sm:inline`).
     - Ukuran file: `WizardStepperHeader.tsx` terjaga pada 100 LOC ($\le 150$ LOC target).
   - **Verifikasi Kualitas & Invarian:**
     - `npm run drift:check`: ✅ 0 drift (104/104 spec-plan pairs).
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm test`: ✅ 1002/1002 tests passing.

2. **Perencanaan Arsitektur Stepper Header Dynamic Accordion di Mobile (ADR-0077 — Planning Complete):**
   - **Diagnosis Masalah UX Lapangan:**
     - Stepper wizard POSM (`WizardStepperHeader.tsx`) membagi 4 langkah secara rata (`grid grid-cols-4`) di mobile.
     - Akibatnya, seluruh label teks langkah disembunyikan kaku (`hidden sm:flex`), hanya menyisakan angka dan icon kecil (`[ 1 🏬 ] [ 2 📚 ] [ 3 📷 ] [ 4 📍 ]`).
     - Pengguna dan installer di lapangan kehilangan konteks teks mengenai nama langkah dan tindakan yang harus dilakukan.
   - **Solusi Desain Responsif Mobile-First (Dynamic Flex Accordion):**
     - Mengubah container tombol stepper di mobile menjadi `flex items-center gap-1 sm:grid sm:grid-cols-4 sm:gap-2`.
     - **Langkah Aktif (`isCurrent`):** Melebar mengambil ruang sisa (`flex-1 min-w-0 px-2.5 py-1.5`) dan menampilkan nomor, icon, serta **teks label aktif** (`<span className="truncate text-xs font-bold sm:hidden">{s.label}</span>`).
     - **Langkah Tidak Aktif (`!isCurrent`):** Menyusut ringkas (`shrink-0 px-2 py-1.5`), hanya menampilkan nomor/centang dan icon, menghemat ruang secara maksimal untuk langkah aktif.
     - Desktop invariant: Tampilan desktop ($\ge 640\text{px}$) dipertahankan 100% *byte-for-byte* tanpa perubahan (`sm:grid sm:grid-cols-4 sm:gap-2`).
   - **Artefak Perencanaan:**
     - ADR: [`docs/adr/0077-mobile-wizard-stepper-accordion-expansion.md`](file:///Users/mac/Web%20Development/vrello-up/docs/adr/0077-mobile-wizard-stepper-accordion-expansion.md)
     - Spec: [`docs/superpowers/specs/2026-11-07-mobile-wizard-stepper-accordion-design.md`](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/specs/2026-11-07-mobile-wizard-stepper-accordion-design.md)
     - Plan: [`docs/superpowers/plans/2026-11-07-mobile-wizard-stepper-accordion.md`](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/plans/2026-11-07-mobile-wizard-stepper-accordion.md)
     - Handover: [`docs/handover-mobile-wizard-stepper-accordion.md`](file:///Users/mac/Web%20Development/vrello-up/docs/handover-mobile-wizard-stepper-accordion.md)
   - **Verifikasi Invarian Drift:**
     - 104/104 spec-plan pairing lulus 100% tanpa drift (`npm run drift:check`).

2. **Perencanaan Arsitektur Stabilisasi Ketinggian Modal & Ekspansi Hasil Pencarian Mobile (ADR-0076 — Planning Complete):**
   - **TDD Test Suite (`src/components/views/PlacementsView/placementModalResponsiveness.test.ts`):**
     - Memverifikasi container modal menggunakan `h-[88dvh]` di mobile dan `sm:h-auto sm:max-h-[92vh]` di desktop.
     - Memverifikasi form body menggunakan `flex-1 min-h-0 overflow-y-auto` dan menghapus `min-h-[340px]`.
     - Memverifikasi container hasil pencarian combobox meluas ke `max-h-80` di mobile dan mempertahankan `sm:max-h-72` di desktop.
     - Memverifikasi file `PlacementFormModal.tsx` tetap dalam batas koordinator $\le 350$ LOC (310 LOC).
     - Siklus TDD terverifikasi: RED state (3 assertions gagal saat baseline) -> GREEN state (4/4 assertions lulus).
   - **Refaktor Komponen Modal (`src/components/views/PlacementsView/PlacementFormModal.tsx` — 310 LOC):**
     - Mengubah wrapper modal menjadi `w-full max-w-xl h-[88dvh] sm:h-auto sm:max-h-[92vh]`, mematri header dan footer tombol "Batal" serta "Lanjut" secara permanen tanpa lonjakan *layout shift*.
     - Mengubah scroll container menjadi `min-h-0 flex-1 overflow-y-auto`, mencegah distorsi tinggi minimum pada layar ponsel kecil.
     - **Invarian Desktop 100% Terjaga:** Tampilan desktop ($\ge 640\text{px}$) tetap mempertahankan *auto-height* dibatasi `sm:max-h-[92vh]`.
   - **Refaktor Komponen Combobox (`src/components/views/PlacementsView/OutletSearchCombobox.tsx`):**
     - Memperluas tinggi maksimum container list hasil pencarian dari `max-h-60` (240px) ke `max-h-80 sm:max-h-72` (320px di mobile), menampilkan 3–4 kartu outlet lengkap secara simultan.
   - **Verifikasi Non-Negotiable Quality Gates:**
     - `npm run drift:check` ✅ (103/103 spec-plan pairs valid, 0 drift).
     - `npm run build:check` ✅ (0 TypeScript / Next.js compilation errors).
     - `npm run test:smoke` ✅ (155/155 pass, 0 fail).
     - `npm test` ✅ (996/996 pass, 0 fail).

2. **Perencanaan Arsitektur Stabilisasi Ketinggian Modal & Ekspansi Hasil Pencarian Mobile (ADR-0076 — Planning Complete):**
   - **Diagnosis Masalah UX Lapangan:**
     - Modal wizard POSM (`PlacementFormModal.tsx`) menggunakan `max-h-[92vh]` tanpa tinggi tetap di mobile, menyebabkan ketinggian modal berubah-ubah secara liar mengikuti konten (misal saat query kosong, modal mengkerut ke ~400px sehingga tombol footer "Batal" dan "Lanjut" naik ke tengah; saat hasil pencarian muncul, modal meregang ke bawah mendorong tombol jatuh). Ini memicu *layout shift* yang melelahkan jempol pengguna.
     - Container daftar hasil pencarian di mobile pada `OutletSearchCombobox.tsx` dibatasi kaku di `max-h-60` (240px), sehingga hanya menampilkan ~2 outlet sebelum harus di-scroll.
   - **Solusi Desain Responsif Mobile-First:**
     - Mengubah container modal di mobile menjadi `h-[88dvh] sm:h-auto sm:max-h-[92vh]`. Dengan `flex flex-col`, header wizard (`shrink-0`) dan footer wizard (`shrink-0 border-t`) selalu terpatri stabil, sedangkan form body (`flex-1 min-h-0 overflow-y-auto`) menangani scrolling secara internal. Tombol "Batal" dan "Lanjut" **100% diam dan terpatri** di posisi bawah yang konsisten.
     - Memperluas container hasil pencarian di mobile dari `max-h-60` menjadi `max-h-80 sm:max-h-72` (320px di mobile), menampilkan 3–4 outlet sekaligus secara lega.
     - Desktop invariant: Tampilan desktop ($\ge 640\text{px}$) dipertahankan 100% *byte-for-byte* tanpa perubahan (`sm:h-auto sm:max-h-[92vh]` dan `sm:max-h-72`).
   - **Artefak Perencanaan:**
     - ADR: [`docs/adr/0076-mobile-placement-modal-fixed-height-and-search-expansion.md`](file:///Users/mac/Web%20Development/vrello-up/docs/adr/0076-mobile-placement-modal-fixed-height-and-search-expansion.md)
     - Spec: [`docs/superpowers/specs/2026-11-07-mobile-placement-modal-fixed-height-design.md`](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/specs/2026-11-07-mobile-placement-modal-fixed-height-design.md)
     - Plan: [`docs/superpowers/plans/2026-11-07-mobile-placement-modal-fixed-height.md`](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/plans/2026-11-07-mobile-placement-modal-fixed-height.md)
     - Handover: [`docs/handover-mobile-placement-modal-fixed-height.md`](file:///Users/mac/Web%20Development/vrello-up/docs/handover-mobile-placement-modal-fixed-height.md)
   - **Verifikasi Invarian Drift:**
     - 103/103 spec-plan pairing lulus 100% tanpa drift (`npm run drift:check`).

2. **Perencanaan Arsitektur Keterbacaan Hasil Pencarian & Kartu Outlet Terpilih di Mobile (ADR-0075 — Planning Complete & Amended):**
   - **TDD Test Suite (`src/components/views/PlacementsView/outletSearchResponsiveness.test.ts`):**
     - Memverifikasi dropdown pencarian memiliki container stacked mobile (`flex flex-col gap-1 sm:hidden`) dan container desktop (`hidden sm:flex`).
     - Memverifikasi elemen nama toko mobile menerapkan `break-words line-clamp-2` tanpa pemotongan kaku.
     - Memverifikasi alamat mobile menerapkan `MapPin` dan `line-clamp-2 leading-normal`.
     - Memverifikasi tombol `Ganti Outlet` di header kartu disembunyikan di mobile dengan `hidden sm:inline-flex`.
     - Memverifikasi kartu outlet terpilih merender tombol bawah *full-width* `Ganti Outlet Lain` di mobile via `w-full sm:hidden`.
     - Memverifikasi kedua tombol memicu `handleChangeClick` dan tombol unselect memicu `handleClear`.
     - Memverifikasi petunjuk keyboard pada header panel pencarian disembunyikan di mobile via `hidden sm:inline`.
     - Memverifikasi subtitle Step 1 disembunyikan di mobile saat outlet terpilih via `selectedOutlet && "hidden sm:block"` di `Step1Outlet.tsx`.
     - Siklus TDD terverifikasi: RED state -> GREEN state (9/9 assertions lulus).
   - **Refaktor Komponen Combobox (`src/components/views/PlacementsView/OutletSearchCombobox.tsx`):**
     - Mengubah tombol `Ganti Outlet` di header kartu terpilih menjadi `hidden sm:inline-flex`, membebaskan ruang horizontal nama dan alamat toko dari ~92px menjadi ~230px (+148% lebih lebar), meniadakan pemotongan 5 baris nama dan 8 baris alamat.
     - Menambahkan tombol aksi mobile bawah *full-width* ramah sentuhan jempol (`w-full sm:hidden py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 ...`) berlabel `Ganti Outlet Lain`.
     - Merestrukturisasi item dropdown hasil pencarian (`results.map`) dengan layout bertingkat di mobile (`sm:hidden`): baris 1 (kode + brand + GPS status), baris 2 (nama outlet penuh multi-baris), baris 3 (alamat lengkap 2 baris).
     - Menambahkan `hidden sm:inline` pada petunjuk keyboard pencarian (`Gunakan ↑↓ lalu Enter atau klik outlet`).
     - **Invarian Desktop 100% Terjaga:** Tampilan desktop ($\ge 640\text{px}$) identik dengan desain asal.
   - **Refaktor Komponen Step 1 (`src/components/views/PlacementsView/wizard/Step1Outlet.tsx`):**
     - Menyembunyikan subtitle saat outlet terpilih di mobile dengan `selectedOutlet && "hidden sm:block"` untuk menghemat ruang vertikal layar.
   - **Verifikasi Non-Negotiable Quality Gates:**
     - `npm run drift:check` ✅ (102/102 spec-plan pairs valid, 0 drift).
     - `npm run build:check` ✅ (0 TypeScript / Next.js compilation errors).
     - `npm run test:smoke` ✅ (154/154 pass, 0 fail).
     - `npm test` ✅ (992/992 pass, 0 fail).

2. **Perencanaan Arsitektur Keterbacaan Hasil Pencarian & Kartu Outlet Terpilih di Mobile (ADR-0075 — Planning Complete & Amended):**
   - **Diagnosis Masalah Visual Mobile:**
     - Hasil pencarian (`results.map`): Baris nama toko terpotong kaku (`truncate`) karena dipaksa sejajar dengan badge kode dan brand. Baris alamat juga terpotong kaku. Petunjuk keyboard *"Gunakan ↑↓ lalu Enter atau klik outlet"* menambah beban vertikal di mobile yang berbasis sentuhan.
     - Kartu outlet terpilih (`showCard`): Tombol `[🔄 Ganti Outlet]` (~105px) dan `[✕]` (~28px) di baris header memakan ~140px, mencekik kolom nama dan alamat di mobile menjadi hanya ~92px lebar. Ini mengakibatkan nama toko terpotong menjadi 5 baris vertikal dan alamat menjadi 8 baris vertikal kaku. Subtitle *"Outlet terverifikasi..."* juga memakan tinggi vertikal berharga di mobile.
   - **Solusi Desain Responsif Mobile-First (Disempurnakan):**
     - Hasil pencarian di mobile: Menggunakan layout bertingkat di mana baris 1 berisi badge kode, brand, dan status GPS; baris 2 berisi nama toko penuh (`break-words line-clamp-2`); baris 3 berisi alamat lengkap (`line-clamp-2`).
     - Kartu terpilih di mobile: Tombol `[🔄 Ganti Outlet]` dipindahkan dari header ke baris aksi bawah sebagai tombol *full-width* ramah sentuhan jempol (`w-full sm:hidden`). Kolom nama dan alamat memperoleh lebar penuh ~230px (+148% lebih lega), menghilangkan 100% pemotongan vertikal 5-baris nama & 8-baris alamat.
     - **Hemat Ruang Vertikal Mobile (Amandemen Pengguna):**
       - Menyembunyikan petunjuk keyboard *"Gunakan ↑↓ lalu Enter atau klik outlet"* di mobile via `hidden sm:inline`.
       - Menyembunyikan subtitle *"Outlet terverifikasi untuk pelaksanaan materi promosi lapangan"* di mobile saat outlet terpilih via `hidden sm:block` di `Step1Outlet.tsx`.
     - Desktop invariant: Tampilan desktop ($\ge 640\text{px}$) dipertahankan 100% *byte-for-byte* tanpa perubahan.
   - **Artefak Perencanaan:**
     - ADR: [`docs/adr/0075-mobile-outlet-search-and-selected-card-readability.md`](file:///Users/mac/Web%20Development/vrello-up/docs/adr/0075-mobile-outlet-search-and-selected-card-readability.md)
     - Spec: [`docs/superpowers/specs/2026-11-07-mobile-outlet-search-and-selected-card-readability-design.md`](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/specs/2026-11-07-mobile-outlet-search-and-selected-card-readability-design.md)
     - Plan: [`docs/superpowers/plans/2026-11-07-mobile-outlet-search-and-selected-card-readability.md`](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/plans/2026-11-07-mobile-outlet-search-and-selected-card-readability.md)
     - Handover: [`docs/handover-mobile-outlet-search-and-selected-card-readability.md`](file:///Users/mac/Web%20Development/vrello-up/docs/handover-mobile-outlet-search-and-selected-card-readability.md)
   - **Verifikasi Invarian Drift:**
     - 102/102 spec-plan pairing lulus 100% tanpa drift (`npm run drift:check`).

2. **Implementasi Propagasi GPS & Alamat Outlet Placement (ADR-0074 — Implementation Complete):**
     - Plan: [`docs/superpowers/plans/2026-11-07-mobile-outlet-search-and-selected-card-readability.md`](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/plans/2026-11-07-mobile-outlet-search-and-selected-card-readability.md)
     - Handover: [`docs/handover-mobile-outlet-search-and-selected-card-readability.md`](file:///Users/mac/Web%20Development/vrello-up/docs/handover-mobile-outlet-search-and-selected-card-readability.md)
   - **Verifikasi Invarian Drift:**
     - 102/102 spec-plan pairing lulus 100% tanpa drift (`npm run drift:check`).

2. **Implementasi Propagasi GPS & Alamat Outlet Placement (ADR-0074 — Implementation Complete):**
   - **TDD Test Suite (`src/components/views/PlacementsView/placementOutletPropagation.test.ts`):**
     - Memverifikasi preservasi seluruh atribut outlet (`latitude`, `longitude`, `address`, `code`, `city`, `picPhone`) dalam pemetaan `outletsList` di `PlacementsView.tsx`.
     - Memverifikasi implementasi penggabungan fail-safe (*defensive coalescing*) koordinat dan alamat di `PlacementFormModal.tsx`.
     - Menguji 4 skenario operasional: Fresh Selection (koordinat & alamat terjaga), Edit Mode (resolusi dari `selOutlet`), Legitimate Null Coordinates (koordinat null sejati tetap null), dan Unselected State.
     - Memverifikasi batas ukuran file: `PlacementsView.tsx` (230 LOC $\le 250$ LOC ceiling) dan `PlacementFormModal.tsx` (310 LOC $\le 350$ LOC ceiling).
     - Siklus TDD terverifikasi: RED state (2 assertions gagal saat baseline) -> GREEN state (8/8 assertions lulus).
   - **Refaktor Proyeksi Parent (`src/components/views/PlacementsView/PlacementsView.tsx` — 230 LOC):**
     - Memperluas pemetaan `outletsList` agar mempertahankan `code: o.code`, `address: o.address`, `city: o.city`, `latitude: o.latitude`, `longitude: o.longitude`, `picPhone: o.picPhone`.
   - **Refaktor Modal Placement (`src/components/views/PlacementsView/PlacementFormModal.tsx` — 310 LOC):**
     - Mengubah komputasi `selectedOutletObj` dengan fail-safe coalescing: `lat = pOutlet?.latitude ?? selOutlet?.latitude ?? null`, `lng = pOutlet?.longitude ?? selOutlet?.longitude ?? null`, serta mempertahankan alamat non-kosong.
     - Memulihkan badge `• GPS Aktif` dan pratinjau alamat lengkap di `OutletSelectedCard.tsx` serta memastikan geofencing di `Step4FinalCheck.tsx` menerima telemetri lokasi asli.
   - **Verifikasi Non-Negotiable Quality Gates:**
     - `npm run drift:check` ✅ (101/101 spec-plan pairs valid, 0 drift).
     - `npm run build:check` ✅ (0 TypeScript / Next.js compilation errors).
     - `npm run test:smoke` ✅ (153/153 pass, 0 fail).
     - `npm test` ✅ (983/983 pass, 0 fail).

2. **Perencanaan Arsitektur Propagasi GPS & Alamat Outlet Placement (ADR-0074 — Planning Complete):**
   - **Diagnosis Bug & Root Cause Analysis:**
     - Menemukan bahwa combobox pencarian API (`GET /api/marcom/outlets?q=...`) mengembalikan data GPS & alamat lengkap (`• GPS Ada`).
     - Namun saat dipilih, `PlacementsView.tsx` memotong atribut (`latitude`, `longitude`, `address`, `code`) pada pemetaan `outletsList`.
     - Di `PlacementFormModal.tsx`, `selectedOutletObj` memprioritaskan `selOutlet` yang terpotong dan menimpa `placement.outlet` dengan nilai `undefined`/`null`, menyebabkan preview kartu Step 1 menampilkan *"Alamat belum tercatat"* dan *"Titik GPS Belum Diatur"*, serta mematahkan validasi geofencing di Step 4.
   - **Persetujuan Checkpoint & Artefak Perencanaan:**
     - Disetujui melalui Checkpoint 1 (Opsi 1: Full Object Propagation & Fail-Safe Merging).
     - Disetujui melalui Checkpoint 2 (Ruang Lingkup & Asumsi Teknis).
     - Disetujui melalui Checkpoint 3 (Strategi Pentahapan & Pengujian).
     - ADR: [`docs/adr/0074-placement-form-selected-outlet-gps-and-address-propagation.md`](file:///Users/mac/Web%20Development/vrello-up/docs/adr/0074-placement-form-selected-outlet-gps-and-address-propagation.md)
     - Spec: [`docs/superpowers/specs/2026-11-07-placement-form-selected-outlet-gps-propagation-design.md`](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/specs/2026-11-07-placement-form-selected-outlet-gps-propagation-design.md)
     - Plan: [`docs/superpowers/plans/2026-11-07-placement-form-selected-outlet-gps-propagation.md`](file:///Users/mac/Web%20Development/vrello-up/docs/superpowers/plans/2026-11-07-placement-form-selected-outlet-gps-propagation.md)
     - Handover: [`docs/handover-placement-form-selected-outlet-gps-propagation.md`](file:///Users/mac/Web%20Development/vrello-up/docs/handover-placement-form-selected-outlet-gps-propagation.md)
   - **Verifikasi Invarian Drift:**
     - Berhasil memvalidasi 101/101 spec-plan pairing tanpa drift (`npm run drift:check` lulus 100%).

2. **Implementasi Mobile Field Event Media Section Upload Action Layout (ADR-0073 — Implementation Complete):**
   - **TDD Test Suite (`src/components/views/EventsView/eventMediaResponsiveness.test.ts`):**
     - Memverifikasi tombol header disembunyikan di mobile dan dirender di desktop (`hidden sm:flex`).
     - Memverifikasi tombol *full-width* bawah dirender di mobile dan disembunyikan di desktop (`w-full sm:hidden`).
     - Memverifikasi kedua tombol memicu `fileInputRef.current?.click()` dan disabled saat `isUploading`.
     - Memverifikasi `EventMediaSection.tsx` tetap dalam batas aman ($\le 460$ LOC).
     - Siklus TDD terverifikasi: RED state (3/4 assertions gagal saat baseline) -> GREEN state (4/4 assertions lulus).
   - **Refaktor Komponen Media (`src/components/views/EventsView/EventMediaSection.tsx` — 454 LOC):**
     - Menambahkan `shrink-0` pada icon `<Film className="w-4 h-4 text-blue-500 shrink-0" />` di baris header.
     - Mengubah container tombol header menjadi `hidden sm:flex items-center gap-2`.
     - Memindahkan input file `<input ref={fileInputRef} ... />` ke luar container `hidden sm:flex` agar tetap aktif di DOM tree dan dapat dipicu tombol mobile.
     - Menambahkan tombol aksi *full-width* khusus mobile (`w-full sm:hidden py-2.5 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold flex items-center justify-center gap-2 border border-blue-200/60 shadow-2xs`) tepat di bawah area media (baik dropzone maupun daftar attachment thumbnail).
     - **Invarian Desktop 100% Terjaga:** Tampilan desktop ($\ge 640\text{px}$) identik dengan desain asal.
   - **Verifikasi Non-Negotiable Quality Gates:**
     - `npm run drift:check` ✅ (100/100 spec-plan pairs valid, 0 drift).
     - `npm run build:check` ✅ (0 TypeScript / Next.js compilation errors).
     - `npm run test:smoke` ✅ (152/152 pass, 0 fail).
     - `npm test` ✅ (975/975 pass, 0 fail).

2. **Perencanaan Arsitektur Mobile Field Event Media Section Upload Action Layout (ADR-0073 — Planning Complete):**
   - **Diagnostik Masalah:**
     - Penempatan tombol `"Upload dari Perangkat"` di baris header `EventMediaSection.tsx` pada mobile viewports (< 640px) menyebabkan perebutan ruang sempit (~320px): judul `"Media & Dokumentasi Event"` terpecah menjadi 2 baris dan tombol terpecah menjadi 2 baris.
     - Posisi tombol kecil di header sulit dijangkau jempol satu tangan, dan saat aset sudah diunggah, kotak dropzone menghilang sehingga tombol kecil di header menjadi satu-satunya jalur penambahan file.
   - **Keputusan Desain & Rationale (ADR-0073 — Opsi A):**
     - Sembunyikan tombol header di mobile via `hidden sm:flex`, membiarkan judul membentang penuh 100% pada **1 baris utuh**.
     - Render tombol aksi *full-width* ergonomis khusus mobile (`w-full sm:hidden`) tepat di bawah area media (di bawah dropzone saat kosong, atau di bawah daftar thumbnail saat terisi).
     - **Invarian Desktop 100% Terjaga:** Tampilan desktop ($\ge 640\text{px}$) tetap mempertahankan tombol di header (`sm:flex sm:items-center`) dan menyembunyikan tombol bawah (`sm:hidden`).
   - **Dokumen Perencanaan Lengkap Disusun:**
     - ADR: `docs/adr/0073-mobile-event-media-upload-action-layout.md` (ACCEPTED).
     - Spec: `docs/superpowers/specs/2026-11-07-mobile-event-media-upload-layout-design.md` (APPROVED).
     - Plan: `docs/superpowers/plans/2026-11-07-mobile-event-media-upload-layout.md` (APPROVED).
     - Handover: `docs/handover-mobile-event-media-upload-layout.md` (EXECUTION-READY).
   - **Verifikasi Drift Check:** `npm run drift:check` ✅ (100/100 spec-plan pairs valid, 0 drift).

2. **Implementasi Mobile Field Event Checklist Readability & Header Layout Enhancement (ADR-0072 — Implementation Complete):**
   - **TDD Test Suite (`src/components/views/EventsView/eventChecklistResponsiveness.test.ts`):**
     - Menambahkan pengujian responsivitas 2 baris header pada mobile dan 1 baris inline pada desktop.
     - Memverifikasi ketiadaan kelas `truncate` dan penggunaan `break-words text-xs leading-snug` untuk pembungkusan multi-baris subtask.
     - Memverifikasi perataan `items-start` dan `mt-0.5 shrink-0` pada checkbox untuk penjangkaran baris pertama.
     - Memverifikasi placeholder ringkas `"Tambah item checklist baru..."` tanpa terpotong di layar 320px-390px.
     - Memverifikasi batasan koordinator `EventChecklistSection.tsx` tetap $\le 250$ LOC (159 LOC).
     - Siklus Red-Green terkonfirmasi: 4/5 assertions gagal saat baseline (RED), kemudian lulus 100% pasca implementasi (GREEN - 5/5 pass).
   - **Refaktor Komponen Checklist (`src/components/views/EventsView/EventChecklistSection.tsx` — 159 LOC):**
     - Mengubah header container menjadi `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2`.
     - Memisahkan judul event checklist (`Event Preparation Checklist`) pada Baris 1 mobile dan status strip (`0/5 selesai` + `Template <type>`) pada Baris 2 dengan `justify-between sm:justify-end`.
     - Mengganti `truncate` pada judul subtask dengan `break-words text-xs leading-snug flex-1 min-w-0` menggunakan utilitas `cn()`.
     - Mengubah alignment baris item menjadi `items-start justify-between gap-2.5` dengan checkbox `w-4 h-4 mt-0.5 shrink-0`.
     - Mengganti placeholder add-item input menjadi `"Tambah item checklist baru..."`.
     - **Invarian Desktop 100% Terjaga:** Tampilan desktop ($\ge 640\text{px}$) tetap menjadi 1 baris inline identik dengan desain asal.
   - **Verifikasi Non-Negotiable Quality Gates:**
     - `npx tsx --test src/components/views/EventsView/eventChecklistResponsiveness.test.ts` ✅ (5/5 pass).
     - `npm run drift:check` ✅ (99/99 spec-plan pairs valid, 0 drift).
     - `npm run build:check` ✅ (`tsc --noEmit` 0 errors).
     - `npm run test:smoke` ✅ (151/151 smoke tests pass).
     - `npm test` ✅ (971/971 tests pass across 169 suites).

2. **Perencanaan Arsitektur Mobile Field Event Checklist Readability (ADR-0072 — Planning Complete):**
   - **Diagnostik Masalah:**
     - Header `EventChecklistSection.tsx` memaksakan 3 elemen panjang (*Judul*, *Counter completion*, dan *Tombol template*) dalam satu baris sempit mobile (< 640px), menyebabkan judul terpecah menjadi 4 baris vertikal sempit dan counter/tombol terjepit.
     - Setiap baris item checklist dipotong secara kaku dengan `truncate`, menghilangkan informasi detail instruksi persiapan operasional bagi staf lapangan.
     - Placeholder input penambahan item terpotong canggung di tengah kurung buka (`"Add new checklist item... ("`).
     - Penggunaan `items-center` menyebabkan checkbox melayang di tengah vertikal saat teks item membungkus menjadi 2 baris.
   - **Keputusan Desain & Rationale (ADR-0072):**
     - Menerapkan arsitektur header 2 baris responsif di mobile (`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2`): Baris 1 untuk judul penuh `Event Preparation Checklist`, Baris 2 untuk counter badge `0/5 selesai` dan tombol `[🔄 Template <type>]` (`justify-between sm:justify-end`).
     - Menghapus `truncate` pada item checklist, menggantikannya dengan `break-words text-xs leading-snug` serta penataan `items-start sm:items-center` dengan checkbox `w-4 h-4 mt-0.5 shrink-0`.
     - Mengubah placeholder input menjadi ringkas `"Tambah item checklist baru..."`.
     - **Invarian Desktop 100% Terjaga:** Pada layar $\ge 640\text{px}$ (`sm:`), seluruh layout kembali 1 baris inline identik dengan kondisi saat ini.
   - **Dokumen Perencanaan Lengkap Disusun:**
     - ADR: `docs/adr/0072-mobile-event-checklist-readability-enhancement.md` (ACCEPTED).
     - Spec: `docs/superpowers/specs/2026-11-07-mobile-event-checklist-readability-design.md` (APPROVED).
     - Plan: `docs/superpowers/plans/2026-11-07-mobile-event-checklist-readability.md` (APPROVED).
     - Handover: `docs/handover-mobile-event-checklist-readability.md` (EXECUTION-READY).
   - **Verifikasi Drift Check:** `npm run drift:check` ✅ (99/99 spec-plan pairs valid, 0 drift).

2. **Penyusunan Dokumentasi Retrospektif Arsitektur Mobile Responsiveness (ADR-0068, ADR-0069, ADR-0070, ADR-0071 — Documentation Complete):**
   - **Latar Belakang & Mandat Pengguna:** Mengodifikasi seluruh perbaikan responsivitas mobile yang sebelumnya diimplementasikan secara taktis menjadi paket dokumen arsitektur formal (ADR, Design Spec, Implementation Plan, Execution Handover) untuk mencegah miskomunikasi (*drift understanding*) antara pengguna, proyek, dan model AI lainnya.
   - **Klaster 1: Standarisasi Perataan Kanan Tombol Aksi Header Mobile (ADR-0068):**
     - Mengodifikasi aturan `justify-end sm:justify-start w-full sm:w-auto` untuk kenyamanan jempol satu tangan pada `BranchesHeader.tsx`, `DocumentsHeader.tsx`, `ReportsHeader.tsx`, dan `QuarterlyPosmReportTab.tsx`.
     - ADR: `docs/adr/0068-mobile-header-action-alignment-standardization.md` (ACCEPTED)
     - Spec: `docs/superpowers/specs/2026-11-07-mobile-header-action-alignment-standardization-design.md` (APPROVED)
     - Plan: `docs/superpowers/plans/2026-11-07-mobile-header-action-alignment-standardization.md` (COMPLETED)
     - Handover: `docs/handover-mobile-header-action-alignment-standardization.md` (IMPLEMENTED & VERIFIED)
   - **Klaster 2: Toolbar Filter Anti-Shift & Grid Pencarian Proporsional Mobile (ADR-0069):**
     - Mengodifikasi aturan `sm:order-first` untuk mencegah pergeseran 90px pada desktop saat filter aktif muncul, penataan 2 baris terorganisir di mobile, dan pencarian 100% full-width (`order-last sm:order-first relative w-full sm:w-56`) pada `BranchesHeader.tsx`, `InventoryHeaderKpis.tsx`, `InventoryTableView.tsx`, dan `BorrowRecordsTable.tsx`.
     - ADR: `docs/adr/0069-mobile-filter-toolbar-anti-shift-and-search-grid.md` (ACCEPTED)
     - Spec: `docs/superpowers/specs/2026-11-07-mobile-filter-toolbar-anti-shift-and-search-grid-design.md` (APPROVED)
     - Plan: `docs/superpowers/plans/2026-11-07-mobile-filter-toolbar-anti-shift-and-search-grid.md` (COMPLETED)
     - Handover: `docs/handover-mobile-filter-toolbar-anti-shift-and-search-grid.md` (IMPLEMENTED & VERIFIED)
   - **Klaster 3: Ekualisasi Tinggi Track & Pill View Switcher Mobile (ADR-0070):**
     - Mengodifikasi pola `flex items-stretch sm:items-center` dan `min-h-[40px] sm:min-h-0` pada `OutletsHeader.tsx` dan `PlacementFilterControls.tsx` agar active indicator pill putih selalu menutupi 100% tinggi track abu-abu secara presisi tanpa jeda vertikal pada tab multi-line maupun single-line.
     - ADR: `docs/adr/0070-mobile-view-switcher-track-and-pill-height-equalization.md` (ACCEPTED)
     - Spec: `docs/superpowers/specs/2026-11-07-mobile-view-switcher-track-and-pill-height-equalization-design.md` (APPROVED)
     - Plan: `docs/superpowers/plans/2026-11-07-mobile-view-switcher-track-and-pill-height-equalization.md` (COMPLETED)
     - Handover: `docs/handover-mobile-view-switcher-track-and-pill-height-equalization.md` (IMPLEMENTED & VERIFIED)
   - **Klaster 4: Tata Letak Form GPS & Ketahanan Toast Mobile (ADR-0071):**
     - Mengodifikasi penataan link GPS 2 baris di mobile (`sm:hidden` baris 2, `hidden sm:inline-flex` baris 1), ID toast Sonner persisten `outlet-gps-detection`, pass-through pointer events pada container toaster (`pointer-events: none` dengan `pointer-events: auto` pada toast aktif) untuk mencegah toast macet memblokir tombol modal di `OutletFormModal.tsx` dan `src/app/globals.css`.
     - ADR: `docs/adr/0071-mobile-outlet-form-gps-layout-and-toast-resilience.md` (ACCEPTED)
     - Spec: `docs/superpowers/specs/2026-11-07-mobile-outlet-form-gps-layout-and-toast-resilience-design.md` (APPROVED)
     - Plan: `docs/superpowers/plans/2026-11-07-mobile-outlet-form-gps-layout-and-toast-resilience.md` (COMPLETED)
     - Handover: `docs/handover-mobile-outlet-form-gps-layout-and-toast-resilience.md` (IMPLEMENTED & VERIFIED)
   - **Verifikasi Drift Check:** `npm run drift:check` ✅ (98/98 spec-plan pairs valid, 0 drift).

2. **Implementasi Mobile Bottom Navigation — Fluid Sliding Pill Animation & Layout Isolation (ADR-0067 — Implementation Complete):**
   - **TDD Test Suite (`src/components/layout/MobileBottomNav.test.ts`):**
     - Menambahkan pengujian `it("verifies MobileBottomNav wraps tabs in LayoutGroup for projection tree isolation")` yang memverifikasi pembungkusan tab dengan `<LayoutGroup id="mobile-bottom-nav">`.
     - Mengonfirmasi siklus Red-Green: tes gagal saat asserting LayoutGroup (RED), kemudian lulus 100% setelah implementasi (GREEN).
     - Memverifikasi batasan koordinator `MobileBottomNav.tsx` tetap di bawah ambang batas (135 LOC <= 150 LOC).
     - Seluruh 15 pengujian pada suite lulus (15/15 tests passing).
   - **Refaktor Komponen Navigasi (`src/components/layout/MobileBottomNav.tsx` — 135 LOC):**
     - Mengimpor `LayoutGroup` dari `framer-motion` dan membungkus daftar pemetaan tab bottom bar dengan `<LayoutGroup id="mobile-bottom-nav">` untuk isolasi pohon proyeksi independen dari `ActiveViewStage`.
     - Menghapus efek `whileTap` skala pada tombol luar (`<button>`), sehingga batas geometris (*bounding box*) tetap stabil selama interaksi sentuhan jempol.
     - Memindahkan `whileTap={shouldReduceMotion ? undefined : { scale: 0.92 }}` ke pembungkus konten internal (`<motion.div className="relative z-10 ...">`), mempertahankan feedback sentuhan fisik yang responsif tanpa merusak kalkulasi layout projection.
     - Memperjelas kontras visual pill aktif: `bg-slate-100/90 dark:bg-white/10 border border-slate-200/60 dark:border-white/10 shadow-2xs rounded-xl`.
     - Menyetel parameter fisika pegas: `{ type: "spring", stiffness: 420, damping: 30 }` untuk pergerakan luncuran 60fps yang halus dan presisi.
     - **Invarian Desktop 100% Terjaga:** `GlobalRail.tsx` dan `Sidebar.tsx` tetap tidak tersentuh.
   - **Verifikasi Non-Negotiable Quality Gates:**
     - `npx tsx --test src/components/layout/MobileBottomNav.test.ts` ✅ (15/15 tests passing).
     - `npm run drift:check` ✅ (94/94 spec-plan pairs valid, 0 drift).
     - `npm run build:check` ✅ (`tsc --noEmit` 0 errors).
     - `npm run test:smoke` ✅ (150/150 smoke tests pass).
     - `npm test` ✅ (966/966 tests pass across 168 suites).

2. **Perencanaan Arsitektur Mobile Bottom Navigation — Animasi Luncuran Active Pill (ADR-0067 — Planning Complete):**
   - **Diagnostik & Root Cause Masalah:**
     - Efek sentuh `whileTap={{ scale: 0.92 }}` pada `<motion.button>` induk menyebabkan distorsi *bounding box* geometri saat jempol menyentuh layar, sehingga kalkulasi *layout projection* Framer Motion gagal atau meloncat kaku (*snap*) alih-alih meluncur mulus.
     - Ketiadaan `<LayoutGroup>` membiarkan pohon proyeksi animasi bilah bawah tercampur dengan pohon animasi global halaman utama (`ActiveViewStage`).
     - Kontras visual pill `bg-slate-100/80 dark:bg-white/10` sebelumnya terlalu samar tanpa border dan bayangan halus, mengurangi kejelasan visual pergerakan pill.
   - **Solusi Arsitektur yang Ditetapkan (ADR-0067):**
     - Membungkus daftar tab dengan `<LayoutGroup id="mobile-bottom-nav">` untuk isolasi pohon proyeksi independen.
     - Menghilangkan `whileTap` pada tombol luar (menjadikannya tombol dengan *bounding box* statis), dan memindahkan `whileTap` ke pembungkus konten dalam (`<motion.div className="relative z-10 ...">`).
     - Memperjelas kontras visual pill: `bg-slate-100/90 dark:bg-white/10 border border-slate-200/60 dark:border-white/10 shadow-2xs rounded-xl`.
     - Menyetel fisika transisi pegas: `{ type: "spring", stiffness: 420, damping: 30 }`.
   - **Dokumen Perencanaan Lengkap Disusun:**
     - ADR: `docs/adr/0067-mobile-bottom-nav-sliding-pill-animation.md` (ACCEPTED).
     - Spec: `docs/superpowers/specs/2026-11-07-mobile-bottom-nav-sliding-pill-design.md` (APPROVED).
     - Plan: `docs/superpowers/plans/2026-11-07-mobile-bottom-nav-sliding-pill.md` (APPROVED).
     - Handover: `docs/handover-mobile-bottom-nav-sliding-pill.md` (READY FOR EXECUTION).
   - **Verifikasi Drift Check:** `npm run drift:check` ✅ (94/94 spec-plan pairs valid, 0 drift).

2. **Implementasi Mobile Bottom Navigation — Penggantian Home dengan Pipeline (ADR-0066 — Implementation Complete):**
   - **TDD Test Suite (`src/components/layout/MobileBottomNav.test.ts`):**
     - Memperbarui pengujian kanonikal 5-tab bilah navigasi bawah mobile untuk memverifikasi `"Pipeline"`, `"Outlets"`, `"Placements"`, `"Events"`, dan `"Menu"` (menggantikan `"Home"`).
     - Mengonfirmasi siklus Red-Green: tes gagal pada assertions `"Pipeline"` saat kode awal dijalankan (RED), kemudian lulus 100% setelah implementasi (GREEN).
     - Memverifikasi batas koordinator `MobileBottomNav.tsx` tetap di bawah ambang batas (147 LOC <= 150 LOC) dan tidak ada border biru kaku.
     - Seluruh 14 pengujian pada suite lulus (14/14 tests passing).
   - **Refaktor Komponen Navigasi (`src/components/layout/MobileBottomNav.tsx` — 147 LOC):**
     - Mengganti impor ikon `Home` dari `lucide-react` dengan `Layers`.
     - Memperbarui item slot 1 pada array `BOTTOM_TABS`:
       - `id: "pipeline"`
       - `label: "Pipeline"`
       - `icon: Layers`
       - `activeColor: "text-indigo-500 dark:text-indigo-400"`
       - `isActive: (view, isSidebarOpen) => !isSidebarOpen && view === "pipeline"`
       - `onClick: ({ setActiveView, setAppMode }) => { setAppMode("marcom"); setActiveView("pipeline"); }`
     - Menjadikan bilah navigasi bawah mobile 100% terdedikasi untuk alur kerja operasional pemasaran lapangan (*Field Marcom Toolbar*).
     - **Invarian Desktop 100% Terjaga:** `GlobalRail.tsx` dan `Sidebar.tsx` tidak tersentuh dan tetap menampilkan menu sesuai arsitektur dasbor desktop.
   - **Verifikasi Non-Negotiable Quality Gates:**
     - `npx tsx --test src/components/layout/MobileBottomNav.test.ts` ✅ (14/14 tests passing).
     - `npm run drift:check` ✅ (93/93 spec-plan pairs valid, 0 drift).
     - `npm run build:check` ✅ (`tsc --noEmit` 0 errors).
     - `npm run test:smoke` ✅ (150/150 smoke tests pass).
     - `npm test` ✅ (965/965 tests pass across 168 suites).

2. **Perencanaan Arsitektur Mobile Bottom Navigation — Penggantian Home dengan Pipeline (ADR-0066 — Planning Complete):**
   - **Keputusan Desain & Rationale:**
     - Menggantikan slot 1 pada bilah navigasi bawah mobile (`MobileBottomNav.tsx`) dari `Home` menjadi `Pipeline` (`id: "pipeline"`, icon: `Layers`, activeColor: `text-indigo-500`).
     - Mengeliminasi redundansi tombol `Home` pada mobile yang sebelumnya hanya mengarah ke Kanban Board Tasks. Menu Kanban Board tetap dapat diakses penuh melalui drawer samping (`Sidebar.tsx`) di bawah mode Tasks.
     - Mewujudkan bilah navigasi bawah 100% khusus modul kerja operasional Marcom lapangan: **Pipeline**, **Outlets**, **Placements**, **Events**, serta tombol **Menu**.
     - Invarian desktop tetap terjaga 100% pada `GlobalRail.tsx` dan `Sidebar.tsx`.
   - **Dokumen Perencanaan Lengkap Disusun:**
     - ADR: `docs/adr/0066-mobile-bottom-nav-replace-home-with-pipeline.md` (ACCEPTED).
     - Spec: `docs/superpowers/specs/2026-11-07-mobile-bottom-nav-pipeline-design.md` (APPROVED).
     - Plan: `docs/superpowers/plans/2026-11-07-mobile-bottom-nav-pipeline.md` (APPROVED).
     - Handover: `docs/handover-mobile-bottom-nav-pipeline.md` (READY FOR EXECUTION).
   - **Verifikasi Drift Check:** `npm run drift:check` ✅ (93/93 spec-plan pairs valid, 0 drift).

2. **Perbaikan Proporsi & Tinggi Active Pill Mobile View Switcher Placements (Implementation Complete):**
   - **Diagnostik Masalah:**
     - Pada viewport mobile (< 640px), kontainer tab switcher di `PlacementFilterControls.tsx` menggunakan `flex items-center`. Tombol tab anak (`motion.button`) tidak meregang (*stretch*), melainkan tingginya murni dihitung dari jumlah baris teks masing-masing.
     - Tab `Table` dan `Map View` berada pada 1 baris (~30px), sedangkan tab `Rekap Kuartal` berada pada 2 baris (~46px). Akibatnya, saat `Table` atau `Map View` aktif, *active pill* putih (`absolute inset-0`) menjadi kerdil (~30px) dan mengambang di tengah track abu-abu (48px) dengan gap kosong ~8px di atas dan bawahnya.
   - **Solusi yang Diterapkan (`PlacementFilterControls.tsx`):**
     - Mengubah kontainer menjadi `flex items-stretch sm:items-center` sehingga seluruh tombol tab di mobile dipaksa memiliki tinggi yang seragam dengan item tertinggi (100% tinggi track).
     - Menambahkan `min-h-[40px] sm:min-h-0` pada tombol tab di mobile untuk menjamin area sentuh sentuhan jempol ergonomis dan *active pill* selalu mengisi penuh track abu-abu secara presisi tanpa jeda vertikal pada semua tab.
     - **Invarian Desktop 100% Terjaga:** Kembali ke `sm:items-center` dan `sm:min-h-0` di desktop ($\ge 640\text{px}$).
   - **TDD:** Memperbarui `src/components/views/PlacementsView/placementsHeaderResponsiveness.test.ts` (5/5 tests pass).
   - **Verifikasi Quality Gates:** `npm run drift:check` ✅ (92/92 pairs), `npm run build:check` ✅, `npm run test:smoke` ✅ (150/150), `npm test` ✅ (965/965).

2. **Perbaikan Proporsi & Tinggi Active Pill Mobile View Switcher Outlets (Implementation Complete):**
   - **Diagnostik Masalah:**
     - Pada viewport mobile (< 640px), kontainer tab switcher menggunakan `flex items-center`. Tombol tab anak (`motion.button`) tidak meregang (*stretch*), melainkan tingginya murni dihitung dari jumlah baris teks masing-masing.
     - Saat loading (atau sebelum teks wrap), tab *Tabel Data* berada pada 1 baris (~30px), sedangkan tab lain membengkak menjadi 2 baris (~46px). Akibatnya, *active pill* putih (`absolute inset-0`) menjadi kerdil dan mengambang di tengah track abu-abu dengan ruang kosong di atas dan bawahnya.
   - **Solusi yang Diterapkan (`OutletsHeader.tsx`):**
     - Mengubah kontainer menjadi `flex items-stretch sm:items-center` sehingga seluruh tombol tab di mobile dipaksa memiliki tinggi yang sama dengan item tertinggi (100% tinggi track).
     - Menambahkan `min-h-[40px] sm:min-h-0` pada tombol tab di mobile untuk menjamin area sentuh sentuhan jempol stabil dan *active pill* selalu mengisi penuh track abu-abu secara presisi tanpa jeda, baik saat teks 1 baris maupun 2 baris, baik saat loading maupun loaded.
     - **Invarian Desktop 100% Terjaga:** Kembali ke `sm:items-center` dan `sm:min-h-0` di desktop ($\ge 640\text{px}$).
   - **TDD:** Memperbarui `src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts` (11/11 tests pass).
   - **Verifikasi Quality Gates:** `npm run drift:check` ✅ (92/92 pairs), `npm run build:check` ✅, `npm run test:smoke` ✅ (150/150), `npm test` ✅ (964/964).

1. **Implementasi Mobile Analytics ROI Header Layout & Horizontal KPI Carousel (ADR-0065 — Implementation Complete):**
   - **Diagnostik & Keputusan Tata Letak:**
     - Menstandarkan perataan tombol `[🔄]` (Refresh) ke margin kanan pada mobile (`justify-end sm:justify-start`), menyelaraskan dengan ergonomi jempol satu tangan di halaman lainnya.
     - Menyusun ulang toolbar filter menjadi 2 baris terorganisir: Baris 1 berisi dropdown *Branch* dan *Quarter* dalam **Grid 2 Kolom Simetris 50/50** (`grid grid-cols-2 gap-2 w-full sm:w-auto`), melenyapkan pemotongan teks `"Semua Bran..."` dan `"Semua K..."`. Baris 2 berisi *Brand Toggle Pills* dan tombol kondisional *Reset Filters* dengan penataan `justify-between` (zero layout shift).
     - Mentransformasikan 4 kartu KPI dari grid 2x2 sempit yang memotong teks footer (`"Rata-ra..."`, `"17/22 terpas..."`) menjadi **Horizontal Scroll Carousel** pada mobile (`flex overflow-x-auto pb-2 -mx-4 px-4 min-w-[210px] shrink-0`), memberikan ruang horizontal ~210px per kartu dan menghemat ~140px tinggi vertikal layar (*above the fold*).
     - **Invarian Desktop Terjaga 100%**: Pada layar $\ge 640\text{px}$ (`sm:` / `lg:`), kartu kembali ke grid 4 kolom (`sm:grid-cols-2 lg:grid-cols-4`), toolbar filter kembali menjadi 1 baris inline (`sm:flex`), dan tombol refresh kembali ke `sm:justify-start`.
   - **Dokumen Perencanaan Lengkap:**
     - ADR: `docs/adr/0065-mobile-analytics-roi-header-layout-and-horizontal-kpi-carousel.md` (ACCEPTED).
     - Spec: `docs/superpowers/specs/2026-11-07-mobile-analytics-roi-header-design.md` (APPROVED).
     - Plan: `docs/superpowers/plans/2026-11-07-mobile-analytics-roi-header.md` (APPROVED).
     - Handover: `docs/handover-mobile-analytics-roi-header.md` (READY FOR EXECUTION).
   - **TDD Test Suite:**
     - `src/components/views/AnalyticsView/analyticsHeaderResponsiveness.test.ts` (5/5 tests passing).
   - **Verifikasi Quality Gates:**
     - `npm run drift:check` ✅ (92/92 spec-plan pairs valid, 0 drift).
     - `npm run build:check` ✅ (`tsc --noEmit` 0 errors).
     - `npm run test:smoke` ✅ (150/150 smoke tests pass).
     - `npm test` ✅ (963/963 tests pass across 168 suites).

1. **Reports Header Mobile Action Alignment (Implementation Complete):**
   - **Fix (`ReportsHeader.tsx` & `QuarterlyPosmReportTab.tsx`):** Aligned primary action row (`Refresh`, `Export Center`) to the right (`justify-end sm:justify-start`) and aligned `+ Buat Laporan Bulanan` button to the right (`self-end sm:self-auto`) on mobile viewports. Aligned quarterly POSM report tab action controls to the right on mobile (`justify-end sm:justify-start`).
   - **Preserved:** Desktop layout remains 100% byte-for-byte identical with `sm:justify-start` and `sm:self-auto`. Tab segmented controls, 1-Click Executive PDF button, and KPI horizontal scroller remain untouched.
   - **TDD:** Added `src/components/views/ReportsView/reportsHeaderResponsiveness.test.ts` (3/3 tests passing).
   - **Verification:** `npm run drift:check` ✅, `npm run build:check` ✅, `npm test` ✅ (958/958 pass), `npm run test:smoke` ✅ (149/149 pass).

1. **Documents Header Mobile Action Alignment (Implementation Complete):**
   - **Fix (`DocumentsHeader.tsx`):** Aligned the action row containing `Refresh` and `Tambah Dokumen` to the right on mobile viewports (`justify-end sm:justify-start`), eliminating dead whitespace on the right margin and matching the one-handed thumb ergonomics of Placements, Outlets, Branches, and Inventory.
   - **Preserved:** Desktop layout remains 100% byte-for-byte identical with `sm:justify-start`. Category chips, search bar, view mode switcher, and KPI horizontal scroller remain untouched per user confirmation.
   - **TDD:** Added `src/components/views/DocumentsView/documentsHeaderResponsiveness.test.ts` (3/3 tests passing).
   - **Verification:** `npm run drift:check` ✅, `npm run build:check` ✅, `npm test` ✅, `npm run test:smoke` ✅ (148/148 pass).

1. **Equipment Inventory Mobile Responsiveness & Layout Optimization (Implementation Complete):**
   - **Problems Addressed:**
     - Search input was cramped into ~90px on mobile (`Search c...`) because search, category dropdown, and view mode switcher were crammed into a single flex row.
     - Equipment code badge in `InventoryTableView.tsx` wrapped onto 3 lines (`BTH- \n POP- \n 001`) due to missing `whitespace-nowrap`.
     - Segmented tabs were inline width with dead space rather than balanced 50/50.
     - Header and content outer padding used static `p-6` (48px wasted margin on mobile).
     - Action buttons were left-aligned rather than right-aligned for mobile thumb reach.
   - **Fixes Applied:**
     - `InventoryHeaderKpis.tsx`:
       - Changed filter & search container to `flex flex-wrap items-center gap-2 w-full sm:w-auto`.
       - Search container now uses `order-last sm:order-first relative w-full sm:w-56 text-xs` (100% full-width on mobile row 2, first in row on desktop row 1).
       - Category dropdown uses `flex-1 sm:flex-initial sm:w-44 text-xs` to expand flexibly alongside view mode switcher on mobile row 1 and stay 176px on desktop.
       - View mode switcher uses `shrink-0` (with `ml-auto sm:ml-0` on borrowing tab).
       - Segmented tabs use `w-full sm:w-auto` with tab buttons using `flex-1 sm:flex-initial text-center justify-center`.
       - Action row aligned to right on mobile via `justify-end sm:justify-start`.
       - Outer padding updated to responsive `p-4 sm:p-6 pb-2`.
     - `InventoryView.tsx`: Outer content container padding updated to `p-4 sm:p-6 flex-1`.
     - `InventoryTableView.tsx`: Added `whitespace-nowrap font-mono` and badge `whitespace-nowrap` to prevent item code from splitting across lines.
     - **Desktop 100% Invariant:** Search remains first in row (`sm:order-first sm:w-56`), dropdown remains `sm:w-44`, action row remains `sm:justify-start`, and tabs remain inline.
   - **TDD:** Added `src/components/views/InventoryView/inventoryHeaderResponsiveness.test.ts` (7/7 tests passing).
   - **Verification:** `npm run drift:check` ✅, `npm run build:check` ✅, `npm test` ✅, `npm run test:smoke` ✅ (147/147 pass).

1. **Branches Header Anti-Shift Reset Filters & Mobile Full-Width Search (Implementation Complete):**
   - **Problem Addressed:** On desktop, when `Reset Filters` appeared on the right of the search bar, the right-aligned flex layout pushed both `Search` and `CustomDropdown` 90px to the left, jarring user focus. On mobile, `Reset Filters` was pushed to an orphaned 3rd row beneath the full-width search input, creating Cumulative Layout Shift (CLS).
   - **Fix (`BranchesHeader.tsx`):**
     - Mobile: Placed `Reset Filters` inside Row 1 beside `CustomDropdown` using `justify-between sm:justify-start`, consuming the unused horizontal dead space and keeping Row 1 at fixed height (0 CLS).
     - Desktop: Added `sm:order-first` to `Reset Filters`, rendering it to the *left* of `CustomDropdown`. When active filters appear, they expand into open space to the left rather than pushing the right-anchored `Search` and `CustomDropdown` (0px layout shift).
     - Search bar remains full-width (`w-full`) on mobile and 224px (`sm:w-56`) on desktop.
   - **TDD:** Updated `src/components/views/BranchesView/branchesHeaderResponsiveness.test.ts` with assertions for mobile `justify-between`, desktop `sm:order-first`, and coordinator LOC limits (5/5 pass).
   - **Verification:** `npm run drift:check` ✅, `npm run build:check` ✅, `npm test` ✅, `npm run test:smoke` ✅ (146/146 pass).

1. **Branches Header Mobile Action Alignment & Full-Width Search (Implementation Complete):**
   - **Actions:** The mobile row containing `Refresh` and `Tambah Branch` now uses `justify-end sm:justify-start` in `BranchesHeader.tsx`, anchoring both controls to the right content margin. Desktop keeps its original right-hand column position and internal left alignment.
   - **Search:** The branch search wrapper changed from `w-44 sm:w-56` to `w-full sm:w-56`, so the field spans the full mobile content width (358px at a 390px viewport) while remaining 224px on desktop.
   - **Preserved:** Status chip scroller, region dropdown (`w-40 sm:w-44`), reset-filter link, KPI cards, and the `md:flex-row` controls layout are untouched.
   - **TDD:** Added `src/components/views/BranchesView/branchesHeaderResponsiveness.test.ts` with assertions for mobile right alignment, full-width mobile search, and desktop width/layout invariants (3/3 pass).
   - **Runtime verification (Playwright, real Chrome):** Mobile 390px — action row `justify-content: flex-end`, group right edge 374px, search width 358px; desktop 1440px — action row `flex-start` in its column, search width 224px.
   - **Verification:** `npm run drift:check` ✅, `npm run build:check` ✅, `npm test` ✅, `npm run test:smoke` ✅.

1. **Mobile Sidebar Non-Overshooting Tween Refinement (ADR-0063 Amendment — Implementation Complete):**
   - **Defect:** The mobile drawer used spring physics (`damping: 28, stiffness: 300`), which is underdamped. On open it overshot `x: 0`, translating the `left-0` panel to the right and briefly exposing the page background as a flash on the left edge.
   - **Fix (`Sidebar.tsx`):** Replaced the spring with a monotonic 240ms tween (`type: "tween"`, `duration: 0.24`, `ease: [0.2, 0, 0, 1]`). The drawer now decelerates into `x: 0` without crossing the target.
   - **Choreography:** The mobile backdrop fade now shares the same 240ms duration and easing, so both layers settle together.
   - **Desktop Invariant:** Unchanged. `initial={false}`, `exit={undefined}`, and `transition={{ duration: 0 }}` when `!isMobile`; `useReducedMotion()` still bypasses animation.
   - **Regression Tests (`MobileBottomNav.test.ts`):** Added assertions that `Sidebar.tsx` contains a tween and no `spring`/`damping`/`stiffness`, that backdrop and drawer share `duration: 0.24`, and that desktop motion stays instant and untranslated (14/14 pass).
   - **Docs:** Added a 2026-11-07 amendment to ADR-0063 and reconciled the animation spec (executive summary, timing, code contract, acceptance criteria).
   - **Verification:** `npx tsx --test src/components/layout/MobileBottomNav.test.ts` ✅ (14/14), `npm run drift:check` ✅ (91/91 spec-plan pairs, 0 drift), `npm run build:check` ✅ (0 errors), `npm test` ✅ (940/940 across 163 suites), `npm run test:smoke` ✅ (145/145).

1. **Mobile Create Outlet Form GPS Layout & Toast Fix:**
   - Memindahkan tautan *"View on Maps"* ke baris kedua khusus mobile (`sm:hidden`) dan mempertahankan tautan desktop di baris header (`hidden sm:inline-flex`) pada `OutletFormModal.tsx`; judul GPS memakai `whitespace-nowrap` agar tidak terpecah.
   - Memperbaiki toast GPS yang macet pada perangkat sentuh: toast memakai ID stabil `outlet-gps-detection`, `pointerEvents: "none"` sehingga ketukan diteruskan ke tombol tutup modal di belakangnya, dan `toast.dismiss(GPS_TOAST_ID)` saat modal unmount.
   - Menambahkan aturan Sonner di `globals.css`: kontainer `[data-sonner-toaster]` meneruskan ketukan pada area kosong, sedangkan `[data-sonner-toast]` tetap interaktif.
   - Menambahkan TDD suite `src/components/views/OutletsView/outletFormModalMobileUx.test.ts` (7/7 pass).
   - Verifikasi: `npm run drift:check` ✅, `npm run build:check` ✅, `npm test` ✅ (937/937 pass), `npm run test:smoke` ✅ (145/145 pass).

1. **Implementasi Mobile Notification Center Popover Viewport-Bounded Layout (ADR-0064 — Implementation Complete):**
   - **TDD Test Suite (`src/lib/productivity/useNotificationFeed.test.ts`):**
     - Memverifikasi tata letak popover mobile menggunakan `fixed inset-x-3 top-13` untuk mencegah terpotongnya teks di sisi kiri layar smartphone (< 640px).
     - Memverifikasi keberadaan overlay backdrop mobile (`fixed inset-0 bg-slate-900/20 sm:hidden`) untuk penutupan instan saat disentuh (tap-dismissal).
     - Memverifikasi preservasi desktop 100% utuh menggunakan kelas `sm:absolute sm:right-0 sm:w-86`.
     - Memverifikasi batas ukuran baris koordinator `NotificationCenter.tsx` tetap di bawah ambang batas (251 LOC).
     - Seluruh 5 pengujian pada suite lulus (5/5 tests passing).
   - **Refaktor Komponen Popover (`NotificationCenter.tsx` — 251 LOC):**
     - Melepaskan popover dari kontainer lonceng relatif pada viewport smartphone dengan kelas `fixed inset-x-3 top-13 z-50 max-h-[82vh] flex flex-col`.
     - Menambahkan backdrop overlay transparan `fixed inset-0 bg-slate-900/20 backdrop-blur-2xs z-40 sm:hidden` dengan handler klik `setIsOpen(false)`.
     - Mempertahankan penataan desktop 100% identik dengan `sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-86 sm:max-w-[calc(100vw-2rem)] sm:max-h-none sm:block`.
     - Menjaga fungsionalitas navigasi klik, pembacaan feed notifikasi, dan tombol *"Mark all read"* beroperasi optimal tanpa regresi.
   - **Verifikasi Invarian & Drift Check:**
     - `npx tsx --test src/lib/productivity/useNotificationFeed.test.ts` ✅ (5/5 pass).
     - `npm run drift:check` ✅ (91/91 spec-plan pairs valid, coordinator sizes ≤ 250 LOC, 0 drift).
     - `npm run build:check` ✅ (`tsc --noEmit` 0 error).
     - `npm run test:smoke` ✅ (144/144 pass, 0 fail).
     - `npm test` ✅ (930/930 tests pass across 161 suites, 0 fail).

1. **Implementasi Mobile Notification Center Popover Viewport-Bounded Layout (ADR-0064 — Implementation Complete):**
   - **TDD Test Suite (`src/lib/productivity/useNotificationFeed.test.ts`):**
     - Memverifikasi tata letak popover mobile menggunakan `fixed inset-x-3 top-13` untuk mencegah terpotongnya teks di sisi kiri layar smartphone (< 640px).
     - Memverifikasi keberadaan overlay backdrop mobile (`fixed inset-0 bg-slate-900/20 sm:hidden`) untuk penutupan instan saat disentuh (tap-dismissal).
     - Memverifikasi preservasi desktop 100% utuh menggunakan kelas `sm:absolute sm:right-0 sm:w-86`.
     - Memverifikasi batas ukuran baris koordinator `NotificationCenter.tsx` tetap di bawah ambang batas (251 LOC).
     - Seluruh 5 pengujian pada suite lulus (5/5 tests passing).
   - **Refaktor Komponen Popover (`NotificationCenter.tsx` — 251 LOC):**
     - Melepaskan popover dari kontainer lonceng relatif pada viewport smartphone dengan kelas `fixed inset-x-3 top-13 z-50 max-h-[82vh] flex flex-col`.
     - Menambahkan backdrop overlay transparan `fixed inset-0 bg-slate-900/20 backdrop-blur-2xs z-40 sm:hidden` dengan handler klik `setIsOpen(false)`.
     - Mempertahankan penataan desktop 100% identik dengan `sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-86 sm:max-w-[calc(100vw-2rem)] sm:max-h-none sm:block`.
     - Menjaga fungsionalitas navigasi klik, pembacaan feed notifikasi, dan tombol *"Mark all read"* beroperasi optimal tanpa regresi.
   - **Verifikasi Invarian & Drift Check:**
     - `npx tsx --test src/lib/productivity/useNotificationFeed.test.ts` ✅ (5/5 pass).
     - `npm run drift:check` ✅ (91/91 spec-plan pairs valid, coordinator sizes ≤ 250 LOC, 0 drift).
     - `npm run build:check` ✅ (`tsc --noEmit` 0 error).

1. **Implementasi Mobile Sidebar Slide Transition & Backdrop Animation (ADR-0063 — Implementation Complete):**
   - **TDD Test Suite (`src/components/layout/MobileBottomNav.test.ts`):**
     - Memverifikasi impor `motion`, `AnimatePresence`, dan `useReducedMotion` pada `Sidebar.tsx`.
     - Memverifikasi pembungkusan backdrop mobile dan drawer dengan `<AnimatePresence>`.
     - Memverifikasi penggunaan `motion.div` untuk backdrop fade (`opacity: 0 -> 1 -> 0`) dan `motion.aside` untuk drawer slide (`x: "-100%"`).
     - Memverifikasi proteksi guard `isMobile` untuk mencegah translasi inline atau layout shift pada desktop.
     - Memverifikasi batas koordinator `Sidebar.tsx` tetap $\le 250$ LOC (205 LOC).
     - Seluruh 11 assertions lulus (11/11 tests passing).
   - **Refaktor Komponen Drawer Navigasi (`Sidebar.tsx` — 205 LOC):**
     - Menambahkan listener `isMobile: window.innerWidth < 768` yang hydration-safe (default `false` di server).
     - Membungkus mobile backdrop dan drawer dalam `<AnimatePresence>`.
     - Mengimplementasikan backdrop `motion.div` dengan animasi fade halus (200ms).
     - Mengimplementasikan drawer `motion.aside` dengan animasi slide dari tepi kiri (`x: isMobile ? "-100%" : 0`) dan spring physics (`damping: 28, stiffness: 300`).
     - Menjamin desktop preservasi 100%: pada viewport $\ge 768\text{px}$, motion disetel ke `initial={false}`, `exit={undefined}`, dan `transition={{ duration: 0 }}` sehingga sidebar tetap menjadi panel statis murni.
     - Menghormati preferensi aksesibilitas `useReducedMotion()`.
   - **Verifikasi Invarian & Drift Check:**
     - `npx tsx --test src/components/layout/MobileBottomNav.test.ts` ✅ (11/11 pass).
     - `npm run drift:check` ✅ (91/91 spec-plan pairs valid, coordinator sizes ≤ 250 LOC, 0 drift).
     - `npm run build:check` ✅ (`tsc --noEmit` 0 error).
     - `npm run test:smoke` ✅ (144/144 pass, 0 fail).

1. **Perencanaan Arsitektur Mobile Notification Center Popover Viewport-Bounded Layout (ADR-0064 — Planning Complete):**
   - **Diagnostik Masalah Terpotong (*Clipping Defect*):**
     - Mendiagnosis dari screenshot pengguna bahwa popover notifikasi *Activity Center* terpotong ~50px di sebelah kiri layar smartphone (< 640px).
     - Menemukan akar penyebab: popover di-anchor `right-0` terhadap kontainer lonceng yang berjarak ~80px dari tepi kanan layar, dengan lebar statis `w-86` (344px), sehingga batas kirinya jatuh di luar viewport `(375px - 80px) - 344px = -49px`.
     - Merancang penataan viewport-bounded mobile: melepaskan anchor relatif lonceng pada mobile dan menggantinya dengan `fixed inset-x-3 top-13 z-50 max-h-[82vh] flex flex-col` (margin simetris 12px dari tepi kiri dan kanan layar), dilengkapi mobile backdrop overlay (`fixed inset-0 bg-slate-900/20 backdrop-blur-2xs sm:hidden`) untuk mempermudah dismiss.
     - **Invarian Desktop Terjaga 100%**: Pada layar $\ge 640\text{px}$ (`sm:`), popover kembali ke posisi anchor lonceng `sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-86` tanpa backdrop (`sm:hidden`), 100% byte-for-byte identik dengan kondisi saat ini.
   - **Penyusunan Dokumen Perencanaan & Handover:**
     - ADR: `docs/adr/0064-mobile-notification-center-popover-viewport-bounded-layout.md` (ACCEPTED).
     - Spec: `docs/superpowers/specs/2026-11-06-mobile-notification-center-popover-viewport-bounded-design.md` (APPROVED).
     - Plan: `docs/superpowers/plans/2026-11-06-mobile-notification-center-popover-viewport-bounded.md` (APPROVED).
     - Handover: `docs/handover-mobile-notification-center-popover-viewport-bounded.md` (READY FOR EXECUTION).
   - **Verifikasi Invarian & Drift Check:**
     - `npm run drift:check` ✅ (91/91 spec-plan pairs valid, coordinator sizes ≤ 250 LOC, 0 drift).
     - `npm run build:check` ✅ (`tsc --noEmit` 0 error).

1. **Implementasi Mobile Placements Table Header Deduplication & Brand Filter Preservation (ADR-0062 — Implementation Complete):**
   - **TDD Test Suite (`src/components/views/PlacementsView/placementsFilterLayout.test.ts`):**
     - Memverifikasi de-duplikasi judul: `PlacementsView.tsx` mengonfigurasi `hideTitle={true}` pada `MarcomTableShell` untuk melenyapkan judul lokal `[📋] Placements 22 placements` yang berdesakan di samping filter brand.
     - Memverifikasi pelestarian filter brand: `PlacementsView.tsx` mempertahankan `headerExtra={brandChips}` pada header tabel dengan styling pill kompak (`shrink-0`), tanpa ditarik memanjang secara paksa (full-width).
     - Memverifikasi dukungan `hideTitle?: boolean` di `MarcomTableShell.tsx` dengan perataan kanan otomatis (`hideTitle && "justify-end"`).
     - Memverifikasi batas koordinator tetap terjaga: `PlacementsView.tsx` 214 LOC (≤ 250 LOC) dan `PlacementFilterControls.tsx` 164 LOC (≤ 250 LOC).
     - Seluruh 4 assertions lulus (4/4 tests passing).
   - **Pelestarian Desain Kompak Brand Filter (`PlacementFilterControls.tsx` — 164 LOC):**
     - Mempertahankan `PlacementBrandChips` sebagai kelompok pill kompak (`shrink-0`, `p-0.5 rounded-xl border`), sesuai preferensi visual pengguna.
     - Karena judul di sebelah kiri ditiadakan, kelompok pill brand (`[ All Brands | • IM3 | • 3 (Tri) ]`, ~210px) leluasa berada di kartu header tanpa terpotong (bebas clipping).
   - **Integrasi View Koordinator (`PlacementsView.tsx` — 214 LOC):**
     - Menyetel `hideTitle={true}` pada `MarcomTableShell`, melenyapkan judul lokal ganda tanpa menghilangkan header tabel itu sendiri.
     - Mempertahankan `headerExtra={brandChips}`, mobile search bar bawaan tabel (`w-full`), dan `filterBar={statusFilterChips}`.
     - Mempertahankan keselarasan desktop 100% utuh tanpa regresi visual.
   - **Verifikasi Invarian & Drift Check:**
     - `npx tsx --test src/components/views/PlacementsView/placementsFilterLayout.test.ts` ✅ (4/4 pass).
     - `npm run drift:check` ✅ (89/89 spec-plan pairs valid, coordinator sizes ≤ 250 LOC, 0 drift).
     - `npm run build:check` ✅ (`tsc --noEmit` 0 error).

1. **Implementasi Mobile View Switcher Full-Width & Action Row Right Alignment (ADR-0061 — Implementation Complete):**
   - **TDD Test Suite (`src/components/views/PlacementsView/placementsHeaderResponsiveness.test.ts` & `src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts`):**
     - Memverifikasi baris aksi `PlacementsHeader.tsx` menggunakan perataan kanan mobile: `justify-end sm:justify-start w-full sm:w-auto`.
     - Memverifikasi segmented control `PlacementViewSwitcher` menggunakan `w-full sm:w-auto` dengan tab `flex-1 sm:flex-initial justify-center`.
     - Memverifikasi `OutletsHeader.tsx` menggunakan `justify-end sm:justify-start w-full sm:w-auto` pada baris tombol dan `w-full sm:w-auto` dengan tab `flex-1 sm:flex-initial justify-center` pada view mode switcher.
     - Memverifikasi `EventsHeader.tsx` menggunakan `justify-end sm:justify-start w-full sm:w-auto` pada baris tombol dan `w-full sm:w-auto` dengan tab `flex-1 sm:flex-initial justify-center` pada view mode switcher.
     - Seluruh pengujian lulus (4/4 di Placements test suite, 10/10 di Outlets test suite).
   - **Refaktor Komponen Layout Header Responsif:**
     - `PlacementsHeader.tsx` (96 LOC): Menyetel baris tombol aksi ke `justify-end sm:justify-start w-full sm:w-auto`.
     - `PlacementFilterControls.tsx` (226 LOC): Menyetel `PlacementViewSwitcher` ke `w-full sm:w-auto` dan tombol segmented tab ke `flex-1 sm:flex-initial justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-1`.
     - `OutletsHeader.tsx` (282 LOC): Menyetel tombol aksi ke `justify-end sm:justify-start w-full sm:w-auto`, kontainer view switcher ke `w-full sm:w-auto flex items-center`, dan tab ke `flex-1 sm:flex-initial justify-center py-1.5 sm:py-1`.
     - `EventsHeader.tsx` (140 LOC): Menyetel tombol aksi ke `justify-end sm:justify-start w-full sm:w-auto`, kontainer view switcher ke `relative w-full sm:w-auto flex items-center`, dan tab ke `flex-1 sm:flex-initial justify-center py-1.5 sm:py-1`.
   - **Non-Negotiable Quality Gates:**
     - Invarian desktop $\ge 640\text{px}$ (`sm:`) dipertahankan 100% tanpa perubahan visual di desktop.
     - `npx tsx --test src/components/views/PlacementsView/placementsHeaderResponsiveness.test.ts` ✅ (4/4 pass).
     - `npx tsx --test src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts` ✅ (10/10 pass).
     - `npm run drift:check` ✅ (89/89 spec-plan pairs valid, coordinator sizes ≤ 250 LOC, 0 drift).
     - `npm run build:check` ✅ (`tsc --noEmit` 0 error).
     - `npm run test:smoke` ✅ (140/140 pass, 0 fail).
     - `npm test` ✅ (923/923 tests passing across 160 suites, 0 fail).

1. **Perencanaan Arsitektur Mobile View Switcher Full-Width & Action Row Right Alignment (ADR-0061 — Planning Complete):**
   - **Diagnostik Ketidakseimbangan Visual Header Mobile:**
     - Mendiagnosis dari screenshot pengguna bahwa baris tombol aksi (`Refresh`, `Export`, `+ Add Placement`) menggantung di sebelah kiri (~65% lebar layar) menyisakan ruang kosong tak terpakai di margin kanan kartu pada viewport mobile (< 640px).
     - Mendiagnosis bahwa segmented view mode switcher (`Table`, `Map View`, `Rekap Kuartal`) terpotong di ~80% lebar layar dengan padding sempit, menyimpang dari standar segmented control mobile native yang membentang penuh (100% width).
     - Merancang solusi tata letak responsif: baris tombol aksi diratakan ke kanan (`justify-end sm:justify-start w-full sm:w-auto`), dan kontainer view switcher dibuat membentang penuh (`w-full sm:w-auto`) dengan pembagian tab yang terbagi rata secara simetris (`flex-1 sm:flex-initial justify-center`).
     - **Invarian Desktop Terjaga 100%**: Pada layar $\ge 640\text{px}$ (`sm:`), tombol aksi kembali ke `sm:justify-start` dan view switcher kembali ke `sm:w-auto sm:inline-flex` (100% identik dengan kondisi saat ini tanpa pergeseran piksel).
   - **Penyusunan Dokumen Perencanaan & Handover:**
     - ADR: `docs/adr/0061-mobile-view-switcher-full-width-and-action-row-alignment.md` (ACCEPTED).
     - Spec: `docs/superpowers/specs/2026-11-06-mobile-view-switcher-and-action-alignment-design.md` (APPROVED).
     - Plan: `docs/superpowers/plans/2026-11-06-mobile-view-switcher-and-action-alignment.md` (APPROVED).
     - Handover: `docs/handover-mobile-view-switcher-and-action-alignment.md` (READY FOR EXECUTION).
   - **Verifikasi Invarian & Drift Check:**
     - `npm run drift:check` ✅ (88/88 spec-plan pairs valid, coordinator sizes ≤ 250 LOC, 0 drift).
     - `npm run build:check` ✅ (`tsc --noEmit` 0 error).

1. **Implementasi Mobile Filter & Search Proportional Grid Layout (ADR-0060 — Implementation Complete):**
   - **TDD Test Suite (`src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts`):**
     - Memverifikasi dropdown filter dibungkus dalam 2-column mobile grid: `grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center`.
     - Memverifikasi komponen dropdown menggunakan `w-full sm:w-44` agar membentang simetris 50% di mobile dan fixed 176px di desktop.
     - Memverifikasi kolom pencarian menggunakan `flex-1 sm:w-52` sehingga membentang 100% penuh di baris kedua mobile.
     - Memverifikasi proteksi invarian desktop tetap 100% utuh (`sm:w-44`, `sm:w-52`, `sm:flex sm:items-center`).
     - Seluruh 8 assertions lulus (8/8 tests passing).
   - **Refaktor Komponen Layout Filter (`OutletsHeader.tsx`):**
     - Membungkus filter dan pencarian dalam container responsif `flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto`.
     - Mengelompokkan *All Branches* dan *All Store Types* ke dalam Baris 1 mobile (`grid grid-cols-2`), melenyapkan ruang kosong asimetris di margin kanan layar smartphone.
     - Mengelompokkan input pencarian dan tombol *Reset Filters* ke dalam Baris 2 mobile (`flex items-center gap-2 w-full`), memberikan area sentuh pencarian yang luas dan proporsional.
   - **Verifikasi Invarian & Drift Check:**
     - `npx tsx --test src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts` ✅ (8/8 pass).
     - `npm run drift:check` ✅ (87/87 spec-plan pairs valid, coordinator sizes ≤ 250 LOC, 0 drift).
     - `npm run build:check` ✅ (`tsc --noEmit` 0 error).
     - `npm run test:smoke` ✅ (139/139 pass, 0 fail).

1. **Implementasi Mobile Typographical Scale & Density Standardization (ADR-0059 — Implementation Complete):**
   - **TDD Test Suite (`src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts`):**
     - Memverifikasi `OutletsHeader.tsx` menerapkan responsive title scale `text-base sm:text-xl` dan badge `text-[10px] sm:text-[11px]`.
     - Memverifikasi subtitle deskripsi menggunakan `text-[11px] sm:text-xs`.
     - Memverifikasi tombol aksi dan input pencarian menggunakan `h-8 sm:h-9 text-xs sm:text-sm`.
     - Memverifikasi densitas sel tabel `OutletsView.tsx` menggunakan `text-xs sm:text-sm` dan padding kompak `py-2 sm:py-3.5`.
     - Memverifikasi label `MobileBottomNav.tsx` diselaraskan ke `text-[10.5px] font-medium leading-none mt-0.5`.
     - Seluruh 5 assertions lulus (5/5 tests passing).
   - **Refaktor Komponen Header Responsif (`OutletsHeader.tsx`, `PlacementsHeader.tsx`, `EventsHeader.tsx`):**
     - Memperbarui title row menjadi `text-base sm:text-xl font-bold` dengan ikon `w-4 h-4 sm:w-5 sm:h-5` dan badge ringkas.
     - Memperbarui subjudul menjadi `text-[11px] sm:text-xs leading-tight sm:leading-normal`.
     - Memperbarui tombol aksi (`Refresh`, `+ Add Outlet`, `Export`, `New Field Event`) menjadi `h-8 sm:h-9 text-xs sm:text-sm px-2.5 sm:px-3.5`.
     - Memperbarui view switcher pills menjadi `px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs`.
     - Memperbarui filter dropdowns dan search input menjadi `h-8 sm:h-9 text-xs sm:text-sm`.
   - **Optimasi Densitas Tabel (`OutletsView.tsx`):**
     - Memperbarui kode outlet ke font mono proporsional `text-[10px] sm:text-xs`.
     - Memperbarui nama outlet ke `text-xs sm:text-sm font-semibold` dengan padding baris sel `py-2 sm:py-3.5 px-2.5 sm:px-3`.
   - **Penyesuaian Visual Bottom Navigation Bar (`MobileBottomNav.tsx`):**
     - Mengubah label tab menjadi `text-[10.5px] font-medium leading-none mt-0.5` untuk proporsi visual yang seimbang dengan header dan tabel.
   - **Animasi Active Button Sliding Bottom Navigation Bar (`MobileBottomNav.tsx`):**
     - Mengimplementasikan `<motion.div layoutId="activeMobileBottomTab" />` dengan spring physics (`stiffness: 450, damping: 32`) untuk efek sliding pill background yang halus dan responsif saat berpindah antar tab navigasi.
     - Menyusun layering z-index (`relative z-10`) untuk ikon dan teks label agar tetap berada di atas sliding background.
     - Menambahkan proteksi tab collision pada state `isSidebarOpen` dan unit test assertion di `MobileBottomNav.test.ts`.
   - **Non-Negotiable Invariants Verification:**
     - 100% kelas desktop (`sm:text-xl`, `sm:h-9`, dsb.) dipertahankan tanpa perubahan visual di desktop.
     - `npx tsx --test src/components/views/OutletsView/outletsHeaderResponsiveness.test.ts` ✅ (5/5 pass).
     - `npm run drift:check` ✅ (86/86 spec-plan pairs valid, coordinator sizes ≤ 250 LOC, 0 drift).
     - `npm run build:check` ✅ (`tsc --noEmit` 0 error).
     - `npm run test:smoke` ✅ (139/139 pass, 0 fail).
     - `npm test` ✅ (911/911 tests passing across 157 suites, 0 fail).  

---

## What Was Completed This Session

1. **Implementasi Mobile Shell UI/UX Polish & Viewport Optimization (ADR-0058 — Implementation Complete):**
   - **TDD Test Suite (`src/components/layout/MobileBottomNav.test.ts`):**
     - Memverifikasi de-duplikasi tombol hamburger di `TopNav.tsx` (tidak ada lagi duplikat outer button).
     - Memverifikasi keberadaan single canonical hamburger di `TopNavBreadcrumbs.tsx` terikat ke `toggleSidebar`.
     - Memverifikasi default `mobileStrip = true` pada `KpiSummaryCards.tsx`.
     - Memverifikasi layout edge-to-edge `fixed inset-y-0 left-0` pada mobile drawer `Sidebar.tsx`.
     - Memverifikasi ketiadaan styling kaku `border border-blue-600` pada `MobileBottomNav.tsx`.
     - Memverifikasi seluruh koordinator file tetap berada di bawah batas ketat `<= 250 LOC` (`page.tsx`: 86, `TopNav.tsx`: 142, `Sidebar.tsx`: 175, `MobileBottomNav.tsx`: 134) (6/6 tests passing).
   - **De-duplikasi Hamburger Header (`TopNav.tsx` — 142 LOC):**
     - Menghapus outer `<button>` toggle dan impor ikon `Menu` dari `TopNav.tsx`.
     - Menstandarkan pemicu tunggal hamburger di dalam `TopNavBreadcrumbs.tsx`.
   - **Breadcrumb Ringkas Responsif (`TopNavBreadcrumbs.tsx` — 185 LOC):**
     - Menyembunyikan prefix panjang `[V] Vrello / Marketing Hub /` pada layar smartphone (`< 640px`).
     - Menampilkan secara eksklusif `[☰ Menu] [Active View Label]` yang ringkas (`max-w-[140px] truncate`), melenyapkan tabrakan visual dengan badge unread notification `(2)` dan avatar pengguna.
   - **Universal Mobile KPI Strip (`KpiSummaryCards.tsx` — 241 LOC):**
     - Mengubah default parameter dari `mobileStrip = false` menjadi `mobileStrip = true` pada `KpiSummaryCards` dan `KpiSummaryCardsSkeleton`.
     - Secara instan mengubah tumpukan vertikal 4-5 kartu KPI (yang tadinya memakan ~500px layar) menjadi strip carousel horizontal geser jempol (`max-h-[85px]`) di seluruh modul aplikasi (*Outlets, Placements, Events, Branches, Pipeline, Reports*).
     - Menarik tabel data dan kartu operasional langsung *above the fold* tanpa perlu scrolling berlebih.
   - **Styling Tab Modern (`MobileBottomNav.tsx` — 134 LOC):**
     - Menghapus border kaku dan dot indicator yang bertabrakan dengan label teks, mengadopsi styling pill bersih `bg-slate-100/70 dark:bg-white/10 rounded-xl` dengan warna aksen ikon pada tab aktif.
   - **Edge-to-Edge Native Sheet (`Sidebar.tsx` — 175 LOC):**
     - Mengubah penataan aside mobile menjadi `fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] rounded-r-2xl border-r shadow-2xl`, menghilangkan celah floating atas-bawah.
   - **Non-Negotiable Quality Gates:**
     - `npm run drift:check` ✅ (85/85 spec-plan pairs valid, coordinator files <= 250 LOC, 0 drift).
     - `npm run build:check` ✅ (`tsc --noEmit` 0 error).
     - `npm run test:smoke` ✅ (138/138 pass, 0 fail).
     - `npm test` ✅ (906/906 tests pass across 156 suites, 0 failures).

1. **Perencanaan Arsitektur Mobile Shell UI/UX Polish & Viewport Optimization (ADR-0058 — Planning Complete):**
   - **Analisis Kebutuhan Visual & Diagnostik Screenshot:**
     - Mendiagnosis 5 kecacatan visual dari screenshot aktual: duplikasi hamburger `☰ ☰` di TopNav, tabrakan breadcrumb dengan notifikasi merah `(2)`, penumpukan vertikal 4 kartu KPI yang memakan 500px tinggi layar, kotak border biru kaku pada tab aktif bottom nav, dan gap melayang pada mobile sidebar.
     - Merancang solusi holistik: single canonical hamburger di `TopNavBreadcrumbs.tsx`, breadcrumb ringkas khusus mobile (`sm:hidden`), universal default `mobileStrip = true` di `KpiSummaryCards.tsx` (mengubah KPI seluruh halaman menjadi carousel swipe 80px), styling pill modern di `MobileBottomNav.tsx`, dan drawer edge-to-edge native sheet di `Sidebar.tsx`.
   - **Penyusunan Dokumen Perencanaan & Handover:**
     - ADR: `docs/adr/0058-mobile-shell-ui-ux-polish-and-viewport-optimization.md` (ACCEPTED).
     - Spec: `docs/superpowers/specs/2026-11-06-mobile-shell-ui-ux-polish-design.md` (APPROVED).
     - Plan: `docs/superpowers/plans/2026-11-06-mobile-shell-ui-ux-polish.md` (APPROVED).
     - Handover: `docs/handover-mobile-shell-ui-ux-polish.md` (READY FOR EXECUTION).
   - **Verifikasi Invarian & Drift Check:**
     - `npm run drift:check` ✅ (85/85 spec-plan pairs valid, coordinator sizes ≤ 250 LOC, 0 drift).

1. **Implementasi Mobile Responsiveness Chassis & Navigation (ADR-0057 — Implementation Complete):**
   - **TDD Test Suite (`src/components/layout/MobileBottomNav.test.ts`):**
     - Memverifikasi keberadaan komponen `MobileBottomNav.tsx` serta batas ketat `<= 150 LOC`.
     - Menguji 5 tab kanonikal (*Home, Outlets, Placements, Events, Menu*) beserta icon matching (`Home`, `Store`, `MapPin`, `CalendarDays`, `Menu`).
     - Menguji restriksi viewport mobile via `md:hidden` dan layout `fixed bottom-0`.
     - Menguji keberadaan hamburger menu trigger pada `TopNav.tsx` dan binding `toggleSidebar`.
     - Menguji mounting `MobileBottomNav` pada `src/app/page.tsx` serta batas koordinator `<= 250 LOC` (5/5 passing).
   - **Atomic Component `MobileBottomNav.tsx` (114 LOC):**
     - Mengimplementasikan 5 tab navigasi bawah dengan micro-interaction `whileTap` dan dukungan `useReducedMotion()`.
     - Menghubungkan peralihan mode otomatis ke `setAppMode("marcom")` saat memilih tab *Outlets*, *Placements*, atau *Events*.
     - Menghubungkan tab *Menu* langsung ke `toggleSidebar()`.
     - Mendukung iOS safe-area inset via `pb-[env(safe-area-inset-bottom)]`.
   - **Hamburger Trigger pada `TopNav.tsx` (153 LOC):**
     - Menambahkan tombol hamburger dengan ikon `Menu` sebelum breadcrumbs pada viewport mobile (`md:hidden`).
     - Menghubungkan tombol ke selector Zustand `toggleSidebar()`.
   - **Auto-Dismissal pada `Sidebar.tsx` (175 LOC):**
     - Menambahkan helper `handleSelectView` yang menutup drawer `Sidebar` secara otomatis saat item navigasi ditekan pada viewport mobile (`window.innerWidth < 768`).
   - **Canvas Padding Responsif pada `src/app/page.tsx` (85 LOC):**
     - Mengubah padding root container menjadi `p-0 md:p-2 gap-0 md:gap-2 pb-14 md:pb-0`.
     - Mengubah styling canvas `<main>` menjadi `rounded-none md:rounded-2xl border-x-0 md:border border-y-0 md:border-y`.
     - Memasang dynamic import `<MobileBottomNav />` dengan `ssr: false`.
   - **Non-Negotiable Quality Gates:**
     - `npm run drift:check` ✅ (84/84 spec-plan pairs valid, coordinator files <= 250 LOC, 0 drift).
     - `npm run build:check` ✅ (`tsc --noEmit` 0 error).
     - `npm run test:smoke` ✅ (138/138 pass, 0 fail).
     - `npm test` ✅ (905/905 tests pass across 156 suites, 0 failures).

1. **Perencanaan Arsitektur Mobile Responsiveness Chassis & Navigation (ADR-0057 — Planning Complete):**
   - **Analisis Kebutuhan Bisnis & Desain Solusi:**
     - Mengidentifikasi kendala ketiadaan navigasi mobile (*navigation blackout*) pada viewport smartphone (< 768px), di mana `GlobalRail` disembunyikan dan `TopNav` tidak memiliki pemicu hamburger menu.
     - Merancang fondasi *Mobile Chassis* (Tahap 1): Bilah navigasi bawah atomik `MobileBottomNav.tsx` dengan 5 tab lapangan (*Home, Outlets, Placements, Events, Menu*), tombol hamburger pada `TopNav.tsx`, auto-dismiss pada `Sidebar.tsx`, dan penyesuaian safe-area canvas di `src/app/page.tsx`.
     - Menjamin keselarasan token ikon kanonikal dan warna desktop (`Home`, `Store`, `MapPin`, `CalendarDays`, `Menu`).
   - **Penyusunan Dokumen Perencanaan & Handover:**
     - ADR: `docs/adr/0057-mobile-responsiveness-chassis-and-navigation-architecture.md` (ACCEPTED).
     - Spec: `docs/superpowers/specs/2026-11-06-mobile-responsiveness-chassis-and-navigation-design.md` (APPROVED).
     - Plan: `docs/superpowers/plans/2026-11-06-mobile-responsiveness-chassis-and-navigation.md` (APPROVED).
     - Handover: `docs/handover-mobile-responsiveness-chassis-and-navigation.md` (READY FOR EXECUTION).
   - **Verifikasi Invarian & Drift Check:**
     - `npm run drift:check` ✅ (84/84 spec-plan pairs valid, 0 drift).

1. **Implementasi Hide Brain² AI Assistant from User-Facing Navigation Surfaces (ADR-0056 — Implementation Complete):**
   - **TDD Assertion (`src/components/modals/MoreAppsMenu.test.ts`):** Mengubah pengujian dari positif menjadi negatif (`assert.strictEqual(moreContent.includes("Brain² AI Assistant"), false)`) untuk mencegah regresi kebangkitan tombol AI.
   - **Global Rail Navigation (`src/components/layout/GlobalRail.tsx`):** Menghapus tombol navigasi `"ai"` (`Sparkles` icon), serta membersihkan selector Zustand `isAiDrawerOpen` dan `setAiDrawerOpen`.
   - **More Apps Popover (`src/components/modals/MoreAppsMenu.tsx`):** Menghapus tombol `"Brain² AI Assistant"`, menyisakan `Command Palette` (⌘K), `Export Center`, dan `Backup & Data`.
   - **Root Canvas Host (`src/app/page.tsx`):** Menghapus dynamic import dan unmount `<AiDrawer />` dari render tree root canvas, menghemat client evaluation saat inisialisasi aplikasi (LOC: 78).
   - **Help & Docs Card (`src/components/modals/HelpDocsModal.tsx`):** Mengganti kartu panduan *"Brain² & Autonomous Agents"* menjadi panduan operasional riil: *"Field Inventory & Equipment Loans"*.
   - **Dormancy Comment (`src/components/ai/AiDrawer.tsx`):** Menandai file sebagai kode dorman (`// ponytail: deferred AI assistant UI dormant until LLM backend integration`) tanpa menghapusnya, sehingga siap diaktifkan kembali jika integrasi LLM riil disetujui.
   - **Non-Negotiable Quality Gates:**
     - `npm run drift:check` ✅ (83/83 spec-plan pairs valid, coordinator files <= 250 LOC, 0 drift).
     - `npm run build:check` ✅ (`tsc --noEmit` 0 error).
     - `npm run test:smoke` ✅ (137/137 pass, 0 fail).
     - `npm test` ✅ (900/900 tests pass across 155 suites, 0 failures).

2. **Penyesuaian Label KPI Pipeline Matrix Table:**
   - Mengubah label kartu KPI ringkasan pada Cockpit Pipeline Operasional Outlet (`src/components/views/PipelineView/PipelineView.tsx`) dari `"MoU Sehat %"` (`MOU SEHAT %`) menjadi `"Active MoU %"` (`ACTIVE MOU %`).

2. **Perencanaan Arsitektur Hide Brain² AI Assistant from User-Facing Surfaces (ADR-0056 — Planning Complete):**
   - **Analisis Kebutuhan Bisnis & Desain Solusi:**
     - Mengidentifikasi keberadaan prototipe *Brain² AI Assistant* yang belum dibutuhkan dalam workflow operasional lapangan marcom Indosat Ooredoo Hutchison, namun tampil mencolok di navigasi utama (*Global Rail*, *More Apps Menu*, *page.tsx* root mount, dan *HelpDocsModal*).
     - Menetapkan Opsi 1 (Clean UI Dormancy): menyembunyikan seluruh tombol dan drawer dari pandangan pengguna tanpa menghapus file kode `AiDrawer.tsx` agar dapat diaktifkan kembali secara instan jika integrasi LLM riil disetujui di masa depan.
   - **Penyusunan Dokumen Perencanaan & Handover:**
     - ADR: `docs/adr/0056-hide-brain2-ai-assistant.md` (ACCEPTED).
     - Spec: `docs/superpowers/specs/2026-11-06-hide-brain2-ai-assistant-design.md` (APPROVED).
     - Plan: `docs/superpowers/plans/2026-11-06-hide-brain2-ai-assistant.md` (APPROVED).
     - Handover: `docs/handover-hide-brain2-ai-assistant.md` (READY FOR EXECUTION).
   - **Verifikasi Invarian & Drift Check:**
     - `npm run drift:check` ✅ (83/83 spec-plan pairs valid, 0 drift).

1. **Penyediaan Akun Supervisor Semarang Pandanaran & Overhaul Database Seeding:**
   - **Dedicated Supervisor Account:** Menambahkan akun `SUPERVISOR` khusus cabang Semarang Pandanaran (`branch-smg-01`) dengan email `spv.semarang@vrelloup.dev` dan nama "Raden Mas Hartono (SPV Semarang Pandanaran)".
   - **User Profile Update:** Mengubah nama tampilan akun auditor (`viewer.hendra@vrelloup.dev`) dari `"Hendra Pratama (HQ Internal Auditor)"` menjadi `"Hendra Pratama (Auditor)"` di database aktif dan `prisma/seed.ts`.
   - **Regional Scope Realignment:** Menyesuaikan scope `user-spv-jabar` (`spv.maya@vrelloup.dev`) murni untuk klaster Jawa Barat (`["branch-bdg-01", "branch-crb-01"]`).
   - **Production-Grade Seed Script (`prisma/seed.ts`):** Overhaul seed script dengan dataset realistis marcom Indosat Ooredoo Hutchison (IM3 & Tri) mencakup seluruh arsitektur ADR-0001 hingga ADR-0055 (14 pengguna, 8 cabang, 6 material, 22 outlet, 8 MoU, 22 placement, 6 event, 14 inventaris, 8 peminjaman, 21 item pinjam, 14 post konten, 10 dokumen, 4 laporan bulanan).
   - **Verifikasi Eksekusi:**
     - Database seed selesai sukses dalam 41.98s dengan 0 error.
     - `npm run drift:check` ✅ (0 drift).
     - `npm run build:check` ✅ (`tsc --noEmit` 0 error).
     - `npm run test:smoke` ✅ (137/137 pass, 0 fail).

2. **Implementasi Field Event Completion Unreturned Equipment Warning Workflow (ADR-0054 — Implementation Complete):**
   - **Pure Logic & Aggregation Engine (`src/lib/marcom/eventEquipmentHelpers.ts`):**
     - Memperluas interface `EventEquipmentSummary` dengan `hasUnreturned: boolean` dan `unreturnedList: UnreturnedEquipmentItem[]`.
     - Mengimplementasikan deteksi status pinjaman terbuka (`ACTIVE`, `OVERDUE`, `PENDING`, `APPROVED`) yang terhubung dengan event, mengekstrak rincian peminjam, due date, dan breakdown item alat.
     - Menambahkan penanda utang operasional `ponytail: debt DEBT-EVENT-LOGISTICS-001`.
   - **Unit Testing Pure Logic (`src/lib/marcom/eventEquipmentHelpers.test.ts`):**
     - Menambahkan unit tests untuk memverifikasi penanganan status: pinjaman berstatus `RETURNED` dan `CANCELLED` menghasilkan `hasUnreturned: false`, sedangkan `ACTIVE`/`OVERDUE`/`PENDING` menghasilkan `hasUnreturned: true` beserta ekstraksi daftar item alat tercecer (6/6 passing).
   - **Warning Interception Modal (`src/components/views/EventsView/EventCompleteWarningModal.tsx`):**
     - Membuat dialog interseptif saat operator mencoba menandai event sebagai `COMPLETED` saat masih ada alat yang belum kembali.
     - Menyediakan visualisasi kartu pinjaman (kode pinjam, nama PIC peminjam, telepon, jadwal tempo, rincian unit alat).
     - Menyediakan dua jalur tindakan: *"Batal & Periksa Alat"* (membatalkan status change dan trigger scroll ke seksi inventaris) serta *"Tetap Selesaikan Acara (Override)"* (mengizinkan penutupan event dengan peringatan audit).
   - **Integrasi EventDrawer (`src/components/views/EventsView/EventDrawer.tsx`):**
     - Mengintersepsi pemilihan status `COMPLETED` dari dropdown status (Opsi B) seketika bila `equipmentSummary?.hasUnreturned`.
     - Menambahkan banner peringatan permanen berlatar amber/kuning di bawah header drawer ketika event berstatus `COMPLETED` namun masih memiliki alat yang belum kembali ke gudang.
     - Menambahkan ID anchor `#borrowed-equipment-section` dengan auto-scroll halus ke daftar alat saat operator membatalkan dialog.
   - **Multi-Surface Pervasive Visibility:**
     - `EventCardsView.tsx`: Menampilkan badge peringatan berlatar merah/oranye dengan ikon `AlertTriangle` dan teks `${equipmentSummary.totalUnits} Unit (Alat Tercecer)` ketika event berstatus `COMPLETED`.
     - `EventTableView.tsx`: Menghubungkan store `borrowRecords` dan menampilkan pill badge peringatan oranye pada kolom nama event bila memiliki alat belum kembali.
     - `Outlet360Drawer.tsx`: Menampilkan pill peringatan *"Alat Belum Kembali"* pada tab Field Events di samping status event.
     - `PipelineMatrixTable.tsx`: Menambahkan `nearestEventId` ke `OutletPipelineRow.eventSummary` di SSOT (`src/types/index.ts`) dan `pipelineEngine.ts`, serta menampilkan indikator peringatan alat belum kembali di Kolom 4 (Field Events).
   - **Non-Negotiable Gates & Quality Verifications:**
     - `npm run drift:check` ✅ (82/82 spec-plan pairs valid, 0 drift).
     - `npm run build:check` ✅ (`tsc --noEmit` 0 errors).
     - `npm run test:smoke` ✅ (137/137 tests pass, 0 failures).
     - `npm test` ✅ (899/899 tests pass across 155 suites, 0 failures).

2. **Implementasi Modular 4-Step Wizard Stepper Header untuk BorrowRequestModal (ADR-0055 — Implementation Complete):**
   - **Modular Helper & Validation Logic (`src/components/views/InventoryView/wizard/borrowWizardHelpers.ts`):**
     - Mendefinisikan metadata 4 langkah (`BORROW_WIZARD_STEPS`): *Peminjam* (Langkah 1), *Jadwal & Event* (Langkah 2), *Pilih Alat* (Langkah 3), *Review & Submit* (Langkah 4).
     - Mengekspor pure logic guard `canAdvanceFromBorrowStep` untuk memvalidasi syarat input tiap langkah dan `getBorrowStepCompletionStatus` untuk status centang (*completed*).
   - **Komponen Visual Stepper (`src/components/views/InventoryView/wizard/BorrowStepperHeader.tsx`):**
     - Menghadirkan 4 kartu langkah responsif dengan sequensial nomor lingkaran, label utama, sub-label (*Langkah 1..4*), dan ikon mobile responsif (`User`, `Calendar`, `Package`, `ClipboardCheck`).
     - Menerapkan styling status token Tailwind: *Current* (Blue-600 ring highlight & bg-tint), *Completed* (ikon centang `Check` berlatar emerald-500), dan *Inactive* (slate disabled).
     - Menambahkan progress track bar horizontal animasi `(currentStep / 4) * 100%`.
     - Mengimplementasikan handler klik selektif: melompat kembali ke langkah sebelumnya yang sudah selesai/tervalidasi, dan memblokir lompatan ke langkah depan yang belum memenuhi syarat.
   - **Integrasi Host Modal (`src/components/views/InventoryView/BorrowRequestModal.tsx`):**
     - Memasang `<BorrowStepperHeader />` di bawah baris judul modal dan mengaitkan `completionStatus` secara reaktif via `useMemo`.
   - **Otomatisasi Pengujian & Non-Negotiable Gates:**
     - Menambahkan unit tests komprehensif pada `src/components/views/InventoryView/borrowRequestModal.test.ts` (10/10 tests pass).
     - `npm run drift:check` ✅ (82/82 spec-plan pairs valid, 0 drift).
     - `npm run build:check` ✅ (`tsc --noEmit` 0 errors).
     - `npm run test:smoke` ✅ (137/137 tests pass, 0 failures).
     - `npm test` ✅ (897/897 tests pass across 155 suites, 0 failures).

2. **Perencanaan Arsitektur Peringatan Penutupan Event dengan Alat Inventaris Belum Kembali (ADR-0054 — Planning Complete):**
   - **Analisis Kebutuhan Bisnis & Tata Kelola Operasional:**
     - Mengidentifikasi celah di mana PIC dapat langsung menutup acara (`COMPLETED`) di `PATCH /api/marcom/events/[id]` dan `EventDrawer.tsx` saat peralatan bernilai tinggi masih tercecer/berstatus `ACTIVE`/`OVERDUE` di lapangan.
     - Merancang pendekatan pragmatis (Opsi 2 dengan Operational Debt): backend tetap permisif (zero hard blocker), namun di UI dilakukan intersepsi seketika saat memilih opsi "Completed" (Opsi B) via `EventCompleteWarningModal.tsx`.
     - Menyebarkan sinyal peringatan visual di multi-permukaan: kartu event (`EventCardsView`), baris tabel event (`EventTableView`), sub-drawer field events di Cockpit 360° (`Outlet360Drawer`), dan baris tabel pipeline (`PipelineMatrixTable`).
     - Mencatat utang operasional `DEBT-EVENT-LOGISTICS-001` dengan kriteria migrasi yang jelas ke fail-closed blocker Opsi 1.
   - **Penyusunan Dokumen Perencanaan & Handover:**
     - ADR: `docs/adr/0054-field-event-completion-unreturned-equipment-warning-workflow.md` (APPROVED).
     - Spec: `docs/superpowers/specs/2026-11-06-field-event-completion-unreturned-equipment-warning-workflow-design.md` (APPROVED).
     - Plan: `docs/superpowers/plans/2026-11-06-field-event-completion-unreturned-equipment-warning-workflow.md` (APPROVED).
     - Handover: `docs/handover-field-event-completion-unreturned-equipment-warning-workflow.md` (EXECUTION-READY).
   - **Non-Negotiable Gates:**
     - `npm run drift:check` ✅ (82/82 spec-plan pairs valid, 0 drift).

2. **Perencanaan Arsitektur Modular 4-Step Wizard Stepper Header untuk BorrowRequestModal (ADR-0055 — Planning Complete):**
   - **Analisis Kebutuhan & UX Alignment:**
     - Menganalisis modal permohonan pinjam alat (`BorrowRequestModal.tsx`) yang saat ini hanya menampilkan badge teks polos (*Step 1 of 4*).
     - Menyelaraskan desain visual horizontal stepper dengan modal eksekusi POSM Lapangan (`PlacementFormModal.tsx`), menghadirkan 4 kartu langkah (*Peminjam, Jadwal & Event, Pilih Alat, Review*), nomor lingkaran, label langkah, sub-label (*Langkah 1..4*), ikon mobile responsif, status centang hijau saat selesai, dan progress track bar animasi `(step / 4) * 100%`.
     - Menetapkan aturan navigasi selektif: pengguna dapat melompat kembali ke langkah sebelumnya atau langkah yang telah tervalidasi, namun diblokir melompat ke langkah depan yang belum memenuhi guard validasi.
     - Mengadopsi token warna biru khas Inventory (`blue-600`, `ring-blue-500/20`) agar konsisten dengan tombol dan kartu di modul inventaris.
   - **Penyusunan Dokumen Perencanaan & Handover:**
     - ADR: `docs/adr/0055-borrow-request-modal-stepper-header.md` (APPROVED).
     - Spec: `docs/superpowers/specs/2026-11-06-borrow-request-modal-stepper-header-design.md` (APPROVED).
     - Plan: `docs/superpowers/plans/2026-11-06-borrow-request-modal-stepper-header.md` (APPROVED).
     - Handover: `docs/handover-borrow-request-modal-stepper-header.md` (EXECUTION-READY).
   - **Non-Negotiable Gates:**
     - `npm run drift:check` ✅ (82/82 spec-plan pairs valid, 0 drift).

2. **Implementasi Outlet Soft-Delete Architecture & Database Restrict Protection (ADR-0053 — Implementation Complete):**
   - **Database & Prisma Schema Hardening:**
     - Menambahkan kolom `deletedAt DateTime?` dan index `@@index([deletedAt])` pada model `Outlet` di `prisma/schema.prisma`.
     - Mengubah relasi `Placement.outlet` dari cascade delete menjadi `onDelete: Restrict` di Prisma schema dan mengeksekusi DDL constraint `Placement_outletId_fkey ON DELETE RESTRICT ON UPDATE CASCADE` di Supabase Postgres.
     - Melakukan sinkronisasi schema client via `npx prisma generate`.
   - **SSOT Domain Entities (`src/types/index.ts`):**
     - Menambahkan field `deletedAt?: string | Date | null` pada domain interface `OutletItem` (dan `Outlet`).
   - **Query Filtering & Operational Form Guard (`outletsSearchFilter.ts`):**
     - Menambahkan opsi `includeDeleted?: boolean | null` pada `OutletSearchFilterOptions`.
     - Mengisolasi kueri direktori toko default dengan klausul `where.deletedAt = null` (kecuali jika eksplisit diminta via `includeDeleted: true`).
     - Menegakkan operational form guard: menambahkan klausul `where.active = true` saat kueri difilter dengan `status === "APPROVED"` agar form operasional POSM/MoU/Event terlindung dari toko non-aktif maupun toko soft-deleted.
   - **API Mutation Endpoints (Single & Batch Soft-Delete):**
     - Memperbarui `GET /api/marcom/outlets/[id]/route.ts`: mengembalikan HTTP 404 jika toko berstatus soft-deleted (`deletedAt !== null`), kecuali jika `includeDeleted=true`.
     - Memperbarui `DELETE /api/marcom/outlets/[id]/route.ts`: mengganti penghapusan fisik dengan soft-delete murni (`prisma.outlet.update` menyetel `{ deletedAt: new Date(), active: false }`). Menolak penghapusan berulang dengan HTTP 404 jika toko sudah dalam status soft-deleted.
     - Memperbarui `GET /api/marcom/outlets/route.ts`: mengekstrak parameter `includeDeleted` dari search params.
     - Memperbarui `DELETE /api/marcom/outlets/route.ts`: mengganti `deleteMany` fisik dengan batch soft-delete `prisma.outlet.updateMany` pada toko yang belum terhapus (`where: { id: { in: ids }, deletedAt: null }`).
   - **Otomatisasi Pengujian & Seed Data Fixture:**
     - Membuat test suite `src/app/api/marcom/outlets/outletSoftDelete.test.ts` (6/6 tests passed) menguji default filter exclusion, `includeDeleted` bypass, operational form active guard, single soft-delete, placement preservation, pencegahan repeat delete (404), dan batch soft-delete.
     - Memperbarui deterministic seed di `prisma/seed.ts` dengan fixture toko soft-deleted `outlet-del-999` ("Toko Legend Era Tutup (Soft-Deleted)") dan placement historis `plc-hist-999` bernilai `1500000` status `DONE`.
   - **Non-Negotiable Verification Gates:**
     - `npm run drift:check` ✅ (80/80 spec-plan pairs valid, 0 drift).
     - `npm run build:check` ✅ (`tsc --noEmit` 0 errors).
     - `npm test` ✅ (892/892 tests passed across 155 suites, 0 failures).
     - `npm run test:smoke` ✅ (133/133 tests passed, 0 failures).

2. **Perencanaan Arsitektur Outlet Soft-Delete & Database Restrict Protection (ADR-0053 — Planning Complete):**
   - **Analisis Risiko Finansial & Master Data Invariants:**
     - Mengidentifikasi kerentanan kritis *cascade deletion* pada skema Prisma di mana penghapusan `Outlet` menghapus permanen seluruh riwayat pemasangan materi promosi (`Placement`), foto bukti fisik di toko, dan realisasi anggaran promosi (`cost`), menyebabkan distorsi retrospektif pada Laporan Triwulanan Eksekutif.
     - Merumuskan arsitektur soft-delete murni sesuai mandat bisnis: **"Meskipun tertulis hapus permanen, tetap tidak boleh ada hard delete."**
     - Mengubah relasi PostgreSQL `Placement.outlet` dari `onDelete: Cascade` menjadi `onDelete: Restrict` sebagai pertahanan berlapis di tingkat database.
     - Mengisolasi kueri direktori toko dengan filter default `where.deletedAt = null` pada `outletsSearchFilter.ts`, serta mewajibkan `active = true` untuk seleksi form operasional POSM/MoU/Event.
   - **Penyusunan Dokumen Perencanaan & Handover:**
     - ADR: `docs/adr/0053-outlet-soft-delete-and-database-restrict-protection.md` (APPROVED).
     - Spec: `docs/superpowers/specs/2026-11-06-outlet-soft-delete-and-database-restrict-protection-design.md` (APPROVED).
     - Plan: `docs/superpowers/plans/2026-11-06-outlet-soft-delete-and-database-restrict-protection.md` (APPROVED).
     - Handover: `docs/handover-outlet-soft-delete-and-database-restrict-protection.md` (READY FOR EXECUTION).
   - **Non-Negotiable Gates:**
     - `npm run drift:check` ✅ (80/80 spec-plan pairs valid, 0 drift).

2. **Implementasi Pelunasan Ganti Rugi Inventaris & Pemulihan Stok (ADR-0052 — Implementation Complete):**
   - **Database & SSOT Domain Entities:**
     - Menambahkan 6 field settlement pada model `BorrowRecord` di `prisma/schema.prisma`: `settlementType`, `settledAmount`, `settledAt`, `settledBy`, `settlementNotes`, dan `settlementProofUrls: String[]`.
     - Mengeksekusi DDL migration pada Postgres dan menyinkronkan client via `npx prisma generate`.
     - Mengekspor enum tipe SSOT `CompensationSettlementType = "NONE" | "CASH_TRANSFER" | "ITEM_REPLACEMENT"` dan memperbarui domain interface `BorrowRecord` di `src/types/index.ts`.
   - **Backend Mutation Endpoint & Transaksi Atomik (`/borrow/[id]/settle/route.ts`):**
     - Menerapkan fail-closed authentication guard (HTTP 401) dan Four-Eyes Principle RBAC guard (HTTP 403): membatasi wewenang eksekusi hanya untuk role `warehouse`, `admin`, dan `super_admin`, serta melarang staf peminjam melunasi liabilitasnya sendiri.
     - Validasi status awal: menolak permohonan pelunasan apabila record tidak berstatus `PENDING_SETTLEMENT` (HTTP 400).
     - Validasi kelengkapan data: menolak jika catatan kosong (HTTP 400) atau berkas bukti tidak dilampirkan (HTTP 422).
     - Menjalankan mutasi dalam transaksi atomik Prisma (`$transaction`):
       - Mode `CASH_TRANSFER`: mencatat `settledAmount`, mengubah `compensationStatus` menjadi `RESOLVED`, dan membiarkan stok master tetap afkir (karena uang masuk ke kas operasional).
       - Mode `ITEM_REPLACEMENT`: mencatat `settledAmount = 0`, mengubah `compensationStatus` menjadi `RESOLVED`, dan secara atomik memulihkan `totalUnits` serta `availableUnits` pada `InventoryItem` sebanyak jumlah unit afkir (`majorDamageUnits + lostUnits`).
   - **Antarmuka Pengguna & Attachment Deck (`InventoryView`):**
     - Membuat komponen baru `BorrowSettlementModal.tsx`: switch mode dinamis (Kas vs Penggantian Barang), kalkulasi live total unit afkir, input catatan pelunasan, dan deck upload multi-berkas (`multiple`) ke `/api/marcom/uploads` (`kind: "inventory-proofs"`) dengan tombol hapus individual per berkas.
     - Memperbarui `BorrowDetailModal.tsx`: menambahkan tombol aksi *"Selesaikan Ganti Rugi"* (khusus status `PENDING_SETTLEMENT` dan `canManage`), serta kartu rincian pelunasan lengkap (metode, tanggal, verifikator, keterangan, dan tautan berkas bukti) apabila berstatus `RESOLVED`.
     - Memperbarui `InventoryViewModals.tsx` untuk meneruskan event `onSettled` secara reaktif ke state view.
   - **Otomatisasi Pengujian & Seed Data Fixture:**
     - Menambahkan pengujian integrasi lifecycle ganti rugi pada `src/app/api/marcom/inventory/inventoryApi.test.ts` (5/5 tests passed).
     - Membuat pengujian invarian struktural UI pada `src/components/views/InventoryView/borrowSettlementModal.test.ts` (4/4 tests passed).
     - Memperbarui deterministic seed di `prisma/seed.ts` dengan data fixture ganti rugi pending (`brw-rec-004`) dan ganti rugi lunas penggantian barang (`brw-rec-005`).
   - **Non-Negotiable Verification Gates:**
     - `npm run drift:check` ✅ (79/79 spec-plan pairs valid, 0 drift).
     - `npm run build:check` ✅ (`tsc --noEmit` 0 errors).
     - `npm test` ✅ (886/886 tests passed across 154 suites, 0 failures).
     - `npm run test:smoke` ✅ (127/127 tests passed, 0 failures).

2. **Perencanaan Arsitektur Pelunasan Ganti Rugi Inventaris & Pemulihan Stok (ADR-0052 — Planning Complete):**
   - **Analisis Kebutuhan Bisnis & Tata Kelola Operasional:**
     - Mengidentifikasi celah siklus ganti rugi di mana liabilitas kerusakan/kehilangan inventaris tertahan pada status `PENDING_SETTLEMENT` tanpa alur atau tombol pelunasan.
     - Merancang dua mode pelunasan dalam satu modal terpadu:
       1. `CASH_TRANSFER`: Pembayaran tunai/transfer penuh; stok master inventaris tetap afkir (uang masuk kas perusahaan).
       2. `ITEM_REPLACEMENT`: Penggantian unit fisik baru; transaksi atomik (`$transaction`) secara otomatis memulihkan `totalUnits` dan `availableUnits` pada `InventoryItem`.
     - Menyediakan dukungan upload multi-berkas bukti pembayaran / serah terima barang (`settlementProofUrls: String[]`).
     - Menegakkan *Four-Eyes Principle*: melarang staf peminjam melunasi liabilitasnya sendiri; membatasi wewenang mutasi pelunasan hanya untuk role `warehouse` dan `admin`.
   - **Penyusunan Dokumen Perencanaan & Handover:**
     - ADR: `docs/adr/0052-inventory-compensation-settlement-and-restoration-workflow.md` (APPROVED).
     - Spec: `docs/superpowers/specs/2026-11-06-inventory-compensation-settlement-and-restoration-workflow-design.md` (APPROVED).
     - Plan: `docs/superpowers/plans/2026-11-06-inventory-compensation-settlement-and-restoration-workflow.md` (APPROVED).
     - Handover: `docs/handover-inventory-compensation-settlement-and-restoration-workflow.md` (READY FOR EXECUTION).
   - **Non-Negotiable Gates:**
     - `npm run drift:check` ✅ (79/79 spec-plan pairs valid, 0 drift).

2. **Implementasi MoU Multi-Document Upload, Mandatory Approval Guard & Revision Lifecycle (ADR-0051 — Implementation Complete):**
   - **Database & SSOT Domain Entities:**
     - Menambahkan nilai `REVISION` pada enum `MouStatus` dan kolom array `docPaths String[] @default([])` pada model `Mou` di `prisma/schema.prisma` serta SSOT types `src/types/index.ts`.
     - Migrasi skema database Postgres via raw DDL SQL dan sinkronisasi client dengan `npx prisma generate`.
     - Mempertahankan kolom skalar `docPath` untuk backward-compatibility dan secara otomatis menyinkronkannya dengan berkas pertama (`docPaths[0]`).
   - **State Machine & Backend Fail-Closed Guard:**
     - Memperbarui state machine `src/lib/marcom/mouMachine.ts`: mengizinkan transisi `SUBMITTED -> APPROVED | REVISION | REJECTED | DRAFT`, `REVISION -> SUBMITTED | DRAFT`, dan `REJECTED -> DRAFT`.
     - Menambahkan backend fail-closed guard pada `PATCH /api/marcom/mous/[id]/route.ts`: menolak permohonan transisi ke status `APPROVED` atau `DONE` apabila tidak terdapat dokumen fisik/digital yang diunggah (`docPaths.length === 0` dan `docPath` kosong) dengan status `HTTP 422 Unprocessable Entity`.
     - Memperbarui `POST /api/marcom/mous/route.ts` untuk menerima `docPaths`, membersihkan array string, dan menyinkronkan berkas utama ke `docPath`.
     - Memperbarui `src/components/views/MousView/mouApi.ts` dan menambahkan unit test pada `mouApi.test.ts` (5/5 passed) & `mouMachine.test.ts` (3/3 passed).
   - **Pipeline View & Cockpit Integration:**
     - Memperbarui `src/lib/marcom/pipelineEngine.ts` untuk mengenali status `REVISION` dalam `normalizeMouStatus`.
     - Menjaga invarian kesehatan pipeline: `isHealthy` tetap `false` saat status `REVISION`, dan materi promosi permanen yang belum memiliki MoU disetujui otomatis ditandai sebagai `isBlockedItem` (Bottleneck POSM).
     - Menambahkan badge oranye dengan ikon `RotateCcw` ("Perlu Revisi" dan "Revisi") pada `PipelineMatrixTable.tsx` dan `PipelineCockpitCardList.tsx`.
     - Menambahkan unit test pipeline engine pada `src/lib/marcom/pipelineEngine.test.ts` (10/10 passed).
   - **MousView UI Multi-File & In-Place Revision Controls:**
     - `mouSortingHelpers.ts`: Menambahkan bobot urutan operasional `REVISION: 3`.
     - `mouColumns.tsx`: Menambahkan styling status `REVISION` (oranye), indikator jumlah berkas tambahan (`+N`), dan state guard tooltip pada tombol quick approve jika dokumen belum diunggah.
     - `MousView.tsx`: Menambahkan opsi filter chip "Revision" pada tab status.
     - `MouExpandedRow.tsx` & `MouDetailDrawer.tsx`: Menambahkan kontrol alur revisi in-place: tombol "Minta Revisi", "Tolak", "Submit Ulang", dan "Kembalikan ke Draft", serta disable guard bertooltip pada tombol approval jika berkas belum diunggah.
     - `MouFormModal.tsx`: Mendukung multi-file upload (`<input multiple accept="application/pdf,image/*">`), proses upload paralel via Supabase Storage, deck attachment list per berkas dengan tombol hapus individual, dan tombol "+ Tambah Berkas / Lembar Tambahan".
     - `MouDocumentViewerModal.tsx`: Mendukung paginasi multi-lembar (*"Berkas X dari Y"*), tombol navigasi Prev/Next, dot indicator interaktif, serta keyboard shortcut panah kiri/kanan.
   - **Seed Fixtures & Non-Negotiable Gates:**
     - Memperbarui fixture `prisma/seed.ts`: MoU `mou-hlth-004` dengan 3 lembar foto lampiran fisik dan menambahkan MoU `mou-rev-007` berstatus `REVISION`.
     - Menjalankan seed ulang dengan sukses (`npx tsx prisma/seed.ts`).
     - `npm run drift:check` ✅ (78/78 spec-plan pairs valid, 0 drift).
     - `npm run build:check` ✅ (`tsc --noEmit` 0 errors).
     - `npm test` ✅ (881/881 tests passed across 153 test suites, 0 failures).

2. **Perencanaan Arsitektur MoU Multi-Document Upload, Mandatory Approval Guard & Revision Lifecycle (ADR-0051 — Planning Complete):**
   - **Discovery & Analisis Akar Masalah:**
     - Mengidentifikasi celah tata kelola di mana status MoU dapat disetujui (`APPROVED`) atau diselesaikan (`DONE`) tanpa adanya dokumen fisik/digital kontrak yang sah.
     - Mengidentifikasi batasan format lampiran berkas tunggal yang memaksa staf di lapangan menggabungkan foto kamera smartphone secara manual menjadi PDF sebelum mengunggah.
     - Mengidentifikasi *dead-end rejection UX* di mana status `REJECTED` tidak menyediakan tombol aksi pemulihan di tabel atau laci detail, memaksa staf menduplikasi baris MoU baru melalui tombol "+ Buat MoU Baru".
     - Menganalisis dampak integrasi status baru terhadap `PipelineView` & `pipelineEngine.ts` (`isHealthy`, `isBlockedItem` pada materi permanen, serta deteksi bottleneck SLA).
   - **Penyusunan Dokumen Perencanaan & Handover:**
     - ADR: `docs/adr/0051-mou-multi-document-upload-mandatory-approval-guard-and-revision-lifecycle.md` (APPROVED).
     - Spec: `docs/superpowers/specs/2026-11-06-mou-multi-document-upload-mandatory-approval-guard-and-revision-lifecycle-design.md` (APPROVED).
     - Plan: `docs/superpowers/plans/2026-11-06-mou-multi-document-upload-mandatory-approval-guard-and-revision-lifecycle.md` (APPROVED).
     - Handover: `docs/handover-mou-multi-document-upload-mandatory-approval-guard-and-revision-lifecycle.md` (READY FOR EXECUTION).
   - **Non-Negotiable Gates:**
     - `npm run drift:check` ✅ (78/78 spec-plan pairs valid, 0 drift).

2. **Implementasi Role Warehouse, Inspeksi Pengembalian & Tracking Ganti Rugi Alat (ADR-0050 — Implementation Complete):**
   - **Database & SSOT Domain Entities:**
     - Menambahkan nilai `WAREHOUSE` pada enum `DbUserRole` di `prisma/schema.prisma` dan type `UserRole` di `src/types/index.ts`.
     - Menambahkan kolom multi-unit breakdown pada `BorrowItem`: `goodUnits`, `minorDamageUnits`, `majorDamageUnits`, `lostUnits`.
     - Menambahkan kolom pelacakan ganti rugi pada `BorrowRecord`: `compensationAmount`, `compensationStatus` (`NONE`, `PENDING_SETTLEMENT`, `RESOLVED`), `compensationNotes`, dan array `damagePhotos`.
     - Sinkronisasi skema database via database migration SQL dan `npx prisma generate`.
   - **Hardening RBAC & Four-Eyes Principle (`src/lib/marcom/guards.ts`):**
     - Menambahkan definisi role `warehouse` dengan wewenang CUD penuh pada modul inventaris (`VIEW_INVENTORY`, `MANAGE_INVENTORY`, `REQUEST_BORROW`, `APPROVE_BORROW`, `PROCESS_RETURN`).
     - Menetapkan aturan *Zero-Write / Read-Only* mutlak bagi role `warehouse` terhadap seluruh modul operasional lainnya (MoU, Placements, Outlets, Events, Content, Docs, Reports).
     - Menegakkan *Four-Eyes Principle* dengan mencabut hak `PROCESS_RETURN` dan `MANAGE_INVENTORY` dari role `staff`.
     - Memperbarui `hasScopedPermission`, `resolveMarcomRole`, dan `canAssignUserRole` untuk mendukung role `warehouse`.
   - **Backend Mutation Endpoint Guard & Stock Balancing (`return/route.ts`):**
     - Memvalidasi otorisasi: menolak permohonan pengembalian dari `staff` atau `viewer` dengan `HTTP 403 Forbidden`.
     - Memvalidasi alokasi breakdown: menolak jika penjumlahan `goodUnits + minorDamageUnits + majorDamageUnits + lostUnits !== bi.quantity` dengan `HTTP 422 Unprocessable Entity`.
     - Menghitung mutasi stok master secara atomik dalam `$transaction`:
       - Unit `good` dan `minorDamage` dipulihkan ke `availableUnits`.
       - Unit `majorDamage` dan `lost` dihapusbukukan (afkir) secara permanen dari `totalUnits` (mengurangi `totalUnits`).
       - Status ganti rugi otomatis diatur ke `PENDING_SETTLEMENT` jika terdapat unit afkir.
   - **Penyelarasan Antarmuka & Modals (`InventoryView` & `UsersView`):**
     - `ReturnProcessModal.tsx`: Input numerik 4 kondisi unit per item dengan indikator real-time jika total tidak sesuai, kartu kewajiban ganti rugi (nominal, status lunas/pending, catatan, dan galeri upload foto bukti), serta submit button guard `disabled={loading || isAnySumInvalid}`.
     - `BorrowDetailModal.tsx`: Menampilkan badge status kewajiban ganti rugi di header, kartu rincian kompensasi dan galeri foto bukti kerusakan, serta sub-rincian alokasi unit pada tabel peralatan.
     - `UserRoleSelect.tsx`: Menambahkan opsi `Warehouse` pada dropdown pemilihan role pengguna.
   - **Otomatisasi Pengujian Regresi & Invarian:**
     - `src/lib/marcom/guards.test.ts`: Uji wewenang warehouse & pencabutan return pada staff (15/15 passed).
     - `src/app/api/marcom/inventory/inventoryApi.test.ts`: Uji otorisasi 403, validasi jumlah 422, dan aritmatika keseimbangan stok & ganti rugi (4/4 passed).
     - `src/components/views/InventoryView/returnProcessModal.test.ts`: Uji invarian struktural breakdown steppers, upload foto, dan opsi role warehouse (4/4 passed).
   - **Non-Negotiable Gates:**
     - `npm run drift:check` ✅ (77/77 spec-plan pairs valid, 0 drift).
     - `npm run build:check` ✅ (`tsc --noEmit` 0 errors).
     - `npm test` ✅ (877/877 tests passed across 153 test suites, 0 failures).

2. **Perencanaan Arsitektur Role Warehouse, Inspeksi Pengembalian & Tracking Ganti Rugi Alat (ADR-0050 — Planning Complete):**
   - **Analisis Root Cause & Blast Radius:**
     - Mengidentifikasi anomali fatal pada `return/route.ts` di mana barang rusak berat (`MAJOR_DAMAGE`) tetap dipulihkan ke `availableUnits`.
     - Mengidentifikasi celah hilangnya akurasi stok master karena ketiadaan breakdown kondisi per unit pada peminjaman kuantitas jamak (`quantity > 1`).
     - Mengidentifikasi celah hilangnya data liabilitas ganti rugi (pencatatan nominal, metode, status penyelesaian, dan foto bukti kerusakan).
     - Menegakkan *Four-Eyes Principle* dengan mencabut izin `PROCESS_RETURN` dan `MANAGE_INVENTORY` dari `staff`, serta membentuk role `WAREHOUSE` yang memiliki hak CUD penuh di inventaris dan strictly Read-Only di modul lain.
   - **Penyusunan Dokumen Perencanaan & Handover:**
     - ADR: `docs/adr/0050-warehouse-role-and-return-inspection-compensation-workflow.md` (APPROVED).
     - Spec: `docs/superpowers/specs/2026-11-06-warehouse-role-and-return-inspection-compensation-workflow-design.md` (APPROVED).
     - Plan: `docs/superpowers/plans/2026-11-06-warehouse-role-and-return-inspection-compensation-workflow.md` (COMPLETE).
     - Handover: `docs/handover-warehouse-role-and-return-inspection-compensation-workflow.md` (READY FOR EXECUTION).
   - **Non-Negotiable Gates:**
     - `npm run drift:check` ✅ (77/77 spec-plan pairs valid, 0 drift).

2. **Pembatasan Pemilihan Toko Hanya untuk Outlet Terverifikasi (APPROVED) pada Form Operasional (ADR-0049 — Implementation Complete):**
   - **Backend Mutation Guard (`src/app/api/marcom/placements/route.ts`):**
     - Menambahkan verifikasi status toko sebelum membuat penempatan POSM baru (`prisma.placement.create`).
     - Menolak penempatan pada outlet berstatus `PENDING_APPROVAL`, `DRAFT`, atau `REJECTED` dengan respons `HTTP 400 Bad Request` ("Hanya outlet berstatus APPROVED yang dapat dipasangi materi promosi.").
     - Menolak outlet yang tidak ditemukan dengan `HTTP 404 Not Found`.
   - **Penyelarasan Form & Drawer Operasional:**
     - `src/components/views/PlacementsView/OutletSearchCombobox.tsx`: Menambahkan parameter `status: "APPROVED"` pada query pencarian outlet.
     - `src/components/views/EventsView/EventCreateModal.tsx`: Memperbarui request fetch ke `/api/marcom/outlets?status=APPROVED`.
     - `src/components/views/EventsView/EventDrawer.tsx`: Memperbarui request fetch ke `/api/marcom/outlets?status=APPROVED`.
     - `src/components/views/ContentPlannerView/ContentPostModal.tsx`: Memperbarui request fetch ke `/api/marcom/outlets?status=APPROVED`.
     - `src/components/views/MousView/MousView.tsx`: Memfilter `storeOutlets.filter(o => o.status === "APPROVED")` sebelum memetakan ke pilihan `MouFormModal`.
   - **Otomatisasi Pengujian Regresi & Invarian:**
     - Dibuat unit test guard backend di `src/app/api/marcom/placements/placementOutletGuard.test.ts` (3/3 tests pass).
     - Dibuat structural invariant test di `src/components/views/PlacementsView/operationalOutletFilter.test.ts` (6/6 tests pass).
   - **Penyusunan Dokumen Perencanaan & Handover:**
     - ADR: `docs/adr/0049-filter-approved-outlets-in-operational-forms.md` (APPROVED).
     - Spec: `docs/superpowers/specs/2026-11-05-filter-approved-outlets-in-operational-forms-design.md` (APPROVED).
     - Plan: `docs/superpowers/plans/2026-11-05-filter-approved-outlets-in-operational-forms.md` (COMPLETE).
     - Handover: `docs/handover-filter-approved-outlets-in-operational-forms.md` (COMPLETE).
   - **Non-Negotiable Gates:**
     - `npm run drift:check` ✅ (76/76 spec-plan pairs valid, 0 drift).
     - `npm run build:check` ✅ (`tsc --noEmit` 0 errors).
     - `npm test` ✅ (869/869 tests pass across 154 test suites, 0 failures).

2. **Perbaikan Bug Logout Redirection via Hard Browser Navigation (ADR-0048 — Implementation Complete):**
   - **Eliminasi Soft Navigation & Cache Purge (`src/components/layout/UserMenuDropdown.tsx`):**
     - Menggantikan `router.push("/login")` dan `router.refresh()` dengan `window.location.href = "/login"`.
     - Menghancurkan seluruh in-memory state Zustand dan RSC caches, menjamin pengguna keluar secara instan ke layar login tanpa tersisa sebagai "Pengguna VIEWER".
   - **Indikator Loading & Pencegahan Double-Click (`UserMenuDropdown.tsx`):**
     - Menambahkan state `isLoggingOut`.
     - Tombol "Keluar (Sign Out)" menampilkan ikon animasi berputar `Loader2` dan teks berganti menjadi "Keluar..." saat proses logout berjalan.
     - Memproteksi tombol dari double-click via properti `disabled` dan kelas CSS `pointer-events-none opacity-70 cursor-wait`.
   - **Otomatisasi Pengujian Regresi (`src/components/layout/userMenuSignOut.test.ts`):**
     - Dibuat unit test terisolasi yang memvalidasi bahwa `UserMenuDropdown.tsx` menggunakan `window.location.href = "/login"`, tidak mengimpor `useRouter` untuk logout, dan mengelola state `isLoggingOut` dengan `Loader2` (4/4 tests pass).
   - **Penyusunan Dokumen Perencanaan & Handover:**
     - ADR: `docs/adr/0048-hard-browser-redirect-on-signout.md` (APPROVED).
     - Spec: `docs/superpowers/specs/2026-11-05-hard-browser-redirect-on-signout-design.md` (APPROVED).
     - Plan: `docs/superpowers/plans/2026-11-05-hard-browser-redirect-on-signout.md` (COMPLETE).
     - Handover: `docs/handover-hard-browser-redirect-on-signout.md` (COMPLETE).
   - **Non-Negotiable Verification Gates:**
     - `npm run drift:check` ✅ (75/75 spec-plan pairs valid, 0 drift).
     - `npm run build:check` ✅ (`tsc --noEmit` 0 errors).
     - `npm test` ✅ (860/860 tests pass across 152 test suites, 0 failures).

2. **Relokasi Tombol Export Center dari TopNav ke Menu Pop-up More (ADR-0047 — Implementation Complete):**
   - **Pembersihan Komponen TopNav (`src/components/layout/TopNav.tsx`):**
     - Menghapus tombol trigger *Export Center* (`<button title="Export Center">`) dari kluster aksi kanan.
     - Menghapus impor ikon `Download` dari `lucide-react`.
     - Menghapus selektor hook Zustand `setExportCenterOpen`.
     - Menghemat ruang horizontal *TopNav* agar lebih lapang dan bebas tombol redundan.
   - **Otomatisasi Pengujian Regresi (`src/components/modals/MoreAppsMenu.test.ts`):**
     - Menambahkan unit test yang memvalidasi bahwa `TopNav.tsx` tidak lagi merender `title="Export Center"` maupun mengimpor `setExportCenterOpen` (9/9 tests pass).
   - **Penyusunan Perencanaan & Handover ADR-0047:**
     - ADR: `docs/adr/0047-relocate-export-center-to-more-apps-menu.md` (APPROVED).
     - Spec: `docs/superpowers/specs/2026-11-05-relocate-export-center-to-more-apps-menu-design.md` (APPROVED).
     - Plan: `docs/superpowers/plans/2026-11-05-relocate-export-center-to-more-apps-menu.md` (COMPLETE).
     - Handover: `docs/handover-relocate-export-center-to-more-apps-menu.md` (COMPLETE).
   - **Non-Negotiable Gates:**
     - `npm run drift:check` ✅ (74/74 spec-plan pairs valid, 0 drift).
     - `npm run build:check` ✅ (`tsc --noEmit` 0 errors).
     - `npm test` ✅ (856/856 tests pass across 152 test suites, 0 failures).

2. **Sentralisasi Wewenang Persetujuan Outlet ke Super Admin (ADR-0046 — Implementation Complete):**
   - **Pembaruan Guard RBAC Terpusat (`src/lib/marcom/guards.ts`):**
     - Menghapus izin `"APPROVE_OUTLET"` dari daftar perizinan `rolePermissions.supervisor`.
     - Menambahkan batasan `APPROVE_OUTLET` fail-closed bersama `MANAGE_MASTER_DATA` pada `hasScopedPermission`, memastikan hanya Super Admin (`role === "admin"`) yang dapat menyetujui outlet di tingkat sistem dan endpoint `PATCH /api/marcom/outlets/[id]/approval`.
     - Menghapus fallback cabang PIC pada staff untuk `APPROVE_OUTLET`, mempertahankan aturan *Four-Eyes Principle* khusus untuk `APPROVE_MOU`.
   - **Penyelarasan Tampilan Antrean Persetujuan (`OutletApprovalQueueTab.tsx`):**
     - Memperbarui label fallback saat pengguna non-admin melihat antrean dari `"Hanya PIC Cabang / Admin yang dapat ACC"` menjadi `"Hanya Super Admin yang dapat menyetujui outlet"`.
     - Tombol "ACC / Setujui" dan "Tolak" otomatis tersembunyi bagi supervisor, staff, dan viewer.
   - **Pengujian Unit & Non-Negotiable Gates:**
     - Memperbarui assertions di `src/lib/marcom/guards.test.ts` (14/14 tests pass):
       - `hasPermission("supervisor", "APPROVE_OUTLET") === false`
       - `hasScopedPermission` dengan `APPROVE_OUTLET` mengembalikan `false` untuk supervisor dan staff, serta `true` untuk admin.
     - `npm run drift:check` ✅ (73/73 spec-plan pairs valid, 0 drift).
     - `npm run build:check` ✅ (`tsc --noEmit` 0 errors).
     - `npm test` ✅ (856/856 tests pass across 152 test suites, 0 failures).

2. **Penyusunan Perencanaan & Handover ADR-0046:**
   - ADR: `docs/adr/0046-centralize-outlet-approval-to-super-admin.md` (APPROVED).
   - Spec: `docs/superpowers/specs/2026-11-05-centralize-outlet-approval-to-super-admin-design.md` (APPROVED).
   - Plan: `docs/superpowers/plans/2026-11-05-centralize-outlet-approval-to-super-admin.md` (COMPLETE).
   - Handover: `docs/handover-centralize-outlet-approval-to-super-admin.md` (COMPLETE).

3. **Pencabutan Izin Tambah Outlet dari Role Staff (ADR-0045 — Implementation Complete):**
   - **Pembaruan Guard RBAC Terpusat (`src/lib/marcom/guards.ts`):**
     - Menghapus izin `"SUBMIT_DRAFT_OUTLET"` dari daftar perizinan `rolePermissions.staff`.
     - Memastikan endpoint backend `POST /api/marcom/outlets/draft` dan upload foto outlet `POST /api/marcom/uploads?kind=outlets` menolak eksekusi oleh staff dengan respons HTTP 403 Forbidden.
   - **Hardening UI Outlet (`OutletsView.tsx` & `OutletExpandedRow.tsx`):**
     - Memperbaiki komputasi hak akses di `OutletsView.tsx`: Mengganti `canManage || role !== "viewer"` menjadi canonical check `canManage || can("SUBMIT_DRAFT_OUTLET")`. Tombol "+ Tambah Outlet" kini tersembunyi bagi staff.
     - Membatasi tombol "Edit Outlet" di `OutletExpandedRow.tsx`: Mengubah prop dari `canAddOutlet` menjadi `canManage` (Admin only) agar staff maupun supervisor tidak dapat mengedit master data outlet.
   - **Pengujian Unit & Non-Negotiable Gates:**
     - Memperbarui unit test di `src/lib/marcom/guards.test.ts` untuk memverifikasi `hasPermission("staff", "SUBMIT_DRAFT_OUTLET") === false` (14/14 tests pass).
     - `npm run drift:check` ✅ (72/72 spec-plan pairs valid, 0 drift).
     - `npm run build:check` ✅ (`tsc --noEmit` 0 errors).
     - `npm test` ✅ (856/856 tests pass across 152 test suites, 0 failures).

2. **Penyusunan Perencanaan & Handover ADR-0045:**
   - ADR: `docs/adr/0045-revoke-outlet-creation-access-from-staff.md` (APPROVED).
   - Spec: `docs/superpowers/specs/2026-11-05-revoke-outlet-creation-access-from-staff-design.md` (APPROVED).
   - Plan: `docs/superpowers/plans/2026-11-05-revoke-outlet-creation-access-from-staff.md` (COMPLETE).
   - Handover: `docs/handover-revoke-outlet-creation-access-from-staff.md` (COMPLETE).

3. **Eliminasi Banner Bottleneck Redundan pada PipelineView:**
   - Menghapus banner peringatan bottleneck berulang (*"Terdapat N outlet mengalami hambatan pemasangan POSM permanen..."*) dari `src/components/views/PipelineView/PipelineView.tsx`.
   - Menghemat ruang vertikal layar karena metrik dan tombol filter bottleneck telah tersedia secara elegan pada kartu ringkasan KPI (`KpiSummaryCards`) dan bilah filter (`PipelineFilterBar`).
   - Verifikasi: `npm run drift:check` ✅, `npm run build:check` ✅, `npm test` ✅ (855/855 tests passed).

2. **Indikator Loading Alih Halaman Auth via React useTransition (ADR-0044 — Implementation Complete):**
   - **Komponen Atomik Reusable `AuthSwitchLink.tsx`:**
     - Dibuat komponen terpusat di `src/components/auth/AuthSwitchLink.tsx` memanfaatkan `useTransition` (React 19) dan `useRouter` (Next.js 15).
     - Menampilkan spinner `Loader2` berputar dan label transisi dinamis (*Membuka pendaftaran...* / *Membuka halaman masuk...*) seketika saat link diklik (<16ms).
     - Mencegah klik ganda (*double navigation*) dengan `disabled={isPending}` dan kelas `pointer-events-none`.
   - **Integrasi pada `LoginForm` dan `RegisterForm`:**
     - Menggantikan elemen `<Link href="/register">` pada `src/components/auth/LoginForm.tsx` dengan `<AuthSwitchLink />`.
     - Menggantikan elemen `<Link href="/login">` pada `src/components/auth/RegisterForm.tsx` dengan `<AuthSwitchLink />`.
     - Menjaga keselarasan desain token tipografi teal, hover effect, dan focus ring bawaan.
   - **Automated Testing & Invariant Verification:**
     - Dibuat unit & integration test di `src/components/auth/authSwitchLink.test.ts` (7/7 tests pass).
     - Verifikasi non-negotiable gates:
       - `npm run drift:check` ✅ (71/71 spec-plan pairs valid, 0 drift)
       - `npm run build:check` ✅ (`tsc --noEmit` 0 errors)
       - `npm test` ✅ (855/855 tests pass across 152 test suites, 0 failures)

2. **Pilihan Cabang pada Pendaftaran Akun via CustomDropdown (ADR-0043 — Implementation Complete):**
   - **Pre-fetching Cabang Server-Side (RSC Zero-Waterfall):**
     - Memperbarui `src/app/(auth)/register/page.tsx` untuk melakukan query daftar cabang aktif langsung ke Prisma (`findMany` terurut abjad) dan mengopernya sebagai props ke `RegisterForm`.
   - **Integrasi `CustomDropdown` pada Formulir Registrasi:**
     - Mengintegrasikan `CustomDropdown<string>` (`size="md"`, `searchable={true}`) pada `src/components/auth/RegisterForm.tsx` di antara field Email dan Password.
     - Menyediakan pencarian real-time nama cabang dan kota penugasan.
     - Validasi sisi klien dengan pesan galat *"Cabang penugasan wajib dipilih."* jika belum memilih cabang.
   - **Validasi Ketat Backend & Inisialisasi Penugasan:**
     - Menambahkan validasi `branchId` wajib pada `registerSchema` di `src/app/api/auth/register/route.ts`.
     - Melakukan pengecekan keberadaan cabang di database via `prisma.branch.findUnique` sebelum user dibuat (mengembalikan HTTP 400 jika cabang tidak valid).
     - Menginisialisasi `assignedBranchIds: [branchId]` pada saat pembuatan record user baru dengan status awal `PENDING`.
   - **Automated Testing & Invariant Verification:**
     - Membuat unit & invariant test di `src/app/api/auth/register/registerRoute.test.ts` (7/7 tests pass).
     - Verifikasi non-negotiable gates:
       - `npm run drift:check` ✅ (70/70 spec-plan pairs valid, 0 drift)
       - `npm run build:check` ✅ (`tsc --noEmit` 0 errors)
       - `npm test` ✅ (848/848 tests pass across 152 test suites, 0 failures)

1. **Comprehensive UX Polish & CustomDropdown Integration pada BorrowRequestModal (ADR-0042 — Implementation Complete):**
   - **Eliminasi Total Native `<select>` pada Step 2:**
     - Menggantikan elemen `<select>` bawaan untuk *Link to Field Event* dengan komponen kanonikal `CustomDropdown<string>` (`size="md"`, `searchable={true}`).
     - Ditambahkan aksi *Clear link* yang muncul saat event dipilih untuk mereset link kembali ke mode standalone.
     - Ditambahkan badge durasi dinamis (*Duration: N days*) otomatis antara `borrowDate` dan `returnDueDate`.
   - **Penyederhanaan & Auto-fill Identitas Peminjam pada Step 1:**
     - Auto-populasi `borrowerName` dari `session?.user?.name` saat modal dibuka jika kosong, dengan preservasi kemampuan edit manual.
     - Menghapus input `borrowerDivision` dari UI untuk meminimalkan beban input, dan memastikan payload tetap mengirimkan string kosong `borrowerDivision: ""` agar 100% kompatibel dengan API backend.
     - Menambahkan ikon intuitif (`User`, `Phone`) pada input.
   - **Akselerasi Pemilihan Barang pada Step 3:**
     - Menambahkan deretan pill quick-filter kategori (`All Categories` + `EQUIPMENT_CATEGORIES`) horizontal yang dapat di-scroll.
     - Menambahkan tombol stepper kuantitas (`-` / `+`) yang mendampingi input angka dengan pembatasan unit maksimum stok riil (`item.availableUnits`).
     - Tampilan badge ringkasan total unit terpilih.
   - **Redesain Ringkasan 2 Kolom & Proteksi Loading pada Step 4:**
     - Mengelompokkan ringkasan menjadi 2 kolom terstruktur: kolom kiri untuk logistik, peminjam, jadwal, lokasi, dan event; kolom kanan untuk daftar item, kode inventaris, kuantitas, dan total agregat unit.
     - Proteksi double-submission dengan spinner `Loader2` dan disable button saat `loading === true`.
   - **Pengujian & Verifikasi Invariant:**
     - Dibuat unit test `src/components/views/InventoryView/borrowRequestModal.test.ts` (5/5 assertions lulus 100%).
     - Verifikasi non-negotiable gates:
       - `npm run drift:check` ✅ (69/69 spec-plan pairs valid, 0 drift)
       - `npm run build:check` ✅ (`tsc --noEmit` 0 errors)
       - `npm test` ✅ (841/841 passing across 152 test suites, 0 failures)

1. **Standardisasi CustomDropdown pada Modal Form Item Inventaris (ADR-0041 — Implementation Complete):**
   - **Eliminasi Total Native `<select>`:**
     - Menggantikan elemen `<select>` bawaan browser untuk pilihan *Category* dan *Equipment Status* pada `src/components/views/InventoryView/InventoryItemFormModal.tsx` dengan komponen kanonikal `CustomDropdown` (`src/components/ui/CustomDropdown.tsx`).
     - Menghilangkan tampilan dropdown Aqua bawaan OS macOS dan menggantinya dengan popover menu modern, ber-shadow, dan tema dark/light mode yang kohesif.
   - **Preservasi Kontrak Tipe & Skema Data:**
     - Menstandarkan properti `size="md"` (`min-h-[36px]`) dengan `className="w-full"` agar tinggi dan lebar dropdown selaras sempurna dengan input teks sekitarnya.
     - Memetakan opsi kategori secara dinamis dari `EQUIPMENT_CATEGORIES` dan status dari `EQUIPMENT_STATUS_CONFIG`.
     - Menjaga typing ketat `<CustomDropdown<EquipmentStatus>>` dan `<CustomDropdown<string>>`.
   - **Preservasi Proteksi Loading & Double-Submission:**
     - Menjaga atribut `disabled={loading}` dan spinner `Loader2` pada tombol submit form.
   - **Automated Testing & Invariant Verification:**
     - Menambahkan pengujian otomatis di `src/components/views/InventoryView/inventoryItemFormModal.test.ts` (4/4 assertions lulus 100%).
     - Verifikasi non-negotiable gates:
       - `npm run drift:check` ✅ *All 68 spec(s) have matching plan files. No drift detected.*
       - `npm run build:check` ✅ *TypeScript compilation 0 errors (`tsc --noEmit`).*
       - `npm test` ✅ *836/836 tests passed 100% (0 failures across 152 suites).*


1. **Standardized ConfirmDialog Component & Inventory Deletion Integration (ADR-0040 — Implementation Complete):**
   - **Komponen Reusable `ConfirmDialog.tsx`:**
     - Dibuat komponen terpusat di `src/components/ui/ConfirmDialog.tsx` yang membungkus native HTML `<dialog>` `Modal` primitive.
     - Mendukung varian visual `danger` (tombol konfirmasi `destructive`, ikon peringatan merah dengan latar lembut `bg-red-50 dark:bg-red-950/40`), `warning`, dan `info`.
     - Mendukung slot `itemDetails` kustom untuk preview ringkas objek yang akan dihapus.
     - Proteksi loading state (`isLoading`) dengan ikon `Loader2` berputar dan `disabled` pada seluruh tombol aksi untuk mencegah double-submission.
   - **Integrasi Penuh pada `InventoryView.tsx`:**
     - Menggantikan dialog bawaan browser `window.confirm` dengan state-driven `<ConfirmDialog />`.
     - Menampilkan detail item: kode inventaris, nama barang, dan pill kategori.
     - Mutasi penghapusan dibungkus dalam blok `try ... finally { setIsDeleting(false); }` agar tombol selalu pulih jika request gagal (misal jika barang sedang dalam status dipinjam).
   - **Automated Testing & Verifikasi Invariant:**
     - Dibuat unit test `src/components/ui/confirmDialog.test.ts` (3/3 passing) untuk menguji wrapping `Modal`, varian warna, dan proteksi disable.
     - Dibuat integration test `src/components/views/InventoryView/inventoryDeleteConfirm.test.ts` (3/3 passing) untuk memastikan eliminasi `confirm()` dan penggunaan `try...finally`.
     - Verifikasi non-negotiable gates: `npm run drift:check` (67/67 specs paired), `npm run build:check` (0 errors), `npm test` (0 failures).

1. **Penataan Switcher Tampilan & Default Table View pada Equipment Inventory:**
   - **Pertukaran Posisi Tombol (Table di Kiri, Card di Kanan):**
     - Memindahkan tombol *Table View* (`TableIcon`) ke sisi kiri dan *Grid / Card View* (`LayoutGrid`) ke sisi kanan pada `InventoryHeaderKpis.tsx` (berlaku untuk katalog dan tab peminjaman).
   - **Table View sebagai Tampilan Awal (Default View):**
     - Mengubah state inisial `catalogViewMode` di `InventoryView.tsx` menjadi `"table"`.
   - **Pertukaran Gaya Warna Background Container & Active Pill:**
     - Kontainer tombol menggunakan `bg-slate-100 dark:bg-slate-800`.
     - Active pill penanda tab aktif menggunakan `bg-white dark:bg-slate-900 rounded shadow-xs` dengan kontras tinggi.
   - **Automated Testing & Verifikasi Invariant:**
     - Menambahkan pengujian otomatis di `src/components/views/InventoryView/inventoryViewMode.test.ts` (3/3 assertions pass).
     - Verifikasi: `npm run drift:check` (66/66 specs paired), `npm run build:check` (0 errors), `npm test` (826/826 tests pass).

1. **Z-Index Stacking Context Standardization & Table Shell Isolation (ADR-0039 — Implementation Complete):**
   - **Eliminasi Kliping Popover Menu Dropdown oleh Tabel:**
     - Mengatasi masalah visual di mana popover menu `CustomDropdown` (seperti *All Branches* di `MousView`) tertimpa/terpotong oleh elemen tabel di bawahnya (`Dokumen MOU` dan tombol berkas PDF).
   - **Isolasi Stacking Context Shell Tabel (`MarcomTableShell.tsx` & `MousView.tsx`):**
     - Menerapkan `isolation: isolate` (`isolate`) pada root kontainer `MarcomTableShell.tsx` dan pembungkus konten tabel di `MousView.tsx`, mengurung elemen kolom sticky (`z-10` dan `z-20`) mutlak di dalam domain tabel Layer 0 sehingga tidak pernah bocor ke atas header.
   - **Eskalasi Z-Index Dropdown Aktif (`CustomDropdown.tsx`):**
     - Mengubah z-index kontainer saat `isOpen = true` dari `z-30` ke `z-50`, menjamin menu popover selalu mengambang di atas semua elemen header dan konten stage.
   - **Harmonisasi Hierarki Header Marcom & TopNav:**
     - Mengubah seluruh 12 header filter marcom (`MousHeader`, `OutletsHeader`, `BranchesHeader`, `DocumentsHeader`, `EventsHeader`, `ReportsHeader`, `AnalyticsHeader`, `InventoryHeaderKpis`, `UsersHeader`, `ProfileHeader`, `ProjectsFilterBar`, `PipelineFilterBar`, dan header tab/timeline terkait) dari `relative z-20` menjadi `relative z-30`.
     - Menaikkan `TopNav.tsx` dari `relative z-30` ke `relative z-40` agar notifikasi dan menu akun pengguna selalu berada di atas header halaman.
   - **Dokumentasi Invariant SSOT:**
     - Menambahkan Canonical 7-Layer Z-Index & Stacking Context Hierarchy contract ke `docs/architecture-system-invariants.md`.
   - **Automated Testing & Invariant Verification:**
     - Menambahkan pengujian otomatis di `src/components/ui/customDropdownZIndex.test.ts` (5/5 assertions pass).
     - Verifikasi non-negotiable gates:
       - `npm run drift:check` ✅ All 66 spec(s) have matching plan files. No drift detected.
       - `npm run build:check` ✅ TypeScript compilation 0 errors (`tsc --noEmit`).
       - `npm run test:smoke` ✅ 116/116 smoke tests pass.
       - `npm test` ✅ 826/826 tests pass 100% (0 failures).

1. **Row-Scoped Loading Animation & State Guard for MOU Quick Approve (ADR-0038 — Implementation Complete):**
   - **Visual Feedback & Spinner Indikator:**
     - Mengubah tombol *Quick Approve* pada baris tabel MOU (`src/components/views/MousView/mouColumns.tsx`) agar langsung menampilkan ikon spinner berputar (`<RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin" />`) dan teks status `"Menyetujui..."` (pada breakpoint `xl:inline`) saat proses persetujuan berlangsung.
   - **Proteksi Double-Submission & State Guard:**
     - Menambahkan state lokal `approvingMouId: string | null` di `MousView.tsx` dan meneruskannya ke `MouColumnDeps`.
     - Tombol diberi atribut `disabled={isApproving}` serta styling `disabled:opacity-80 cursor-not-allowed` untuk mencegah double click/race condition pada koneksi latensi tinggi.
     - Handler `onClick` dijaga dengan guard `if (!isApproving)` untuk memblokir pemicuan konkuren.
   - **Pemulihan Status Resilien (Resilient State Recovery):**
     - Membungkus alur mutasi `handleStatusTransition` di `MousView.tsx` dalam blok `try ... finally { setApprovingMouId(null); }` sehingga tombol selalu pulih ke kondisi normal baik saat mutasi berhasil maupun jika server/automasi melempar error.
   - **Automated Testing & Invariant Verification:**
     - Menambahkan pengujian otomatis di `src/components/views/MousView/mouColumns.test.ts` (6/6 tests passing).
     - Verifikasi: `npm run drift:check` (65/65 paired specs), `npm run build:check` (0 errors), `npm run test:smoke` (114/114 passed), dan `npm test` seluruhnya lulus 100% (818/818 tests passed).



1. **Pembersihan Ikon Mata Pratinjau pada Kartu Dokumen:**
   - Menghapus tombol tindakan `<Eye />` dari footer `DocumentCardsView.tsx`.
   - Menjaga affordance klik langsung pada seluruh bodi kartu untuk membuka pratinjau drawer dokumen.

2. **Standardisasi CustomDropdown pada Form Modal & Drawer Event dan Content (ADR-0037 — Implementation Complete):**
   - **Eliminasi OS Aqua Native Popover:**
     - Menggantikan seluruh elemen native `<select>` yang memunculkan popover tidak bergaya bawaan OS (khususnya Aqua macOS) pada `EventDrawer.tsx`, `EventCreateModal.tsx`, dan `ContentPostModal.tsx` menggunakan komponen terstandarisasi `CustomDropdown` (`src/components/ui/CustomDropdown.tsx`).
   - **Dukungan Pencarian Data Master Terintegrasi:**
     - Mengaktifkan `searchable={true}` pada dropdown pemilihan *Outlet Terkait* dan *Person in Charge (PIC)* untuk mempercepat operasional pemilihan outlet toko dari ratusan data master.
   - **Harmonisasi Dimensi & Sizing:**
     - Menstandarkan properti `size="md"` (`min-h-[36px]`) agar tinggi dropdown sejajar sempurna dengan input teks sekitarnya.
   - **Preservasi Side-Effects & Safety:**
     - Menjaga fungsi autofill lokasi dari outlet yang dipilih, generate template checklist subtasks aktivasi, dan input teks kondisional untuk `Custom PIC Name...`.
   - **Automated Testing & Invariant Verification:**
     - Menambahkan pengujian otomatis di `src/components/views/EventsView/eventDrawerCustomDropdown.test.ts`.
     - Verifikasi: `npm run drift:check`, `npm run build:check`, `npm run test:smoke` (114/114 pass), dan `npm test` seluruhnya lulus 100% (817/817 tests passed).

2. **Sinkronisasi Harian Berjalan & Inisiasi Otomatis Laporan Bulanan via Vercel Cron (ADR-0036 — Implementation Complete):**
   - **Vercel Cron Configuration (`vercel.json`):**
     - Dikonfigurasi jadwal cron harian `0 17 * * *` (00:00 WIB) yang memicu endpoint serverless `/api/cron/reports-sync` tanpa memerlukan server VPS ataupun daemon container permanen.
   - **Endpoint Terproteksi (`/api/cron/reports-sync/route.ts`):**
     - Memvalidasi token header `Authorization: Bearer <CRON_SECRET>` standar Vercel untuk menolak eksekusi publik tanpa izin (HTTP 401).
   - **Domain Sync Engine (`src/lib/marcom/monthlyReportSync.ts`):**
     - Otomatis membuat entri `MonthlyReport` baru pada rollover awal bulan jika belum ada.
     - Melakukan sinkronisasi harian untuk `summary` metrik dan daftar `activities` berdasarkan data operasional terbaru.
     - Mengimplementasikan `hasCustomNarratives` untuk memastikan narasi kualitatif (`achievements`, `keyIssues`, `actionPlans`) yang telah disesuaikan oleh administrator tidak ditimpa oleh cron.
   - **Automated Testing & Verification:**
     - Ditambahkan pengujian unit di `src/lib/marcom/monthlyReportSync.test.ts` dan pengujian route di `src/app/api/cron/reportsSyncRoute.test.ts`.
     - Verifikasi: `npm run drift:check`, `npm run build:check`, dan `npm test` seluruhnya lulus 100% (814/814 tests passed).

2. **Penataan Grid Kartu Modular Baris Ekspansi Laporan (ADR-0035 — Implementation Complete):**
   - **`MonthlyReportExpandedRow.tsx` Extraction:**
     - Mengekstrak markup baris ekspansi dari `ReportsView.tsx` menjadi sub-komponen atomik `MonthlyReportExpandedRow.tsx`, memangkas 84 baris kode dari file coordinator (755 LOC).
     - Menata 4 kontainer kartu modular 2x2 (`Aktivitas Operasional`, `Capaian Utama`, `Kendala & Isu Lapangan`, `Rencana Tindak Lanjut`) dengan latar `bg-white dark:bg-slate-900/60`, border halus, `shadow-2xs`, ikon tematik (`Layers`, `CheckCircle2`, `AlertTriangle`, `ArrowUpRight`), dan count pill badge.
     - Mengimplementasikan `parseActivityDisplay` murni untuk mem-parsing string aktivitas menjadi badge kategori berkode warna (`POSM`, `MOU`, `CONTENT`, `EVENT`), judul tegas, dan subteks biaya/detail terpisah.
     - Menata dokumen pendukung menjadi strip kartu berkas horizontal interaktif dengan ekstensi file uppercase dan tautan langsung.
   - **Automated Testing & Invariant Verification:**
     - Menambahkan pengujian otomatis di `src/components/views/ReportsView/monthlyReportExpandedRow.test.ts`.
     - Verifikasi: `npm run drift:check`, `npm run build:check`, dan `npm test` seluruhnya lulus 100% (806/806 tests passed).


1. **Tata Letak Editorial PDF Eksekutif Profesional & Anti-AI-Slop (ADR-0034 — Implementation Complete):**
   - **`exportCenter.ts` Overhaul:**
     - Menghapus seluruh emoji kasual (🏆, ⚠️, 🎯, 📋) dan kotak alert pastel (`.box-green`, `.box-amber`, `.box-blue`).
     - Mengganti kartu metrik mengambang dengan **Executive Scorecard Bar** terintegrasi bergaris hairline slate.
     - Memasang kop resmi organisasi **Vrello Up**, nomor registrasi dokumen resmi (`No. Dokumen: VRL/MRK/REP/...`), dan badge kerahasiaan (*DOKUMEN INTERNAL & RAHASIA*).
     - Menata seksi narasi dengan angka Romawi (*I. RINGKASAN CAPAIAN UTAMA*, *II. EVALUASI KENDALA*, *III. RENCANA TINDAK LANJUT*, *IV. MATRIKS RINCIAN KEGIATAN*) beraksen garis vertikal 2px slate.
     - Menstandarkan seluruh tanggal kegiatan ke format Indonesia `DD/MM/YYYY`.
   - **`reportDraftEngine.ts` Refinement:**
     - Membersihkan prefix bracket redundant (`[POSM]`, `[MOU]`, `[KONTEN]`, `[EVENT]`) dari judul kegiatan.
     - Menyempurnakan generator narasi capaian ketika belum ada item terealisasi menjadi bahasa operasional profesional (menghilangkan kalimat kaku *"Berhasil menyelesaikan 0 dari N"*).
   - **Automated Testing & Invariant Verification:**
     - Menambahkan pengujian otomatis di `src/lib/marcom/reportDraftEngine.test.ts` dan `src/lib/productivity/exportCenter.test.ts`.
     - Verifikasi: `npm run drift:check`, `npm run build:check`, `npm run test:smoke`, dan `npm test` seluruhnya lulus 100%.


1. **Integrasi Export Center ke Menu More Apps (ADR-0033 — Implementation Complete):**
   - **`MoreAppsMenu.tsx` Enhancement:**
     - Mengimpor ikon `FileSpreadsheet` dari `lucide-react`.
     - Mengingest aksi `setExportCenterOpen` dari Zustand workspace store.
     - Menambahkan tombol **Export Center** dengan badge `CSV / PDF` di section Main Tools tepat di bawah *Brain² AI Assistant*.
     - Handler menutup pop-up menu (`onClose()`) dan membuka modal global `ExportCenter` (`setExportCenterOpen(true)`).
     - Menjaga ukuran baris `MoreAppsMenu.tsx` pada 228 LOC (jauh di bawah batas 250 LOC).
   - **Preservasi Halaman Reports:**
     - Mempertahankan tombol *Export Center* di `src/components/views/ReportsView/ReportsHeader.tsx` tanpa modifikasi apapun sesuai persyaratan non-goal pengguna.
   - **Automated Testing & Invariant Verification:**
     - Menambahkan test case di `src/components/modals/MoreAppsMenu.test.ts` untuk memverifikasi render, impor, dan binding aksi `setExportCenterOpen`, serta memastikan tombol di `ReportsHeader.tsx` tetap utuh.
     - Verifikasi: `npm run drift:check`, `npm run build:check`, `npm test` seluruhnya lulus 100%.


1. **TopNav Notification Feed Lifecycle & Focus Sync (ADR-0032 — Implementation Complete):**
   - **`useNotificationFeed.ts` Creation:**
     - Membuat custom hook `src/lib/productivity/useNotificationFeed.ts` (~55 LOC) yang menangani pemanggilan awal `/api/marcom/mous` saat halaman dimuat.
     - Menambahkan listener `window.addEventListener("focus", onFocus)` dengan proteksi SSR (`typeof window !== "undefined"`) sehingga saat staf kembali ke tab browser, notifikasi langsung tersinkronisasi.
     - Menyediakan fungsi `refresh()` dan re-trigger saat panel notifikasi dibuka (`isOpen === true`).
   - **Modernisasi `NotificationCenter.tsx`:**
     - Menghapus deklarasi state lokal `const [mouRows, setMouRows] = useState(...)`.
     - Menghapus blok `useEffect` lama dengan guard `if (!isOpen) return;` yang sebelumnya menunda pemanggilan notifikasi MOU.
     - Mengintegrasikan `{ mouRows } = useNotificationFeed({ isOpen })`.
     - Jumlah baris `NotificationCenter.tsx` turun dari 289 menjadi 275 LOC.
   - **Automated Testing & Verifikasi Invariant:**
     - Membuat pengujian unit otomatis di `src/lib/productivity/useNotificationFeed.test.ts` (4 assertions lulus 100%).
     - `npm run drift:check`: ✅ No drift detected (59 pasangan spec-plan sinkron).
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run test:smoke`: ✅ 110/110 passed.
     - `npm test`: ✅ Full test suite passed.

2. **Pembersihan Toggle Dark Mode di MoreAppsMenu:**
   - Menghapus tombol toggle dark/light mode dan dependensi `next-themes` dari `src/components/modals/MoreAppsMenu.tsx`.
   - Mengeliminasi ikon `Sun`, `Moon` yang tidak lagi digunakan dan merapikan layout section bawah.
   - Mengubah unit test di `src/components/modals/MoreAppsMenu.test.ts` untuk memastikan tidak ada kontrol tema redundan di menu More.
   - Verifikasi: `npm run drift:check`, `npm run build:check`, `npm test` seluruhnya lulus 100%.

2. **Migrasi Backup & Data ke MoreAppsMenu dan Eliminasi SettingsModal (ADR-0031 — Implementation Complete):**
   - **`MoreAppsMenu.tsx` Enhancement:**
     - Menghubungkan Zustand store `spaces`, `tasks`, `tags`, dan `importBackup`.
     - Mengimplementasikan aksi **Export Backup (JSON)** yang langsung men-download berkas `vrello-backup-YYYY-MM-DD.json`.
     - Mengimplementasikan aksi **Import Backup (JSON)** dengan input berkas tersembunyi, parsing aman, dan dialog konfirmasi `window.confirm`.
     - Menghapus tombol redundan **New Task** beserta ikon `Plus` dan binding `setCreateTaskModalOpen`.
     - Menghapus bagian redundan **Quick Views** (Home, List, Board, Calendar).
   - **Eliminasi Total `SettingsModal.tsx`:**
     - Menghapus berkas `src/components/modals/SettingsModal.tsx` (~279 LOC tereliminasi).
     - Menghapus tab redundan *Appearance* (karena tema sudah ada di TopNav dan More).
   - **Pembersihan Footer `Sidebar.tsx`:**
     - Menghapus impor `SettingsModal`, state `isSettingsOpen`, dan tombol gear Settings.
     - Footer kini hanya menyisakan tombol *Help & Docs* yang bersih dan minimalis.
   - **Automated Testing & Verifikasi Invariant:**
     - Memperbarui `src/components/modals/MoreAppsMenu.test.ts` (6 assertions lulus 100%).
     - `npm run drift:check`: ✅ No drift detected (58 pasangan spec-plan sinkron).
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm test`: ✅ 789 passed, 0 failures.

2. **Pill Cabang Interaktif di Halaman Manajemen Pengguna (`UsersView`):**
   - Mengubah elemen badge/pill nama cabang di `UserActiveRow.tsx` menjadi tombol interaktif yang membuka formulir `UserBranchSelectModal` (Penugasan Cabang) ketika diklik.
   - Menambahkan visual state hover dan kursor interaktif (`cursor-pointer hover:bg-primary/20`).
   - Memperbarui pengujian otomatis di `src/components/views/UsersView/userBranchAssignment.test.ts`.
   - Verifikasi: `npm run drift:check`, `npm run build:check`, `npm test` seluruhnya lulus 100%.

2. **Pembersihan Badge Redundan di Header Halaman Profil:**
   - Menghapus badge/pill `{userName}` di samping judul `"Profil & Keamanan Akun"` pada `src/components/views/ProfileView/ProfileHeader.tsx`.
   - Membersihkan prop `userName` yang tidak lagi dipakai dari `ProfileHeaderProps` dan pemanggilnya di `ProfileView.tsx`.
   - Verifikasi: `npm run drift:check`, `npm run build:check`, `npm test` seluruhnya lulus 100%.

2. **Sticky Right Columns untuk Kolom Dokumen MOU dan Aksi pada Tabel MOUs (ADR-0030 — Implementation Complete):**
   - **`MarcomTableShell.tsx` Enhancement:**
     - Exported declarative interface `MarcomColumnMeta` (`align?`, `sticky?`, `stickyOffset?`, `stickyBorder?`).
     - Rendered sticky right header cells with `position: sticky`, `right: ...px`, `z-20`, and solid background `bg-slate-50 dark:bg-[#18191B]`.
     - Rendered sticky right body cells with `position: sticky`, `right: ...px`, `z-10`, solid background `bg-white dark:bg-[#18191B]`, and row hover synchronization `group-hover:bg-slate-50/80 dark:group-hover:bg-slate-800/40`.
     - Added boundary separator with left border and soft drop shadow (`border-l border-slate-200/80 dark:border-slate-800 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.04)] dark:shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.2)]`).
     - Added `group` CSS class to data rows to ensure row-level hover states propagate to sticky cells.
   - **`mouColumns.tsx` Configuration & Visual Alignment:**
     - Configured `meta: { sticky: "right", stickyOffset: 130, stickyBorder: true }` on `docPath` column (`id: "document"`, width 165px).
     - Configured `meta: { sticky: "right", stickyOffset: 0 }` on display actions column (`id: "actions"`, width 130px) ensuring Quick Approve button (`[✓ Approve]`) and drawer chevron fit comfortably without clipping visual artifacts or overlapping.
     - Added edge breathing room (`pr-3`) on rightmost sticky cell and integrated selection highlight sync (`bg-teal-50/70 dark:bg-teal-950/40`).
   - **Automated Unit Testing (`mouColumns.test.ts`):**
     - Created `src/components/views/MousView/mouColumns.test.ts` asserting sticky properties, offsets, borders, and column widths (5 passed, 0 failures).
   - **Documentation & Invariants:**
     - Completed `docs/superpowers/plans/2026-11-05-mou-table-sticky-right-columns.md`.
     - Updated `docs/superpowers/specs/2026-11-05-mou-table-sticky-right-columns-design.md` to `IMPLEMENTED (ADR-0030)`.
     - Added changelog entry in `CHANGELOG.md`.
   - **Verification Gates Passed:**
     - `npm run drift:check`: ✅ No drift detected (57 spec-plan pairs).
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm test`: ✅ Full test suite passed.

2. **Eliminasi Total Google Drive & Standarisasi Dokumen MOU ke Internal Storage (ADR-0029 — Implementation Complete):**
   - **Parser Sanitized (`src/components/views/MousView/mouDocumentHelpers.ts`):**
     - Simplified `MouDocumentType` to `INTERNAL_PDF | INTERNAL_IMAGE | EMPTY`.
     - Completely removed `isExternalUrl`, `isGoogleDrive`, and `EXTERNAL_URL`.
     - Standardized file labels to `"Dokumen PDF"`, `"Gambar Scan"`, and `"Tidak ada berkas"`.
   - **Form Modal Modernization (`src/components/views/MousView/MouFormModal.tsx`):**
     - Completely eliminated raw `Document URL / Path` text input field and placeholder.
     - Implemented clean **Active Document Card** with file icon, cleaned filename (`extractCleanFilename`), storage indicator badge ("Tersimpan di Supabase Storage"), and actions: "Pratinjau", "Ganti", and "Hapus".
     - Implemented dashed empty upload button triggering file input directly into Supabase Storage bucket `mou-documents`.
   - **Document Viewer Modal Cleaned (`src/components/views/MousView/MouDocumentViewerModal.tsx`):**
     - Removed external Google Drive warning card fallback, simplifying viewer strictly to internal PDF iframe viewer and Image lightbox.
     - Cleaned `mouColumns.tsx` document button styling and removed unused `ExternalLink` icon.
   - **Seeder Database Re-seeded (`prisma/seed.ts`):**
     - Replaced 4 dummy Google Drive URLs with corporate internal PDF links.
     - Successfully executed `npx prisma db seed` with 6 seeded MOUs.
   - **Automated Unit Testing (`mouDocumentHelpers.test.ts`):**
     - Updated unit tests for internal PDF, internal Image, and Supabase Storage CDN URLs (10 passed, 0 failures).
   - **Verification Gates Passed:**
     - `npm run drift:check`: ✅ No drift detected (56 spec-plan pairs).
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm test`: ✅ Full test suite passed.

2. **Sub-Komponen ContentMediaSection pada Modal Schedule New Post (ADR-0028 — Implementation Complete):**
   - **`ContentMediaSection.tsx` Creation:**
     - Created standalone atomic component `src/components/views/ContentPlannerView/ContentMediaSection.tsx` (~313 LOC).
     - Integrated `useDirectDriveUpload("content")` with real-time streaming progress bar and cancel button.
     - Added 16:9 aspect-video showcase banner with cover thumbnail, video/asset card placeholder, and play button overlay.
     - Implemented drag-and-drop reorderable attachments list with 36x36 thumbnail previews, file size indicators, cover badges/selectors, and delete actions.
     - Provided manual URL fallback when no media is attached.
   - **`ContentPostModal.tsx` Modernization:**
     - Replaced inline manual media block (baris 330–462) with `<ContentMediaSection />`.
     - Cleaned up redundant drag-and-drop handlers and state from the modal, reducing file size from 489 LOC down to 321 LOC.
     - Removed unused lucide icon imports (`Paperclip`, `Film`, `File`, `GripVertical`).
   - **Automated Unit Testing (`src/components/views/ContentPlannerView/contentCardStyling.test.ts`):**
     - Added unit test asserting `ContentPostModal.tsx` imports and renders `ContentMediaSection` and wires `mediaAttachments`.
     - 5 passed, 0 failures.
   - **Documentation & Invariants Synchronized:**
     - Spec `docs/superpowers/specs/2026-11-05-content-post-modal-media-section-design.md` updated to `IMPLEMENTED (ADR-0028)`.
     - Plan `docs/superpowers/plans/2026-11-05-content-post-modal-media-section.md` tasks fully checked off.
     - `CHANGELOG.md` updated with rilis entry.
   - **Verification Gates Passed:**
     - `npm run drift:check`: ✅ No drift detected (55 spec-plan pairs).
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm test`: ✅ 780 passed, 0 failures across 138 suites.

2. **Integrasi EventMediaSection ke Modal Buat Event Baru (ADR-0027 — Implementation Complete):**
   - **`EventCreateModal.tsx` Integration:**
     - Imported `TaskAttachment` from `@/types` and `EventMediaSection` from `./EventMediaSection`.
     - Added local states `mediaAttachments` (`TaskAttachment[]`) and `mediaUrl` (`string`).
     - Wired state reset (`setMediaAttachments([])`, `setMediaUrl("")`) in `resetForm` and modal open/close effect.
     - Resolved canonical cover `resolvedMediaUrl = mediaUrl.trim() || mediaAttachments[0]?.url || ""`.
     - Synchronized `POST /api/marcom/events` request payload with `mediaAttachments` and `mediaUrl`.
     - Synchronized `createdItem` passed to `onCreated` with `mediaAttachments` and `mediaUrl: created.mediaUrl || resolvedMediaUrl`.
     - Mounted `<EventMediaSection />` in the scroll body between notes and checklist.
   - **Automated Unit Testing (`src/components/views/EventsView/eventDrawer.test.ts`):**
     - Added test asserting `EventCreateModal.tsx` imports and renders `EventMediaSection`, wires `mediaAttachments`, and removes hardcoded `mediaAttachments: []`.
     - Targeted test passed: 9 passed, 0 failures.
   - **Documentation & Invariants Synchronized:**
     - Spec `docs/superpowers/specs/2026-11-05-event-create-modal-media-attachments-design.md` updated to `IMPLEMENTED (ADR-0027)`.
     - Plan `docs/superpowers/plans/2026-11-05-event-create-modal-media-attachments.md` tasks fully checked off.
     - `CHANGELOG.md` updated with feature entry.
   - **Verification Gates Passed:**
     - `npm run drift:check`: ✅ No drift detected (54 spec-plan pairs).
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm test`: ✅ 778 passed, 0 failures across 138 suites.

2. **Documents Side Drawer Deep Linking via URL Query Parameter (ADR-0026 — Implementation):**
   - **Router Helpers (`src/lib/router/urlState.ts` & `urlState.test.ts`):**
     - Added `docId?: string` to `UrlNavState`.
     - Extended `parseUrlNavState` to parse `docId` / `doc` and auto-assign `view: "documents"`, `appMode: "marcom"`.
     - Extended `serializeUrlNavState` to serialize `docId`.
     - Created `buildShareableDocumentUrl(docId, origin?)` returning canonical `/?mode=marcom&view=documents&docId={docId}`.
     - Added unit tests (15 passed, 0 failures).
   - **Coordinator Auto-Hydration & URL Sync (`src/components/views/DocumentsView/DocumentsView.tsx`):**
     - Added auto-hydration `useEffect` opening `selectedDrawerDoc` when `docId` is detected in URL.
     - Synchronized `handleSelectDrawerDoc` with `window.history.replaceState` (adds `docId` on drawer open, removes on drawer close).
     - Added `popstate` event listener supporting native browser Back/Forward navigation.
     - Wired `handleSelectDrawerDoc` to card clicks, table rows, table edit buttons, and drawer close.
   - **Card & Drawer Deep Link Actions (`DocumentCardsView.tsx` & `DocumentDrawer.tsx`):**
     - Updated card copy button to wrap in `<a>` tag with `href={buildShareableDocumentUrl(doc.id)}`, supporting middle-click / new tab opening and clipboard copy with origin.
     - Updated drawer header copy button to copy canonical shareable URL via `buildShareableDocumentUrl`.
     - Preserved raw file path copy in drawer file replacement sub-bar (`handleCopyRawFilePath`).
     - Eliminated obsolete "Lokasi: Cloud / Google Drive" & "Internal Server Storage" badge from the bottom of metadata container in `DocumentDrawer.tsx`.
   - **Unit Tests (`documentDrawer.test.ts`):**
     - Added test assertion verifying wiring of `buildShareableDocumentUrl` and `docId` URL handling across `DocumentsView.tsx` and `DocumentCardsView.tsx` (10 passed, 0 failures).
   - **Verification Gates Passed:**
     - `npm run drift:check`: ✅ No drift detected (53 specs paired).
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm test`: ✅ 778 passed, 0 failures across 138 suites.

2. **Eliminate Legacy Drive/Cloud Storage Badges & Standardize Documents KPIs:**
   - **`DocumentCardsView.tsx`:** Removed obsolete `Cloud` and `HardDrive` storage badges from the card footer, aligning actions neatly to the right. Removed `isCloud` computation and unused imports.
   - **`DocumentsView.tsx`:**
     - Removed storage icons (`Cloud` / `HardDrive`) from the "Nama Dokumen" table column.
     - Re-ordered `categoryChips` calculation before `kpiCards`.
     - Standardized KPI Card 3 to **"Ragam Kategori"** with value `categoryChips.length` and helper `Dominan: ${kpiData.topCategory}`.
     - Cleaned `Cloud` and `isCloudDocumentUrl` imports.
   - **Unit Tests (`documentDrawer.test.ts`):**
     - Added test asserting `DocumentCardsView.tsx` does not contain `Drive / Cloud` or `Server Local`, and `DocumentsView.tsx` table does not contain `Google Drive / Cloud`.
     - 9 passed, 0 failures in `documentDrawer.test.ts`.
   - **Verification Gates Passed:**
     - `npm run drift:check`: ✅ All invariants pass.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm test`: ✅ 775 passed, 0 failures across 138 suites.

2. **Complete Elimination of Document Status & Supabase Storage Focus (ADR-0025 — Implementation):**
   - **Prisma Schema & Database DDL (`prisma/schema.prisma` & `prisma/migrations/20261105000000_drop_document_item_status/`):**
     - Dropped `status` column from `model DocumentItem`.
     - Executed raw migration SQL: `ALTER TABLE "DocumentItem" DROP COLUMN IF EXISTS "status";`.
     - Regenerated Prisma Client v6.19.3 cleanly.
   - **Seed Cleaned & Re-seeded (`prisma/seed.ts`):**
     - Stripped ad-hoc status strings from all 4 document seed fixtures.
     - Re-seeded database (`npx prisma db seed`), seeding 4 document items and reports with 0 errors.
   - **SSoT Types Sanitized (`src/types/index.ts`):**
     - Completely removed `export type DocumentStatus`.
     - Removed `status?: DocumentStatus;` from `interface DocumentItem`.
   - **Obsolete Taxonomy Helper Deleted:**
     - Removed `src/lib/marcom/documentTaxonomy.ts` and `src/lib/marcom/documentTaxonomy.test.ts`.
   - **API Endpoints Refactored (`/api/marcom/documents/route.ts` & `[id]/route.ts`):**
     - Removed all taxonomy imports and status validation / field destructuring.
     - Removed `"status"` from `PATCHABLE_FIELDS`.
   - **Pure Domain Logic & KPIs (`src/lib/marcom/documentWorkflow.ts`):**
     - Removed `activeCount`, `draftCount`, and `archivedCount` from `DocumentKPIs` and calculations.
     - Removed status filter criteria from `FilterDocumentsOptions` and `filterDocuments`.
     - Replaced KPI Card 3 with "Penyimpanan Cloud" metric (comparing Supabase cloud vs local storage).
   - **UI Views Refactored (`DocumentsView/`):**
     - `DocumentCreateModal.tsx`: Eliminated status state/input; optimized grid to 2 columns (Periode & PIC).
     - `DocumentDrawer.tsx`: Eliminated status state, constants, and selector dropdown from sticky header.
     - `DocumentCardsView.tsx`: Eliminated status badge, displaying clean category badge and file format chip.
     - `DocumentsView.tsx`: Removed `selectedStatus` dead state, removed status table column, and updated KPI card 3.
   - **Automated Unit Tests Updated:**
     - `src/components/views/DocumentsView/documentDrawer.test.ts`: Added assertions verifying zero status references across all 4 document UI components.
     - `src/lib/marcom/documentWorkflow.test.ts`: Updated fixtures and assertions for KPIs without status counts.
   - **Verification Gates Passed:**
     - `npm run drift:check`: ✅ No drift detected (52 specs paired).
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm test`: ✅ 774 passed, 0 failures across 138 suites.

2. **Documents Detail & Edit Drawer Implementation (ADR-0024):**
   - **Dedicated Creation Modal (`src/components/views/DocumentsView/DocumentCreateModal.tsx`):**
     - Centered kickoff modal dialog for uploading new document assets cleanly.
     - Validates name, category, fileType, and filePath. Supports local file upload (`POST /api/marcom/uploads`, `kind: "documents"`) and Google Drive file picker/URL embedding (`useGoogleDrivePicker`, `GoogleDriveLinkModal`).
     - Submits `POST /api/marcom/documents`, invokes `onCreated`, and shows success toast.
   - **Slide-Over Detail & Edit Drawer (`src/components/views/DocumentsView/DocumentDrawer.tsx`):**
     - Unified 560px slide-over right drawer container with Framer Motion spring physics (`damping: 28, stiffness: 300`) and backdrop blur overlay.
     - Sticky Header: Dynamic category badge, file format chip, inline editable title input (`<input />`), copy link button, external tab link button, and close (`<X />`) button.
     - Scrollable Body:
       - Multi-format Live Media Viewer: PDF embedded iframe, native MP4 video player, `AppImage` lightbox, or ZIP/Package download card with primary "Download / Buka Dokumen" button.
       - File Replacement Sub-bar: Re-upload replacement files locally or attach Google Drive URLs with real-time file size and type detection.
       - Metadata Form in standardized grey card container (`p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40`): Category (with datalist), Status (`ACTIVE`, `DRAFT`, `ARCHIVED`), Branch, Period, PIC Owner (with member suggestions), and Description textarea.
     - Sticky Footer: "Hapus Dokumen" delete button (`<Trash2 />`, confirm guard, dispatches `DELETE`), "Tutup", and "Simpan Perubahan" primary button (dispatches `PATCH /api/marcom/documents/[id]`).
   - **Cards & Coordinator Modernization (`DocumentCardsView.tsx` & `DocumentsView.tsx`):**
     - Card clicks in `DocumentCardsView.tsx` and table row clicks (`onRowClick`) in `MarcomTableShell` now directly open `DocumentDrawer`.
     - Deprecated legacy `modalDocument` and `previewDocument` states in `DocumentsView.tsx`, dropping file LOC from 809 down to ~409 lines (~400 line reduction).
     - Decommissioned obsolete `DocumentPreviewModal.tsx`.
   - **Automated Unit Testing (`src/components/views/DocumentsView/documentDrawer.test.ts`):**
     - 7 unit tests asserting drawer existence, creation modal existence, `DocumentPreviewModal` elimination, coordinator wiring, and SSOT typing.
   - **Verification Gates Passed:**
     - `npm run drift:check`: ✅ No drift detected. All 51 specs paired and invariants pass.
     - `npm run build:check`: ✅ TypeScript compiled with 0 errors.
     - `npm test`: ✅ 775 passed, 0 failed across 138 suites.

2. **Content Planner Media Section Grey Div Container Wrapping (UI Refinement):**
   - **Container Parity with Field Event Drawer (`src/components/views/ContentPlannerView/ContentDrawer.tsx`):**
     - Wrapped the entire "Aset Media / Video Footage" section in `p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3`, matching `EventMediaSection.tsx`.
     - Styled attachment row cards with `bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700` for clear visual contrast against the grey container.
     - Updated empty upload dropzone with `bg-white/60 dark:bg-slate-800/40`.
   - **Unit Tests Added (`src/components/views/ContentPlannerView/contentCardStyling.test.ts`):**
     - Added test asserting that `ContentDrawer.tsx` wraps the media section in the standardized grey container.

2. **Content Planner Card Item Styling Parity with Field Events (UI Refinement):**
   - **Date of Release Moved Below Title (`ContentBoardCard.tsx` & `ContentPlannerView.tsx`):**
     - Relocated publish/release date from card footer up to immediately below the title (`Calendar` icon in `text-blue-500`, formatted via `formatDate(post.publishDate)`).
   - **PIC Style with Profile Photo & Name (`ContentBoardCard.tsx` & `ContentPlannerView.tsx`):**
     - Replaced plain text `PIC: {post.picName}` and icon-only badge with circular profile avatar (`AppImage`, 16×16 `rounded-full`, sizes="avatar") and name (`font-medium text-slate-700 dark:text-slate-300`).
     - Resolved `picMember` using `findMemberForPic` across both Kanban board cards and grid card views.
     - Single-row footer neatly aligns PIC profile photo and name on the left, with quick approval transition buttons or subtask/media chips on the right.
   - **Unit Tests Added (`src/components/views/ContentPlannerView/contentCardStyling.test.ts`):**
     - 3 tests validating `findMemberForPic` avatar resolution, `ContentBoardCard.tsx` date positioning and AppImage avatar, and `ContentPlannerView.tsx` cards view parity.

2. **Field Event Card Clickable & Clean Footer (UI Refinement):**
   - **Card Click Navigation (`src/components/views/EventsView/EventCardsView.tsx`):**
     - Made entire card container clickable (`onClick={() => onSelectEvent(event)}` and `cursor-pointer`), matching Content Planner card behavior.
     - Added `e.stopPropagation()` to internal clickable elements (footage player preview, footage count chip, and archive folder external link).
     - Removed redundant edit (`Edit2`) and delete (`Trash2`) icon buttons from the card footer (events are edited and deleted directly via `EventDrawer.tsx`).
   - **Unit Tests Added (`src/components/views/EventsView/eventDrawer.test.ts`):**
     - Added assertions verifying root card `onClick`, `cursor-pointer`, and absence of `<Edit2` and `<Trash2` buttons.

2. **Field Event Thumbnail Compression & Cover Preview Implementation (ADR-0023, Spec & Plan `2026-11-04-field-event-thumbnails`):**
   - **Upload Route Adaptation (`src/app/api/marcom/drive/upload/route.ts`):**
     - Added optional `context: "events" | "content"` parameter extraction from multipart `formData`.
     - Updated `generateAndUploadThumbnail` to partition WebP thumbnails cleanly into Supabase bucket path `thumbnails/${context}/${userId}/${fileId}.webp`.
   - **Direct Drive Upload Hook (`src/lib/marcom/useDirectDriveUpload.ts`):**
     - Updated hook to support `defaultContext: "events" | "content"` and forward `context` in multipart form payload.
   - **Cover Showcase & Row Thumbnails (`src/components/views/EventsView/EventMediaSection.tsx` & `EventDrawer.tsx`):**
     - Integrated 16:9 aspect-video cover preview banner with ambient hover glow and play overlay (`<Play />`) opening full-screen lightbox.
     - Enforced zero Google Drive thumbnail embed URLs: images render via `<AppImage src={coverThumbnailUrl}>`, and videos render a stylized gradient card with `<Video />` icon.
     - Added 36×36 square thumbnail (`<AppImage src={att.thumbnailUrl}>` for images) in each attachment row.
     - Added 6-dot drag reordering handle (`<GripVertical />`) for intuitive arrangement.
     - Implemented single-click "Cover" selector badge/button to designate the active cover without array mutation.
     - Implemented safe removal fallback: reassigns cover to the next available attachment if active cover is deleted.
     - Synchronized `mediaUrl` state and persistence across `EventDrawer.tsx`.
   - **Card Thumbnail Optimization (`src/components/views/EventsView/EventCardsView.tsx`):**
     - Resolved `coverThumbnailUrl` prioritizing `mediaUrl` selection.
     - Replaced unoptimized `<img>` and raw `<video>` tags with edge-cached `<AppImage src={coverThumbnailUrl}>` and stylized video poster cards.
   - **Unit Tests Added (`src/components/views/EventsView/eventThumbnails.test.ts`):**
     - 5 targeted tests covering context parameter handling, 16:9 banner resolution, 36×36 row thumbnails, cover fallback logic, and elimination of raw Google Drive thumbnail URLs.
   - **Verification Gates Passed:**
     - `npm run drift:check`: ✅ No drift detected. All 50 specs paired and invariants pass.
     - `npm run build:check`: ✅ TypeScript compiled with 0 errors.
     - `npm test`: ✅ 763 passed, 0 failed across 136 suites.

2. **Field Event Thumbnail Compression & Cover Preview Planning (ADR-0023):**
   - **Mode:** Strict Planning-Only session ("don't code in this session").
   - **ADR-0023 (`docs/adr/0023-field-event-thumbnail-generation-cover-preview.md`):**
     - Addressed media presentation disparity between Content Planner (16:9 banner, WebP thumbnail CDN, cover toggle) and Field Events.
     - Decided on Option A: Re-use unified `/api/marcom/drive/upload` endpoint with optional `context: "events"`, explicitly avoid flaky Google Drive thumbnail embeds, and serve edge-cached WebP thumbnails for images with stylized gradient cards for videos.
   - **Specification (`docs/superpowers/specs/2026-11-04-field-event-thumbnails-design.md`):**
     - Detailed data flow: Sharp WebP compression (800px width, q75), Supabase Storage `content-thumbnails`, 16:9 cover preview banner with play overlay in `EventDrawer`, 36×36 square thumbnails in attachment rows, one-click "Cover" selector, and card thumbnail rendering in `EventCardsView`.
   - **Implementation Plan (`docs/superpowers/plans/2026-11-04-field-event-thumbnails.md`):**
     - 5 atomic execution phases with exact code snippets, line mappings, checklists, and verification gates.
   - **Handover (`docs/handover-field-event-thumbnails.md`):**
     - Execution-ready guide with exact code modifications and numbered order for the next session.

2. **Field Event Edit Drawer and Modal Separation Implementation (ADR-0022, Spec & Plan `2026-11-04-field-event-edit-drawer`):**
   - **Dedicated Creation Modal (`src/components/views/EventsView/EventCreateModal.tsx`):**
     - Centered modal dialog matching Content Planner's fast kickoff paradigm.
     - Handles event creation form fields: activation name, type (Roadshow, Launch, Booth, Exhibition, Workshop, Community), branch, location, associated outlet, schedule dates, PIC assignment, budget, target attendees, operational notes, and subtask checklist template.
     - Dispatches `POST /api/marcom/events`, executes cache invalidation via `addCachedEvent`, and displays success toast.
   - **Slide-Over Edit Drawer (`src/components/views/EventsView/EventDrawer.tsx`):**
     - 560px wide slide-over right drawer container with Framer Motion spring physics (`damping: 28, stiffness: 300`) and backdrop blur overlay.
     - Sticky Header: Dynamic event type badge, status selector dropdown (`UPCOMING`, `ON_PROGRESS`, `COMPLETED`, `CANCELLED` backed by `canTransitionEvent` state machine invariants), close (`X`) button, and inline editable title input.
     - Scrollable Body:
       - Logistics & Venue: Organizing branch select, venue text input with MapPin icon, and associated outlet select with clear link.
       - Schedule & Team: Date range with multi-day validation, PIC member assignment with custom fallback, budget IDR with formatIDR, target attendees, and actual attendees.
       - Live Unit Economics: Real-time projection of cost per attendee (target vs actual realization % badge).
       - Logistics Notes: Auto-resizing textarea for venue permits and sound rig specifications.
       - Media & Dokumentasi Event: Reuses `EventMediaSection` for direct device uploads via Google Drive backend, progress indicator, and raw footage archive Drive folder link.
       - Equipment Borrowing: Reuses `EventBorrowedEquipmentSection` displaying borrowed tools and shortcuts for the event.
       - Subtasks Checklist: Reuses `EventChecklistSection` for task subtasks.
     - Sticky Footer:
       - Left: "Hapus Event" button (`Trash2` icon) with confirmation alert, dispatches `DELETE /api/marcom/events/[id]`, invalidates cache, and closes drawer.
       - Right: "Tutup" button and "Simpan Perubahan" primary button, dispatches `PATCH /api/marcom/events/[id]`, invalidates cache, and updates drawer state.
   - **Coordinator Modernization (`src/components/views/EventsView/EventsView.tsx`):**
     - Replaced `isFormModalOpen` and `editingEvent` with `isCreateModalOpen` and `selectedDrawerEvent`.
     - Wired `openCreateModal` to "+ Event Baru" header button, empty state CTA, and calendar view empty date slots.
     - Wired `openEditDrawer` to event card clicks (`EventCardsView`), table row clicks (`EventTableView`), calendar event clicks (`EventsCalendarView`), and timeline bar clicks (`EventsTimelineView`).
     - Mounted `<EventCreateModal>` and `<AnimatePresence>{selectedDrawerEvent && <EventDrawer ... />}</AnimatePresence>`.
   - **Projects View Host Updates (`ProjectsCreateModalHost.tsx` & `ProjectsDetailDrawerHost.tsx`):**
     - Updated `ProjectsCreateModalHost.tsx`: Switched dynamic import to `EventCreateModal` (`onCreated={handleEventSaved}`), maintained 237 LOC (strictly $\le 250$ LOC).
     - Updated `ProjectsDetailDrawerHost.tsx`: Switched dynamic import to `EventDrawer` (`onUpdateEvent`, `onDeleteEvent` with `removeCachedEvent`), maintained 247 LOC (strictly $\le 250$ LOC).
   - **Decommissioned Monolithic `EventFormModal.tsx`:**
     - Verified zero remaining references across `src/` with `git grep "EventFormModal"`.
     - Deleted 950-line `src/components/views/EventsView/EventFormModal.tsx`.
   - **Unit Tests Added (`src/components/views/EventsView/eventDrawer.test.ts`):**
     - 7 unit tests covering deletion of `EventFormModal`, existence of `EventCreateModal` and `EventDrawer`, `EventsView.tsx` coordinator wiring, coordinator host file size limits ($\le 250$ LOC), dynamic import bindings, event machine transitions, and SSOT contracts.
   - **Verification Gates Passed:**
     - `npm run drift:check`: ✅ No drift detected. All invariants pass.
     - `npm run build:check`: ✅ TypeScript compiled with 0 errors.
     - `npm test`: ✅ 758 passed, 0 failed across 135 suites.

2. **Field Event Media Attachments Implementation (ADR-0021, Spec & Plan `2026-11-04-field-event-media-attachments`):**
   - **Database Schema & Migration:**
     - Modified `prisma/schema.prisma`: Added `mediaAttachments Json @default("[]")` to `FieldEvent` model; removed `EventFootage` relation and dropped `EventFootage` model.
     - Generated and applied migration `prisma/migrations/20261104000000_add_field_event_media_attachments/migration.sql`.
     - Regenerated Prisma Client v6.19.3.
     - Updated `prisma/seed.ts` to attach media attachments to `event-003` and clean up `eventFootage` references.
   - **Domain Entity SSOT (`src/types/index.ts`):**
     - Updated `FieldEventItem` interface to include `mediaAttachments?: TaskAttachment[]`.
   - **API Routes Updated:**
     - `src/app/api/marcom/events/route.ts`: Sanitizes `mediaAttachments`, validates array structure, persists directly to `prisma.fieldEvent.create`, and removed legacy `footage: true` queries.
     - `src/app/api/marcom/events/[id]/route.ts`: Added `"mediaAttachments"` to `PATCHABLE_FIELDS`, validates array in PATCH handler, and removed legacy `EventFootage` handling.
     - `src/app/api/marcom/outlets/[id]/route.ts` & `src/app/api/marcom/pipeline/route.ts`: Removed obsolete `include: { footage: true }`.
   - **Component Modernization & Refactoring:**
     - Created `src/components/views/EventsView/EventMediaSection.tsx`: Atomic subcomponent following Strangler Pattern with "Upload dari Perangkat" button, drag-and-drop zone, real-time Google Drive upload progress bar with cancellation, interactive attachment list with type icons (`Film`, `Video`, `File`, `Folder`), and Drive folder link input for raw coverage archives.
     - Updated `src/components/views/EventsView/EventFormModal.tsx`: Integrated `EventMediaSection`, converted legacy footage/mediaUrl to `TaskAttachment[]` for backward-compatibility, removed legacy footage states, and persisted `mediaAttachments`.
     - Updated `src/components/views/EventsView/EventFootageModal.tsx`: Adapted clips playlist to prioritize `event.mediaAttachments`, added image file previews alongside video/Google Drive iframes, and linked Drive archive folder.
     - Updated `src/components/views/EventsView/EventCardsView.tsx`: Displays photo and video previews, dynamic media count badge, and archive folder button.
     - Updated `src/components/views/EventsView/EventTableView.tsx`: Displays unified media count badge.
   - **Tests & Verification:**
     - Created `src/components/views/EventsView/eventsApi.test.ts` with 3 integration tests covering SSOT types, POST validation, and PATCH updates.
     - Verified:
       - `npm run drift:check`: ✅ No drift detected. All invariants pass.
       - `npm run build:check`: ✅ TypeScript compiled with 0 errors.
       - `npm run test:smoke`: ✅ 104 passed, 0 failed.
       - `node --test src/components/views/EventsView/eventsApi.test.ts`: ✅ 3 passed, 0 failed.

2. **Outlet Draft Photo Supabase Storage Migration (ADR-0020, Spec & Plan `2026-11-03-outlet-draft-photo-supabase-storage`):**
   - **Bucket Setup:** Created public `outlet-photos` Supabase Storage bucket with 25MB limit via Storage REST API.
   - **Extended `/api/marcom/uploads/route.ts`:**
     - Added `"outlets"` to `VALID_KINDS`.
     - Mapped `outlets` to `outlet-photos` bucket and `outlets` path prefix (`outlets/{branchId}/{uuid}-{sanitizedFilename}`).
     - Protected with `SUBMIT_DRAFT_OUTLET` permission action.
     - Updated invalid kind error message.
   - **Updated `SubmitDraftOutletModal.tsx`:**
     - Added `ALLOWED_PHOTO_TYPES` (`image/jpeg`, `image/jpg`, `image/png`, `image/webp`) guard to prevent iOS HEIC payload bloat.
     - Stored compressed `File` in `photoFile` state, keeping `formData.photoUrl` base64 preview local to the browser.
     - Implemented upload-before-create in `handleSubmit`: uploads `photoFile` to `/api/marcom/uploads`, receives CDN public URL, asserts non-data URL safety net, and submits to `/api/marcom/outlets/draft`.
     - Added `isUploadingPhoto` state and spinner label ("Mengunggah Foto...").
     - Ensured `photoFile` resets on photo removal, manual URL input, and modal reopen.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run test:smoke`: ✅ 103 passed, 0 failed.
     - `npm test`: ✅ 748 passed, 0 failed (133 suites).
     - End-to-end smoke test verified file upload to `outlet-photos` and public CDN retrieval.
     - Confirmed existing database rows count with `photoUrl LIKE 'data:%'` is 0 (Phase 6 backfill not needed).

2. **Migrate Filesystem Uploads to Supabase Storage (ADR-0019, Spec & Plan `2026-11-03-migrate-filesystem-uploads-to-supabase-storage`):**
   - **Bucket Setup:** Created 3 public Supabase Storage buckets via Storage REST API: `mou-documents` (25MB limit), `marcom-documents` (25MB limit), and `placement-photos` (25MB limit).
   - **Shared Storage Helper (`src/lib/server/supabaseStorage.ts`):** Lightweight `uploadToSupabase(bucket, storagePath, buffer, mimeType)` REST helper using Node native `fetch` and service role authentication without needing `@supabase/supabase-js`.
   - **Rewrote `/api/marcom/uploads/route.ts`:** Replaced local `node:fs/promises` (`mkdir`, `writeFile`) with direct `uploadToSupabase`. Route returns public CDN URLs under `https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}`. Supported upload kinds: `documents`, `mou-documents`, `placements`.
   - **Updated `mouApi.ts`:** Changed `kind` parameter in `uploadMouDocument()` from `"documents"` to `"mou-documents"` to route MOU contracts into the dedicated `mou-documents` bucket.
   - **Tests Added & Passing:**
     - `src/lib/server/supabaseStorage.test.ts`: Tests missing env vars, successful buffer uploads, and HTTP error handling.
     - `src/app/api/marcom/uploads/uploadsApi.test.ts`: Enforces no local fs writes and verifies bucket mappings.
     - `src/components/views/MousView/mouApi.test.ts`: Verifies `kind: "mou-documents"` dispatched to `/api/marcom/uploads`.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run test:smoke`: ✅ 103 passed, 0 failed.
     - `npm test`: ✅ 748 passed, 0 failed (133 suites).

2. **6-Dot Drag-to-Reorder for Media Attachments (`ContentDrawer.tsx` & `ContentPostModal.tsx`):**
   - **6-Dot Drag Handle:** Added `GripVertical` icon (6 dots) to the left of the file icon in `ContentDrawer` and `ContentPostModal`.
   - **Native Drag-and-Drop:** Enabled HTML5 drag-and-drop on the grip handle (`cursor-grab active:cursor-grabbing`, `draggable`, `onDragStart`, `onDragOver`, `onDrop`, `onDragEnd`) with a custom drag image (`setDragImage`) referencing the full attachment row.
   - **Visual Feedback:** While dragging, the dragged item displays `opacity-40 border-dashed border-pink-400` and the drop target row highlights with `border-pink-500 bg-pink-50/50`.
   - **Preserves Cover State:** Reordering items directly mutates only the sequence in `mediaAttachments`, keeping cover resolution decoupled and strictly bound to `mediaUrl`.
   - **Badge Update:** Cleaned up badge from `"(New)"` to `"New"`.

2. **Decouple Cover Selection from Array Reordering (`ContentDrawer.tsx`, `ContentPlannerView.tsx`, `ContentPostModal.tsx`):**
   - **No Array Reordering:** Clicking "Cover" on any attachment now points `mediaUrl = att.url` without mutating or reordering the `mediaAttachments` array order. Files stay in their original upload sequence.
   - **Cover State Resolution:** Cover badge and cover buttons evaluate `isCover = att.url === (mediaUrl || mediaAttachments[0]?.url)`.
   - **Drawer Preview & Card Thumbnail:** Both preview player and calendar/list/board cards resolve the active cover attachment via `mediaAttachments.find(a => a.url === mediaUrl) || mediaAttachments[0]`. Lightbox thumbnail click automatically opens directly at the chosen cover's index.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run lint`: ✅ 0 ESLint warnings or errors.
     - `npm run test:smoke`: ✅ 101 passed, 0 failed.
     - `npm test`: ✅ 743 passed, 0 failed (132 suites).

2. **Unsaved Media Indicator (New) in ContentDrawer (`src/components/views/ContentPlannerView/ContentDrawer.tsx`):**
   - **Feature & Visual Indicator:** Added thin green `(New)` text (`text-[10px] text-emerald-600 dark:text-emerald-400 font-normal shrink-0`) displayed right after the file size for any media attachment recently uploaded in the current drawer session that has not yet been saved to PostgreSQL.
   - **Persistence Synchronization:** Managed `savedAttachmentIds` state initialized from `post.mediaAttachments` on drawer open. Marking newly added files as unsaved until the user clicks "Simpan Perubahan", at which point `savedAttachmentIds` is updated and the `(New)` tag is cleared.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run lint`: ✅ 0 ESLint warnings or errors.
     - `npm run test:smoke`: ✅ 101 passed, 0 failed.
     - `npm test`: ✅ 743 passed, 0 failed (132 suites).

2. **Simplify Media Upload Entry Points in ContentDrawer (Plan: `docs/superpowers/plans/2026-11-03-simplify-media-upload-entry-points.md`):**
   - **Upload-Only Modal (`src/components/ui/GoogleDriveLinkModal.tsx`):**
     - Removed segmented tab control ("Unggah Langsung" vs "Tempel Link URL") and `activeTab` state.
     - Removed `GoogleDriveUrlForm`, `buildAttachmentFromManualUrl`, and `Link2` imports.
     - Simplified header subtitle to "Unggah berkas langsung ke Google Drive."
     - Rendered the direct upload dropzone, file list, and confirmation action directly.
   - **Unified "Upload dari Perangkat" Entry Points (`src/components/views/ContentPlannerView/ContentDrawer.tsx`):**
     - Updated top header "Upload dari Perangkat" button to open `onOpenUploadModal`, leading directly into the multi-file upload modal.
     - Removed redundant "Link Drive" buttons from both top header and empty-state dropzone.
     - Updated empty-state dropzone "Upload dari Perangkat" button to trigger `onOpenUploadModal`.
     - Removed URL paste input from both empty-state dropzone and media-set action row.
     - Updated "Ganti" button in media-set view to open `onOpenUploadModal` with replacement callback (`setMediaAttachments(attachments)`).
     - Removed unused `CloudUpload` import.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run lint`: ✅ 0 ESLint warnings or errors.
     - `npm run test:smoke`: ✅ 101 passed, 0 failed.
     - `npm test`: ✅ 743 passed, 0 failed (132 suites).

2. **Thumbnail Generation via Sharp + Supabase Storage (ADR-0018, Spec & Plan: `2026-11-03-thumbnail-generation-supabase-storage`):**
   - **Pre-requisite (Supabase Storage Bucket):**
     - Initialized and configured public bucket `content-thumbnails` via Supabase REST API (file size limit 5 MB, allowed MIME type `image/webp`).
     - Verified public object URL pattern returns 404 (NoSuchKey) instead of 401/403.
   - **Attachment Model & Types (`src/lib/marcom/driveUploadHelpers.ts`, `driveUploadHelpers.test.ts`):**
     - Extended `BuildDriveAttachmentParams` with optional `thumbnailUrl?: string`.
     - Populated `thumbnailUrl` on canonical `TaskAttachment` objects created via `buildDriveAttachment`.
     - Added comprehensive unit tests in `driveUploadHelpers.test.ts`.
   - **Upload Endpoint & Image Compression (`src/app/api/marcom/drive/upload/route.ts`):**
     - Integrated `sharp` image processor for compressible image types (`image/jpeg`, `image/jpg`, `image/png`, `image/webp`).
     - Resizes images to max 800px width with aspect ratio preservation and converts to WebP (quality 75).
     - Directly streams WebP buffer to Supabase Storage at `thumbnails/${userId}/${fileId}.webp` with `x-upsert: true` and public max-age caching.
     - Preserves graceful non-fatal degradation: if Supabase upload or sharp fails, Google Drive upload still completes normally.
     - Returns `{ success: true, fileId, name, thumbnailUrl }`.
   - **Attachment Finalization & Hook Threading (`src/app/api/marcom/drive/finalize/route.ts`, `src/lib/marcom/useDirectDriveUpload.ts`):**
     - Threaded `thumbnailUrl` through `useDirectDriveUpload` upload response into the `finalize` API request payload.
     - Finalize route passes `thumbnailUrl` to `buildDriveAttachment`.
   - **Card & Drawer Thumbnail Rendering (`ContentPlannerView.tsx`, `ContentDrawer.tsx`):**
     - Added `thumbnailUrl` check as the primary rendering branch before the Google Drive placeholder check in `ContentPlannerView.tsx`.
     - Renders `<AppImage src={coverThumbnailUrl} ...>` with smooth hover preview overlay.
     - Added cover preview thumbnail rendering in `ContentDrawer.tsx`.
     - Added "Cover" action button on non-first attachment rows in `ContentDrawer.tsx` to easily reorder attachments and set any uploaded item as cover.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run lint`: ✅ 0 ESLint warnings or errors.
     - `npm run test:smoke`: ✅ 101 passed, 0 failed.
     - `npm test`: ✅ 743 passed, 0 failed (132 suites).

2. **Toast Notifications Timer Progress Bar (Plan: `2026-11-03-toast-timer-progress-bar.md`):**
   - **Feature & UX Feedback:** Added a thin, semantic countdown timer progress bar (`height: 2px; opacity: 0.45; background: currentColor`) at the bottom of toast notifications in `src/app/globals.css`.
   - **Synchronization:** Explicitly set `duration={4000}` on `<Toaster />` in `src/app/layout.tsx` matching the CSS linear keyframe countdown.
   - **Interactive State:** Pauses countdown on toast hover (`animation-play-state: paused`) in sync with Sonner's hover-pause behavior; excludes loading/promise toasts and respects `prefers-reduced-motion`.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run test:smoke`: ✅ 101 passed, 0 failed.
     - `npm test`: ✅ 742 passed, 0 failed.

2. **Move Toast Notifications to top-right (Plan: `2026-11-03-fix-toast-position-top-right.md`):**
   - **Root Cause & UX Collision:** Toast notifications were configured at `bottom-right`, where sequentially fired multi-file upload toasts piled up directly over `ContentDrawer` bottom CTAs ("Simpan Perubahan" and "Hapus Post"), blocking user clicks.
   - **Fix:** Updated `<Toaster richColors position="top-right" />` in `src/app/layout.tsx`.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run test:smoke`: ✅ 101 passed, 0 failed.
     - `npm test`: ✅ 742 passed, 0 failed.

2. **Fix mediaAttachments Not Saving in ContentPlannerView Drawer Update (Plan: `2026-11-03-fix-media-attachments-not-saving.md`):**
   - **Root Cause:** `handleDrawerUpdate` in `ContentPlannerView.tsx` manually constructed the PATCH request payload and omitted `mediaAttachments`, causing updates from `ContentDrawer` to never persist attachments to PostgreSQL.
   - **Fix:** Added `mediaAttachments: updated.mediaAttachments ?? []` to the PATCH request body in `ContentPlannerView.tsx`.
   - **Impact:** Fixes both attachment persistence across drawer saves and enables the lightbox multi-attachment carousel/navigation when clicking post cards.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run test:smoke`: ✅ 101 passed, 0 failed.
     - `npm test`: ✅ 742 passed, 0 failed.

2. **Multi-File Media UI Adaptation for Content Planner (Plan: `2026-11-03-multi-file-media-ui-adaptation.md`, ADR: `docs/adr/0017-multi-file-media-ui-adaptation.md`, Spec: `docs/superpowers/specs/2026-11-03-multi-file-media-ui-adaptation.md`):**
   - **`previewMedia` State Refactoring (`ContentPlannerView.tsx`):**
     - Updated shape from `{ title, mediaUrl, platform?, format? }` to `{ title, attachments: TaskAttachment[], currentIndex: number, platform?, format? }`.
     - Extended keyboard listener to handle `ArrowLeft` and `ArrowRight` navigation with boundary clamping.
     - Updated calendar/list card thumbnail click handler to populate `attachments` (real `mediaAttachments` or synthetic 1-item cover array) and `currentIndex: 0`.
   - **Full Lightbox Navigation (`ContentPlannerView.tsx`):**
     - Added active file counter (`${currentIndex + 1} / ${attachments.length}`) and truncated active filename in header.
     - Replaced hardcoded `previewMedia.mediaUrl` with active attachment `active.url` (including external link).
     - Added responsive prev/next navigation overlay buttons (`ChevronLeft` / `ChevronRight`) with disabled edge states.
     - Added bottom dot indicators (capped at 10 dots with ellipsis) with direct click-to-jump navigation.
   - **ContentDrawer Call Sites (`ContentDrawer.tsx`):**
     - Updated `onPreviewMedia` prop contract to accept `{ title, attachments, currentIndex, platform?, format? }`.
     - Cover thumbnail click opens lightbox at index 0.
     - Attachment list row click opens lightbox directly at clicked item index (`currentIndex: i`).
   - **Card Surface Indicators (`ContentPlannerView.tsx` & `ContentBoardCard.tsx`):**
     - Calendar & list view thumbnails display `+N` badge (`+{attachments.length - 1}`) when attachments > 1.
     - Kanban board cards display `ImageIcon` with item count badge (`🖼 N`) when attachments > 1.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected (0 errors).
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run test:smoke`: ✅ 101 passed, 0 failed.
     - `npm test`: ✅ 742 passed, 0 failed.

2. **Multi-File Device Upload in ContentDrawer (Plan: `2026-11-03-fix-drawer-multi-file-device-upload.md`):**
   - **Multi-File Input (`ContentDrawer.tsx`):** Added `multiple` attribute to `<input type="file">`, allowing OS file picker to select multiple files at once.
   - **Batch File Processing (`ContentDrawer.tsx`):** Updated `onChange` and `handleDrop` from single-element indexing (`files?.[0]`) to sequential `for...of` processing across `Array.from(files)`.
   - **Sequential Queue & Feedback:** Each file is streamed to Google Drive sequentially with distinct loading/success toasts, automatically appended into `mediaAttachments`, and keeps `mediaUrl` synchronized with the cover.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run test:smoke`: ✅ 101 passed, 0 failed.
     - `npm test`: ✅ 742 passed, 0 failed (132 suites).

2. **Multi-File Upload in ContentPostModal Create Flow (Plan: `2026-11-03-multi-file-upload-create-modal.md`):**
   - **Modal Refactoring (`ContentPostModal.tsx`):**
     - Replaced internal single-file `useDirectDriveUpload` and hidden input with unified `onOpenUploadModal` trigger matching `ContentDrawer`.
     - Rendered interactive attachment list showing file type icons (`Film` vs `File`), filenames, formatted file sizes (`MB`), Cover indicator on first item, and delete actions.
     - Preserved manual link URL input as graceful empty-state fallback.
   - **View State & Creation Wiring (`ContentPlannerView.tsx`):**
     - Added `mediaAttachments: TaskAttachment[]` state to creation form.
     - Reset `mediaAttachments` to `[]` on modal open.
     - Included `mediaAttachments` and synchronized `mediaUrl = mediaAttachments[0]?.url || mediaUrl.trim()` in POST payload.
     - Passed `mediaAttachments`, `setMediaAttachments`, and `onOpenUploadModal` props to `<ContentPostModal>`.
   - **Cross-Component Compatibility:**
     - Made `mediaAttachments` props optional with default fallbacks in `ContentPostModalProps` to protect callers like `ProjectsCreateModalHost.tsx`.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run test:smoke`: ✅ 101 passed, 0 failed.
     - `npm test`: ✅ 742 passed, 0 failed (132 suites).

2. **Fix Prisma Migration History Drift (Plan: `docs/superpowers/plans/2026-11-03-fix-prisma-migration-drift.md`):**
   - **Root Cause & Diagnosis:** Live PostgreSQL database on Supabase was previously updated via direct SQL / `db push` without initializing the `_prisma_migrations` tracking table, causing `prisma migrate status` to warn that 5 existing migrations had not been applied.
   - **Migration History Initialization:**
     - Created `_prisma_migrations` table and resolved all 5 legacy migrations as applied using `npx prisma migrate resolve --applied`:
       - `20260906221636_marcom_port`
       - `20261027000000_remove_workspace_tenant`
       - `20261029072742_add_user_auth_model`
       - `20261029134026_drop_task_models`
       - `20261030192500_add_inventory_system`
     - Created new migration file `prisma/migrations/20261103000000_add_media_attachments/migration.sql` with safe idempotent SQL: `ALTER TABLE "ContentPost" ADD COLUMN IF NOT EXISTS "mediaAttachments" JSONB NOT NULL DEFAULT '[]';`.
     - Resolved `20261103000000_add_media_attachments` as applied.
   - **Verification:**
     - `npx prisma migrate status`: ✅ 6 migrations found, database schema is up to date.
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run test:smoke`: ✅ 101 passed, 0 failed.

2. **Multi-File Media Upload for Content Posts (ADR-0016, Spec & Plan: `2026-11-03-multi-file-media-upload`):**
   - **Database & Prisma Schema (`prisma/schema.prisma`):**
     - Added `mediaAttachments Json @default("[]")` to `model ContentPost`.
     - Applied Postgres schema update: `ALTER TABLE "ContentPost" ADD COLUMN IF NOT EXISTS "mediaAttachments" JSONB NOT NULL DEFAULT '[]';`.
     - Regenerated Prisma Client (`npx prisma generate`).
   - **SSOT Type Definitions (`src/types/index.ts`):**
     - Updated `ContentPostItem` domain interface to include `mediaAttachments?: TaskAttachment[]`.
   - **API Routes (`src/app/api/marcom/content/route.ts`, `src/app/api/marcom/content/[id]/route.ts`):**
     - POST route: extracts `mediaAttachments` and enforces array validation (`Array.isArray(mediaAttachments) ? mediaAttachments : []`).
     - PATCH route: updates `mediaAttachments` when passed in request body (`Array.isArray(body.mediaAttachments) ? body.mediaAttachments : []`).
   - **Modal Multi-File Upload UI (`src/components/ui/GoogleDriveLinkModal.tsx`):**
     - Rewrote to accumulate files across multiple uploads in `uploadedFiles` state array instead of auto-closing immediately.
     - Dropzone remains available for batch uploading up to a 10-file cap.
     - Renders scrollable file list with file type icons (`Film` vs `FileText`), filename, formatted file size (`KB`/`MB`), checkmark status, and per-item remove button.
     - "Lampirkan X File" confirm button passes `TaskAttachment[]` to `onAttach` and closes modal.
     - "Tempel Link URL" tab automatically constructs a valid `TaskAttachment` via `buildAttachmentFromManualUrl` and attaches it.
   - **Callers & Hook Compatibility (`src/lib/marcom/useGoogleDrivePicker.ts`, `ContentPlannerView.tsx`):**
     - Updated `handleManualAttach` to accept `attachmentsOrUrl: TaskAttachment[] | string`, ensuring complete backward compatibility for other views (`DocumentsView`, `EventFormModal`, `ProjectsCreateModalHost`).
     - Updated `pendingUploadAttachRef` and `handleOpenUploadModal` in `ContentPlannerView.tsx` to handle `(attachments: TaskAttachment[]) => void`.
   - **Drawer State & Multi-Media Presentation (`src/components/views/ContentPlannerView/ContentDrawer.tsx`):**
     - Managed `mediaAttachments` local state, hydrated on post selection (`Array.isArray(post.mediaAttachments) ? post.mediaAttachments : []`).
     - Kept `mediaUrl` and `mediaAttachments[0]` in strict synchronization: attaching files sets cover URL to index 0, removing index 0 automatically promotes index 1 to cover and updates `mediaUrl`.
     - Rendered attachment list cards with "Cover" badge, preview button, and delete action.
     - Handled device file upload and Drive modal attachment flows seamlessly.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run lint`: ✅ 0 warnings or errors.
     - `npm run test:smoke`: ✅ 101 passed, 0 failed.
     - `npm test`: ✅ 742 passed, 0 failed (132 suites).

1. **Fix Drive Upload CORS Error + Restore Picker User Drive View (Plan: `2026-11-03-fix-drive-upload-cors-picker-upload-tab.md`):**
   - **Root Cause & Diagnosis:**
     1. Direct browser XHR `PUT` to Google's resumable session URL failed with browser CORS policy block (`No 'Access-Control-Allow-Origin' header is present`) because the resumable session URL was generated server-side with a service account token and does not authorize browser origins.
     2. Google Picker displayed "No documents" because `docsView.setParent(FOLDER_ID)` scoped file queries to the service account's internal Drive folder which authenticated users do not own.
   - **Server-Side Upload Proxy (`src/app/api/marcom/drive/upload/route.ts`):**
     - Created `POST /api/marcom/drive/upload` multipart endpoint that receives file binary, initiates resumable session, and executes the PUT stream server-to-server directly to Google's CDN without CORS constraints.
     - Enforces authentication guard and file name sanitization via `sanitizeUploadFileName`.
     - Returns `{ success: true, fileId, name }`.
   - **Hook Refactoring (`src/lib/marcom/useDirectDriveUpload.ts`):**
     - Replaced browser XHR with clean `fetch()` multipart POST to `/api/marcom/drive/upload` followed by `/api/marcom/drive/finalize`.
     - Added standard `AbortController` cancellation support (`cancelUpload()`) and progressive percentage progress indicators (20% -> 40% -> 75% -> 100%).
   - **Google Picker Unscoping (`src/lib/marcom/useGoogleDrivePicker.ts`):**
     - Removed `docsView.setParent(FOLDER_ID)` to let the Picker surface the authenticated user's own Drive documents and folders instead of the empty service account folder.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run lint`: ✅ 0 warnings or errors.
     - `npm run test:smoke`: ✅ 101 passed, 0 failed.
     - `npm test`: ✅ 742 passed, 0 failed (132 suites).
     - `npm run build`: ✅ Next.js production build compiled cleanly (48/48 routes).

2. **Direct "Upload dari Perangkat" Button & Drag-and-Drop in ContentDrawer & ContentPostModal:**
   - **User Intent & Problem Statement:** Users requested an explicit, foolproof **"Upload dari Perangkat"** button to upload images and videos directly from their local machine into Content Planner without having to navigate modal sub-tabs or deal with Google login popups.
   - **Direct Device File Picker (`ContentDrawer.tsx`, `ContentPostModal.tsx`):**
     - Embedded a hidden `<input ref={fileInputRef} type="file" accept="image/*,video/*" />` triggered directly by a prominent "Upload dari Perangkat" button with `<Upload />` icon.
     - Wired up `useDirectDriveUpload` for direct binary streaming to Google Drive via server-side resumable session (`/api/marcom/drive/upload-session` and `/api/marcom/drive/finalize`), bypassing Vercel 4.5MB payload limits and making files readable with zero user Google login.
     - Added real-time upload progress card showing animated progress bar, live percentage (`X%`), spinning indicator, and abort/cancel control.
   - **Interactive Dropzone Empty State (`ContentDrawer.tsx`):**
     - When no media is attached, replaced the plain text input with an interactive dashed dropzone supporting direct drag-and-drop of video/image files.
     - Provided two prominent actions: primary "Upload dari Perangkat" button and secondary "Link Drive" button (`onOpenUploadModal`), plus direct URL input.
   - **Post Creation Modal Parity (`ContentPostModal.tsx`):**
     - Added "Upload dari Perangkat" button alongside "Google Drive" picker with live upload progress bar.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run lint`: ✅ 0 warnings or errors.
     - `npm run test:smoke`: ✅ 100 passed, 0 failed.
     - `npm test`: ✅ 741 passed, 0 failed (131 suites).

2. **Unify ContentDrawer Media Upload to Single "Tambah Media" Button (Plan: `2026-11-03-fix-drive-picker-no-upload-tab.md`):**
   - **User Intent & Problem Statement:** The native Google Picker had no upload tab and was scoped to a shared folder, showing "No documents". Having two adjacent text links ("Upload dari Perangkat" and "Pilih dari Google Drive") caused confusion and directed users back to the dead-end native Picker flow.
   - **Unified UX Entry Point (`ContentDrawer.tsx`):** Replaced the dual-link buttons with a single, prominent "Tambah Media" button that triggers `onOpenUploadModal`.
   - **Modal Integration (`ContentPlannerView.tsx`):** "Tambah Media" directly opens `GoogleDriveLinkModal` (which provides both "Unggah Langsung" via service account resumable direct stream and "Tempel Link URL" for existing Drive links). Removed `onOpenDrivePicker` invocation from `ContentDrawer`.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run lint`: ✅ 0 warnings or errors.
     - `npm run test:smoke`: ✅ 100 passed, 0 failed.
     - `npm test`: ✅ 741 passed, 0 failed (131 suites).

2. **Fix Google Drive Picker "Server rejected" & Content Media Type (Plan: `2026-11-03-fix-drive-picker-upload-server-rejected.md`):**
   - **Root Cause & Diagnosis:** Google Picker native Upload tab (`DocsUploadView`) failed with "Server rejected" when uploading images because `drive.file` OAuth scope restricts file access to app-created files and does not permit creating arbitrary files in the native Picker iframe. In addition, `defaultKind: "video"` was hardcoded for content posts, restricting Picker to video files only and blocking PNG/JPEG selections.
   - **Fix 1 — Disable Broken Picker Native Upload Tab (`src/lib/marcom/useGoogleDrivePicker.ts`):** Removed `new google.picker.DocsUploadView()` and `.addView(uploadView)` from `createAndShowPicker`. Direct uploads are handled safely and reliably by `GoogleDriveLinkModal` via `useDirectDriveUpload` using the server-side service account.
   - **Fix 2 — Allow All File Types for Content Posts (`ContentDrawer.tsx`, `ContentPlannerView.tsx`):** Changed `defaultKind` from `"video"` to `"all"` in `ContentDrawer.tsx` (`onOpenDrivePicker`) and `ContentPlannerView.tsx` (`onOpenDriveSelector` & `GoogleDriveLinkModal`), allowing users to pick images, carousels, videos, and documents seamlessly.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run lint`: ✅ 0 warnings or errors.
     - `npm run test:smoke`: ✅ 100 passed, 0 failed.
     - `npm test`: ✅ 741 passed, 0 failed (131 suites).

2. **Verify Content Format Video Regression Resolution (Plan: `2026-11-02-fix-content-format-video-regression.md`):**
   - **Diagnosis & Plan Scope:** Evaluated regression report where `format: "video"` previously failed after hard refresh due to unpatched database rows reloading into in-memory Zustand store.
   - **Database Row Verification:** Verified database state directly via Prisma query (`ContentPost.findMany`). Zero rows contain invalid formats (`format: { notIn: ["reel", "carousel", "image", "story", "article", "thread"] }` returns 0). Zero rows contain invalid status (`REVISION_NEEDED`). All existing records (`cnt-001`, `cnt-002`, `cnt-003`, `cnt-004`, etc.) have canonical format (`reel` / `carousel` / `image`) and canonical status (`REVISION`, `PUBLISHED`, `IN_REVIEW`, `SCHEDULED`).
   - **Client-Side Guard Verification:** Confirmed `ContentDrawer.tsx` line 108 enforces `isValidFormat(post.format) ? post.format : "reel"` and `isValidPlatform(post.platform) ? post.platform : "instagram"`.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm test`: ✅ 741 passed, 0 failed (131 suites).

2. **Fix Invalid `format: "video"` & Seed Data Normalization (`ContentDrawer.tsx`, `prisma/seed.ts`):**
   - **Plan:** `docs/superpowers/plans/2026-11-02-fix-content-format-invalid-video.md`.
   - **Root Cause:** `prisma/seed.ts` originally seeded invalid `format` (`reels`, `video`, `shorts`) and invalid `status` (`REVISION_NEEDED`) directly via Prisma. When opened in `ContentDrawer`, `post.format` (`"video"`) was loaded into state and passed to `PATCH /api/marcom/content/[id]`, which failed with HTTP 400 (`Invalid format: 'video'. Must be one of: reel, carousel, image, story, article, thread`).
   - **Seed File Fix (`prisma/seed.ts`):** Corrected `cnt-001` (`"reels"` -> `"reel"`), `cnt-002` (`"video"` -> `"reel"`, `"REVISION_NEEDED"` -> `"REVISION"`), and `cnt-004` (`"shorts"` -> `"reel"`).
   - **Client-Side Fallback Guard (`ContentDrawer.tsx`):**
     - Imported `isValidFormat`, `isValidPlatform`, and `VALID_POST_STATUSES` from `@/lib/marcom/contentTaxonomy`.
     - Guarded `setFormat` with `isValidFormat(post.format) ? post.format : "reel"`.
     - Guarded `setPlatform` with `isValidPlatform(post.platform) ? post.platform : "instagram"`.
     - Guarded `setStatus` with fallback from `"REVISION_NEEDED"` to `"REVISION"` and validation against `VALID_POST_STATUSES`.
   - **Database Row Normalization:** Migrated existing records in `ContentPost` (`format: "reel"` for `video/reels/shorts`, `status: "REVISION"` for `REVISION_NEEDED`).
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run lint`: ✅ 0 warnings or errors.
     - `npm run test:smoke`: ✅ 100 passed, 0 failed.
     - `npm test`: ✅ 741 passed, 0 failed (131 suites).

2. **Google Drive Remote Image Pattern & AppImage Resilience Fix (`next.config.ts`, `AppImage.tsx`, `appImageHelpers.ts`, `appImageHelpers.test.ts`):**
   - **Root Cause & Problem Statement:** Next.js threw runtime error `Error: Invalid src prop (...) on next/image, hostname "drive.google.com" is not configured under images in your next.config.js` when rendering card attachments with Google Drive viewer links.
   - **next.config.ts Configuration:** Added `drive.google.com`, `docs.google.com`, and `*.google.com` to `images.remotePatterns`.
   - **Image Source Normalization (`normalizeImageSrc` in `appImageHelpers.ts`):** Converts Google Drive web viewer links (`/file/d/{id}/view`, `?id={id}`) into direct thumbnail endpoints (`https://drive.google.com/thumbnail?id={id}&sz=w800`).
   - **Unconfigured Remote Host Protection (`isConfiguredRemoteHost` in `appImageHelpers.ts` & `AppImage.tsx`):** If an image URL belongs to an unconfigured external domain, `AppImage` gracefully falls back to a native `<img>` element instead of letting Next.js throw unhandled runtime exceptions.
   - **Bypass Image Optimization for Google Drive (`shouldBypassOptimization`):** Flags Google Drive URLs as `unoptimized` so client browsers fetch thumbnails directly with user session context rather than causing server-side image proxy failures.
   - **Unit Tests:** Added 6 new test cases to `src/components/ui/appImageHelpers.test.ts` (15 tests passing).
   - **Coordinator / Component LOC Check:** `AppImage.tsx` (135 LOC $\le 250$), `appImageHelpers.ts` (85 LOC $\le 250$).

2. **Unify Filter: Remove Pill Tabs, Promote Stat Cards & Active Card Animation (ADR 15):**
   - **User Intent & Problem Statement:** The User Management page had two UI elements filtering the same underlying user table. The user requested removing the pill bar, wiring the "Total Pengguna" stat card to display all users (reset filter), and making the active card border more beautiful with fluid spring animation on card switch.
   - **ADR & Spec:** `docs/adr/0015-unify-filter-stat-cards-remove-pill-tabs.md` & `docs/auth-user-management/spec-unify-filter-stat-cards.md`.
   - **"Total Pengguna" Filter Integration (`UsersView.tsx`, `UsersHeader.tsx`, `UsersActiveTab.tsx`, `UserActiveRow.tsx`, `src/types/index.ts`):**
     - Added `UserTabFilter = UserStatus | "ALL"` to SSOT types.
     - Wired "Total Pengguna" KPI card with `onClick: () => onTabChange("ALL")` and `active: activeTab === "ALL"`.
     - In `UsersView.tsx`: When `activeTab === "ALL"`, fetches `/api/admin/users?limit=50` (unfiltered by status) returning all registered accounts.
     - Enhanced `UsersActiveTab` and `UserActiveRow` to display all users with status-aware actions: approved accounts have "Nonaktifkan", pending accounts have "Setujui" (launching `ApproveUserModal`), and rejected accounts have "Aktifkan" (instant reactivate).
   - **Animated Active KPI Card Border (`KpiSummaryCards.tsx`):**
     - Integrated Framer Motion spring-animated sliding active indicator (`motion.div layoutId={activeLayoutId}`) across cards.
     - Styled each card with color-matched vibrant 2px border, ambient colored glow (`shadow-[0_0_16px_rgba(...)]`), and subtle surface tint when active.
     - Seamless, fluid glide when switching active cards with spring physics (`stiffness: 450, damping: 35`) and `useReducedMotion()` fallback.
     - Preserved coordinator LOC ($\le 250$): `UsersView` 188 LOC, `UsersHeader` 134 LOC, `UsersActiveTab` 233 LOC, `UserActiveRow` 177 LOC, `KpiSummaryCards` 241 LOC.
   - **Verification Gates:**
     - `npm run drift:check`: ✅ No drift detected.
     - `npm run build:check`: ✅ 0 TypeScript errors.
     - `npm run lint`: ✅ 0 warnings or errors.
     - `npm run test:smoke`: ✅ 100 passed, 0 failed.
     - `npm test`: ✅ 734 passed, 0 failures (129 suites).
     - `npm run build`: ✅ Production Next.js build compiled cleanly (31/31 routes).

2. **Branch Assignment UX Fixes:**
   - **FIX-1 (Accessibility)**: Replaced click-based `<label>` with accessible native `<input type="checkbox" className="sr-only">` and `pointer-events-none` on visual box in `ApproveUserModal.tsx` and `UserBranchSelectModal.tsx`. Ensures full keyboard Tab/Space navigation and screen reader checked state announcements.
   - **FIX-2 (UX Race Condition)**: Isolated `isBranchSaving` state in `UsersActiveTab.tsx`, decoupling modal save state from table-row action `processingId`. Opening a branch modal while a row is deactivating no longer falsely disables the modal save button.
   - **FIX-3 (Resilience / Error Feedback)**: Added `branchesStatus` state (`idle`, `loading`, `ok`, `error`), memoized `fetchBranches`, and an amber error notification banner with an inline "Coba Lagi" retry button in `UsersView.tsx`.
   - Updated unit tests in `src/components/views/UsersView/userBranchAssignment.test.ts` (5 tests passing).
   - Preserved all coordinator and modal file sizes strictly $\le 250$ LOC.
   - Plan: `docs/superpowers/plans/2026-11-02-branch-assignment-ux-fixes.md`.

2. **User Management Branch Assignment & Area Supervisor Scoping (ADR 14):**
   - **User Intent & Problem Statement:** The user observed that previously neither the registration form nor User Management asked or allowed assigning users to specific branches (`assignedBranchIds`). Confirmed that `supervisor` acts as an Area Supervisor (Model A) with multi-branch purview, and managers should assign branches in User Management upon approval or via active user management (Option 1).
   - **ADR 14 & Spec:** Authored ADR 14 (`docs/adr/0014-user-management-branch-assignment.md`), Design Spec (`docs/superpowers/specs/2026-11-02-user-branch-assignment-design.md`), and Plan (`docs/superpowers/plans/2026-11-02-user-branch-assignment.md`).
   - **Pure RBAC & Scoping Helpers (`src/lib/marcom/branchAssignmentHelpers.ts`):**
     - `getAssignableBranches`: Admins can assign all branches; Supervisors can only assign from their own `assignedBranchIds`.
     - `canAssignBranchToUser`: Prevents supervisors from assigning out-of-scope branches.
     - `formatUserBranchBadges`: Displays "Semua Cabang (Nasional)" for Admin, "Belum Ada Cabang" for unassigned, and human-readable branch names for assigned users.
     - 13 comprehensive unit tests passing in `branchAssignmentHelpers.test.ts`.
   - **Backend API Hardening (`src/app/api/admin/users/[id]/route.ts`):**
     - In `PATCH /api/admin/users/[id]`, added validation using `canAssignBranchToUser`.
     - Rejects out-of-scope branch assignments by supervisors with HTTP 403 (`Supervisor hanya dapat menugaskan cabang dalam wilayah binaannya.`).
     - Added API guard test cases in `adminUsersGuards.test.ts` (6 tests passing).
     - Maintained file size at 218 LOC ($\le 250$ LOC).
   - **Approval & Active UI Components:**
     - `ApproveUserModal.tsx` (224 LOC $\le 250$): Modal triggered upon clicking "Setujui" in `UsersPendingTab` allowing explicit selection of role and branch penugasan before activating the account.
     - `UserBranchSelectModal.tsx` (199 LOC $\le 250$): Dialog for updating branch penugasan for active users in `UsersActiveTab`.
     - `UserActiveRow.tsx` (136 LOC $\le 250$): Extracted row subcomponent (Strangler Pattern) displaying user info, role select, branch chips with edit trigger, status, last login, and deactivate button.
     - `UsersActiveTab.tsx` (172 LOC $\le 250$): Added "Cabang" column and integrated `UserBranchSelectModal`.
     - `UsersPendingTab.tsx` (233 LOC $\le 250$): Integrated `ApproveUserModal`.
     - `UsersView.tsx` (155 LOC $\le 250$): Fetches branches from `/api/marcom/branches` on mount and passes them to tabs.
     - 4 unit tests passing in `userBranchAssignment.test.ts`.
   - **Verification Gates:**
     - `npm run drift:check`: Clean, 46 paired specs/plans, all coordinator files $\le 250$ LOC.
     - `npm run test:smoke`: 100 passed, 0 failed.
     - `npm test`: 733 passed, 0 failed (129 suites).
     - `npm run build:check`: 0 errors.
     - `npm run lint`: 0 warnings or errors.
     - `npm run build`: Production Next.js build compiled cleanly (31/31 routes).

2. **Supervisor Guarded User Management Access (ADR 13):**
   - **User Intent & Problem Statement:** The user inquired if the system has a `supervisor` user level and requested that supervisors be granted access to the User Management page (`/?view=users`) and its operational actions like an admin.
   - **Privilege Escalation & Hierarchy Protection:** Adopted guarded access (Option 2):
     - Supervisors are granted access to view all registration tabs (`PENDING`, `APPROVED`, `REJECTED`), approve/reject new registrations, reassign branches, and manage roles (`supervisor`, `staff`, `viewer`).
     - Supervisors are strictly blocked from promoting accounts to `admin` (privilege escalation prevention) and blocked from modifying, deactivating, or deleting `admin` accounts (tampering protection).
   - **ADR 13 & Spec:** Authored ADR 13 (`docs/adr/0013-supervisor-guarded-user-management-access.md`), Design Spec (`docs/superpowers/specs/2026-11-02-supervisor-guarded-user-management-design.md`), and Plan (`docs/superpowers/plans/2026-11-02-supervisor-guarded-user-management.md`).
   - **Pure RBAC Guards (`src/lib/marcom/guards.ts`):**
     - `canAccessUserManagement(role)`: Returns `true` for `"admin"` and `"supervisor"`.
     - `canManageUserTarget(actorRole, targetUserRole)`: Returns `false` if `targetUserRole === "admin"` and `actorRole !== "admin"`.
     - `canAssignUserRole(actorRole, nextRole)`: Returns `false` if `nextRole === "admin"` and `actorRole !== "admin"`.
     - Unit tests in `src/lib/marcom/guards.test.ts` (14 tests passed).
   - **API Endpoint Guarding (`src/app/api/admin/users/`):**
     - Hardened `route.ts` with `canAccessUserManagement(session.user.role)` (HTTP 403 otherwise).
     - Hardened `[id]/route.ts`:
       - `PATCH`: Enforces `canAccessUserManagement`, `canManageUserTarget` (blocks modifying admin accounts with 403), and `canAssignUserRole` (blocks promoting to admin with 403).
       - `DELETE`: Enforces `canAccessUserManagement` and `canManageUserTarget` (blocks deleting admin accounts with 403).
     - Verified with integration tests in `src/app/api/admin/users/adminUsersGuards.test.ts` (5 tests passed).
   - **UI Navigation & View Routing:**
     - `GlobalRail.tsx`: Authorized `users` nav item and `usePendingUsers` via `canAccessUserManagement` (240 LOC $\le 250$).
     - `ActiveViewStage.tsx`: Authorized mounting of `UsersView` via `canAccessUserManagement` (125 LOC $\le 250$).
     - `src/app/admin/users/page.tsx`: Updated redirect check using `canAccessUserManagement`.
   - **UsersView Component Protections:**
     - `UserRoleSelect.tsx`: Excludes `"admin"` option from dropdown when actor is `"supervisor"` and disables control when target is an admin.
     - `UsersActiveTab.tsx`: Disables deactivation button on admin accounts when actor is `"supervisor"`.
     - `UsersRejectedTab.tsx`: Disables reactivation and delete buttons on admin accounts when actor is `"supervisor"`.
     - `UsersView.tsx`: Passes session actor role to active and rejected tabs.
     - Verified with unit tests in `src/components/views/UsersView/userRoleSelect.test.ts` (3 tests passed).

2. **Global Rail Pending Users Notification Badge (ADR 12):**
   - **User Intent & Problem Statement:** Administrators had no ambient indication of new user registrations pending approval ("Menunggu Review") unless they navigated to `/?view=users`. Needed a small red dot badge displaying the exact pending count on the `Users` icon in `GlobalRail`.
   - **ADR 12 & Spec:** Authored ADR 12 (`docs/adr/0012-global-rail-pending-users-badge.md`), Design Spec (`docs/superpowers/specs/2026-11-02-global-rail-pending-users-badge-design.md`), and Plan (`docs/superpowers/plans/2026-11-02-global-rail-pending-users-badge.md`).
   - **Pure Logic Helpers (`src/lib/marcom/pendingUsersHelpers.ts`):**
     - `formatPendingBadgeCount`: Formats count, returns `null` for $\le 0$, caps at `"99+"`, and formats `1..99` as exact string.
     - `fetchPendingUsersCountApi`: Calls `/api/admin/users?status=PENDING&limit=1`, extracts `total`, and fails safe to `0` without throwing on non-200 or network issues.
     - 6 unit tests in `pendingUsersHelpers.test.ts` passing 100%.
   - **Zustand Data Slice Integration (`src/lib/store/slices/types.ts`, `createDataSlice.ts`):**
     - Added `pendingUsersCount: number` (initial 0) and `setPendingUsersCount: (count: number) => void`.
     - In `UsersView.tsx`: Connected `setPendingUsersCount(pData.total || 0)` whenever `fetchUsers` executes so approving/rejecting a user immediately decrements the badge in real time.
   - **Client Polling & Revalidation Hook (`src/lib/marcom/usePendingUsers.ts`):**
     - Only queries when `isAdmin: true` (0 calls for non-admins).
     - Fetches on mount, revalidates on window focus, and polls every 60s.
   - **Global Rail UI Presentation (`src/components/layout/GlobalRail.tsx`):**
     - Rendered small red dot badge (`bg-rose-500 text-white text-[9px] font-bold min-w-3.5 h-3.5 px-0.5 rounded-full ring-2 ring-[#0F1115] shadow-xs`) on top-right of the `Users` icon.
     - `GlobalRail.tsx` LOC: 239 LOC ($\le 250$ LOC coordinator limit). Added 5 tests in `GlobalRail.test.ts`.
   - **Verification Gates:**
     - `npm run drift:check`: Clean, 44 paired specs/plans.
     - `npm run lint`: `✔ No ESLint warnings or errors`.
     - `npm run test:smoke`: 96 passed, 0 failed.
     - `npm test`: 704 passed, 0 failures.
     - `npm run build:check`: 0 errors.
     - `npm run build`: Production Next.js build compiled successfully (31/31 routes).

2. **Production Build & ESLint Strict Invariant Resolution (Vercel Build Failure Fix):**
   - **Root Cause Evaluated:** Vercel deployment failed during `next build` -> `next lint` ("Linting and checking validity of types") due to strict ESLint `@typescript-eslint/no-unused-vars` errors and `react-hooks/exhaustive-deps` warnings across 8 files:
     - `DirectDriveUploadDropzone.tsx`: Unused import `CheckCircle2`.
     - `GoogleDriveUrlForm.tsx`: Unused import `Info`.
     - `ProjectsListTable.tsx`: Unused variable `isGroupFullySelected`.
     - `useProjectsBoard.ts`: Unused type import `MarcomWorkItemType` and unused destructuring `outlets, materials`.
     - `useProjectsList.ts`: Unused destructuring `outlets, materials`.
     - `MousView.tsx`: `handleStatusTransition` missing `useCallback` causing unnecessary re-creation in `columns = useMemo(...)`.
     - `OutletFormModal.tsx`: `suggestionSeed` in `useMemo` dependency array needed explicit referencing in expression `suggestionSeed >= 0 ? generateSuggestedOutletCode(selectedBranch?.code) : ""` to prevent unused/unnecessary dependency warning while satisfying unit test assertions.
     - `MarcomTableShell.tsx`: Pre-computed `searchKeysHash` hash string derived `resolvedKeys` directly in `useMemo` callback, resolving the missing `searchKeys` dependency warning without triggering unnecessary re-indexing on every render.
   - **Verification Gates:**
     - `npm run lint`: `✔ No ESLint warnings or errors` (0 errors, 0 warnings).
     - `npm run drift:check`: Clean, all architectural invariants pass.
     - `npm run test:smoke`: 94 passed, 0 failed.
     - `npm test`: 693 passed, 0 failures.
     - `npm run build:check`: `tsc --noEmit` exited 0 with no type errors.
     - `npm run build`: Production Next.js build compiled successfully, all 31/31 routes static/dynamic generated cleanly.

2. **Centralized Google Drive Storage System via Developer Refresh Token & Direct Resumable Uploads:**
   - **Evaluated Architectural Invariants & Root Cause:**
     - Client-side Google Picker forced every team member to sign in to personal Google accounts and consumed individual storage quotas.
     - Files with default "Restricted" permissions resulted in Google 403 errors on embedded iframes for other team members.
     - Google Cloud Service Accounts on standard `@gmail.com` accounts have 0 GB quota, failing with `403 Forbidden: Storage quota exceeded`.
     - Vercel serverless request ceiling is 4.5 MB, failing large video/footage uploads with HTTP 413.
   - **ADR 11 (`docs/adr/0011-centralized-google-drive-storage-refresh-token.md`):** Adopted Developer OAuth2 Refresh Token architecture with browser-to-Google Resumable Upload sessions (`https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable`).
   - **Domain SSOT Types (`src/types/index.ts`):** Added `DriveUploadSessionRequest`, `DriveUploadSessionResponse`, `DriveFinalizeRequest`, and `DriveFinalizeResponse`.
   - **One-Time Developer CLI Helper (`scripts/get-drive-refresh-token.ts`, `npm run drive:token`):** Built standalone local tool using Node `http` to generate developer OAuth2 refresh token once with scope `https://www.googleapis.com/auth/drive.file`.
   - **Pure Logic Modules & 100% Test Coverage (TDD):**
     - `driveTokenHelpers.ts` + `driveTokenHelpers.test.ts`: 6 unit tests covering URLSearchParams formatting, Google OAuth response parsing, and token expiration calculations.
     - `driveUploadHelpers.ts` + `driveUploadHelpers.test.ts`: 7 unit tests covering Google resumable upload headers (`X-Upload-Content-Type`, `X-Upload-Content-Length`), Location header extraction, file name sanitization, and canonical `TaskAttachment` formatting.
   - **Server-Side Token Manager (`src/lib/server/driveAuth.ts`):** Lightweight in-memory access token cache with automatic renewal before expiration.
   - **Backend API Routes (`/api/marcom/drive/`):**
     - `upload-session/route.ts`: Validates NextAuth session and initiates a Google Drive resumable session targeting `NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID`.
     - `finalize/route.ts`: Automates public read permission (`role: "reader", type: "anyone"`) on the uploaded file ID so all team members can preview videos/documents without authentication blocks.
   - **Client Streaming Hook & UI Components:**
     - `useDirectDriveUpload.ts`: Two-step client lifecycle managing chunked browser-to-Google upload via `XMLHttpRequest` with upload progress events and cancellation.
     - `DirectDriveUploadDropzone.tsx`: Drag-and-drop zone with live percentage progress bar, cancel action, and error recovery.
     - `GoogleDriveLinkModal.tsx`: Upgraded modal with segmented tabs for direct cloud upload vs manual link pasting via `GoogleDriveUrlForm.tsx`.
   - **Verification Gates:** `npm run drift:check` (clean, 43 paired specs/plans), `npm run build:check` (0 errors), `npm run test:smoke` (94 passed, 0 failed), `npm test` (693 passed, 0 failures), all coordinator files strictly $\le 250$ LOC.

1. **Workspace Return Target Resolver & LocalStorage Sanitization (`layoutHierarchyHelpers.ts`, `TopNavBreadcrumbs.tsx`, `useWorkspaceStore.ts`, `createUiSlice.ts`):**
   - **Root Cause Evaluated:** Before Global Views were isolated, visiting `view=profile` saved `"profile"` into `lastTaskView` in client `localStorage` (`vrelloup-workspace-storage`). Consequently, clicking the shortcut button "Kembali ke Workspace" on `users` (or rehydrating from storage) navigated to the Profile page rather than an actual operational workspace view.
   - **Pure Helper `resolveWorkspaceReturnTarget` (`layoutHierarchyHelpers.ts`):** Built fail-safe resolver ensuring return target is strictly an operational workspace view (`board`, `list`, `calendar` or active Marcom view), and rejected any global account views (`profile`, `users`). Added 6 unit tests in `layoutHierarchyHelpers.test.ts` (19 tests total passing).
   - **Strict Whitelist in UI Slice (`createUiSlice.ts`):** Restricted `lastTaskView` mutations strictly to `isWorkItem` (`board`, `list`, `calendar`). Global views (`profile`, `users`) can never pollute `lastTaskView`.
   - **Storage Rehydration Sanitizer (`useWorkspaceStore.ts`):** Added auto-cleanup in `onRehydrateStorage` resetting any persisted `"profile"` or `"users"` values in `lastTaskView` and `lastMarcomView` back to `"board"` and `"events"`.
   - **TopNav Return Integration (`TopNavBreadcrumbs.tsx`):** Connected "Kembali ke Workspace" button to `resolveWorkspaceReturnTarget`, ensuring `appMode` and `activeView` are correctly restored together with instant toast feedback.
   - **Verification Gates:** `npm run drift:check` (clean, 42 paired specs/plans), `npm run build:check` (0 errors), `npm run test:smoke` (92 passed, 0 failed), `npm test` (680 passed, 0 failures), all coordinator files strictly $\le 250$ LOC.

2. **User Management Global View Layout Isolation (`layoutHierarchyHelpers.ts`, `layoutHierarchyHelpers.test.ts`):**
   - **Root Cause Evaluated:** While ADR 07 unified User Management into the SPA stage, navigating to `users` still rendered the 240px operational `Sidebar` (showing Projects/Marcom menu items). This squeezed table column widths and introduced cognitive clutter for administrators.
   - **ADR 10 & Spec:** Authored ADR 10 (`docs/adr/0010-user-management-global-view-layout-isolation.md`) and Design Spec (`docs/superpowers/specs/2026-11-01-user-management-global-layout-design.md`) extending Global Account View layout isolation to User Management (`users`).
   - **Pure Helper Refactoring (`layoutHierarchyHelpers.ts`):** Updated `shouldRenderSidebar` to evaluate `GLOBAL_ACCOUNT_VIEWS.has(activeView)`, suppressing `Sidebar.tsx` for both `profile` and `users`. Updated unit tests in `layoutHierarchyHelpers.test.ts` (13 passing tests).
   - **Widescreen Table Ergonomics:** `UsersView` expands across the full remaining viewport width, eliminating horizontal scrollbars for user approvals, RBAC role selectors, and assigned branch chips.
   - **Verification Gates:** `npm run drift:check` (clean, 42 paired specs/plans), `npm run build:check` (0 errors), `npm run test:smoke` (92 passed, 0 failed), `npm test` (674 passed, 0 failures), all coordinator files strictly $\le 250$ LOC.

2. **Global View Layout Isolation & Profile Hierarchy (`layoutHierarchyHelpers.ts`, `Sidebar.tsx`, `TopNav.tsx`, `TopNavBreadcrumbs.tsx`, `createUiSlice.ts`):**
   - **Root Cause Evaluated:** Placing `profile` in `appMode: "tasks"` by default caused `TopNavBreadcrumbs` to render `Vrello / Projects / profile`, leaking the task filter bar (`ProjectsFilterBar`) into the profile view and cluttering the stage with the 240px operational `Sidebar`.
   - **ADR 09 & Spec:** Authored ADR 09 (`docs/adr/0009-global-view-layout-isolation-and-profile-hierarchy.md`) and Design Spec (`docs/superpowers/specs/2026-11-01-profile-layout-hierarchy-design.md`) establishing clear bifurcation between Operational Views and Global Account Views.
   - **Pure Helpers Module (`layoutHierarchyHelpers.ts`):** Defined `WORK_ITEM_VIEWS` and `GLOBAL_ACCOUNT_VIEWS`. Implemented `shouldRenderSidebar`, `shouldRenderProjectsFilterBar`, and `getGlobalBreadcrumbInfo`. Added 12 unit tests in `layoutHierarchyHelpers.test.ts` (100% pass).
   - **Sidebar Unmount on Profile (`Sidebar.tsx`):** Conditionally returned `null` when `!shouldRenderSidebar(activeView)`, freeing 240px of screen width for a clean, full-stage profile experience while keeping `GlobalRail` (52px) persistently visible.
   - **TopNav Filter Bar Gating (`TopNav.tsx`):** Restricted `ProjectsFilterBar` strictly to task work items (`board`, `list`, `calendar`) via `shouldRenderProjectsFilterBar`.
   - **Direct Root Breadcrumb (`TopNavBreadcrumbs.tsx`):** Rendered `Vrello / Profil & Keamanan Akun` directly after root brand anchor with `User` icon and added an accessible "Kembali ke Workspace" shortcut button.
   - **UI Slice State Preservation (`createUiSlice.ts`):** Prevented `setActiveView("profile")` from overwriting `lastTaskView` or `lastMarcomView`.
   - **Verification Gates:** `npm run drift:check` (clean, 41 paired specs/plans), `npm run build:check` (0 errors), `npm run test:smoke` (92 passed, 0 failed), `npm test` (673 passed, 0 failures), all coordinator files strictly $\le 250$ LOC (`Sidebar`: 187, `TopNavBreadcrumbs`: 175, `TopNav`: 151).

2. **Dedicated User Profile Workspace View (`ProfileView.tsx`, `ProfileHeader.tsx`, `ProfileAvatarUploader.tsx`, `ProfileAccessCard.tsx`, `ProfileSecurityCard.tsx`, `/api/user/profile`, `profileValidators.ts`, `profileHelpers.ts`):**
   - **User Intent & Problem Statement:** Credentials users (email & password) had no self-service mechanism to change their display name, upload/change profile avatar, or update their account password. While Google OAuth users have profiles hydrated from Google, standard accounts had no profile management screen or API.
   - **Architecture & ADR 08:** Authored ADR 08 (`docs/adr/0008-dedicated-user-profile-workspace-view.md`) and Design Spec (`docs/superpowers/specs/2026-11-01-user-profile-view-design.md`) establishing Option 1 (Dedicated Workspace View `activeView: "profile"`).
   - **SSOT Domain Types (`src/types/index.ts`):** Added `"profile"` to `ViewMode` union, and declared `UserProfileResponse` and `UpdateProfilePayload` interfaces.
   - **URL Routing & Navigation (`urlState.ts`, `src/app/profile/page.tsx`, `UserMenuDropdown.tsx`):** Registered `"profile"` in `VALID_VIEW_MODES` and `urlState.ts`. Built Next.js redirection page at `/profile/page.tsx` redirecting to `/?view=profile` (and unauthenticated users to `/login`). Added "Lihat Profil & Akun" action trigger with `UserIcon` to `UserMenuDropdown.tsx` (120 LOC $\le 250$ LOC).
   - **Backend Security & API Route (`profileValidators.ts`, `/api/user/profile/route.ts`):**
     - Implemented `updateProfileSchema` in `profileValidators.ts` (Zod validation for name 2-80 chars, URL/data URI avatar, password length $\ge 8$, and matching confirmation). 8 unit tests in `profileValidators.test.ts` passing.
     - Implemented `GET` and `PATCH` endpoints in `src/app/api/user/profile/route.ts` with NextAuth session scoping.
     - Enforced Google Account protection (blocks password change for Google accounts), verified existing passwords via bcrypt comparison, hashed new passwords (cost factor 12), and mapped nullable avatar to Prisma `String @default("")`.
   - **Pure UI Helpers (`profileHelpers.ts`):** Implemented `formatBranchBadges`, `validatePasswordForm`, and `sanitizeAvatarUrl` with 10 unit tests in `profileHelpers.test.ts` passing.
   - **Atomic Components & Coordinator (`ProfileView/`):**
     - `ProfileHeader.tsx`: 73 LOC. Workspace view header with icon, title, subtitle, and account badge (`Google Verified` vs `Credentials Account`).
     - `ProfileAvatarUploader.tsx`: 196 LOC. `<AppImage />` preview with fallback initials, client-side Canvas compression to WebP ($\le 400\times 400$), URL input, and avatar removal.
     - `ProfileAccessCard.tsx`: 68 LOC. Displays RBAC role badge, registration date, and assigned branch chips. Extracted to protect coordinator size.
     - `ProfileSecurityCard.tsx`: 144 LOC. Google Identity shield card for OAuth users or password change form with show/hide password toggles for Credentials users.
     - `ProfileView.tsx`: 218 LOC ($\le 250$ LOC). Responsive two-column coordinator with Zustand store sync (`syncSessionUser`), data mutation handling, and toast feedback.
     - Mounted dynamically in `ActiveViewStage.tsx` (`case "profile":`).
   - **Verification Gates:** `npm run drift:check` (clean, 40 paired specs/plans), `npm run build:check` (0 errors), `npm run test:smoke` (91 passed, 0 failed), `npm test` (661 passed, 0 failures), all coordinator files strictly $\le 250$ LOC.

2. **Session RBAC & Permissions Synchronization across All 7 Views (`permissions.ts`, `permissionsHelpers.ts`, `auth.ts`, `auth.config.ts`, `next-auth.d.ts`, `TopNav.tsx`, `createDataSlice.ts`):**
   - **Root Cause Evaluated:** All "+ Add / New / Upload" buttons across 7 core pages (Media Placements, Field Events, MOU, Branches, Outlets, Equipment Inventory, Documents) were conditionally gated by `useMarcomPermissions()`. Previously, `useMarcomPermissions()` resolved roles against a static mock array `const members = SEED_USERS` (`user-1` to `user-5`). When a user logged in with a real database account (e.g. `user-admin` or Google OAuth), their ID was not in `SEED_USERS`, causing `resolveMarcomRole` to fail closed to `"viewer"`. As a `"viewer"`, all create and manage permissions were revoked, making Add buttons vanish across the site.
   - **NextAuth Token & Session Claims Hydration:** Added `assignedBranchIds?: string[]` to `Session["user"]`, `User`, and `JWT` in `src/types/next-auth.d.ts`. Updated `resolveJwtClaims` in `src/lib/server/auth-helpers.ts` to propagate branch assignments, updated Credentials `authorize()` and `jwt()` callback in `src/auth.ts`, and updated `session()` callback in `src/auth.config.ts`. Added test cases in `src/lib/server/auth-helpers.test.ts` (19/19 passing).
   - **Pure Helper Module (`permissionsHelpers.ts`):** Implemented `normalizeMarcomRole` with case-insensitive trimming and fail-closed validation, and `resolveEffectivePermissionsUser` prioritizing active `session.user` over fallback store users with automatic branch scope extraction. Created comprehensive unit test suite in `src/lib/marcom/permissionsHelpers.test.ts` (8 passing tests).
   - **Hook Integration (`permissions.ts`):** Connected `useMarcomPermissions()` to `useSession()` from `next-auth/react`. Evaluates permissions dynamically for the authenticated user while providing resilient fallback to Zustand store for SSR, offline, and unit tests.
   - **Zustand Store Parity:** Added `syncSessionUser` action in `createDataSlice.ts` and called it in `TopNav.tsx` to keep Zustand's active user roster synchronized with real NextAuth session users.
   - **Verification Gates:** `npm run drift:check` (clean, 39 paired specs/plans), `npm run build:check` (0 TypeScript errors), `npm run test:smoke` (89 passed, 0 failed), `npm test` (643 passed, 0 failures), all coordinator files strictly $\le 250$ LOC.

2. **Unified Projects Work Item Creation via Original Marcom Hub Forms:**
   - **Root Cause Evaluated:** Quick creation triggers in Projects views (`useProjectsCalendar.handleCreateType`, `useProjectsBoard.handleQuickCreate`, `useProjectsList.handleQuickAddInGroup`) performed blind, minimal POST mutations with hardcoded dummy titles and invalid states (such as `status: "PLANNED"` on placements, which failed with HTTP 400). Placements bypassed the required 4-step wizard (outlet, material, geofence, photos) and field events bypassed logistics checklists.
   - **Pure Helpers Module (`createModalHelpers.ts`):** Implemented `sanitizeDateInput` with ISO date fallback, `resolveInitialStatus` mapping target board columns to valid entity statuses, and `getInitialPlacementPayload` enforcing state machine invariants (`NOT_STARTED` default). Added comprehensive unit tests in `createModalHelpers.test.ts` (6 passing tests).
   - **Modal Host Component (`ProjectsCreateModalHost.tsx`):** Built coordinator ($\le 250$ LOC, 238 LOC) mirroring `ProjectsDetailDrawerHost.tsx`. Dynamically imports `ContentPostModal`, `EventFormModal`, and `PlacementFormModal` via `next/dynamic` (`ssr: false`), wires Zustand data stores (`branches`, `outlets`, `materials`, `mous`, `placements`, `members`), handles submission and cache invalidation (`fetchPosts`, `fetchEvents`, `fetchPlacements`), and integrates with `GoogleDriveLinkModal`.
   - **Calendar Integration (`ProjectsCalendarView.tsx`, `useProjectsCalendar.ts`):** Connected `CalendarCreatePopover` to trigger `ProjectsCreateModalHost` pre-filled with the selected calendar cell date. Removed legacy dummy creation endpoint calls.
   - **Board Integration & Deconstruction (`ProjectsBoardView.tsx`, `ProjectsBoardColumn.tsx`, `useProjectsBoard.ts`):** Replaced inline title text form in `ProjectsBoardColumn.tsx` with a type picker trigger menu (`Content Post`, `Field Event`, `Media Placement`), saving ~33 LOC and bringing `ProjectsBoardColumn.tsx` safely down to 234 LOC ($\le 250$ LOC). Connected `ProjectsBoardView.tsx` with column status mapping and mounted `ProjectsCreateModalHost`.
   - **List View Integration (`ProjectsListView.tsx`, `ProjectsListHeader.tsx`, `ProjectsListTable.tsx`, `useProjectsList.ts`):** Added "+ New Item" trigger with type selector menu in `ProjectsListHeader.tsx` and group row actions in `ProjectsListTable.tsx`. Mounted `ProjectsCreateModalHost` in `ProjectsListView.tsx` and removed defunct `handleQuickAddInGroup`.
   - **Verification Gates:** `npm run drift:check` (clean, 0 drift), `npm run build:check` (0 errors), `npm run test:smoke` (88 passed, 0 failed), `npm test` (635 passed, 0 failures), all coordinator files strictly $\le 250$ LOC (`ProjectsCreateModalHost`: 238, `ProjectsBoardColumn`: 234, `ProjectsBoardView`: 199, `ProjectsCalendarView`: 154, `ProjectsListView`: 118).

2. **Core Web Vitals Next.js Image Optimization (`AppImage.tsx`, `appImageHelpers.ts`, `next.config.ts`, 16 components):**
   - **Root Cause Evaluated:** 22 raw `<img>` instances across 16 components lacked layout sizing, leading to Cumulative Layout Shift (CLS) on high-latency field connections, excessive bandwidth consumption without modern WebP/AVIF compression or responsive srcset downscaling, and Next.js compiler warnings under `@next/next/no-img-element`.
   - **Remote Host Whitelist (`next.config.ts`):** Configured `images.remotePatterns` for `images.unsplash.com`, `lh3.googleusercontent.com`, `*.googleusercontent.com`, and `*.supabase.co`.
   - **Pure Layout Helpers (`appImageHelpers.ts`):** Created `shouldBypassOptimization` for `blob:`, `data:`, SVG, and empty URLs to prevent runtime crashes during client-side photo picking. Added `resolveImageSizes` mapping presets (`avatar`: 36px, `thumbnail`: 64px/96px, `card`: 100vw/50vw/33vw, `lightbox`: 100vw/1200px, `full`: 100vw). Comprehensive unit test suite in `appImageHelpers.test.ts` (8 tests passing).
   - **Resilient Primitive (`AppImage.tsx`):** Built `<AppImage />` with automatic aspect ratio geometry (eliminating CLS), `sizes` optimization, automatic unoptimized bypass for blob/data URLs, and graceful placeholder error recovery.
   - **Full Codebase Migration (22 instances across 16 components):** Migrated `TopNav.tsx`, `UserMenuDropdown.tsx`, `UsersActiveTab.tsx`, `UsersPendingTab.tsx`, `UsersRejectedTab.tsx`, `OutletApprovalQueueTab.tsx` (2x), `Outlet360Drawer.tsx` (2x), `SubmitDraftOutletModal.tsx`, `PlacementPhotoUploader.tsx` (2x), `PlacementPhotoGallery.tsx` (3x), `EventTableView.tsx`, `EventCardsView.tsx`, `MouDocumentViewerModal.tsx`, `DocumentPreviewModal.tsx`, `ContentDrawer.tsx`, `ContentPlannerView.tsx` (2x), `ProjectsWorkItemCard.tsx`.
   - Gates: `npm run lint` (0 `@next/next/no-img-element` warnings), `npm run build:check` (0 errors), `npm run test:smoke` (87 passed, 0 failed), `npm test` (629 passed, 0 failures), `npm run build` (all 27/27 pages compiled), `npm run drift:check` (clean).

2. **TopNav Avatar & Profile Session Synchronization (`TopNav.tsx`, `UserMenuDropdown.tsx`, `userProfileHelpers.ts`, `userProfileHelpers.test.ts`):**
   - **Root Cause Evaluated:** TopNav avatar button derived initials exclusively from Zustand store `me = users.find(u => u.id === currentUserId) ?? users[0]`, which defaulted to `"user-1"` (`Alex Rivera` -> `"AR"`), completely ignoring authenticated NextAuth session data (`session.user`). TopNav trigger button also lacked profile image (`<img>`) rendering support, and `currentUserId` in Zustand was not synchronized with `session.user.id`.
   - **Pure Helper Module (`userProfileHelpers.ts`):** Implemented `getInitials(name, email)` with robust edge-case handling (multi-word, single-word, extra whitespace, email initial fallback, safe defaults) and `getEffectiveProfile({ sessionUser, fallbackUser })` prioritizing `sessionUser` properties (`name`, `email`, `image`, `role`, `initials`, `isAuthenticated`). Created comprehensive unit test suite in `userProfileHelpers.test.ts` (9 tests passing).
   - **TopNav Integration (`TopNav.tsx`):** Consumed `getEffectiveProfile`, rendered `profile.image` with `imageError` fallback to `profile.initials`, rendered active emerald presence dot when `isAuthenticated: true`, and added `useEffect` synchronizing `session.user.id` to `useWorkspaceStore.currentUserId`.
   - **UserMenuDropdown Parity (`UserMenuDropdown.tsx`):** Unified profile card resolution using `getEffectiveProfile({ sessionUser: session?.user })` with `imageError` fallback, ensuring 100% visual and data parity with TopNav trigger button.
   - Gates: `npm run build:check` (0 errors), `npm run drift:check` (clean), `npm run test:smoke` (86 passed), `npm test` (621 passed, 0 failures), coordinator LOC strictly $\le 250$ (`TopNav.tsx`: 135 LOC, `UserMenuDropdown.tsx`: 99 LOC).

2. **Default Light Theme on First Visit (`src/app/layout.tsx`):**
   - **Evaluated Prior Behavior:** `<ThemeProvider>` in `src/app/layout.tsx` had `defaultTheme="dark"` and `enableSystem={true}`. In `next-themes`, when `defaultTheme="dark"`, any initial visit where `localStorage.getItem("theme")` was null defaulted to `"dark"`, bypassing the client device OS `prefers-color-scheme` and always forcing dark mode.
   - **Configured Deterministic Light Theme Default:** Changed `defaultTheme="light"` and set `enableSystem={false}`. First-time visitors and devices with no stored theme preference open in light theme.
   - **Preserved User Overrides:** User manual theme toggle actions (`ThemeToggle`, `SettingsModal`, `MoreAppsMenu`, `CommandPalette`) continue persisting to `localStorage` under key `"theme"` seamlessly.
   - Gates: `npm run build:check` (0 errors), `npm run drift:check` (clean), `npm run test:smoke` (85 passed), `npm test` (612 passed, 0 failures).

1. **Vercel-Supabase Authentication & Production Database Connectivity Fix (`src/lib/db.ts`, `src/auth.ts`, `src/components/auth/LoginForm.tsx`):**
   - **Root Cause Evaluated:** Integration between Supabase and Vercel automatically exposes `POSTGRES_PRISMA_URL` and `POSTGRES_URL`, but does not populate `DATABASE_URL` or `DIRECT_URL`. Previously, `src/lib/db.ts` only read `process.env.DATABASE_URL`, causing `new PrismaClient()` in Vercel serverless environment to fail on query execution (`Environment variable not found: DATABASE_URL`). Auth.js caught this unhandled database error and redirected to `?error=Configuration`. In turn, `LoginForm.tsx` caught this error and defaulted to showing `"Email atau password tidak sesuai."`, misdiagnosing a database connectivity failure as invalid credentials.
   - **Resilient Fallback Support:** Updated `src/lib/db.ts` to automatically read `process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL`, and synchronize `process.env.DATABASE_URL` and `process.env.DIRECT_URL` (from `POSTGRES_URL_NON_POOLING`) for Prisma engine internals.
   - **Detailed Logging in `src/auth.ts`:** Wrapped `prisma.user.findUnique` in `authorize()` with explicit error logging so future connection failures are visible in Vercel runtime logs. Made `lastLoginAt` updates resilient so write contention never aborts an approved sign-in.
   - **Accurate User Feedback in `LoginForm.tsx`:** Updated error handling to distinguish between server configuration/database connection failure (`error === "Configuration"`) and invalid credentials (`error === "CredentialsSignin"`).
   - Gates: `npm run build:check` (0 errors), `npm run lint` (0 errors), `npm run build` (27/27 static/dynamic pages compiled), `npm run drift:check` (clean), `npm run test:smoke` (85 passed), `npm test` (612 passed, 0 failures). Local live Supabase authentication verified via curl (`HTTP/1.1 302 Found`, session-token issued).

1. **CustomDropdown Sitewide Z-Index, Stacking Context & Responsive Placement Fix (`CustomDropdown.tsx`, `customDropdownHelpers.ts`, Sitewide Headers & Toolbars):**
   - **Root Cause Evaluated:** Header containers with `backdrop-filter: blur(...)` (`backdrop-blur-sm`) create a CSS stacking context. When headers lacked explicit `relative z-20`, their stacking context fell below subsequent stage content containing positioned elements (`sticky top-0 z-20` on `MarcomTableShell` headers and `relative` row cells), causing the table headers and table rows to paint directly ON TOP of opened dropdown menus (as seen in the user's screenshot).
   - **CustomDropdown Root & Popover Stacking Elevation:** Updated `CustomDropdown.tsx` so the root wrapper div dynamically elevates to `z-30` (`isOpen ? "z-30" : "z-auto"`) when opened, preventing sibling controls in the same row from overlapping. Popover menu styled with solid `bg-white dark:bg-slate-900` (eliminating transparency bleed) and deep `shadow-2xl`.
   - **Responsive Viewport Collision Detection:** Added `computeDropdownPlacement` helper in `customDropdownHelpers.ts` with comprehensive unit test suite in `CustomDropdown.test.ts` (12 tests passed). Automatically detects viewport boundaries to flip direction upwards (`bottom-full mb-1 origin-bottom`) when space below < 240px and right-aligns (`right-0 left-auto`) when space to right < 220px. Added explicit `direction="up"` support for bottom-anchored bars (`PlacementBulkActionBar`, `ProjectsBulkActionBar`, and `MarcomTableShell` pagination).
   - **Sitewide Stacking Context Normalization:** Added `relative z-20` across all 11 unified view headers and filter bars sitewide (`MousHeader`, `OutletsHeader`, `BranchesHeader`, `AnalyticsHeader`, `InventoryHeaderKpis`, `ReportsHeader`, `DocumentsHeader`, `PlacementsHeader`, `EventsHeader`, `ContentPlannerHeader`, `UsersHeader`, `PipelineView` header, `PipelineFilterBar`, `ProjectsFilterBar`, `QuarterlyRecapTab`, `QuarterlyPosmReportTab`, `OutletApprovalQueueTab`, `OutletMapView`, and `EventsTimelineView`).
   - Gates: `npm run build:check` (0 errors), `npm run drift:check` (clean), `npm run test:smoke` (85 passed), `npm test` (612 passed, 0 failures).

2. **Supabase Cloud PostgreSQL Migration, Schema Synchronization & Seeding (`prisma/schema.prisma`, `.env.local`, `.env`):**
   - **Project Integration:** Connected project `kkstcawepmqenghaqxzt` in region `aws-0-ap-southeast-1`.
   - **Dual-URL Invariant:** Configured `directUrl = env("DIRECT_URL")` in `prisma/schema.prisma` datasource. Set `DATABASE_URL` to transaction pooler (`aws-0-ap-southeast-1.pooler.supabase.com:6543?pgbouncer=true`) and `DIRECT_URL` to direct connection (`aws-0-ap-southeast-1.pooler.supabase.com:5432`).
   - **URI Encoding Handling:** URL-encoded leading `@` in database password (`%40...`) to prevent connection URI host delimiter corruption.
   - **Environment Variables Sync:** Added `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`.
   - **Schema & Data Migration:** Successfully executed `npx prisma db push` synchronizing all 14 models and relations, followed by `npx tsx prisma/seed.ts` populating standard master data (7 users, 12 branches, 10 outlets, 7 materials, 6 MOUs, 6 placements, 13 inventory items, 4 events, 4 content posts, 4 documents).
   - Gates: Direct Node query verified (`status: 'CONNECTED_SUCCESSFULLY'`), `npm run build:check` (0 errors), `npm run drift:check` (clean), `npm run test:smoke` (85 passed), `npm test` (612 passed, 0 failures).

3. **Production Build & ESLint Strict Cleanup (`next lint` & `next build`):**
   - **Issue Triaged:** Vercel / local `npm run build` failed during Next.js compile step due to strict TypeScript ESLint rules (`@typescript-eslint/no-unused-vars` and `@typescript-eslint/no-explicit-any`).
   - **Unused Imports & Variables Removed:** Cleaned up orphaned imports and variables across 28 components/routes resulting from previous atomic header extractions and dropdown standardizations (`ContentPlannerView`, `EventsView`, `DocumentsView`, `OutletsView`, `ReportsView`, `ProjectsFilterBar`, `BorrowDetailModal`, `DropLineIndicator`, etc.).
   - **Explicit Types & Elimination of `any`:** Replaced all `any` usages in inventory borrow endpoints and `auth-helpers.test.ts` with strict typed interfaces (`RawBorrowRecord`, `Parameters<HandleGoogleSignInParams[...]>[0]`).
   - Gates: `npm run lint` (0 errors), `npm run build` (compiled and generated all 27 static/dynamic pages with 0 errors), `npm run drift:check` (clean), `npm run test:smoke` (85 passed), `npm test` (612 passed, 0 failures).

4. **Next.js Security Patch Upgrade (`15.2.0` -> `15.2.9` for CVE-2025-66478):**
   - **Issue Triaged:** Vercel security gate blocked deployment post-build with `Build Failed: Vulnerable version of Next.js detected, please update immediately (CVE-2025-66478)`.
   - **Patch Upgrade:** Upgraded `next` and `eslint-config-next` to `15.2.9` (the official patched security release in the 15.2.x series, zero breaking changes).
   - **Callback Narrowing Fix:** Fixed closure variable narrowing in `auth-helpers.test.ts` via object capture pattern (`captured.data`).
   - Gates: `npm run build:check` (0 errors), `npm run lint` (0 errors), `npm run build` (27/27 pages compiled), `npm run drift:check` (clean), `npm run test:smoke` (85 passed), `npm test` (612 passed, 0 failures).

2. **MOU Table Rows UI Redesign & Entity Consolidation (`mouColumns.tsx`, `MarcomTableShell.tsx`, `placementColumns.tsx`):**
   - Consolidated standalone `Partner` (190px) and `Outlet` (170px) columns into a single unified `Partner & Outlet` column (220px), saving ~170px of horizontal table width.
   - Formatted two-line entity cell with primary partner title (filtering table on click) and secondary outlet link with store icon (jumping to Outlets view on click).
   - Replaced redundant stacked `"No period set"` and `"No expiry"` badges in Validity column with a clean, subtle `—` when no dates are configured.
   - Replaced harsh fuchsia styling on MOU document buttons with neutral glassmorphic backdrop-blur chips (`bg-slate-100/80 dark:bg-slate-800/60`, border `border-slate-200/80 dark:border-slate-700/60`), subtle Drive/file icons (`FileText`, `ExternalLink`), and clean preview modal triggers.
   - Formatted `Type` column replacing raw database enum underscores with clean spaces.
   - Implemented right-aligned (`text-right font-medium tabular-nums`) financial currency formatting for `Value` column in `mouColumns.tsx` and normalized header right-alignment in `MarcomTableShell.tsx` via `meta: { align: "right" }`.
   - Gates: `npm run build:check` (0 errors), `npm run drift:check` (clean), `npm run test:smoke` (85 passed), `npm test` (612 passed, 0 failures).

2. **User Management Unified Header Component (`UsersHeader.tsx`, `UsersView.tsx`, `usersFilterHelpers.ts`):**
   - Extracted `src/components/views/UsersView/UsersHeader.tsx` (198 LOC), standardizing User Management view with `MousHeader`, `OutletsHeader`, and `DocumentsHeader`.
   - Title Row: Icon (`Users` indigo-500), Title ("Manajemen Pengguna"), Counter badge (`totalUsers` Pengguna), Alert badge (`counts.pending` Perlu Review), Subtitle, and Refresh button (`RefreshCw`).
   - Controls & Navigation Row: Segmented tab buttons with Framer Motion fluid sliding pill animation (`layoutId="activeUsersTabPill"`, spring dynamics `stiffness: 450, damping: 35`, `whileTap={{ scale: 0.95 }}`, and `useReducedMotion()`) and real-time quick search input with clear button.
   - KPI Row: Embedded 4 `KpiSummaryCards` (Total Pengguna, Menunggu Review, Pengguna Aktif, Akun Ditolak/Nonaktif) with direct interactive click navigation to tabs.
   - Created pure filtering helper `filterUsers` in `usersFilterHelpers.ts` with unit test suite in `usersFilterHelpers.test.ts` (5 passed).
   - Refactored coordinator `UsersView.tsx` from 187 down to 123 LOC and applied full-bleed stage layout `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto`.
   - Gates: `npm run build:check` (0 errors), `npm run drift:check` (clean), `npm run test:smoke` (85 passed), `npm test` (608 passed, 0 failures).

2. **MOUs & Partnerships Unified Header Component (`MousHeader.tsx`, `MousView.tsx`):**
   - Extracted `src/components/views/MousView/MousHeader.tsx` (186 LOC), standardizing MOUs view with `OutletsHeader`, `DocumentsHeader`, and `PlacementsHeader`.
   - Title Row: Icon (`FileText`), Title ("MOUs & Partnerships"), Counter badge (`totalMous`), Subtitle, Refresh button (`RefreshCw`), Export button (`Download` -> `ExportCenter`), and "+ New MOU" button (`Plus`, conditional on `canCreate`).
   - Controls & Filter Row: Quick Search input with clear button, Status Chips with Framer Motion sliding pill animation (`layoutId="activeMouStatusPill"`, spring dynamics `stiffness: 450, damping: 35`, `whileTap={{ scale: 0.95 }}`, and `useReducedMotion()`), searchable Branch and MOU Type `CustomDropdown` selectors, Urgency chips (`Expiring Soon`, `Expired`), and dynamic Reset Filters link.
   - KPI Row: `KpiSummaryCards` embedded directly within `MousHeader` beneath the controls row for zero layout shifting.
   - Refactored `MousView.tsx` (reduced from 417 to 348 LOC) consuming `MousHeader` and configuring `MarcomTableShell` with `noPadding` and `hideHeader`.
   - Gates: `npm run build:check` (0 errors), `npm run drift:check` (clean), `npm run test:smoke` (84 passed), `npm test` (603 passed, 0 failures).

2. **Workspace Shell Integration for User Management (ADR 07):**
   - Added `"users"` to SSOT `ViewMode` union in `src/types/index.ts` and `VALID_VIEWS` in `src/lib/router/urlState.ts`.
   - Updated `src/components/views/ActiveViewStage.tsx` with dynamic lazy import of `<UsersView />` guarded by `isAdmin`.
   - Updated `UsersView.tsx` with self-hydrating session defaults and removed redundant page back-link.
   - Updated `GlobalRail.tsx` to set `activeView: "users"` and display active state (`isActive: activeView === "users"`) with 0ms transition.
   - Replaced `/admin/users/page.tsx` with a clean 307 server redirect to `/?view=users`.
   - Gates: `npm run build:check` (0 errors), `npm run drift:check` (clean), `npm run test:smoke` (84 passed), `npm test` (603 passed, 0 failures).

2. **Supervisor Role & Scoped Area Permissions (`guards.ts` & full stack):**
   - Added `"supervisor"` to `UserRole` SSOT in `src/types/index.ts` and `assignedBranchIds?: string[]` to `AppUser`.
   - Added `SUPERVISOR` to `DbUserRole` enum and `assignedBranchIds String[] @default([])` to `model User` in `prisma/schema.prisma` (`prisma db push` + `prisma generate` synchronized).
   - Updated `normalizeRole` in `src/lib/server/auth-helpers.ts` and `roleToDbRole` in `/api/admin/users/[id]` with `assignedBranchIds` persistence.
   - Updated `src/lib/marcom/guards.ts` allowing Supervisor full operational authority (approving MoUs, Outlets, Equipment Borrows, deleting MoUs/documents) strictly bounded by assigned branch boundaries (`assignedBranchIds`), while strictly preventing access to `MANAGE_MASTER_DATA` and user administration.
   - Updated `UserRoleSelect.tsx` with Supervisor option and `UserMenuDropdown.tsx` with dedicated amber role badge.
   - Gates: `npm run build:check` (0 errors), `npm run drift:check` (clean), `npm run test:smoke` (84 passed), `npm test` (602 passed, 0 failures).

1. **Sitewide Active Pills Animation Upgrade (`framer-motion`):**
   - Implemented spring-animated sliding background pills using `motion.div layoutId="..."` across 10 components sitewide.
   - Configured high-performance physics: `type: "spring" as const, stiffness: 450, damping: 35` with tactile micro-interactions (`whileTap={{ scale: 0.95 }}`).
   - Added full accessibility support via `useReducedMotion()` gracefully disabling animations if the user prefers reduced motion.
   - Preserved text clarity and contrast with `relative z-10` on labels and icons.
   - Verified 10 targeted locations:
     1. `DocumentsHeader.tsx`: Cards / Table view switcher (`activeDocumentsViewPill`) & Category filter chips (`activeDocumentsCategoryPill`)
     2. `OutletsHeader.tsx`: Table / Map / Approval view switcher (`activeOutletsViewPill`)
     3. `ReportsHeader.tsx`: Monthly / Quarterly tab switcher (`activeReportsTabPill`)
     4. `InventoryHeaderKpis.tsx`: Catalog / Borrowing tab switcher (`activeInventoryTabPill`), Catalog view switcher (`activeInventoryCatalogViewPill`), Borrow view switcher (`activeInventoryBorrowViewPill`)
     5. `AnalyticsHeader.tsx`: Brand filter toggle pills: ALL / IM3 / TRI (`activeAnalyticsBrandPill`)
     6. `BranchesHeader.tsx`: Status filter chips: All / Active / Inactive (`activeBranchesStatusPill`)
     7. `ProjectsListHeader.tsx`: Group by selector pills: Status / Priority / Branch / None (`activeProjectsGroupByPill`)
     8. `HelpDocsModal.tsx`: Shortcuts / Guides modal tab switcher (`activeHelpDocsTabPill`)
     9. `SettingsModal.tsx`: Backup & Data / Appearance modal tab switcher (`activeSettingsTabPill`)
     10. `OutletSearchCombobox.tsx`: Brand override pills: IM3 / TRI (`activeComboboxBrandPill`)
   - Gates: `npm run build:check` (0 errors), `npm run drift:check` (clean), `npm run test:smoke` (84 passed), `npm test` (599 passed, 0 failures).

1. **Database Schema & Migrations (`prisma/schema.prisma` & migration SQL):**
   - Added enums `EquipmentStatus` (`AVAILABLE`, `BORROWED`, `MAINTENANCE`, `RETIRED`), `BorrowStatus` (`PENDING`, `APPROVED`, `ACTIVE`, `RETURNED`, `CANCELLED`, `OVERDUE`), and `EquipmentCondition` (`EXCELLENT`, `GOOD`, `FAIR`, `POOR`, `DAMAGED`, `LOST`).
   - Added models `InventoryItem` (master equipment catalog with unique code, category, units, storage location), `BorrowRecord` (transaction with sequential code `BRW-YYYYMMDD-NNN`, purpose, dates, status, approver), and `BorrowItem` (junction items with condition tracking).
   - Added `borrowRecords BorrowRecord[]` relation on `FieldEvent`.
   - Cleaned defunct legacy columns via `db push --accept-data-loss` (single-tenant invariant compliance) and recorded official migration `prisma/migrations/20261030192500_add_inventory_system/migration.sql`.
   - Seeded 13 items across Audio/Visual, Staging/Booth, Merchandising/Display, and Electrical/Cables categories.

2. **Domain Model & SSOT Types (`src/types/index.ts`):**
   - Added `"inventory"` to `ViewMode` union.
   - Added canonical interfaces: `EquipmentStatus`, `BorrowStatus`, `EquipmentCondition`, `InventoryItem`, `BorrowItem`, `BorrowRecord`.

3. **API Route Handlers (`src/app/api/marcom/inventory/`):**
   - `route.ts`: GET catalog with search/category/status filters; POST new catalog item with unique code.
   - `[id]/route.ts`: GET item details; PUT updates with available/total unit sanity check; DELETE blocking if active borrows exist.
   - `[id]/availability/route.ts`: GET real-time availability snapshot with active borrow records.
   - `borrow/route.ts`: GET borrow records with status/event filters; POST new borrow request with auto-generated `BRW-YYYYMMDD-NNN` code in PENDING status.
   - `borrow/[id]/route.ts`: GET single borrow record; PUT updates status and atomically decrements `availableUnits` when transitioning to `ACTIVE`.
   - `borrow/[id]/return/route.ts`: POST processes return, updates condition after return, logs damages/notes, and atomically restores `availableUnits` for non-LOST equipment.

4. **State Management & SWR Store (`src/lib/marcom/marcomDataStore.ts` & tests):**
   - Extended `useMarcomDataStore` with `inventoryItems`, `borrowRecords`, `fetchInventory()`, `fetchBorrowRecords()`, and optimistic mutations.
   - Updated store test suite in `marcomDataStore.test.ts` (18 passed).

5. **Navigation & Coordinator Views (`navConfig.ts`, `ActiveViewStage.tsx`, `src/components/views/InventoryView/`):**
   - Added `"Equipment Inventory"` item under Marcom Master Data navigation section.
   - Dynamically loaded `InventoryView` in `ActiveViewStage.tsx`.
   - Built full modular UI component tree under `src/components/views/InventoryView/`:
     - `inventoryConstants.ts`: categories, badge styles, icons.
     - `InventoryHeaderKpis.tsx`: 4 KPI summary cards, tab switchers, search and filter controls.
     - `InventoryItemsGrid.tsx`: visual item card grid with unit availability indicators.
     - `InventoryTableView.tsx`: detailed sortable table view.
     - `BorrowRecordsTable.tsx`: filterable table of borrow transactions.
     - `BorrowTrackingBoard.tsx`: 4-column kanban board for active workflows.
     - `InventoryItemFormModal.tsx`: add/edit modal with validation.
     - `BorrowRequestModal.tsx`: multi-step request modal with item selection.
     - `BorrowDetailModal.tsx`: detailed transaction inspector with status actions.
     - `ReturnProcessModal.tsx`: return inspection and condition check-in dialog.
     - `InventoryViewModals.tsx`: modal coordinator isolating dialog logic.
     - `InventoryView.tsx`: coordinator component strictly $\le 250$ LOC (223 LOC).

6. **Event Integration (`EventBorrowedEquipmentSection.tsx`, `EventFormModal.tsx`):**
   - Added collapsible borrowed equipment section and request shortcut in `EventFormModal.tsx`.

7. **Permissions & Security (`guards.ts`, `guards.test.ts`):**
   - Added permissions: `VIEW_INVENTORY`, `MANAGE_INVENTORY`, `REQUEST_BORROW`, `APPROVE_BORROW`, `PROCESS_RETURN`.

8. **Automated Test Suites:**
   - `src/lib/marcom/inventoryLogic.test.ts`: pure domain logic tests for availability, code generation, and condition status.
   - `src/app/api/marcom/inventory/inventoryApi.test.ts`: API route tests.

9. **Sidebar Mode Switcher Restoration (`AppModeSegmentedControl.tsx`, `Sidebar.tsx`, `GlobalRail.tsx`):**
   - Restored original Projects logo icon (`Kanban` from `lucide-react`) replacing `FolderKanban`.
   - Restored label text to `"Marcom Hub"` in mode switcher pills and `GlobalRail`.
   - Restored Framer Motion animated sliding pill (`motion.div layoutId="activeAppModeIndicator"` with spring physics and reduced-motion support).
   - Extracted `AppModeSegmentedControl.tsx` (104 LOC), bringing `Sidebar.tsx` coordinator down to 182 LOC.

10. **Bugfix: Equipment Inventory Mode Toggle Auto-Reversion (`createUiSlice.ts`, `urlState.ts`, `topNavConstants.ts`):**
   - Added `"inventory"` to `MARCOM_VIEW_SET` in `createUiSlice.ts` so `setActiveView("inventory")` resolves `appMode = "marcom"`.
   - Added `"inventory"` to `VALID_VIEW_MODES` and `MARCOM_VIEWS` in `urlState.ts`, plus `"equipment"` / `"equipments"` normalization aliases.
   - Added `"inventory"` to `MARCOM_VIEW_LABELS` in `topNavConstants.ts`.
   - Added Equipment Inventory view and quick action to `CommandPalette.tsx`.
   - Added automated tests in `marcomViews.test.ts` and `urlState.test.ts`.

11. **Bugfix: Stale Prisma Client Runtime on Development Server (500 error on fetchBorrowRecords):**
   - Root cause: Dev server process started before `BorrowRecord` / `BorrowItem` schema migration, retaining stale Prisma client in Node process memory where `prisma.borrowRecord` was `undefined`.
   - Terminated stale process, restarted clean Next.js server on port 3000, verified authenticated requests return HTTP 200 (`/api/marcom/inventory/borrow` and `/api/marcom/inventory`).

12. **Feature: Event Card Equipment Logistics Indicator Chip — IMPLEMENTED & VERIFIED:**
   - Created Spec: `docs/superpowers/specs/2026-10-31-event-card-equipment-indicator-design.md`
   - Created Plan: `docs/superpowers/plans/2026-10-31-event-card-equipment-indicator.md`
   - Created ADR: `docs/adr/0006-event-card-equipment-indicator.md` (ADR-06)
   - Created pure helper `getEventEquipmentSummary` in `src/lib/marcom/eventEquipmentHelpers.ts`.
   - Added unit test suite in `src/lib/marcom/eventEquipmentHelpers.test.ts` (4 passed).
   - Integrated reactive indicator chip into `EventCardsView.tsx` with teal active state, rose overdue state, and modal open trigger.
   - Added pre-fetch of `fetchBorrowRecords()` to `EventsView.tsx`.

13. **Feature: Open Detail Drawer on Row Click in Projects List View — IMPLEMENTED & VERIFIED:**
   - Attached `onClick={() => onSelect?.(item)}` to `<tr>` in `src/components/views/ProjectsView/ProjectsListRow.tsx` with `cursor-pointer` styling.
   - Isolated click event propagation (`e.stopPropagation()`) across all interactive cell controls (checkbox selection toggle, inline title edit input and double-click trigger, status dropdown button and options, due date editor and date button, PIC assignee editor and button, action button).
   - Preserved seamless row click behavior across non-control cell areas (type badge, branch, checklist, and empty cell padding) to open the domain drawer/modal (`ProjectsDetailDrawerHost`).

14. **Bugfix: HTML Redirect Response on Pipeline View (`SyntaxError: Unexpected token '<'`):**
   - Root cause: NextAuth edge middleware callback in `src/auth.config.ts` was returning `false` for unauthenticated requests on `/api/...` endpoints instead of a 401 JSON Response. NextAuth edge middleware automatically generated an HTTP 307 Temporary Redirect to the `/login` HTML page. The browser's client-side `fetch('/api/marcom/pipeline')` followed the redirect and received the HTML login page with HTTP 200 OK, causing `await res.json()` to fail with `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`.
   - Updated `src/auth.config.ts` `authorized` callback to inspect `request?.nextUrl?.pathname` and return an HTTP 401 JSON Response for unauthenticated/unapproved `/api/` requests, preserving page redirects only for non-API routes.
   - Updated `PipelineView.tsx` with defensive status handling (clean redirect to `/login` if 401 or redirected) and validated `content-type: application/json` before calling `.json()`.
   - Wrapped `src/app/api/marcom/pipeline/route.ts` GET handler in `try / catch` returning structured HTTP 500 JSON on database exceptions.
   - Added automated unit tests in `src/auth.config.test.ts` (8 passed).

15. **Comprehensive QA Edge-Case Database Seeder (`prisma/seed.ts`) — IMPLEMENTED & VERIFIED:**
   - Spec: `docs/superpowers/specs/2026-10-31-qa-comprehensive-seeder-design.md`
   - Plan: `docs/superpowers/plans/2026-10-31-qa-comprehensive-seeder.md`
   - Implemented clean atomic reset protocol (`cleanDatabase`) deleting all tables in reverse FK topological order, guaranteeing idempotent re-runs in < 1 second.
   - Implemented realistic Indonesian corporate domain data across all entities without artificial `[QA]` label strings.
   - Covered edge cases: SLA critical expired MoU (45d ago), SLA warning near-expiry MoU (8d), pending legal approval aging (>60d), flagship multi-year agreement (Rp 150M), rejected MoU with finance reasons, GPS geolocation anomaly (>1.4km deviation, `isLocationValid: false`), installation blocked with `ISSUE` renovation status, permanent material without MoU warning, extreme dimensions installation (`1200 x 400 cm`), cold/orphan outlet with 0 operational records, inactive outlet, overdue borrow with event link, damaged returns (`MAJOR_DAMAGE` and `LOST` equipment condition check-in), content posts in review/revision/published states, document files up to 88.5MB, and executive Q3 report with rich JSON.
   - Standardized branch indexing (`branch-1`..`branch-12`) and preserved catalog item counts ($\ge 13$) to satisfy all downstream integration test suites.

16. **Active Pills Animation on Content Planner Page (`ContentPlannerView.tsx`):**
    - Implemented fluid animated sliding pill for the View Modes Switcher (Cards vs Table) and Platform Filter Pills.
    - Integrated Framer Motion `motion.div` with shared `layoutId` (`activeContentPlannerViewPill` and `activeContentPlannerPlatformPill`), natural spring physics (`stiffness: 450, damping: 35`), and `useReducedMotion()` accessibility support.
    - Added tactile tap gestures (`whileTap={{ scale: 0.95 }}`) and semantic accessibility attributes (`role="tablist"`, `role="tab"`, `aria-selected`).

17. **Placements Persistent Header & Static View Switcher (`PlacementsView.tsx`, `PlacementsHeader.tsx`, `PlacementFilterControls.tsx`):**
    - Spec: `docs/superpowers/specs/2026-10-31-placements-persistent-header-view-switcher-design.md`
    - Plan: `docs/superpowers/plans/2026-10-31-placements-persistent-header-view-switcher.md`
    - Upgraded `PlacementViewSwitcher` with Framer Motion `motion.div layoutId="activePlacementViewPill"`, spring physics (`stiffness: 450, damping: 35`), `whileTap={{ scale: 0.95 }}`, and `useReducedMotion()`.
    - Extracted atomic subcomponent `PlacementsHeader.tsx` (84 LOC) styled with Option B Card-Banner Container (`bg-white dark:bg-slate-900 rounded-2xl border shadow-xs p-4 sm:p-5`), containing title, record badge, view switcher pills, refresh button, export trigger, and `+ Add Placement` action.
    - Added container padding (`p-4 sm:p-6 space-y-4 h-full overflow-y-auto`) to `PlacementsView.tsx` and aligned `MarcomTableShell` with `noPadding` and `hideRefreshButton`.
    - Positioned `KpiSummaryCards` conditionally (`viewMode !== "map"`), hiding the KPI cards on Map View to maximize the Leaflet interactive map viewport and prevent unwanted vertical scrollbars.
    - Streamlined `PlacementsMapTab.tsx` and `PlacementsRecapTab.tsx` by removing redundant duplicate headers.
    - Kept coordinator `PlacementsView.tsx` strictly under the 250 LOC limit (214 LOC).

18. **Field Events Card-Banner Header Architecture (`EventsView.tsx`, `EventsHeader.tsx`):**
    - Spec: `docs/superpowers/specs/2026-10-31-events-card-header-design.md`
    - Plan: `docs/superpowers/plans/2026-10-31-events-card-header.md`
    - Created atomic subcomponent `EventsHeader.tsx` (129 LOC) styled with the Card-Banner container (`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-4 sm:p-5`), matching the design system of Media Placements.
    - Integrated title, flag icon badge, event counter badge (`{totalEvents} events`), subtitle, animated view switcher (`layoutId="activeFieldEventsViewPill"`), refresh action, and role-guarded `+ New Field Event` action (`can("CREATE_EVENT")`).
    - Reduced `EventsView.tsx` from 531 to 447 LOC by decomposing the coordinator header.

19. **Content Planner Container Margin & Padding Alignment (`ContentPlannerView.tsx`):**
    - Removed restrictive `max-w-7xl mx-auto` that caused excessive lateral empty space on widescreen viewports.
    - Aligned outer container styling with `PlacementsView.tsx`: `p-4 sm:p-6 space-y-4 h-full overflow-y-auto`.
    - Removed redundant `pt-2` on Controls Bar for uniform 16px (`space-y-4`) vertical rhythm.

20. **Outlets Header & Navigation Labels Alignment (`OutletsView.tsx`, `navConfig.ts`):**
    - Renamed header title in `OutletsView.tsx` from `"Store Command Center"` to `"Outlets Directory"`.
    - Renamed sidebar navigation item in `navConfig.ts` under Master Data from `"Outlets Directory"` to `"Outlets"`.

21. **Media Placements Inventory-Style Unified Header (`PlacementsHeader.tsx`, `PlacementsView.tsx`):**
    - Restyled header zone with unified backdrop blur container (`p-4 sm:p-6 pb-2 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`).
    - Standardized Title row with inline `MapPin` icon (`text-emerald-500`), count badge, and updated actions bar.
    - Integrated `KpiSummaryCards` directly within the header (conditionally hidden on map view to maximize interactive map canvas viewport).
    - Positioned `PlacementViewSwitcher` at the bottom controls row before the bottom border.
    - Updated `PlacementsView.tsx` outer container to `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto` with content container `p-4 sm:p-6 flex-1 min-h-0`.
    - Maintained coordinator `PlacementsView.tsx` strictly under the 250 LOC limit (213 LOC).

22. **Content Planner Inventory-Style Unified Header (`ContentPlannerHeader.tsx`, `ContentPlannerView.tsx`):**
    - Extracted atomic subcomponent `ContentPlannerHeader.tsx` (247 LOC) with unified backdrop blur container (`p-4 sm:p-6 pb-2 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`).
    - Standardized Title row with inline `Sparkles` icon (`text-pink-500`), count badge, subtitle, and top-right Refresh & Schedule Post buttons.
    - Integrated `KpiSummaryCards` directly within the header zone.
    - Standardized bottom controls row with Platform filter pills (`motion.div layoutId="activeContentPlannerPlatformPill"`), Search input, and Cards/Table view switcher (`layoutId="activeContentPlannerViewPill"`).
    - Updated `ContentPlannerView.tsx` outer container to `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto` with content container `p-4 sm:p-6 flex-1 min-h-0`.
    - Reduced `ContentPlannerView.tsx` by ~185 LOC by decoupling header and filter logic.

23. **Field Events Inventory-Style Unified Header (`EventsHeader.tsx`, `EventsView.tsx`):**
    - Upgraded `EventsHeader.tsx` with unified backdrop blur container (`p-4 sm:p-6 pb-2 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`).
    - Standardized Title row with inline `CalendarDays` icon (`text-blue-500`), event count badge, and top-right Refresh & New Field Event buttons.
    - Integrated `KpiSummaryCards` directly inside the header zone under Title row.
    - Positioned view switcher (Cards | Table | Calendar | Timeline with `activeFieldEventsViewPill`) at the bottom controls row before the bottom border.
    - Updated `EventsView.tsx` outer container to `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto` with content container `p-4 sm:p-6 space-y-4 flex-1 min-h-0`.

24. **Pipeline Inventory-Style Unified Header (`PipelineView.tsx`):**
    - Upgraded header zone with unified backdrop blur container (`p-4 sm:p-6 pb-2 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`).
    - Standardized Title row with inline `Layers` icon (`text-indigo-500`), Cockpit 360° badge, subtitle, and top-right Refresh button (`p-2 border rounded-lg`).
    - Integrated `KpiSummaryCards` directly within the header zone.
    - Updated outer container to `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto` and wrapped content area in `p-4 sm:p-6 space-y-4 flex-1 min-h-0`.

25. **Analytics & ROI Hub Inventory-Style Unified Header (`AnalyticsHeader.tsx`, `AnalyticsActionableStrip.tsx`, `AnalyticsView.tsx`, `AnalyticsSkeleton.tsx`):**
    - Created `AnalyticsHeader.tsx` (~200 LOC) following the Equipment Inventory design:
      - Unified backdrop blur container (`p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`).
      - Title row with inline `BarChart3` icon (`text-indigo-500`), `Live Metrics` badge, subtitle, and top-right Refresh button (`p-2 border rounded-lg`).
      - Embedded 4 KPI Cards (SLA Persetujuan MOU, POSM Deployment Rate, Efisiensi Event Lapangan, Reliabilitas Konten Sosmed) with drill-down routes to respective Marcom views and zero-CLS skeleton placeholders when loading.
      - Integrated bottom filter toolbar with Branch selector, Quarter selector, Brand toggle pills, and Reset button.
    - Extracted `AnalyticsActionableStrip.tsx` to surface unit economics and editorial turnaround in the stage content area.
    - Updated `AnalyticsSkeleton.tsx` to mirror stage content geometry (Actionable Telemetry strip + 2×2 Chart Grid).
    - Updated `AnalyticsView.tsx` outer container to `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto` and wrapped stage content in `p-4 sm:p-6 flex-1 min-h-0 space-y-6`.
    - Removed dead obsolete components `AnalyticsKpiRow.tsx` and `AnalyticsFilterBar.tsx`.

26. **Reports & Exports Hub Inventory-Style Unified Header (`ReportsHeader.tsx`, `ReportsView.tsx`):**
    - Created `ReportsHeader.tsx` following the Equipment Inventory design:
      - Unified backdrop blur container (`p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`).
      - Title row with inline `BarChart3` icon (`text-orange-500`), `Executive Archive` badge, subtitle, and top-right action buttons (Refresh, Export Center, and 1-Click Executive PDF).
      - Embedded 4 KPI Cards (Total Laporan, Total Aktivitas, Avg Completion, Laporan Terkini) with `KpiSummaryCards items={kpiCards}` within the header zone.
      - Bottom controls row with Tab switcher (Laporan Bulanan & Rekap POSM Kuartalan) and New Monthly Report button.
    - Updated `ReportsView.tsx` outer container to `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto` and wrapped stage content in `p-4 sm:p-6 flex-1 min-h-0 space-y-4`.

27. **Documents & Asset Library Hub Inventory-Style Unified Header (`DocumentsHeader.tsx`, `DocumentsView.tsx`):**
    - Created `DocumentsHeader.tsx` (~209 LOC) following the Equipment Inventory design:
      - Unified backdrop blur container (`p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`).
      - Title row with inline `Files` icon (`text-teal-500`), document count badge (`{count} dokumen`), concise subtitle, and top-right action buttons (Refresh and `+ Tambah Dokumen`).
      - Embedded 4 KPI Cards (Total Dokumen, Kapasitas Terpakai, Dokumen Aktif, Kategori Terbanyak) with `KpiSummaryCards items={kpiCards}` within the header zone.
      - Bottom controls row with Category filter chips (Semua Dokumen + individual categories with count badges), search input with clear button, and view mode switcher (Cards | Table).
    - Updated `DocumentsView.tsx` outer container to `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto` (removed restrictive `max-w-7xl mx-auto`), replaced inline headers with `<DocumentsHeader ... />`, and wrapped stage content in `p-4 sm:p-6 flex-1 min-h-0 space-y-4`.

28. **Outlets Directory Inventory-Style Unified Header (`OutletsHeader.tsx`, `OutletsView.tsx`):**
    - Created `OutletsHeader.tsx` (~190 LOC) following the Equipment Inventory design:
      - Unified backdrop blur container (`p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`).
      - Title row with inline `Store` icon (`text-orange-500`), outlet count badge (`{totalOutlets} outlet`), concise subtitle, and top-right action buttons (Refresh and `+ Add Outlet` / `Ajukan Toko Baru`).
      - Embedded 5 KPI Cards (Total Outlets, Active Branches, Brand Portfolio, MoU Partnerships, Placements Installed) with `KpiSummaryCards items={kpiItems}` within the header zone.
      - Bottom controls row with View mode switcher tabs (Tabel Data, Peta Sebaran, Antrean Approval with pending count badge), Branch dropdown selector, Store Type dropdown selector, search input with clear button, and Reset Filters button.
    - Updated `OutletsView.tsx` outer container to `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto`, replaced inline header, floating KPI cards, and inline filterBar with `<OutletsHeader ... />`, and wrapped stage content in `p-4 sm:p-6 flex-1 min-h-0 space-y-4`.

29. **Branches & Regional Hubs Inventory-Style Unified Header (`BranchesHeader.tsx`, `BranchesView.tsx`):**
    - Created `BranchesHeader.tsx` (~185 LOC) following the Equipment Inventory design:
      - Unified backdrop blur container (`p-4 sm:p-6 pb-3 space-y-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm`).
      - Title row with inline `Building2` icon (`text-cyan-600 dark:text-cyan-400`), branch count badge (`{totalBranches} branch`), concise subtitle, and top-right action buttons (Refresh and `+ Tambah Branch`).
      - Embedded 4 KPI Cards (Total Branches, Outlets Network, Active Partnerships, Avg Program Progress) with `KpiSummaryCards items={kpiItems}` within the header zone.
      - Bottom controls row with Status filter pills (Semua Status, Done, In Progress, Pending with count badges), Region dropdown selector, search input with clear button, and Reset Filters button.
    - Updated `BranchesView.tsx` outer container to `flex flex-col h-full bg-[#FAFBFC] dark:bg-[#121316] overflow-y-auto`, replaced inline header, floating KPI cards, and inline filterBar with `<BranchesHeader ... />`, and wrapped table shell in responsive stage container `p-4 sm:p-6 flex-1 min-h-0 space-y-4`.

30. **CustomDropdown Component & Sitewide Dropdown Standardization (`CustomDropdown.tsx`, Multiple Views):**
    - Spec: `docs/superpowers/specs/2026-10-31-custom-dropdown-standardization-design.md`
    - Plan: `docs/superpowers/plans/2026-10-31-custom-dropdown-standardization.md`
    - Built reusable, accessible, dark-mode-ready, and searchable `CustomDropdown` component (`src/components/ui/CustomDropdown.tsx`) and pure helpers (`src/components/ui/customDropdownHelpers.ts`).
    - Features:
      - Auto-activated search input when options count $\ge 6$ (or explicit `searchable={true}`) with real-time filtering and clear button.
      - Click-outside and Escape key dismissal powered by existing `useDropdown` hook with trigger focus restoration.
      - Keyboard navigation (ArrowDown, ArrowUp, Enter, Space) and ARIA attributes (`role="combobox"`, `role="listbox"`, `role="option"`, `aria-selected`).
      - Active item indicator checkmark (`Check` icon), optional option badges and leading icons.
      - Glassmorphic backdrop blur styling matching both light and dark modes.
    - Replaced native unstyled `<select>` elements across:
      - `BranchesHeader.tsx` (Region dropdown — resolves user screenshot)
      - `OutletsHeader.tsx` (Branch & Store Type dropdowns)
      - `AnalyticsHeader.tsx` (Branch & Quarter dropdowns with icons)
      - `PipelineFilterBar.tsx` (Branch dropdown)
      - `InventoryHeaderKpis.tsx` (Category dropdown)
      - `MousView.tsx` (Branch & Type dropdowns)
      - `QuarterlyRecapTab.tsx` (Quarter & Branch dropdowns)
      - `EventsTimelineView.tsx` (Days range dropdown)
      - `QuarterlyPosmReportTab.tsx` (Quarter dropdown)
      - `OutletApprovalQueueTab.tsx` (Branch dropdown)
      - `OutletMapView.tsx` (Brand, Store Type, Branch, and MoU Status dropdowns)
      - `MarcomTableShell.tsx` (Sitewide table pagination pageSize dropdown)
      - `ProjectsFilterBar.tsx` (Branch & PIC dropdowns)
      - `ProjectsBulkActionBar.tsx` (Bulk status dropdown)
      - `PlacementBulkActionBar.tsx` (Bulk status dropdown)
      - `UserRoleSelect.tsx` (User role select)
    - Created unit tests in `src/components/ui/CustomDropdown.test.ts` (8 tests passing).

31. **Header Layout Swap: Stabilize Pills Row Above KPI Cards Row (`BranchesHeader`, `ReportsHeader`, `OutletsHeader`, `DocumentsHeader`, `InventoryHeaderKpis`, `PlacementsHeader`, `EventsHeader`, `AnalyticsHeader`):**
    - Spec: `docs/superpowers/specs/2026-10-31-header-pills-cards-swap-design.md`
    - Plan: `docs/superpowers/plans/2026-10-31-header-pills-cards-swap.md`
    - Inverted vertical order of Controls/Pills row and dynamic KPI Summary Cards row across all 8 Marcom headers:
      - Row 1: Title, domain badges, primary action buttons (Add / Create / Export).
      - Row 2: Controls & Navigation row (View switcher pills, tab pills, status filter chips, CustomDropdowns, and search inputs).
      - Row 3: KPI Summary Cards row (`KpiSummaryCards items={kpiItems}`).
    - Completely eliminated layout jumping (Cumulative Layout Shift) when switching tabs or views where cards are conditionally hidden (e.g. Map View in Placements, Rekap POSM tab in Reports, or during metric recalculations).
    - Established deterministic $Y$-coordinate for all primary user interaction pills directly beneath the title bar.

---

## Verification Gates (this session)

- `npm run drift:check` → ✅ No drift detected (all 64 specs paired, invariants pass, coordinator LOC OK, SSOT OK)
- `npm run build:check` → ✅ 0 TypeScript errors
- `npm test` → ✅ Full test suite passed (817/817 tests passed)
- `npm run test:smoke` → ✅ 114 passed, 0 failed

---

## Blocked / Risks

- None. Implementation complete and verified.

---

## Known Technical Debt (Recorded for Future Refactoring)

- **TD-001 (Legacy Stubs in Store):** ~60 baris stub fungsi kosong di `src/lib/store/useWorkspaceStore.ts` dan tipe slice di `src/lib/store/slices/types.ts` (`createSpace`, `addDependency`, `emptyTrash`, `addChannelMessage`, dll.) dari era klon ClickUp lama. Tidak menyebabkan bug maupun penurunan performa (murni no-op dan array kosong di memori).
- **TD-002 (Vestigial Workspace ID):** Kolom `workspaceId String @default("ws-main")` di tabel-tabel operasional Prisma (`Placement`, `Mou`, `FieldEvent`, `ContentPost`, `MonthlyReport`, `DocumentItem`). Aman karena Postgres memberikan nilai default otomatis.
- **TD-003 (Dualitas Naming AppMode):** Penggunaan nilai internal `appMode: "tasks"` yang dilabeli "Projects" di UI, padahal isinya adalah tampilan Board dari entitas Marcom.
- **TD-004 (Dead Domain Types):** Definisi interface di `src/types/index.ts` untuk fitur yang tidak pernah aktif (`CustomAutomationRule`, `ChannelMessage`, `Space`, `Folder`, `List`, `Task`). Tipe ini di-strip saat kompilasi TypeScript sehingga tidak menambah ukuran bundle JS produksi.
- **TD-005 (Decommissioned Asset Lifecycle / Repair Tracking):** Barang yang rusak berat (`MAJOR_DAMAGE`) saat ini langsung diafkir dengan memotong `totalUnits` master item demi menjaga akurasi stok fisik harian. Ketika organisasi mulai menggunakan bengkel servis/reparasi rekanan, dapat ditambahkan modul *Asset Repair Ticketing* untuk memulihkan aset yang selesai diperbaiki kembali ke `totalUnits`.

---

## Next Step for Following Session

1. Run verification commands (`npm run drift:check`, `npm run build:check`, `npm test`) on session start.
2. Execute implementation of ADR-0050 using `docs/handover-warehouse-role-and-return-inspection-compensation-workflow.md`.
3. If desired, adopt `CustomDropdown` in `src/components/views/ContentPlannerView/ContentDrawer.tsx` (edit post drawer) for Platform and Format to complete Content Planner symmetry.


