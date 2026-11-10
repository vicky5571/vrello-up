# Master VBA Script: Industry Academia Collaboration Program IOH
**Presentation Title:** Industry Academia Collaboration Program IOH: Digitalisasi & Transformasi Efektivitas Operasional Sales Lapangan Circle Java  
**Platform Inti:** Vrello Up  
**Target Penguji:** Pak Rindo (VP Head of Sales Effectiveness) & Pak Restu (Capability Building Circle Java)  
**Format:** 16:9 Widescreen (960 x 540 pt) | 12 Slides + Complete Verbatim Speaker Notes  
**Dokumen Acuan:** Memenuhi 100% 5 Dimensi Penilaian Resmi Magang IOH (Learning & Dev, Project Involvement, Work Responsibilities, Impact & Contribution, Reflection & Future Roadmap)  

---

```vba
Option Explicit

' ==============================================================================
' MASTER VBA SCRIPT: INDUSTRY ACADEMIA COLLABORATION PROGRAM IOH
' Desain: Bright White, Signature Indosat Yellow, Teal, Red/Tri Pill Badges
' Penilai: Pak Rindo (VP Sales Effectiveness) & Pak Restu (Capability Building)
' Format: 16:9 Widescreen (960 x 540 pt) | 12 Slides + 5 Kriteria Resmi Lengkap
' ==============================================================================

Sub GenerateIOHInternshipPresentation()
    Dim pptPres As PowerPoint.Presentation
    Dim sld As PowerPoint.Slide
    Dim shp As PowerPoint.Shape
    Dim i As Integer
    
    Set pptPres = ActivePresentation
    
    ' 1. Set format layar 16:9 Widescreen (960 x 540 pt)
    With pptPres.PageSetup
        .SlideWidth = 960
        .SlideHeight = 540
    End With
    
    ' Bersihkan slide lama
    For i = pptPres.Slides.Count To 1 Step -1
        pptPres.Slides(i).Delete
    Next i
    
    ' ==========================================================================
    ' PALET WARNA RESMI INDOSAT OOREDOO HUTCHISON
    ' ==========================================================================
    Dim cBgWhite As Long: cBgWhite = RGB(255, 255, 255)
    Dim cSoftGray As Long: cSoftGray = RGB(248, 250, 252)
    Dim cBorder As Long: cBorder = RGB(226, 232, 240)
    
    ' Brand Colors
    Dim cIndosatYellow As Long: cIndosatYellow = RGB(255, 204, 0)   ' Signature Indosat Yellow
    Dim cIndosatTeal As Long: cIndosatTeal = RGB(0, 163, 137)       ' Modern IOH Teal (Kinerja / Data)
    Dim cIM3Red As Long: cIM3Red = RGB(237, 28, 36)                 ' Ooredoo / IM3 Red
    Dim cTriMagenta As Long: cTriMagenta = RGB(225, 0, 116)         ' Hutchison 3 Magenta
    
    ' Typography Colors
    Dim cTextTitle As Long: cTextTitle = RGB(15, 23, 42)            ' Dark Slate / Near Black
    Dim cTextBody As Long: cTextBody = RGB(51, 65, 85)              ' Slate Dark
    Dim cTextMuted As Long: cTextMuted = RGB(100, 116, 139)         ' Slate Medium
    
    ' ==========================================================================
    ' SLIDE 1: COVER & EXECUTIVE POSITIONING
    ' ==========================================================================
    Set sld = pptPres.Slides.Add(1, ppLayoutBlank)
    Call SetSlideBgWhite(sld)
    
    ' Decorative Brand Top Stripe
    Set shp = sld.Shapes.AddShape(msoShapeRectangle, 0, 0, 960, 6)
    shp.Fill.Solid: shp.Fill.ForeColor.RGB = cIndosatYellow: shp.Line.Visible = msoFalse
    
    ' Pill Badges
    Call AddPillBadge(sld, 50, 40, 260, 26, "INDUSTRY ACADEMIA COLLABORATION", cIndosatYellow, cTextTitle)
    Call AddPillBadge(sld, 320, 40, 130, 26, "CIRCLE JAVA", cIndosatTeal, RGB(255, 255, 255))
    Call AddPillBadge(sld, 460, 40, 80, 26, "IM3", cIM3Red, RGB(255, 255, 255))
    Call AddPillBadge(sld, 550, 40, 90, 26, "TRI (3)", cTriMagenta, RGB(255, 255, 255))
    
    ' Main Title
    Set shp = sld.Shapes.AddTextbox(msoTextOrientationHorizontal, 45, 80, 870, 90)
    shp.TextFrame.WordWrap = msoTrue
    shp.TextFrame.TextRange.Text = "Industry Academia Collaboration Program IOH"
    shp.TextFrame.TextRange.Font.Name = "Segoe UI"
    shp.TextFrame.TextRange.Font.Size = 28: shp.TextFrame.TextRange.Font.Bold = msoTrue
    shp.TextFrame.TextRange.Font.Color.RGB = cTextTitle
    
    ' Subtitle
    Set shp = sld.Shapes.AddTextbox(msoTextOrientationHorizontal, 45, 175, 870, 45)
    shp.TextFrame.WordWrap = msoTrue
    shp.TextFrame.TextRange.Text = "Laporan Akhir Magang: Digitalisasi & Transformasi Efektivitas Operasional Sales Lapangan Circle Java melalui Platform Vrello Up"
    shp.TextFrame.TextRange.Font.Name = "Segoe UI"
    shp.TextFrame.TextRange.Font.Size = 13: shp.TextFrame.TextRange.Font.Color.RGB = cTextMuted
    
    ' 4 Pillar Cards
    Call AddIndosatCard(sld, 50, 240, 205, 200, "Learning & Growth", "Evolusi dari kode akademik menjadi disiplin software engineering enterprise (5 skill kunci).", "POIN 1", cIndosatTeal)
    Call AddIndosatCard(sld, 268, 240, 205, 200, "Project & Role", "Pembangunan platform Vrello Up untuk operasional retail 8 cabang di Circle Java.", "POIN 2 & 3", cIM3Red)
    Call AddIndosatCard(sld, 486, 240, 205, 200, "Tangible Impact", "SLA MoU <2 hari, 100% validasi GPS POSM, perlindungan finansial sewa toko, & 1-detik laporan.", "POIN 4", cIndosatYellow)
    Call AddIndosatCard(sld, 704, 240, 205, 200, "Reflection & Future", "Pembelajaran mengatasi edge cases lapangan, eliminasi over-engineering, & roadmap handover.", "POIN 5", cTriMagenta)
    
    ' Presenter Footer
    Set shp = sld.Shapes.AddTextbox(msoTextOrientationHorizontal, 50, 470, 860, 30)
    shp.TextFrame.TextRange.Text = "Penyaji: Full-Stack Solutions Intern | Pembimbing: Pak Rindo (VP Head of Sales Effectiveness) & Pak Restu (Capability Building Circle Java)"
    shp.TextFrame.TextRange.Font.Size = 11: shp.TextFrame.TextRange.Font.Color.RGB = cTextMuted
    
    SetSpeakerNote sld, "Selamat pagi Pak Rindo dan Pak Restu. Terima kasih atas bimbingan luar biasa selama program Industry Academia Collaboration Indosat Ooredoo Hutchison ini." & vbCrLf & _
        "Hari ini, saya mempresentasikan laporan akhir magang saya yang merangkum 5 pilar utama: pembelajaran kompetensi baru, keterlibatan proyek Vrello Up, tanggung jawab dalam tim, dampak nyata bagi efektivitas sales Circle Java, serta refleksi kedewasaan rekayasa sistem yang saya peroleh."

    ' ==========================================================================
    ' SLIDE 2: EXECUTIVE SUMMARY & STRUKTUR LAPORAN (5 MATERI MANDATORI)
    ' ==========================================================================
    Set sld = pptPres.Slides.Add(2, ppLayoutBlank)
    Call SetSlideBgWhite(sld)
    Call SetupIndosatHeader(sld, "RINGKASAN EKSEKUTIF", "Struktur Laporan Akhir Magang Berdasarkan 5 Dimensi Penilaian Mandatori", cIndosatYellow)
    
    Call AddIndosatCard(sld, 50, 115, 160, 380, "1. Learning & Dev", _
        "Penguasaan 5 kapabilitas baru:" & vbCrLf & _
        "• Domain-driven YAGNI" & vbCrLf & _
        "• Defensive UX lapangan" & vbCrLf & _
        "• True Mobile-First design" & vbCrLf & _
        "• Deterministic State SSOT" & vbCrLf & _
        "• Enterprise ADR governance.", "KOMPETENSI", cIndosatTeal)
        
    Call AddIndosatCard(sld, 222, 115, 160, 380, "2. Project Scope", _
        "Vrello Up Platform:" & vbCrLf & _
        "• Master Outlets GIS" & vbCrLf & _
        "• 4-Step POSM Wizard" & vbCrLf & _
        "• MoU Lifecycle State Machine" & vbCrLf & _
        "• Event & Gudang Logistik" & vbCrLf & _
        "• Executive Reporting Hub.", "PROYEK", cIM3Red)
        
    Call AddIndosatCard(sld, 394, 115, 160, 380, "3. Work Roles", _
        "Sinergi Vicky & Zacky:" & vbCrLf & _
        "• Vicky: Data DB & RBAC" & vbCrLf & _
        "• Vicky: Otomasi & Cron Sync" & vbCrLf & _
        "• Zacky: Frontend UI & Motion" & vbCrLf & _
        "• Zacky: Mobile Layout & UX" & vbCrLf & _
        "• 238+ Automated tests.", "PERAN", cIndosatYellow)
        
    Call AddIndosatCard(sld, 566, 115, 160, 380, "4. Real Impact", _
        "Hasil Terukur:" & vbCrLf & _
        "• MoU SLA terpangkas 85%" & vbCrLf & _
        "• Zero wrong POSM placement" & vbCrLf & _
        "• Anti-fraud sewa outlet" & vbCrLf & _
        "• Hemat ratusan jam rekap" & vbCrLf & _
        "• 1-Click Executive PDF.", "DAMPAK", cIndosatTeal)
        
    Call AddIndosatCard(sld, 738, 115, 172, 380, "5. Reflection", _
        "Refleksi & Pengembangan:" & vbCrLf & _
        "• Lean Product Discovery" & vbCrLf & _
        "• Tech Leadership & Delegasi" & vbCrLf & _
        "• Distributed Event-Driven" & vbCrLf & _
        "• Production SRE Telemetry" & vbCrLf & _
        "• Roadmap Handover 3 Fase.", "REFLEKSI", cTriMagenta)
        
    SetSpeakerNote sld, "Bapak-bapak penguji, presentasi ini dirancang sistematis menjawab 5 indikator evaluasi magang Indosat: mulai dari kompetensi yang saya serap, ruang lingkup platform Vrello Up, peran saya di tim sales effectiveness, efisiensi nyata yang dihasilkan, hingga evaluasi tantangan dan roadmap sistem."

    ' ==========================================================================
    ' SLIDE 3: POIN 1 - LEARNING & DEVELOPMENT (5 SKILL DARI GIT COMMIT)
    ' ==========================================================================
    Set sld = pptPres.Slides.Add(3, ppLayoutBlank)
    Call SetSlideBgWhite(sld)
    Call SetupIndosatHeader(sld, "POIN 1: LEARNING & DEVELOPMENT", "Evolusi Kapabilitas Rekayasa: 5 Pembelajaran Kunci dari Riwayat 800+ Commit", cIndosatTeal)
    
    Call AddIndosatCard(sld, 50, 115, 270, 185, "1. Domain YAGNI (Fokus Nilai)", _
        "• Realita Awal: Membangun Gantt Chart dan asisten AI Brain² yang rumit." & vbCrLf & _
        "• Pembelajaran: Kru lapangan butuh kecepatan input data toko, bukan fitur mewah. Kami berani menghapus Gantt demi performa sistem.", "YAGNI", cIndosatYellow)
        
    Call AddIndosatCard(sld, 345, 115, 270, 185, "2. Defensive Field UX", _
        "• Realita Awal: Asumsi user sabar dan sinyal selalu bagus." & vbCrLf & _
        "• Pembelajaran: Membangun Navigation Blocker saat upload foto & GPS Auto-propagation agar data tidak korup saat sinyal fluktuatif.", "DEFENSIVE UX", cIM3Red)
        
    Call AddIndosatCard(sld, 640, 115, 270, 185, "3. True Mobile-First", _
        "• Realita Awal: Mendesain antarmuka di layar desktop lebar." & vbCrLf & _
        "• Pembelajaran: 80% staf bergerak di lapangan pakai smartphone (360-430px). Merancang bottom navigation sliding pill khusus jempol satu tangan.", "MOBILE-FIRST", cIndosatTeal)
        
    Call AddIndosatCard(sld, 50, 310, 415, 185, "4. State SSOT & Zero Layout Shift (CLS)", _
        "• Realita Awal: Mengandalkan rehidrasi lokal yang memicu loop tak terbatas." & vbCrLf & _
        "• Pembelajaran: Sinkronisasi URL browser sebagai Single Source of Truth (SSOT) dan mengganti akordeon dengan detail drawer agar visual tidak melompat.", "STATE ARCHITECTURE", cIndosatTeal)
        
    Call AddIndosatCard(sld, 495, 310, 415, 185, "5. Spec-Driven & ADR Governance", _
        "• Realita Awal: Ngoding impulsif tanpa mencatat alasan teknis." & vbCrLf & _
        "• Pembelajaran: Menyusun 90+ Architecture Decision Records (ADR), 120+ spesifikasi teknis, serta automated drift check (<250 LOC).", "ENGINEERING GOVERNANCE", cTriMagenta)
        
    SetSpeakerNote sld, "Pak Restu, di Poin 1 ini saya merefleksikan 5 skill berharga yang saya pelajari lewat pengalaman nyata 800+ git commit. Saya belajar prinsip YAGNI—berani menghapus fitur spekulatif seperti Gantt chart karena kru lapangan butuh aplikasi yang cepat dan ringkas." & vbCrLf & _
        "Saya juga belajar Defensive UX: memasang navigation blocker agar foto fisik toko tidak hilang saat sinyal minim, serta tata kelola 90+ ADR berstandar korporat."

    ' ==========================================================================
    ' SLIDE 4: POIN 2 - PROJECT INVOLVEMENT (KRONOLOGIS 4 FASE DARI COMMIT AGUSTUS-NOVEMBER)
    ' ==========================================================================
    Set sld = pptPres.Slides.Add(4, ppLayoutBlank)
    Call SetSlideBgWhite(sld)
    Call SetupIndosatHeader(sld, "POIN 2: PROJECT INVOLVEMENT", "Kronologi 4 Fase Proyek Vrello Up Berdasarkan Riwayat Kerja (Agustus - November)", cIndosatYellow)
    
    Call AddIndosatCard(sld, 50, 115, 205, 380, "Fase 1: Foundation (Agustus)", _
        "• Analisis Kebutuhan Awal: Inisiasi platform produktivitas & manajemen tugas terstruktur." & vbCrLf & vbCrLf & _
        "• Reactive State Engine: Implementasi Zustand store, optimasi drag-and-drop Kanban, dan TanStack Table." & vbCrLf & vbCrLf & _
        "• Dual-Persistence: Lapisan penyimpanan offline-ready lokal browser.", "AGUSTUS 2026", cIndosatTeal)
        
    Call AddIndosatCard(sld, 268, 115, 205, 380, "Fase 2: Retail & MoU (September)", _
        "• Pivot Domain Telekomunikasi: Mengarahkan sistem menjadi Marcom & Sales Operations Suite." & vbCrLf & vbCrLf & _
        "• Direktori Outlets GIS: Pemetaan GPS toko ritel di 8 cabang Circle Java." & vbCrLf & vbCrLf & _
        "• 4-Step POSM Wizard: Registrasi materi promosi IM3 & Tri." & vbCrLf & vbCrLf & _
        "• MoU Lifecycle: Alur verifikasi kontrak sewa toko.", "SEPTEMBER 2026", cIM3Red)
        
    Call AddIndosatCard(sld, 486, 115, 205, 380, "Fase 3: Ops & Cron (Oktober)", _
        "• Logistik Gudang Event: Peminjaman kit promosi & sistem denda otomatis kerusakan barang." & vbCrLf & vbCrLf & _
        "• Background Cron Sync: Sinkronisasi harian otomatis server (/api/cron/reports-sync)." & vbCrLf & vbCrLf & _
        "• 1-Click Executive PDF: Generator laporan resmi bulanan & rekapitulasi kuartalan.", "OKTOBER 2026", cIndosatYellow)
        
    Call AddIndosatCard(sld, 704, 115, 205, 380, "Fase 4: Mobile & QA (November)", _
        "• True Mobile-First Chassis: Penyesuaian antarmuka HP 360-430px dengan sliding bottom nav." & vbCrLf & vbCrLf & _
        "• Defensive UX Lapangan: Navigation blocker foto upload & GPS auto-propagation." & vbCrLf & vbCrLf & _
        "• Enterprise Hardening: 238 unit tests (0 fail) & 90+ ADR siap handover.", "NOVEMBER 2026", cTriMagenta)
        
    SetSpeakerNote sld, "Pak Rindo dan Pak Restu, di Poin 2 ini saya memaparkan kronologi keterlibatan proyek Vrello Up dari Agustus hingga November. Di Agustus, kami membangun fondasi arsitektur data. Di September, kami melakukan pivot ke domain telekomunikasi dengan merancang direktori outlet ritel dan alur MoU. Di Oktober, kami mengotomasi pelaporan dengan server cron job dan modul logistik gudang. Dan di November, kami menuntaskan optimasi mobile-first untuk kru lapangan serta menyelesaikan 238 automated tests."

    ' ==========================================================================
    ' SLIDE 5: POIN 3 - WORK RESPONSIBILITIES (PEMBAGIAN PERAN VICKY VS ZACKY)
    ' ==========================================================================
    Set sld = pptPres.Slides.Add(5, ppLayoutBlank)
    Call SetSlideBgWhite(sld)
    Call SetupIndosatHeader(sld, "POIN 3: WORK RESPONSIBILITIES", "Pembagian Peran Tim & Tanggung Jawab Spesifik (Vicky vs Zacky)", cIndosatTeal)
    
    Call AddIndosatCard(sld, 50, 115, 205, 380, "Sistem & Backend (Vicky)", _
        "• Data Architecture: Merancang skema relasional PostgreSQL/Prisma/Supabase & seeder 11 divisi." & vbCrLf & vbCrLf & _
        "• Otorisasi & RBAC: Menegakkan batasan akses ketat assigned-mentor, admin approval, & API security." & vbCrLf & vbCrLf & _
        "• State Machine Deterministik: Logika Financial Guard pada MoU toko & kompensasi ganti rugi aset gudang.", "SISTEM & DATA", cIndosatTeal)
        
    Call AddIndosatCard(sld, 268, 115, 205, 380, "Otomasi & QA (Vicky)", _
        "• Server Background Cron: Endpoint /api/cron/reports-sync mengagregasi data lapangan harian." & vbCrLf & vbCrLf & _
        "• Automated Dispatch: Pengiriman rekap Excel via WhatsApp Document bot & email SMTP." & vbCrLf & vbCrLf & _
        "• 1-Click Executive PDF: Generator dokumen resmi instan dalam 1 detik." & vbCrLf & vbCrLf & _
        "• Zero-Failure Testing: 238 unit tests & drift-check.ts (<250 LOC).", "OTOMASI & QA", cIM3Red)
        
    Call AddIndosatCard(sld, 486, 115, 205, 380, "Frontend & UX (Zacky)", _
        "• Custom Dropdown UI: Mengembangkan bespoke dropdown & membersihkan native select." & vbCrLf & vbCrLf & _
        "• Micro-Interactions: Animasi hardware-accelerated sliding active pills pada filter toolbar." & vbCrLf & vbCrLf & _
        "• Mobile Layout Polishing: Desain bottom navigation bar & splash screen." & vbCrLf & vbCrLf & _
        "• Client-side Validation: Validasi berkas form pendaftaran kandidat.", "FRONTEND & UX", cIndosatYellow)
        
    Call AddIndosatCard(sld, 704, 115, 205, 380, "Sinergi Kolaborasi Tim", _
        "• Pembagian Tugas Modular: Vicky memimpin arsitektur data, keamanan akses & background sync, sementara Zacky memimpin polesan visual antarmuka pengguna." & vbCrLf & vbCrLf & _
        "• Git Workflow Disiplin: Pengelolaan branch fitur mandiri, code review berkala, dan integrasi tanpa konflik." & vbCrLf & vbCrLf & _
        "• Hasil Sistem Terpadu: Cepat, andal, dan ramah pengguna di lapangan.", "SINERGI TIM", cTriMagenta)
        
    SetSpeakerNote sld, "Pak Restu dan Pak Rindo, pada Poin 3 mengenai Work Responsibilities, saya memaparkan pembagian peran yang sangat jelas antara saya (Vicky) dan rekan saya (Zacky)." & vbCrLf & _
        "Tanggung jawab utama saya adalah sebagai Backend & Systems Architect: merancang arsitektur basis data, menegakkan otorisasi RBAC assigned-mentor, logika State Machine Financial Guard MoU, mesin background cron job sinkronisasi harian, dispatch laporan WhatsApp/Email otomatis, serta 238 unit tests untuk menjamin keandalan sistem." & vbCrLf & _
        "Sementara rekan saya, Zacky, berfokus pada Frontend & UI/UX Specialist: merancang custom dropdown, animasi sliding pills, dan polesan navigasi mobile." & vbCrLf & _
        "Sinergi modular ini memastikan Zacky menciptakan antarmuka yang intuitif bagi kru toko, sementara saya menjamin integritas data, keamanan, dan otomasi backend berjalan tanpa celah."

    ' ==========================================================================
    ' SLIDE 6: POIN 4 - IMPACT 1 (VRELLO UP: PRESISI RITEL & POSM LAPANGAN)
    ' ==========================================================================
    Set sld = pptPres.Slides.Add(6, ppLayoutBlank)
    Call SetSlideBgWhite(sld)
    Call SetupIndosatHeader(sld, "POIN 4: IMPACT - VRELLO UP", "Dampak 1: Presisi Pemasangan POSM & Eliminasi Biaya Salah Titik Outlet Ritel", cIndosatYellow)
    
    Call AddIndosatCard(sld, 50, 115, 415, 380, "Master Outlet GIS & Geolocation", _
        "• Sentralisasi Hak Pembuatan Toko: Kru promotor hanya berhak mengajukan draf; approval disahkan Super Admin untuk mencegah duplikasi toko ritel di 8 cabang Circle Java." & vbCrLf & vbCrLf & _
        "• GIS Pinning & Geolocation: Setiap outlet terkunci koordinat lintang/bujur dan foto fasad resmi." & vbCrLf & vbCrLf & _
        "• Soft-Delete & Database Restrict: Histori penempatan materi promosi masa lalu tetap utuh dan dapat diaudit secara finansial meski toko tutup.", "DIREKTORI OUTLET", cIndosatTeal)
        
    Call AddIndosatCard(sld, 495, 115, 415, 380, "4-Step Guided POSM Wizard", _
        "• Auto-Propagation Alamat & GPS: Installer tidak mengetik ulang koordinat toko; sistem otomatis mengunci posisi dari master outlet (Akurasi 100% bebas salah titik pasang)." & vbCrLf & vbCrLf & _
        "• Isolasi Dual-Brand: Pemilihan Spanduk, Neon Box, Shopblind terpisah ketat antara IM3 dan Tri sehingga anggaran kampanye tidak pernah tertukar." & vbCrLf & vbCrLf & _
        "• Navigation Blocker: Tombol 'Lanjut' terkunci hingga bukti foto fisik selesai terunggah sempurna (mencegah draf kosong)." & vbCrLf & vbCrLf & _
        "• Multi-View Monitoring: Tabel data, peta sebaran GIS, dan papan Kanban.", "POSM WIZARD", cIM3Red)
        
    SetSpeakerNote sld, "Pak Rindo, dampak operasional pertama dari Vrello Up adalah eliminasi inefisiensi biaya pasang materi promosi oleh vendor. Dengan GPS Auto-propagation, installer terkunci pada titik koordinat yang sah, menghilangkan 100% risiko salah titik pasang. Dan Navigation Blocker menjamin tidak ada lagi laporan draf kosong tanpa bukti foto fisik."

    ' ==========================================================================
    ' SLIDE 7: POIN 4 - IMPACT 2 (VRELLO UP: MOU FINANCIAL GUARD & AKSIS SLA)
    ' ==========================================================================
    Set sld = pptPres.Slides.Add(7, ppLayoutBlank)
    Call SetSlideBgWhite(sld)
    Call SetupIndosatHeader(sld, "POIN 4: IMPACT - VRELLO UP", "Dampak 2: Akselerasi SLA Kontrak Toko (MoU) & Proteksi Finansial Biaya Sewa", cIM3Red)
    
    ' Top Workflow Stepper Card
    Set shp = sld.Shapes.AddShape(msoShapeRoundedRectangle, 50, 115, 860, 95)
    shp.Fill.Solid: shp.Fill.ForeColor.RGB = cSoftGray: shp.Line.ForeColor.RGB = cBorder
    Set shp = sld.Shapes.AddTextbox(msoTextOrientationHorizontal, 65, 122, 830, 25)
    shp.TextFrame.TextRange.Text = "DETERMINISTIC STATE MACHINE: KEPATUHAN AUDIT TANPA CELAH MANIPULASI BIAYA"
    shp.TextFrame.TextRange.Font.Size = 11: shp.TextFrame.TextRange.Font.Bold = msoTrue: shp.TextFrame.TextRange.Font.Color.RGB = cIndosatTeal
    
    Set shp = sld.Shapes.AddTextbox(msoTextOrientationHorizontal, 65, 148, 830, 50)
    shp.TextFrame.WordWrap = msoTrue
    shp.TextFrame.TextRange.Text = "[1. DRAFT] Input draf kontrak & nilai sewa  -->  [2. PENDING REVIEW] Verifikasi berkas multi-dokumen  -->  [3. ACTIVE / REVISION] Persetujuan Branch Manager  -->  [4. EXPIRED] Monitoring jatuh tempo sewa"
    shp.TextFrame.TextRange.Font.Size = 11.5: shp.TextFrame.TextRange.Font.Bold = msoTrue: shp.TextFrame.TextRange.Font.Color.RGB = cTextTitle
    
    ' Bottom 2 Cards
    Call AddIndosatCard(sld, 50, 225, 415, 270, "Financial Guard Anti-Fraud", _
        "• Sistem secara absolut memblokir pencairan kompensasi sewa tahunan sebelum berkas legal diverifikasi lengkap oleh pimpinan." & vbCrLf & vbCrLf & _
        "• Wajib melampirkan berkas fisik: Surat Perjanjian bertanda tangan, KTP pemilik toko, dan foto fisik outlet." & vbCrLf & vbCrLf & _
        "• Menutup 100% potensi kebocoran anggaran sewa toko rekanan.", "FINANCIAL GUARD", cIM3Red)
        
    Call AddIndosatCard(sld, 495, 225, 415, 270, "Peningkatan Kecepatan SLA (85%)", _
        "• Quick-Approve Interface memungkinkan Branch Manager meninjau dan menyetujui kontrak dalam hitungan detik via Document Drawer." & vbCrLf & vbCrLf & _
        "• Waktu siklus verifikasi berkas berkurang dari 10-14 hari menjadi <2 hari kerja." & vbCrLf & vbCrLf & _
        "• Dashboard telemetri langsung mendeteksi cabang yang mengalami kendala birokrasi berkas.", "AKSELERASI BISNIS", cIndosatTeal)
        
    SetSpeakerNote sld, "Dampak kedua dari Vrello Up adalah tata kelola komersial kemitraan ritel. MoU State Machine bertindak sebagai Financial Guard: anggaran kompensasi sewa toko tidak bisa dicairkan tanpa persetujuan pimpinan atas dokumen legal yang lengkap. Pada saat yang sama, kecepatan SLA persetujuan dipangkas 85% menjadi kurang dari 2 hari."

    ' ==========================================================================
    ' SLIDE 8: POIN 4 - IMPACT 3 (VRELLO UP: OTOMASI CRON & LOGISTIK GUDANG)
    ' ==========================================================================
    Set sld = pptPres.Slides.Add(8, ppLayoutBlank)
    Call SetSlideBgWhite(sld)
    Call SetupIndosatHeader(sld, "POIN 4: IMPACT - VRELLO UP", "Dampak 3: Eliminasi Lembur via Server Cron, 1-Detik PDF, & Logistik Gudang", cIndosatTeal)
    
    Call AddIndosatCard(sld, 50, 115, 270, 380, "Automated Server Cron Sync", _
        "• Server Aggregation Engine: Endpoint /api/cron/reports-sync berjalan otomatis tiap hari di latar belakang server." & vbCrLf & vbCrLf & _
        "• Kompilasi Otomatis: Mengagregasi data penempatan POSM, status kontrak MoU, dan event per cabang." & vbCrLf & vbCrLf & _
        "• Draf Bulanan Terisi Otomatis: Menghilangkan risiko salah hitung atau duplikasi data spreadsheet.", "SERVER CRON", cIndosatTeal)
        
    Call AddIndosatCard(sld, 345, 115, 270, 380, "1-Click Executive PDF Export", _
        "• Standar Editorial Eksekutif: Menghasilkan dokumen laporan resmi berkualitas tinggi siap rapat dalam 1 detik." & vbCrLf & vbCrLf & _
        "• Rekap POSM Kuartalan (Q1 - Q4): Tabulasi terstruktur volume materi terpasang per kuartal dan per brand (IM3 vs Tri)." & vbCrLf & vbCrLf & _
        "• Efisiensi Jam Kerja 100%: Mengeliminasi 3-5 hari kerja lembur akhir bulan staf operasional.", "1-DETIK PDF", cIndosatYellow)
        
    Call AddIndosatCard(sld, 640, 115, 270, 380, "Akuntabilitas Aset Gudang", _
        "• Borrow Request Stepper: Validasi stok fisik harian riil sebelum kit promosi roadshow dipinjamkan." & vbCrLf & vbCrLf & _
        "• Return Inspection: Admin gudang memeriksa kondisi fisik booth, tenda, & sound system saat kembali." & vbCrLf & vbCrLf & _
        "• Otomasi Denda Ganti Rugi: Status MAJOR_DAMAGE otomatis menghitung kompensasi afkir aset.", "LOGISTIK GUDANG", cIM3Red)
        
    SetSpeakerNote sld, "Dampak ketiga dari Vrello Up adalah efisiensi waktu dan proteksi aset: staf operasional biasanya butuh 3-5 hari lembur tiap akhir bulan untuk merekap data. Dengan Server Cron Job, laporan bulanan teragregasi otomatis dan dapat diekspor menjadi Executive PDF dalam 1 detik. Modul inventaris gudang juga mengunci denda ganti rugi jika ada kit event yang rusak."

    ' ==========================================================================
    ' SLIDE 9: POIN 4 - IMPACT 4 (SISTEM OPERASIONAL INTERNAL: ATTENDANCE & REKRUTMEN)
    ' ==========================================================================
    Set sld = pptPres.Slides.Add(9, ppLayoutBlank)
    Call SetSlideBgWhite(sld)
    Call SetupIndosatHeader(sld, "POIN 4: IMPACT - INTERNAL SYSTEMS", "Dampak pada Sistem Pendukung: Otomasi Absensi Harian & Keandalan Rekrutmen", cIndosatYellow)
    
    Call AddIndosatCard(sld, 50, 115, 205, 380, "Attendance: WhatsApp Bot", _
        "• Otomasi Rekap Harian: Generator workbook Excel harian otomatis terkirim via bot WhatsApp Document ke mentor & supervisor tiap sore." & vbCrLf & vbCrLf & _
        "• Eliminasi Kompilasi Manual: Membebaskan staf Capability Building dari beban rekap absensi harian secara total.", "ATTENDANCE BOT", cIndosatTeal)
        
    Call AddIndosatCard(sld, 268, 115, 205, 380, "Attendance: Mentor RBAC", _
        "• Assigned-Mentor Authorization: Otorisasi persetujuan cuti/izin terisolasi ketat hanya ke mentor pembimbing." & vbCrLf & vbCrLf & _
        "• Tata Kelola 11 Divisi: Menjamin integritas data absensi dan kerahasiaan evaluasi ratusan intern magang di Circle Java.", "SECURITY RBAC", cIM3Red)
        
    Call AddIndosatCard(sld, 486, 115, 205, 380, "Recruitment: Email Delivery", _
        "• Keandalan Token Pendaftaran: Perbaikan transport layer SMTP dan penambahan fitur kirim ulang (resend token) 1-klik." & vbCrLf & vbCrLf & _
        "• Zero Missing Token: Menjamin ratusan pelamar kampus menerima tautan seleksi dan jadwal interview tanpa kendala.", "RECRUITMENT TOKEN", cIndosatYellow)
        
    Call AddIndosatCard(sld, 704, 115, 205, 380, "Recruitment: Fast Filter", _
        "• Server-Side Filter & Pagination: Pemrosesan penyaringan data pelamar berbasis status dan kota asal di sisi server." & vbCrLf & vbCrLf & _
        "• Performa Instan (<300ms): Memangkas waktu tunggu admin HR dalam menyaring ribuan berkas pendaftar magang.", "FAST PROCESSING", cTriMagenta)
        
    SetSpeakerNote sld, "Pak Restu, selain Vrello Up, dampak nyata juga saya hadirkan pada sistem internal lainnya: pada sistem absensi, saya mengotomasi pengiriman rekap Excel harian via bot WhatsApp ke para mentor serta mengunci izin akses mentor di 11 divisi resmi. Dan pada sistem rekrutmen, kami mengeliminasi insiden gagal kirim token pendaftaran untuk ratusan pelamar kampus."

    ' ==========================================================================
    ' SLIDE 10: POIN 4 - BUSINESS VALUE MATRIX (KONSOLIDASI DAMPAK & TELEMETRI)
    ' ==========================================================================
    Set sld = pptPres.Slides.Add(10, ppLayoutBlank)
    Call SetSlideBgWhite(sld)
    Call SetupIndosatHeader(sld, "POIN 4: BUSINESS VALUE MATRIX", "Konsolidasi Nilai Bisnis Terukur Lintas Proyek untuk Manajemen Circle Java", cIndosatYellow)
    
    ' 4 Modern Metric Cards
    Call AddStatCard(sld, 50, 115, 205, 240, "< 2 Hari", "SLA Persetujuan MoU", "Kecepatan approval kontrak sewa toko per cabang. Terpangkas 85% dari sebelumnya 10-14 hari kerja.", cIM3Red)
    Call AddStatCard(sld, 268, 115, 205, 240, "1 Detik", "Waktu Ekspor Laporan", "Pembuatan dokumen laporan eksekutif resmi instan via automated cron background aggregation.", cIndosatTeal)
    Call AddStatCard(sld, 486, 115, 205, 240, "100%", "Presisi Titik GPS POSM", "Akurasi penempatan materi promosi bebas salah pasang berkat fitur auto-propagasi koordinat toko.", cIndosatYellow)
    Call AddStatCard(sld, 704, 115, 205, 240, "0 Lembur", "Otomasi Rekap Absensi", "Pengiriman otomatis rekapitulasi harian via WhatsApp bot dan laporan bulanan otomatis tanpa lembur.", cTriMagenta)
    
    ' Telemetry Summary Box
    Set shp = sld.Shapes.AddShape(msoShapeRoundedRectangle, 50, 370, 860, 125)
    shp.Fill.Solid: shp.Fill.ForeColor.RGB = cSoftGray: shp.Line.ForeColor.RGB = cBorder
    Set shp = sld.Shapes.AddTextbox(msoTextOrientationHorizontal, 65, 376, 830, 25)
    shp.TextFrame.TextRange.Text = "RANGKUMAN DAMPAK OPERASIONAL BISNIS NYATA (SEBELUM VS SESUDAH)"
    shp.TextFrame.TextRange.Font.Size = 11: shp.TextFrame.TextRange.Font.Bold = msoTrue: shp.TextFrame.TextRange.Font.Color.RGB = cIndosatTeal
    
    Set shp = sld.Shapes.AddTextbox(msoTextOrientationHorizontal, 65, 400, 830, 85)
    shp.TextFrame.WordWrap = msoTrue
    shp.TextFrame.TextRange.Text = "• Presisi POSM Lapangan: Menutup risiko salah pasang materi promosi oleh pihak ketiga dan menjamin 100% foto fisik valid." & vbCrLf & _
        "• Proteksi Anggaran Sewa (MoU): Financial Guard memblokir 100% pembayaran sewa outlet sebelum dokumen legal diverifikasi resmi." & vbCrLf & _
        "• Efisiensi Jam Kerja: Menyelamatkan ratusan jam lembur staf operasional cabang tiap bulan melalui otomasi server cron dan bot WhatsApp."
    shp.TextFrame.TextRange.Font.Size = 10.5: shp.TextFrame.TextRange.Font.Color.RGB = cTextBody
    
    SetSpeakerNote sld, "Slide 10 merangkum seluruh nilai bisnis terukur: Kecepatan MoU naik 85%, salah pasang POSM dieliminasi total, risiko anggaran sewa bocor dicegah 100%, dan beban kerja lembur staf operasional dipangkas habis. Seluruh dampak ini membuktikan bahwa rekayasa sistem yang kami bangun memberikan nilai nyata bagi efektivitas bisnis Indosat."

    ' ==========================================================================
    ' SLIDE 11: POIN 5 - REFLECTION & FUTURE DEVELOPMENT (4 SKILL STRATEGIS PENGEMBANGAN)
    ' ==========================================================================
    Set sld = pptPres.Slides.Add(11, ppLayoutBlank)
    Call SetSlideBgWhite(sld)
    Call SetupIndosatHeader(sld, "POIN 5: REFLECTION & FUTURE ROADMAP", "Refleksi Pembelajaran Berkesan & 4 Area Strategis Pengembangan Diri", cTriMagenta)
    
    Call AddIndosatCard(sld, 50, 115, 205, 380, "1. Lean Discovery", _
        "• Validasi Lapangan Dini: Memvalidasi kebutuhan riil kru toko sebelum menulis baris kode rumit." & vbCrLf & vbCrLf & _
        "• Pembelajaran Nyata: Belajar dari kasus eliminasi Gantt & AI agar jam kerja rekayasa tidak terbuang sia-sia." & vbCrLf & vbCrLf & _
        "• Fokus Nilai Komersial: Membangun fitur yang terbukti menyelesaikan friksi operasional.", "PRODUCT FIT", cIndosatTeal)
        
    Call AddIndosatCard(sld, 268, 115, 205, 380, "2. Tech Leadership", _
        "• Dari Solo Builder ke Lead: Beralih dari mengerjakan seluruh sistem sendirian menjadi arsitek kolaboratif." & vbCrLf & vbCrLf & _
        "• API-First Contracts: Merancang spesifikasi interface di awal agar pengerjaan modul dapat didelegasikan ke tim." & vbCrLf & vbCrLf & _
        "• Menghilangkan ketergantungan sistem pada figur individu developer.", "LEADERSHIP", cIM3Red)
        
    Call AddIndosatCard(sld, 486, 115, 205, 380, "3. Distributed Scale", _
        "• Kesiapan Skala Nasional: Mempersiapkan Vrello Up melayani puluhan ribu outlet di seluruh Circle IOH se-Indonesia." & vbCrLf & vbCrLf & _
        "• Asynchronous Queues: Menerapkan Message Brokers (Kafka / Redis) untuk antrean foto & kompilasi data." & vbCrLf & vbCrLf & _
        "• Database Sharding & Replicas: Pemisahan transaksi harian dengan analitik laporan.", "SCALABILITY", cIndosatYellow)
        
    Call AddIndosatCard(sld, 704, 115, 205, 380, "4. Production SRE", _
        "• Beyond Lab Tests: Melangkah lebih jauh dari 238 unit tests menuju pemantauan kesehatan sistem di smartphone lapangan." & vbCrLf & vbCrLf & _
        "• APM Telemetry: Memasang OpenTelemetry & Sentry untuk melacak latency rute API di daerah blank spot." & vbCrLf & vbCrLf & _
        "• Proactive Reliability: Deteksi dini kendala sinyal kru toko secara proaktif.", "OBSERVABILITY", cTriMagenta)
        
    SetSpeakerNote sld, "Pak Restu dan Pak Rindo, pada Poin 5 mengenai Reflection & Future Development, saya merefleksikan bahwa selain kemampuan komunikasi yang berkembang pesat selama magang, ada 4 skill strategis yang menjadi fokus peningkatan diri saya ke depan:" & vbCrLf & _
        "1. Product Discovery: memvalidasi kebutuhan riil kru toko sebelum menulis kode rumit agar tidak ada jam kerja yang terbuang sia-sia, belajar dari kasus eliminasi Gantt chart." & vbCrLf & _
        "2. Tech Leadership: bertransformasi dari developer yang mengerjakan segalanya sendiri menjadi arsitek yang merancang kontrak API modular dan mendelegasikan pengerjaan modul ke tim." & vbCrLf & _
        "3. Distributed Scalability: mendalami message queues seperti Kafka dan Redis untuk mempersiapkan sistem seperti Vrello Up naik ke skala nasional puluhan ribu outlet." & vbCrLf & _
        "4. Production SRE: menerapkan telemetri real-time untuk memantau performa aplikasi di smartphone kru lapangan secara proaktif." & vbCrLf & _
        "Refleksi ini menjadi kompas bagi pertumbuhan profesional saya sebagai software engineer berorientasi bisnis."

    ' ==========================================================================
    ' SLIDE 12: IMPLEMENTASI BERTAHAP, KESIMPULAN & Q&A
    ' ==========================================================================
    Set sld = pptPres.Slides.Add(12, ppLayoutBlank)
    Call SetSlideBgWhite(sld)
    Call SetupIndosatHeader(sld, "KESIMPULAN & TANYA JAWAB", "Rencana Rollout 3 Fase, Serah Terima Sistem, & Sesi Diskusi (Q&A)", cIndosatYellow)
    
    Call AddIndosatCard(sld, 50, 115, 270, 220, "Fase 1: Pilot Deployment", "Uji coba terfokus di 2 cabang utama: Semarang & Solo. Sosialisasi SOP mobile wizard dan pemantauan sinkronisasi offline.", "PILOT (BULAN 1)", cIndosatYellow)
    Call AddIndosatCard(sld, 345, 115, 270, 220, "Fase 2: Rollout Circle Java", "Ekspansi menyeluruh ke 6 cabang lainnya (Jogja, Banyumas, Purwokerto, Pekalongan, Kudus, Magelang) dan aktivasi modul ganti rugi gudang.", "ROLLOUT (BULAN 2)", cIndosatTeal)
    Call AddIndosatCard(sld, 640, 115, 270, 220, "Fase 3: Handover Enterprise", "Transfer kapabilitas penuh ke tim internal IT/Sales Indosat dengan 90+ ADR dan 238 unit tests tervalidasi.", "HANDOVER (BULAN 3)", cIM3Red)
    
    ' Closing Callout Box
    Set shp = sld.Shapes.AddShape(msoShapeRoundedRectangle, 50, 355, 860, 135)
    shp.Fill.Solid: shp.Fill.ForeColor.RGB = cSoftGray: shp.Line.ForeColor.RGB = cIndosatYellow: shp.Line.Weight = 2
    Set shp = sld.Shapes.AddTextbox(msoTextOrientationHorizontal, 70, 365, 820, 110)
    shp.TextFrame.WordWrap = msoTrue
    shp.TextFrame.TextRange.Text = "Program Industry Academia Collaboration ini membuktikan bahwa sinergi akademisi dan industri mampu melahirkan inovasi teknologi yang berdampak langsung pada efektivitas komersial dan efisiensi operasional Indosat Ooredoo Hutchison Circle Java." & vbCrLf & vbCrLf & _
        "Terima kasih atas bimbingan strategis Pak Rindo dan Pak Restu. Kami siap membuka sesi diskusi, evaluasi, dan tanya jawab."
    shp.TextFrame.TextRange.Font.Name = "Segoe UI"
    shp.TextFrame.TextRange.Font.Size = 12: shp.TextFrame.TextRange.Font.Bold = msoTrue: shp.TextFrame.TextRange.Font.Color.RGB = cTextTitle
    
    SetSpeakerNote sld, "Sebagai penutup, seluruh aset teknologi, 238 unit tests, dan 90 ADR telah siap diserahterimakan untuk mendukung efektivitas penjualan di Circle Java. Terima kasih banyak atas bimbingan Pak Rindo dan Pak Restu. Saya siap untuk sesi tanya jawab."

    MsgBox "Luar biasa! 12 Slide Laporan Akhir Magang Industry Academia Collaboration IOH telah selesai dibuat dengan sempurna!", vbInformation, "IOH Presentation Ready"
End Sub

' ==============================================================================
' HELPER PROCEDURES FOR INDOSAT AESTHETICS
' ==============================================================================

Private Sub SetSlideBgWhite(sld As PowerPoint.Slide)
    sld.FollowMasterBackground = msoFalse
    sld.Background.Fill.Solid
    sld.Background.Fill.ForeColor.RGB = RGB(255, 255, 255)
End Sub

Private Sub AddPillBadge(sld As PowerPoint.Slide, left As Single, top As Single, width As Single, height As Single, text As String, bgColor As Long, textColor As Long)
    Dim shp As PowerPoint.Shape
    Set shp = sld.Shapes.AddShape(msoShapeRoundedRectangle, left, top, width, height)
    shp.Fill.Solid: shp.Fill.ForeColor.RGB = bgColor: shp.Line.Visible = msoFalse
    shp.Adjustments.Item(1) = 0.5
    shp.TextFrame.TextRange.Text = text
    shp.TextFrame.TextRange.Font.Name = "Segoe UI"
    shp.TextFrame.TextRange.Font.Size = 9.5
    shp.TextFrame.TextRange.Font.Bold = msoTrue
    shp.TextFrame.TextRange.Font.Color.RGB = textColor
End Sub

Private Sub SetupIndosatHeader(sld As PowerPoint.Slide, category As String, title As String, badgeColor As Long)
    Dim shp As PowerPoint.Shape
    
    ' Top Accent Bar
    Set shp = sld.Shapes.AddShape(msoShapeRectangle, 0, 0, 960, 5)
    shp.Fill.Solid: shp.Fill.ForeColor.RGB = badgeColor: shp.Line.Visible = msoFalse
    
    ' Category Pill Badge
    Call AddPillBadge(sld, 50, 30, 220, 24, UCase(category), badgeColor, RGB(15, 23, 42))
    
    ' Title Text
    Set shp = sld.Shapes.AddTextbox(msoTextOrientationHorizontal, 45, 58, 870, 45)
    shp.TextFrame.WordWrap = msoTrue
    shp.TextFrame.TextRange.Text = title
    shp.TextFrame.TextRange.Font.Name = "Segoe UI"
    shp.TextFrame.TextRange.Font.Size = 19: shp.TextFrame.TextRange.Font.Bold = msoTrue
    shp.TextFrame.TextRange.Font.Color.RGB = RGB(15, 23, 42)
End Sub

Private Sub AddIndosatCard(sld As PowerPoint.Slide, left As Single, top As Single, width As Single, height As Single, title As String, body As String, badgeTag As String, accentColor As Long)
    Dim shp As PowerPoint.Shape
    
    Set shp = sld.Shapes.AddShape(msoShapeRoundedRectangle, left, top, width, height)
    shp.Fill.Solid: shp.Fill.ForeColor.RGB = RGB(255, 255, 255)
    shp.Line.ForeColor.RGB = RGB(226, 232, 240): shp.Line.Weight = 1.2
    shp.Adjustments.Item(1) = 0.08
    
    Call AddPillBadge(sld, left + 14, top + 14, 110, 20, badgeTag, accentColor, RGB(255, 255, 255))
    
    Set shp = sld.Shapes.AddTextbox(msoTextOrientationHorizontal, left + 10, top + 38, width - 20, 32)
    shp.TextFrame.WordWrap = msoTrue
    shp.TextFrame.TextRange.Text = title
    shp.TextFrame.TextRange.Font.Name = "Segoe UI"
    shp.TextFrame.TextRange.Font.Size = 12: shp.TextFrame.TextRange.Font.Bold = msoTrue
    shp.TextFrame.TextRange.Font.Color.RGB = RGB(15, 23, 42)
    
    Set shp = sld.Shapes.AddTextbox(msoTextOrientationHorizontal, left + 10, top + 72, width - 20, height - 80)
    shp.TextFrame.WordWrap = msoTrue
    shp.TextFrame.TextRange.Text = body
    shp.TextFrame.TextRange.Font.Name = "Segoe UI"
    shp.TextFrame.TextRange.Font.Size = 9.5
    shp.TextFrame.TextRange.Font.Color.RGB = RGB(51, 65, 85)
End Sub

Private Sub AddStatCard(sld As PowerPoint.Slide, left As Single, top As Single, width As Single, height As Single, statNum As String, statLabel As String, body As String, accentColor As Long)
    Dim shp As PowerPoint.Shape
    
    Set shp = sld.Shapes.AddShape(msoShapeRoundedRectangle, left, top, width, height)
    shp.Fill.Solid: shp.Fill.ForeColor.RGB = RGB(255, 255, 255)
    shp.Line.ForeColor.RGB = RGB(226, 232, 240): shp.Line.Weight = 1.2
    shp.Adjustments.Item(1) = 0.08
    
    Set shp = sld.Shapes.AddTextbox(msoTextOrientationHorizontal, left + 10, top + 12, width - 20, 42)
    shp.TextFrame.WordWrap = msoTrue
    shp.TextFrame.TextRange.Text = statNum
    shp.TextFrame.TextRange.Font.Name = "Segoe UI"
    shp.TextFrame.TextRange.Font.Size = 24: shp.TextFrame.TextRange.Font.Bold = msoTrue
    shp.TextFrame.TextRange.Font.Color.RGB = accentColor
    
    Set shp = sld.Shapes.AddTextbox(msoTextOrientationHorizontal, left + 10, top + 55, width - 20, 28)
    shp.TextFrame.WordWrap = msoTrue
    shp.TextFrame.TextRange.Text = statLabel
    shp.TextFrame.TextRange.Font.Name = "Segoe UI"
    shp.TextFrame.TextRange.Font.Size = 12: shp.TextFrame.TextRange.Font.Bold = msoTrue
    shp.TextFrame.TextRange.Font.Color.RGB = RGB(15, 23, 42)
    
    Set shp = sld.Shapes.AddTextbox(msoTextOrientationHorizontal, left + 10, top + 88, width - 20, height - 95)
    shp.TextFrame.WordWrap = msoTrue
    shp.TextFrame.TextRange.Text = body
    shp.TextFrame.TextRange.Font.Name = "Segoe UI"
    shp.TextFrame.TextRange.Font.Size = 9.5
    shp.TextFrame.TextRange.Font.Color.RGB = RGB(71, 85, 105)
End Sub

Private Sub SetSpeakerNote(sld As PowerPoint.Slide, notesText As String)
    On Error Resume Next
    sld.NotesPage.Shapes.Placeholders(2).TextFrame.TextRange.Text = notesText
    On Error GoTo 0
End Sub
```
