// SEED POLICY: dev/demo/QA only — never run against production.
import { PrismaClient, Prisma, DbUserRole, DbUserStatus, OutletType, OutletStatus, Brand, MaterialType, MouStatus, PlacementStatus, EquipmentStatus, BorrowStatus, EquipmentCondition, EventStatus, DocFileType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const toJson = (v: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue;

const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
const daysFromNow = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

// ============================================================================
// 1. CLEAN RESET PROTOCOL (Reverse FK Dependency Order)
// ============================================================================
async function cleanDatabase() {
  console.log("🧹 Cleaning database tables in reverse foreign-key order...");
  await prisma.borrowItem.deleteMany({});
  await prisma.borrowRecord.deleteMany({});
  await prisma.placement.deleteMany({});
  await prisma.mou.deleteMany({});
  await prisma.fieldEvent.deleteMany({});
  await prisma.contentPost.deleteMany({});
  await prisma.documentItem.deleteMany({});
  await prisma.monthlyReport.deleteMany({});
  await prisma.inventoryItem.deleteMany({});
  await prisma.outlet.deleteMany({});
  await prisma.material.deleteMany({});
  await prisma.branch.deleteMany({});
  await prisma.user.deleteMany({});
  console.log("✅ Database tables successfully truncated.");
}

// ============================================================================
// 2. AUTHENTICATION & USERS SEED (QA Roles Matrix)
// ============================================================================
async function seedUsers() {
  console.log("👤 Seeding authenticated QA user matrix...");
  const passwordHash = await bcrypt.hash(
    process.env.SEED_ADMIN_PASSWORD ?? "changeme123",
    10
  );

  const usersData: Array<{
    id: string;
    name: string;
    email: string;
    role: DbUserRole;
    status: DbUserStatus;
    avatar: string;
    assignedBranchIds?: string[];
  }> = [
    {
      id: "user-admin",
      name: "Budi Pratama (Super Admin)",
      email: process.env.SEED_ADMIN_EMAIL ?? "admin@vrelloup.dev",
      role: "ADMIN",
      status: "APPROVED",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80",
      assignedBranchIds: [],
    },
    {
      id: "user-supervisor",
      name: "Rian Hidayat (Area Supervisor)",
      email: "supervisor.rian@vrelloup.dev",
      role: "SUPERVISOR",
      status: "APPROVED",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80",
      assignedBranchIds: ["branch-1", "branch-2"],
    },
    {
      id: "user-staff-1",
      name: "Dewi Lestari (Field Staff)",
      email: "staff.dewi@vrelloup.dev",
      role: "STAFF",
      status: "APPROVED",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
      assignedBranchIds: ["branch-1"],
    },
    {
      id: "user-staff-2",
      name: "Agus Prabowo (Field Staff)",
      email: "staff.budi@vrelloup.dev",
      role: "STAFF",
      status: "APPROVED",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
      assignedBranchIds: ["branch-2"],
    },
    {
      id: "user-viewer",
      name: "Hendra Gunawan (Stakeholder)",
      email: "viewer.hendra@vrelloup.dev",
      role: "VIEWER",
      status: "APPROVED",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
      assignedBranchIds: [],
    },
    {
      id: "user-pending",
      name: "Siti Rahmawati (Pending Review)",
      email: "pending.siti@vrelloup.dev",
      role: "STAFF",
      status: "PENDING",
      avatar: "",
      assignedBranchIds: [],
    },
    {
      id: "user-rejected",
      name: "Rudi Hartono (Disapproved)",
      email: "rejected.agus@vrelloup.dev",
      role: "STAFF",
      status: "REJECTED",
      avatar: "",
      assignedBranchIds: [],
    },
  ];

  for (const u of usersData) {
    await prisma.user.create({
      data: {
        id: u.id,
        name: u.name,
        email: u.email,
        password: passwordHash,
        role: u.role,
        status: u.status,
        avatar: u.avatar,
        assignedBranchIds: u.assignedBranchIds ?? [],
        lastLoginAt: u.status === "APPROVED" ? daysAgo(1) : null,
      },
    });
  }
}

// ============================================================================
// 3. MASTER INFRASTRUCTURE (Materials & Branches)
// ============================================================================
async function seedMaterials() {
  console.log("🏷️ Seeding POSM materials catalog...");
  const materialsData: Array<{ id: string; type: MaterialType; name: string; requiresMou: boolean }> = [
    { id: "material-poster", type: "POSTER", name: "Poster Promosi A2/A3", requiresMou: false },
    { id: "material-shopblind", type: "SHOPBLIND", name: "Shopblind Kanopi Depan", requiresMou: true },
    { id: "material-sticker", type: "OTHER_MATERIALS", name: "Stiker Kaca & Etalase", requiresMou: false },
    { id: "material-bottom", type: "OTHER_MATERIALS", name: "Bottom Etalase Acrylic", requiresMou: false },
    { id: "material-banner", type: "BANNER", name: "Roll-up / X-Banner Display", requiresMou: false },
    { id: "material-signboard", type: "BRANDING_SIGNBOARD", name: "Branding Signboard / Neonbox", requiresMou: true },
    { id: "material-facade", type: "BRANDING_SIGNBOARD", name: "Fascia Wall Billboard", requiresMou: true },
  ];

  for (const m of materialsData) {
    await prisma.material.create({ data: m });
  }
}

async function seedBranches() {
  console.log("🏢 Seeding corporate branch offices...");
  const branchesData = [
    { id: "branch-1", code: "BR-SMG-01", name: "Semarang Pandanaran", region: "Central Java", city: "Semarang", status: "DONE" as const, picName: "Budi Santoso", picPhone: "+62 811-2345-001", address: "Jl. Pandanaran No. 58, Semarang" },
    { id: "branch-2", code: "BR-SMG-02", name: "Semarang Barat", region: "Central Java", city: "Semarang", status: "ON_PROGRESS" as const, picName: "Agus Prasetyo", picPhone: "+62 811-2345-002", address: "Jl. Siliwangi No. 120, Semarang" },
    { id: "branch-3", code: "BR-SLO-01", name: "Solo Slamet Riyadi", region: "Central Java", city: "Solo", status: "DONE" as const, picName: "Rina Wijaya", picPhone: "+62 812-3456-006", address: "Jl. Slamet Riyadi No. 275, Surakarta" },
    { id: "branch-4", code: "BR-SLO-02", name: "Solo Baru Sukoharjo", region: "Central Java", city: "Sukoharjo", status: "ON_PROGRESS" as const, picName: "Fajar Nugroho", picPhone: "+62 812-3456-007", address: "Jl. Ir. Soekarno No. 45, Sukoharjo" },
    { id: "branch-5", code: "BR-YOG-01", name: "Yogyakarta Malioboro", region: "DI Yogyakarta", city: "Yogyakarta", status: "DONE" as const, picName: "Siti Rahmawati", picPhone: "+62 813-4567-010", address: "Jl. Malioboro No. 62, Danurejan, Yogyakarta" },
    { id: "branch-6", code: "BR-YOG-02", name: "Sleman Kaliurang", region: "DI Yogyakarta", city: "Sleman", status: "ON_PROGRESS" as const, picName: "Dimas Anggara", picPhone: "+62 813-4567-013", address: "Jl. Kaliurang KM 8.5, Sinduharjo, Sleman" },
    { id: "branch-7", code: "BR-PWT-01", name: "Purwokerto Sudirman", region: "Central Java", city: "Purwokerto", status: "DONE" as const, picName: "Aris Munandar", picPhone: "+62 814-5678-022", address: "Jl. Jend. Sudirman No. 450, Purwokerto" },
    { id: "branch-8", code: "BR-MGL-01", name: "Magelang Pemuda", region: "Central Java", city: "Magelang", status: "ON_PROGRESS" as const, picName: "Citra Kirana", picPhone: "+62 815-6789-030", address: "Jl. Pemuda No. 156, Magelang Tengah" },
    { id: "branch-9", code: "BR-KDS-01", name: "Kudus Kota", region: "Central Java", city: "Kudus", status: "PENDING" as const, picName: "Dian Permata", picPhone: "+62 817-8901-045", address: "Jl. Sunan Kudus No. 90, Kudus" },
    { id: "branch-10", code: "BR-BDG-01", name: "Bandung Dago", region: "West Java", city: "Bandung", status: "DONE" as const, picName: "Yudi Purnomo", picPhone: "+62 818-9012-050", address: "Jl. Ir. H. Juanda No. 84, Bandung" },
    { id: "branch-11", code: "BR-SBY-01", name: "Surabaya Gubeng", region: "East Java", city: "Surabaya", status: "DONE" as const, picName: "Ahmad Fauzi", picPhone: "+62 819-0123-060", address: "Jl. Raya Gubeng No. 32, Surabaya" },
    { id: "branch-12", code: "BR-DPS-01", name: "Denpasar Teuku Umar", region: "Bali & Nusra", city: "Denpasar", status: "ON_PROGRESS" as const, picName: "Wayan Sudarma", picPhone: "+62 821-3104-0204", address: "Jl. Teuku Umar No. 119, Denpasar" },
  ];

  for (const b of branchesData) {
    await prisma.branch.create({ data: b });
  }
}

// ============================================================================
// 4. RETAIL OUTLETS SEED (All Store Types, Approval Lifecycles & QA Cases)
// ============================================================================
async function seedOutlets() {
  console.log("🏪 Seeding retail outlets with approval lifecycles & edge conditions...");
  const outletsData = [
    // 1. Healthy Flagship Modern Retail (Associated with branch-1, matches Berkah query)
    {
      id: "outlet-smg-001",
      code: "OUT-SMG-001",
      name: "Berkah Sinar Jaya Cellular",
      type: "MODERN_RETAIL" as OutletType,
      city: "Semarang",
      address: "Jl. Pemuda No. 18, Pandanaran, Semarang",
      picName: "Budi Santoso",
      picPhone: "+62 812-3456-7890",
      active: true,
      brand: "IM3" as Brand,
      latitude: -6.9826,
      longitude: 110.4091,
      branchId: "branch-1",
      status: "APPROVED" as OutletStatus,
      photoUrl: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=600&auto=format&fit=crop&q=80",
      approvedBy: "System Admin",
      approvedAt: daysAgo(120),
    },
    // 2. Traditional Store with Issue & Critical MoU
    {
      id: "outlet-smg-002",
      code: "OUT-SMG-002",
      name: "Warung Berkah Abadi Ponsel",
      type: "TRADITIONAL" as OutletType,
      city: "Semarang",
      address: "Jl. Majapahit No. 142, Gayamsari, Semarang",
      picName: "Agus Prasetyo",
      picPhone: "+62 813-9876-5432",
      active: true,
      brand: "IM3" as Brand,
      latitude: -7.0051,
      longitude: 110.4582,
      branchId: "branch-2",
      status: "APPROVED" as OutletStatus,
      photoUrl: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&auto=format&fit=crop&q=80",
      approvedBy: "System Admin",
      approvedAt: daysAgo(90),
    },
    // 3. Exclusive Store with High-Value Flagship MoU
    {
      id: "outlet-slo-001",
      code: "OUT-SLO-001",
      name: "Solo Megah Cellular Center",
      type: "EXCLUSIVE" as OutletType,
      city: "Solo",
      address: "Jl. Slamet Riyadi No. 312, Laweyan, Surakarta",
      picName: "Rina Wijaya",
      picPhone: "+62 812-7788-9900",
      active: true,
      brand: "TRI" as Brand,
      latitude: -7.5683,
      longitude: 110.8124,
      branchId: "branch-3",
      status: "APPROVED" as OutletStatus,
      photoUrl: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600&auto=format&fit=crop&q=80",
      approvedBy: "System Admin",
      approvedAt: daysAgo(150),
    },
    // 4. Campus Outlet with Impending Expiry MoU
    {
      id: "outlet-yog-001",
      code: "OUT-YOG-001",
      name: "Campus Cell Corner UGM",
      type: "CAMPUS_OUTLET" as OutletType,
      city: "Sleman",
      address: "Jl. Kaliurang KM 5, Caturtunggal, Depok, Sleman",
      picName: "Dimas Anggara",
      picPhone: "+62 813-1122-3344",
      active: true,
      brand: "IM3" as Brand,
      latitude: -7.7612,
      longitude: 110.3812,
      branchId: "branch-6",
      status: "APPROVED" as OutletStatus,
      photoUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&auto=format&fit=crop&q=80",
      approvedBy: "System Admin",
      approvedAt: daysAgo(180),
    },
    // 5. Pending Approval Outlet (Awaiting Admin Review in Queue)
    {
      id: "outlet-yog-002",
      code: "DRAFT-YOG-002",
      name: "Jogja Gadget Point Malioboro",
      type: "CAMPUS_OUTLET" as OutletType,
      city: "Yogyakarta",
      address: "Jl. Sosrowijayan No. 45, Gedongtengen, Yogyakarta",
      picName: "Siti Rahmawati",
      picPhone: "+62 813-5566-7788",
      active: true,
      brand: "TRI" as Brand,
      latitude: -7.7925,
      longitude: 110.3644,
      branchId: "branch-5",
      status: "PENDING_APPROVAL" as OutletStatus,
      photoUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&auto=format&fit=crop&q=80",
      submittedBy: "staff.dewi@vrelloup.dev",
    },
    // 6. Rejected Outlet with Detailed Rejection Reason
    {
      id: "outlet-slo-002",
      code: "DRAFT-SLO-002",
      name: "Kios Pulsa Pojok Pasar Klewer",
      type: "TRADITIONAL" as OutletType,
      city: "Solo",
      address: "Kompleks Pasar Klewer Blok C-12, Pasar Kliwon, Surakarta",
      picName: "Fajar Nugroho",
      picPhone: "+62 812-4455-6677",
      active: false,
      brand: "IM3" as Brand,
      latitude: -7.5756,
      longitude: 110.8289,
      branchId: "branch-4",
      status: "REJECTED" as OutletStatus,
      photoUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80",
      submittedBy: "staff.budi@vrelloup.dev",
      rejectionReason: "Lokasi berada di dalam lorong sempit tanpa akses pandang jalan raya. Visibilitas materi branding tidak memenuhi standar korporasi.",
    },
    // 7. Draft Outlet (Unsubmitted, Incomplete)
    {
      id: "outlet-mgl-001",
      code: "DRAFT-MGL-001",
      name: "Sentral Telepon Borobudur",
      type: "MODERN_RETAIL" as OutletType,
      city: "Magelang",
      address: "Jl. Badrawati No. 8, Borobudur, Magelang",
      picName: "Citra Kirana",
      picPhone: "+62 815-1234-5678",
      active: true,
      brand: "IM3" as Brand,
      latitude: -7.6079,
      longitude: 110.2038,
      branchId: "branch-8",
      status: "DRAFT" as OutletStatus,
      photoUrl: "",
      submittedBy: "staff.dewi@vrelloup.dev",
    },
    // 8. Cold / Orphan Outlet (Active but 0 MoUs, 0 Placements, 0 Events)
    {
      id: "outlet-kds-001",
      code: "OUT-KDS-001",
      name: "Kudus Pratama Phone Shop",
      type: "MODERN_RETAIL" as OutletType,
      city: "Kudus",
      address: "Jl. Ahmad Yani No. 88, Getas Pejaten, Jati, Kudus",
      picName: "Dian Permata",
      picPhone: "+62 817-9988-7766",
      active: true,
      brand: "TRI" as Brand,
      latitude: -6.8144,
      longitude: 110.8415,
      branchId: "branch-9",
      status: "APPROVED" as OutletStatus,
      photoUrl: "https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=600&auto=format&fit=crop&q=80",
      approvedBy: "System Admin",
      approvedAt: daysAgo(30),
    },
    // 9. Bali Exclusive Outlet with Anomaly Geolocation
    {
      id: "outlet-dps-001",
      code: "OUT-DPS-001",
      name: "Dewata Selular Premium Hub",
      type: "EXCLUSIVE" as OutletType,
      city: "Denpasar",
      address: "Jl. Teuku Umar No. 145, Dauh Puri Kauh, Denpasar Barat",
      picName: "Wayan Sudarma",
      picPhone: "+62 821-4433-2211",
      active: true,
      brand: "IM3" as Brand,
      latitude: -8.6748,
      longitude: 115.2075,
      branchId: "branch-12",
      status: "APPROVED" as OutletStatus,
      photoUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=600&auto=format&fit=crop&q=80",
      approvedBy: "System Admin",
      approvedAt: daysAgo(60),
    },
    // 10. Inactive / Retired Outlet
    {
      id: "outlet-pwt-001",
      code: "OUT-PWT-001",
      name: "Mitra Ponsel Purwokerto Lama",
      type: "TRADITIONAL" as OutletType,
      city: "Purwokerto",
      address: "Jl. Jenderal Gatot Subroto No. 12, Purwokerto Timur",
      picName: "Aris Munandar",
      picPhone: "+62 814-1122-8899",
      active: false,
      brand: "IM3" as Brand,
      latitude: -7.4243,
      longitude: 109.2391,
      branchId: "branch-7",
      status: "APPROVED" as OutletStatus,
      photoUrl: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&auto=format&fit=crop&q=80",
      approvedBy: "System Admin",
      approvedAt: daysAgo(300),
    },
    // 11. Soft-Deleted Historical Outlet (ADR-0053)
    {
      id: "outlet-del-999",
      code: "OUT-DEL-999",
      name: "Toko Legend Era Tutup (Soft-Deleted)",
      type: "TRADITIONAL" as OutletType,
      city: "Surabaya",
      address: "Jl. Veteran No. 99, Pasar Lama",
      picName: "Pak Legendaris",
      picPhone: "+62 819-9999-9999",
      active: false,
      brand: "IM3" as Brand,
      latitude: -7.2575,
      longitude: 112.7521,
      branchId: "branch-7",
      status: "APPROVED" as OutletStatus,
      photoUrl: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&auto=format&fit=crop&q=80",
      approvedBy: "System Admin",
      approvedAt: daysAgo(360),
      deletedAt: daysAgo(30),
    },
  ];

  for (const o of outletsData) {
    await prisma.outlet.create({ data: o });
  }
}

// ============================================================================
// 5. MOUS & CONTRACT FUNNEL (Dynamic Dates & QA Scenarios)
// ============================================================================
async function seedMous() {
  console.log("📑 Seeding legal MoUs (Expired, Expiring Soon, Pending Approval & Jumbo Contracts)...");
  const mousData = [
    // 1. Expired Contract (Triggers Critical Urgency in Pipeline)
    {
      id: "mou-exp-001",
      branchId: "branch-2",
      outletId: "outlet-smg-002",
      outletName: "Warung Berkah Abadi Ponsel",
      partnerName: "H. Sudirman Santoso",
      mouType: "EXCLUSIVE_BRANDING",
      submissionDate: daysAgo(420),
      startDate: daysAgo(410),
      endDate: daysAgo(45), // Expired 45 days ago
      status: "APPROVED" as MouStatus,
      picName: "Agus Prasetyo",
      picPhone: "+62 813-9876-5432",
      docPath: "https://storage.marcom-internal.corp/mou-documents/PKS_Warung_Berkah_Abadi_2025.pdf",
      docPaths: ["https://storage.marcom-internal.corp/mou-documents/PKS_Warung_Berkah_Abadi_2025.pdf"],
      compensationValue: 24000000,
      notes: "Kontrak telah habis masa berlakunya 45 hari lalu. Menunggu pengajuan perpanjangan sewa fascia toko.",
    },
    // 2. Near-Expiry Contract (Expiring in 8 Days -> SLA Warning)
    {
      id: "mou-soon-002",
      branchId: "branch-6",
      outletId: "outlet-yog-001",
      outletName: "Campus Cell Corner UGM",
      partnerName: "Prof. Ir. Bambang Soegito",
      mouType: "CAMPUS_PARTNERSHIP",
      submissionDate: daysAgo(360),
      startDate: daysAgo(355),
      endDate: daysFromNow(8), // Expiring in 8 days
      status: "APPROVED" as MouStatus,
      picName: "Dimas Anggara",
      picPhone: "+62 813-1122-3344",
      docPath: "https://storage.marcom-internal.corp/mou-documents/MOU_Campus_UGM_Canopy_2026.pdf",
      docPaths: ["https://storage.marcom-internal.corp/mou-documents/MOU_Campus_UGM_Canopy_2026.pdf"],
      compensationValue: 36000000,
      notes: "Sisa masa berlaku kontrak kurang dari 14 hari. Perlu follow up addendum perpanjangan display kanopi.",
    },
    // 3. Pending Approval Aging Contract (Submitted >60 Days Ago -> Bottleneck Alert)
    {
      id: "mou-sub-003",
      branchId: "branch-12",
      outletId: "outlet-dps-001",
      outletName: "Dewata Selular Premium Hub",
      partnerName: "I Made Sukadana",
      mouType: "FLAGSHIP_STORE",
      submissionDate: daysAgo(68), // Submitted 68 days ago
      startDate: null,
      endDate: null,
      status: "SUBMITTED" as MouStatus,
      picName: "Wayan Sudarma",
      picPhone: "+62 821-4433-2211",
      docPath: "https://storage.marcom-internal.corp/mou-documents/PKS_Dewata_Selular_Flagship_2026.pdf",
      docPaths: ["https://storage.marcom-internal.corp/mou-documents/PKS_Dewata_Selular_Flagship_2026.pdf"],
      compensationValue: 48000000,
      notes: "Dokumen MoU tertahan di meja legal regional selama lebih dari 60 hari karena revisi klausul termin pembayaran.",
    },
    // 4. Healthy Flagship Multi-Year Contract (Multi-Sheet Demonstration)
    {
      id: "mou-hlth-004",
      branchId: "branch-3",
      outletId: "outlet-slo-001",
      outletName: "Solo Megah Cellular Center",
      partnerName: "Kurniawan Widjaja",
      mouType: "EXCLUSIVE_BRANDING",
      submissionDate: daysAgo(90),
      startDate: daysAgo(85),
      endDate: daysFromNow(280), // Valid for 280 more days
      status: "APPROVED" as MouStatus,
      picName: "Rina Wijaya",
      picPhone: "+62 812-7788-9900",
      docPath: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1000&auto=format&fit=crop&q=80",
      docPaths: [
        "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1000&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=1000&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1000&auto=format&fit=crop&q=80",
      ],
      compensationValue: 150000000, // High-value IDR 150 Jt
      notes: "Kontrak kemitraan flagship 1 tahun penuh dengan hak eksklusif branding neon box dan shopblind. Dilengkapi 3 lembar lampiran fisik.",
    },
    // 5. Rejected MoU with Finance Disapproval Notes
    {
      id: "mou-rej-005",
      branchId: "branch-1",
      outletId: "outlet-smg-001",
      outletName: "Berkah Sinar Jaya Cellular",
      partnerName: "Budi Santoso",
      mouType: "SECONDARY_DISPLAY",
      submissionDate: daysAgo(30),
      startDate: null,
      endDate: null,
      status: "REJECTED" as MouStatus,
      picName: "Budi Santoso",
      picPhone: "+62 812-3456-7890",
      docPath: "",
      docPaths: [],
      compensationValue: 12000000,
      notes: "Ditolak oleh Manager Keuangan: Nilai kompensasi melebihi batas plafon regional untuk material display sekunder.",
    },
    // 6. Draft MoU (Zero Compensation, Initial In-Progress Work)
    {
      id: "mou-draft-006",
      branchId: "branch-8",
      outletId: "outlet-mgl-001",
      outletName: "Sentral Telepon Borobudur",
      partnerName: "Hj. Ratna Ningsih",
      mouType: "STANDARD_COMMERCIAL",
      submissionDate: daysAgo(5),
      startDate: null,
      endDate: null,
      status: "DRAFT" as MouStatus,
      picName: "Citra Kirana",
      picPhone: "+62 815-1234-5678",
      docPath: "",
      docPaths: [],
      compensationValue: 0,
      notes: "Draf awal perjanjian sedang disusun oleh tim operasional Magelang.",
    },
    // 7. Revision MoU (Under Review, Needs Correction)
    {
      id: "mou-rev-007",
      branchId: "branch-2",
      outletId: "outlet-smg-002",
      outletName: "Warung Berkah Abadi Ponsel",
      partnerName: "H. Sudirman Santoso (Perpanjangan)",
      mouType: "EXCLUSIVE_BRANDING",
      submissionDate: daysAgo(12),
      startDate: null,
      endDate: null,
      status: "REVISION" as MouStatus,
      picName: "Agus Prasetyo",
      picPhone: "+62 813-9876-5432",
      docPath: "https://storage.marcom-internal.corp/mou-documents/Draft_Addendum_Warung_Berkah_2026.pdf",
      docPaths: [
        "https://storage.marcom-internal.corp/mou-documents/Draft_Addendum_Warung_Berkah_2026.pdf",
      ],
      compensationValue: 28000000,
      notes: "Perlu revisi klausul termin pembayaran dari 3 termin menjadi 2 termin sesuai arahan PIC Cabang.",
    },
  ];

  for (const m of mousData) {
    await prisma.mou.create({ data: m });
  }
}

// ============================================================================
// 6. POSM PLACEMENTS (Done, Anomaly GPS, Issue Blocked, Extreme Dimensions)
// ============================================================================
async function seedPlacements() {
  console.log("📌 Seeding POSM placements (Valid, GPS Deviation >1km, Issue Blocked, Missing Coords)...");
  const placementsData = [
    // 1. Valid Done Placement with Accurate GPS
    {
      id: "plc-001",
      outletId: "outlet-smg-001",
      materialId: "material-shopblind",
      mouId: null,
      status: "DONE" as PlacementStatus,
      brand: "IM3" as Brand,
      date: daysAgo(20),
      picName: "Hendra Kurniawan (Vendor)",
      photoUrl: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&auto=format&fit=crop&q=80",
      dimensions: "300 x 90 cm",
      cost: 1450000,
      notes: "Pemasangan rapi dan terverifikasi di kanopi depan toko.",
      latitude: -6.98262,
      longitude: 110.40912,
      shareLocationUrl: "https://maps.google.com/?q=-6.98262,110.40912",
      locationNotes: "Check-in GPS akurat di teras toko (akurasi 8m).",
      quarter: "Q4 2026",
      campaignTheme: "Pesta Kuota Akhir Tahun",
      isLocationValid: true,
      locationDeviation: 12.4, // 12.4 meters deviation (healthy)
    },
    // 2. Anomaly GPS Deviation (>1.4 km deviation - Fraud/Incorrect check-in detection)
    {
      id: "plc-002",
      outletId: "outlet-dps-001",
      materialId: "material-signboard",
      mouId: "mou-sub-003",
      status: "DONE" as PlacementStatus,
      brand: "IM3" as Brand,
      date: daysAgo(14),
      picName: "I Ketut Suardika (Vendor)",
      photoUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=600&auto=format&fit=crop&q=80",
      dimensions: "400 x 120 cm",
      cost: 4200000,
      notes: "Foto bukti terunggah, namun sistem mendeteksi titik koordinat berada di luar radius outlet.",
      latitude: -8.6872,
      longitude: 115.2198,
      shareLocationUrl: "https://maps.google.com/?q=-8.6872,115.2198",
      locationNotes: "Peringatan Anomali GPS: Koordinat terdeteksi 1.450 meter dari titik master outlet.",
      quarter: "Q4 2026",
      campaignTheme: "Branding Flagship Denpasar",
      isLocationValid: false,
      locationDeviation: 1450.0, // High GPS deviation
    },
    // 3. Blocked Placement with ISSUE Status (Renovation obstacle)
    {
      id: "plc-003",
      outletId: "outlet-smg-002",
      materialId: "material-signboard",
      mouId: "mou-exp-001",
      status: "ISSUE" as PlacementStatus,
      brand: "IM3" as Brand,
      date: daysAgo(40),
      picName: "Agus Prasetyo",
      photoUrl: "",
      dimensions: "350 x 100 cm",
      cost: 3800000,
      notes: "KENDALA: Pemilik outlet sedang merenovasi fasad bangunan toko. Pemasangan signboard ditunda hingga renovasi selesai.",
      latitude: -7.0051,
      longitude: 110.4582,
      shareLocationUrl: "",
      locationNotes: "Survei awal dilakukan, pengerjaan ditahan.",
      quarter: "Q3 2026",
      campaignTheme: "Sinergi Outlet Tradisional",
      isLocationValid: true,
      locationDeviation: 0,
    },
    // 4. In-Progress Placement without Coordinates (Missing Map Pinning)
    {
      id: "plc-004",
      outletId: "outlet-yog-001",
      materialId: "material-banner",
      mouId: "mou-soon-002",
      status: "ON_PROGRESS" as PlacementStatus,
      brand: "IM3" as Brand,
      date: daysAgo(3),
      picName: "Dimas Anggara",
      photoUrl: "",
      dimensions: "85 x 200 cm",
      cost: 450000,
      notes: "Material banner sedang dalam proses pengiriman dari percetakan regional.",
      latitude: null,
      longitude: null,
      shareLocationUrl: "",
      locationNotes: "Belum dilakukan check-in fisik lokasi.",
      quarter: "Q4 2026",
      campaignTheme: "IM3 Colabonation Campus Tour",
      isLocationValid: true,
      locationDeviation: null,
    },
    // 5. Extreme Dimensions Facade Billboard
    {
      id: "plc-005",
      outletId: "outlet-slo-001",
      materialId: "material-facade",
      mouId: "mou-hlth-004",
      status: "DONE" as PlacementStatus,
      brand: "TRI" as Brand,
      date: daysAgo(60),
      picName: "Surya Gemilang Perkasa (Vendor)",
      photoUrl: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600&auto=format&fit=crop&q=80",
      dimensions: "1200 x 400 cm", // Extreme dimensions
      cost: 18500000,
      notes: "Instalasi billboard jumbo di dinding samping gedung Solo Megah Cellular.",
      latitude: -7.56832,
      longitude: 110.81245,
      shareLocationUrl: "https://maps.google.com/?q=-7.56832,110.81245",
      locationNotes: "Verifikasi struktural selesai, lampu sorot LED menyala aktif.",
      quarter: "Q3 2026",
      campaignTheme: "Tri Jaringan Cepat Juara",
      isLocationValid: true,
      locationDeviation: 6.8,
    },
    // 6. Permanent Material without MoU (Policy Warning Case)
    {
      id: "plc-006",
      outletId: "outlet-mgl-001",
      materialId: "material-signboard",
      mouId: null, // Requires MoU but unattached
      status: "NOT_STARTED" as PlacementStatus,
      brand: "IM3" as Brand,
      date: null,
      picName: "Citra Kirana",
      photoUrl: "",
      dimensions: "240 x 80 cm",
      cost: 2100000,
      notes: "PERINGATAN ATURAN: Signboard membutuhkan MoU legal sebelum vendor dapat memulai produksi fisik.",
      latitude: null,
      longitude: null,
      shareLocationUrl: "",
      locationNotes: "",
      quarter: "Q4 2026",
      campaignTheme: "Ekspansi Gerai Magelang",
      isLocationValid: true,
      locationDeviation: null,
    },
    // 7. Historical Placement on Soft-Deleted Outlet (ADR-0053 - Financial Preservation)
    {
      id: "plc-hist-999",
      outletId: "outlet-del-999",
      materialId: "material-shopblind",
      mouId: null,
      status: "DONE" as PlacementStatus,
      brand: "IM3" as Brand,
      date: daysAgo(180),
      picName: "Vendor Jawa Timur",
      photoUrl: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&auto=format&fit=crop&q=80",
      dimensions: "300 x 100 cm",
      cost: 1500000,
      notes: "Dokumentasi POSM historis tetap tersimpan utuh meskipun gerai telah dinonaktifkan.",
      latitude: -7.2575,
      longitude: 112.7521,
      shareLocationUrl: "https://maps.google.com/?q=-7.2575,112.7521",
      locationNotes: "Pemasangan selesai di gerai pasar lama.",
      quarter: "Q1 2026",
      campaignTheme: "Pesta Retensi Awal Tahun",
      isLocationValid: true,
      locationDeviation: 0,
    },
  ];

  for (const p of placementsData) {
    await prisma.placement.create({ data: p });
  }
}

// ============================================================================
// 7. INVENTORY EQUIPMENT CATALOG (5 Categories & Edge Statuses)
// ============================================================================
async function seedInventory() {
  console.log("📦 Seeding equipment inventory catalog (Available, Borrowed, Maintenance & Retired)...");
  const items = [
    { id: "inv-001", code: "TND-001", name: "Folding Tent Branding 3×3m", category: "Staging/Booth", brand: "IM3 Pro", description: "Tenda lipat kanopi anti-air untuk booth outdoor", totalUnits: 6, availableUnits: 4, photoUrl: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=400&auto=format&fit=crop&q=80", storageLocation: "Warehouse A - Rack 1", status: "AVAILABLE" as EquipmentStatus },
    { id: "inv-002", code: "TND-002", name: "Folding Tent Compact 2×2m", category: "Staging/Booth", brand: "Tri Juara", description: "Tenda stan sempit untuk aktivasi trotoar/pasar", totalUnits: 4, availableUnits: 0, photoUrl: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=400&auto=format&fit=crop&q=80", storageLocation: "Warehouse A - Rack 1", status: "BORROWED" as EquipmentStatus }, // Exhausted units
    { id: "inv-003", code: "SPK-001", name: "Portable PA Sound System 12-inch", category: "Audio/Visual", brand: "JBL Professional", description: "Speaker aktif troli baterai 150W dengan Bluetooth", totalUnits: 4, availableUnits: 3, photoUrl: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&auto=format&fit=crop&q=80", storageLocation: "AV Room - Shelf A", status: "AVAILABLE" as EquipmentStatus },
    { id: "inv-004", code: "MIC-001", name: "Wireless Dual Handheld Microphone", category: "Audio/Visual", brand: "Shure Vocal", description: "Mikrofon nirkabel UHF jarak jangkau 50 meter", totalUnits: 4, availableUnits: 3, photoUrl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&auto=format&fit=crop&q=80", storageLocation: "AV Room - Shelf A", status: "AVAILABLE" as EquipmentStatus },
    { id: "inv-005", code: "MIC-002", name: "Clip-on Lavalier Mic Wireless", category: "Audio/Visual", brand: "Saramonic", description: "Mikrofon jepit untuk MC & live streamer event", totalUnits: 2, availableUnits: 0, photoUrl: "", storageLocation: "Service Center Vendor", status: "MAINTENANCE" as EquipmentStatus }, // Under maintenance
    { id: "inv-006", code: "TV-001", name: 'Smart LED TV 43" Display Stand', category: "Merchandising/Display", brand: "Samsung Display", description: "TV showcase produk + bracket besi standing roda", totalUnits: 2, availableUnits: 1, photoUrl: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&auto=format&fit=crop&q=80", storageLocation: "Display Bay - Floor 1", status: "AVAILABLE" as EquipmentStatus },
    { id: "inv-007", code: "TBL-001", name: "Folding Registration Table 180cm", category: "Furniture/Logistics", brand: "Krisbow Heavy", description: "Meja lipat plastik tebal untuk regis peserta event", totalUnits: 8, availableUnits: 6, photoUrl: "", storageLocation: "Warehouse B - Bay 1", status: "AVAILABLE" as EquipmentStatus },
    { id: "inv-008", code: "CHR-001", name: "Stacking / Folding Chair", category: "Furniture/Logistics", brand: "Futura Standar", description: "Kursi lipat besi busa hitam", totalUnits: 25, availableUnits: 15, photoUrl: "", storageLocation: "Warehouse B - Bay 2", status: "AVAILABLE" as EquipmentStatus },
    { id: "inv-009", code: "GEN-001", name: "Silent Inverter Generator 2200W", category: "Electrical/Cables", brand: "Honda Silent", description: "Genset bensin hening untuk daya listrik lapangan", totalUnits: 2, availableUnits: 1, photoUrl: "", storageLocation: "Logistics Shed", status: "AVAILABLE" as EquipmentStatus },
    { id: "inv-010", code: "CBL-001", name: "Heavy Duty Cable Roll 50m", category: "Electrical/Cables", brand: "Uticon Outdoor", description: "Kabel gulung stop kontak 4 lubang pelindung karet", totalUnits: 6, availableUnits: 4, photoUrl: "", storageLocation: "Warehouse B - Rack 3", status: "AVAILABLE" as EquipmentStatus },
    { id: "inv-011", code: "DIS-OLD", name: "Legacy Acrylic Brochure Stand", category: "Merchandising/Display", brand: "Generic", description: "Stan brosur akrilik model lama, engsel retak", totalUnits: 2, availableUnits: 0, photoUrl: "", storageLocation: "Afkir Scrap Room", status: "RETIRED" as EquipmentStatus }, // Retired equipment
    { id: "inv-012", code: "TRP-001", name: "Waterproof Tarpaulin (4×6m)", category: "Furniture/Logistics", brand: "Krisbow Heavy", description: "Terpal waterproof tebal untuk pelindung booth outdoor", totalUnits: 5, availableUnits: 5, photoUrl: "", storageLocation: "Warehouse B - Rack 3", status: "AVAILABLE" as EquipmentStatus },
    { id: "inv-013", code: "HND-001", name: "Hand Truck / Heavy Sack Truck", category: "Furniture/Logistics", brand: "Krisbow Heavy", description: "Troli barang lipat kapasitas angkut 150kg", totalUnits: 3, availableUnits: 3, photoUrl: "", storageLocation: "Warehouse Entrance", status: "AVAILABLE" as EquipmentStatus },
  ];

  for (const item of items) {
    await prisma.inventoryItem.create({ data: item });
  }
}

// ============================================================================
// 8. FIELD EVENTS & FOOTAGE SEED (Upcoming, On Progress, Done & Cancelled)
// ============================================================================
async function seedFieldEvents() {
  console.log("🎪 Seeding field marketing events and media footages...");
  const events = [
    // 1. Upcoming Event Linked with Borrow Records
    {
      id: "event-001",
      name: "Roadshow Colabonation Campus Tour UGM",
      eventType: "CAMPUS_ROADSHOW",
      startDate: daysFromNow(4),
      endDate: daysFromNow(6),
      location: "Plaza Boulevard UGM, Bulaksumur, Yogyakarta",
      branchName: "Yogyakarta Malioboro",
      picName: "Dimas Anggara",
      status: "UPCOMING" as EventStatus,
      budget: 18500000,
      targetAttendee: 1500,
      attendeeCount: 0,
      notes: "Event aktivasi penetrasi kartu perdana mahasiswa baru dengan booth live gaming.",
      outletId: "outlet-yog-001",
    },
    // 2. Overdue Logistics Event (Event Ended but Equipment Unreturned)
    {
      id: "event-002",
      name: "Bazaar UMKM Festival Simpang Lima",
      eventType: "COMMUNITY_BAZAAR",
      startDate: daysAgo(10),
      endDate: daysAgo(6), // Ended 6 days ago
      location: "Lapangan Pancasila Simpang Lima, Semarang",
      branchName: "Semarang Pandanaran",
      picName: "Budi Santoso",
      status: "COMPLETED" as EventStatus,
      budget: 12000000,
      targetAttendee: 800,
      attendeeCount: 920,
      notes: "Aktivasi stan bazaar sembako murah IM3. Catatan: Alat logistik belum dikembalikan ke gudang.",
      outletId: "outlet-smg-001",
    },
    // 3. Completed Event with Video Documentation
    {
      id: "event-003",
      name: "Car Free Day Sehat Bersama Tri Solo",
      eventType: "CFD_ACTIVATION",
      startDate: daysAgo(25),
      endDate: daysAgo(25),
      location: "Jl. Slamet Riyadi KM 3, Surakarta",
      branchName: "Solo Slamet Riyadi",
      picName: "Rina Wijaya",
      status: "COMPLETED" as EventStatus,
      budget: 8500000,
      targetAttendee: 500,
      attendeeCount: 650,
      notes: "Senam zumba massal dan bagi-bagi merchandise starter pack Tri.",
      outletId: "outlet-slo-001",
    },
    // 4. Cancelled Event
    {
      id: "event-004",
      name: "Konser Mini Akustik Pantai Kuta",
      eventType: "MUSIC_CONCERT",
      startDate: daysAgo(5),
      endDate: daysAgo(5),
      location: "Area Parkir Pantai Kuta, Badung, Bali",
      branchName: "Denpasar Teuku Umar",
      picName: "Wayan Sudarma",
      status: "CANCELLED" as EventStatus,
      budget: 25000000,
      targetAttendee: 2000,
      attendeeCount: 0,
      notes: "DIBATALKAN: Cuaca ekstrim dan angin kencang di pesisir pantai tidak memungkinkan pendirian panggung.",
      outletId: "outlet-dps-001",
    },
  ];

  for (const e of events) {
    await prisma.fieldEvent.create({ data: e });
  }

  // Seed Media Attachments for Event-003
  await prisma.fieldEvent.update({
    where: { id: "event-003" },
    data: {
      mediaAttachments: [
        {
          id: "ftg-001",
          name: "Video Highlight Zumba Massal & Crowd 4K",
          sizeBytes: 45000000,
          type: "video",
          url: "https://storage.marcom-internal.corp/events/2026/cfd_solo_highlight.mp4",
          source: "gdrive",
          uploadedAt: new Date().toISOString(),
        },
        {
          id: "ftg-002",
          name: "Dokumentasi Penyerahan Hadiah Doorprize",
          sizeBytes: 18000000,
          type: "video",
          url: "https://storage.marcom-internal.corp/events/2026/cfd_solo_doorprize.mp4",
          source: "gdrive",
          uploadedAt: new Date().toISOString(),
        },
      ],
    },
  });
}

// ============================================================================
// 9. BORROW RECORDS & JUNCTION ITEMS (Overdue, Active, Damaged Return, Cancelled)
// ============================================================================
async function seedBorrowRecords() {
  console.log("🚚 Seeding equipment borrow records (Overdue, Damaged Returns, Active & Pending)...");
  
  // 1. Overdue Borrow Record (Due 6 days ago -> Triggers Red Overdue Chip)
  const brwOverdue = await prisma.borrowRecord.create({
    data: {
      id: "brw-rec-001",
      borrowCode: "BRW-20261015-001",
      borrowerName: "Budi Santoso",
      borrowerPhone: "+62 811-2345-001",
      borrowerDivision: "Field Marketing Semarang",
      picName: "Budi Santoso",
      eventId: "event-002",
      eventLocation: "Lapangan Pancasila Simpang Lima, Semarang",
      borrowDate: daysAgo(15),
      returnDueDate: daysAgo(6), // Due 6 days ago -> OVERDUE
      returnDate: null,
      status: "OVERDUE" as BorrowStatus,
      purpose: "Logistik Stan Bazaar UMKM Festival Simpang Lima",
      notes: "DIPERINGATKAN: Belum dikembalikan ke gudang Semarang setelah event selesai.",
      approvedBy: "System Admin",
      approvedAt: daysAgo(14),
      items: {
        create: [
          {
            inventoryItemId: "inv-001", // Tenda 3x3
            quantity: 2,
            conditionOut: "GOOD" as EquipmentCondition,
            conditionIn: null,
            notes: "Kondisi keluar lengkap dengan pasak besi dan tas kanvas.",
          },
          {
            inventoryItemId: "inv-003", // Speaker Portable
            quantity: 1,
            conditionOut: "GOOD" as EquipmentCondition,
            conditionIn: null,
            notes: "Disertai 1 charger adaptor orisinil.",
          },
        ],
      },
    },
  });

  // 2. Active Borrow Record (Due in 4 days)
  await prisma.borrowRecord.create({
    data: {
      id: "brw-rec-002",
      borrowCode: "BRW-20261028-002",
      borrowerName: "Dimas Anggara",
      borrowerPhone: "+62 813-4567-013",
      borrowerDivision: "Creative & Activation DIY",
      picName: "Dimas Anggara",
      eventId: "event-001",
      eventLocation: "Plaza Boulevard UGM, Yogyakarta",
      borrowDate: daysAgo(2),
      returnDueDate: daysFromNow(4), // Due in 4 days
      returnDate: null,
      status: "ACTIVE" as BorrowStatus,
      purpose: "Peralatan Roadshow Colabonation UGM",
      notes: "Penggunaan outdoor di kampus UGM selama 3 hari.",
      approvedBy: "System Admin",
      approvedAt: daysAgo(2),
      items: {
        create: [
          {
            inventoryItemId: "inv-002", // Tenda 2x2 (Total 4, all active)
            quantity: 4,
            conditionOut: "GOOD" as EquipmentCondition,
            conditionIn: null,
            notes: "Semua 4 unit dipinjam untuk booth registrasi.",
          },
          {
            inventoryItemId: "inv-007", // Meja Lipat
            quantity: 2,
            conditionOut: "GOOD" as EquipmentCondition,
            conditionIn: null,
          },
        ],
      },
    },
  });

  // 3. Pending Borrow Request (Awaiting Admin Approval)
  await prisma.borrowRecord.create({
    data: {
      id: "brw-rec-003",
      borrowCode: "BRW-20261030-003",
      borrowerName: "Dewi Lestari",
      borrowerPhone: "+62 812-3456-7890",
      borrowerDivision: "Field Marketing Semarang",
      picName: "Dewi Lestari",
      eventId: null,
      eventLocation: "Pameran Komputer Java Supermall Semarang",
      borrowDate: daysFromNow(2),
      returnDueDate: daysFromNow(7),
      returnDate: null,
      status: "PENDING" as BorrowStatus,
      purpose: "Stan promosi bundling paket internet di pameran komputer",
      notes: "Menunggu persetujuan kepala logistik / admin.",
      items: {
        create: [
          {
            inventoryItemId: "inv-006", // LED TV 43"
            quantity: 1,
            conditionOut: "GOOD" as EquipmentCondition,
            conditionIn: null,
            notes: "Untuk display looping video promosi paket data.",
          },
        ],
      },
    },
  });

  // 4. Returned with Major Damage & Lost Item Check-in (Pending Settlement)
  await prisma.borrowRecord.create({
    data: {
      id: "brw-rec-004",
      borrowCode: "BRW-20261010-004",
      borrowerName: "Rina Wijaya",
      borrowerPhone: "+62 812-3456-006",
      borrowerDivision: "Activation Solo",
      picName: "Rina Wijaya",
      eventId: "event-003",
      eventLocation: "Jl. Slamet Riyadi KM 3, Surakarta",
      borrowDate: daysAgo(26),
      returnDueDate: daysAgo(24),
      returnDate: daysAgo(23),
      status: "RETURNED" as BorrowStatus,
      purpose: "Peralatan CFD Solo Bersama Tri",
      notes: "Peralatan dikembalikan dengan insiden kerusakan akibat hujan deras.",
      approvedBy: "System Admin",
      approvedAt: daysAgo(26),
      returnNotes: "LAPORAN KERUSAKAN: 1 unit Tenda 3x3 mengalami sobek pada atap terpal karena tersangkut ranting pohon (MAJOR_DAMAGE). 1 unit Mikrofon Wireless hilang di lokasi CFD (LOST). Divisi Solo telah menyepakati penggantian biaya perbaikan.",
      compensationAmount: 650000,
      compensationStatus: "PENDING_SETTLEMENT",
      compensationNotes: "Biaya ganti rugi 1 unit mic hilang dan perbaikan terpal tenda.",
      damagePhotos: [
        "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&auto=format&fit=crop&q=80",
      ],
      items: {
        create: [
          {
            inventoryItemId: "inv-004", // Mic Wireless
            quantity: 1,
            conditionOut: "GOOD" as EquipmentCondition,
            conditionIn: "LOST" as EquipmentCondition, // LOST equipment
            goodUnits: 0,
            minorDamageUnits: 0,
            majorDamageUnits: 0,
            lostUnits: 1,
            notes: "Unit mikrofon hilang, transmitter masih ada.",
          },
          {
            inventoryItemId: "inv-008", // Kursi Lipat
            quantity: 10,
            conditionOut: "GOOD" as EquipmentCondition,
            conditionIn: "GOOD" as EquipmentCondition,
            goodUnits: 10,
            minorDamageUnits: 0,
            majorDamageUnits: 0,
            lostUnits: 0,
            notes: "10 kursi kembali bersih dan utuh.",
          },
        ],
      },
    },
  });

  // 5. Returned & Resolved with Item Replacement (ADR-0052)
  await prisma.borrowRecord.create({
    data: {
      id: "brw-rec-005",
      borrowCode: "BRW-20261005-005",
      borrowerName: "Agus Pratama",
      borrowerPhone: "+62 813-9876-005",
      borrowerDivision: "Activation Semarang",
      picName: "Agus Pratama",
      eventId: "event-002",
      eventLocation: "Mall Ciputra Simpang Lima, Semarang",
      borrowDate: daysAgo(30),
      returnDueDate: daysAgo(25),
      returnDate: daysAgo(24),
      status: "RETURNED" as BorrowStatus,
      purpose: "Eksibisi Launching Paket Baru",
      notes: "Peminjaman stand banner dan mic.",
      approvedBy: "System Admin",
      approvedAt: daysAgo(30),
      returnNotes: "Pengembalian selesai dengan 1 unit mic rusak.",
      compensationAmount: 450000,
      compensationStatus: "RESOLVED",
      compensationNotes: "Telah diganti dengan 1 unit mikrofon Shure baru.",
      damagePhotos: [
        "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&auto=format&fit=crop&q=80",
      ],
      settlementType: "ITEM_REPLACEMENT",
      settledAmount: 0,
      settledAt: daysAgo(22),
      settledBy: "Warehouse Admin",
      settlementNotes: "Menyerahkan 1 unit mic pengganti fisik baru dan telah diverifikasi masuk gudang.",
      settlementProofUrls: [
        "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
      ],
      items: {
        create: [
          {
            inventoryItemId: "inv-004", // Mic Wireless
            quantity: 1,
            conditionOut: "GOOD" as EquipmentCondition,
            conditionIn: "MAJOR_DAMAGE" as EquipmentCondition,
            goodUnits: 0,
            minorDamageUnits: 0,
            majorDamageUnits: 1,
            lostUnits: 0,
            notes: "Unit lama rusak berat, telah diganti unit baru saat pelunasan.",
          },
        ],
      },
    },
  });
}

// ============================================================================
// 10. DIGITAL CONTENT POSTS (Multi-Platform, Revision Needed & Scheduled)
// ============================================================================
async function seedContentPosts() {
  console.log("📱 Seeding digital content posts (Instagram, TikTok, YouTube & Revisions)...");
  const posts = [
    // 1. Published Viral Reel
    {
      id: "cnt-001",
      title: "Review Jujur Sinyal IM3 5G di Kampus UGM",
      platform: "instagram",
      format: "reel",
      publishDate: daysAgo(3),
      status: "PUBLISHED",
      caption: "Tes kecepatan internet IM3 di berbagai sudut kampus UGM Jogja! Siapa yang kuliah di sini dan udah cobain kuota hematnya? 🔥 #IM3Colabonation #KencangTanpaKompromi",
      mediaUrl: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=80",
      branchName: "Yogyakarta Malioboro",
      picName: "Dimas Anggara",
      outletId: "outlet-yog-001",
      subtasks: toJson([
        { id: "sub-1", title: "Shoot video speedtest di perpustakaan UGM", done: true },
        { id: "sub-2", title: "Review visual grading tone kuning khas IM3", done: true },
      ]),
    },
    // 2. Revision Needed (Clear Feedback Notes & Subtasks)
    {
      id: "cnt-002",
      title: "Tutorial Klaim Kuota Bonus Tri via Aplikasi bima+",
      platform: "tiktok",
      format: "reel",
      publishDate: daysFromNow(2),
      status: "REVISION",
      caption: "Gampang banget! Begini cara redeem bonus kuota 30GB buat kamu pengguna setia Tri. Simak sampai habis ya! ✨ #TriJuara #BimaPlus",
      mediaUrl: "https://images.unsplash.com/photo-1611605698335-8b1569810432?w=600&auto=format&fit=crop&q=80",
      branchName: "Solo Slamet Riyadi",
      picName: "Rina Wijaya",
      outletId: "outlet-slo-001",
      revisionNotes: "CATATAN REVISI: Font teks subtitle di detik ke 0:15 tertutup tombol like TikTok. Warna logo Tri di pojok kanan atas mohon ganti ke aset resmi resolusi tinggi.",
      subtasks: toJson([
        { id: "sub-3", title: "Reposition teks subtitle agar tidak menabrak UI TikTok", done: false },
        { id: "sub-4", title: "Ganti logo Tri dengan file vector SVG high-res", done: false },
        { id: "sub-5", title: "Tambahkan audio trending pop terkini", done: true },
      ]),
    },
    // 3. In Review Post
    {
      id: "cnt-003",
      title: "Infografis Promo Bundling Starter Pack Semarang",
      platform: "instagram",
      format: "carousel",
      publishDate: daysFromNow(5),
      status: "IN_REVIEW",
      caption: "Makin hemat internetan sepanjang akhir tahun dengan paket kuota data spesial Semarang! Cek slide berikutnya untuk detail paket. 📲",
      mediaUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80",
      branchName: "Semarang Pandanaran",
      picName: "Dewi Lestari",
      outletId: "outlet-smg-001",
      subtasks: toJson([]),
    },
    // 4. Scheduled YouTube Shorts
    {
      id: "cnt-004",
      title: "Suasana Heboh Bazaar UMKM Simpang Lima Bersama IM3",
      platform: "youtube",
      format: "reel",
      publishDate: daysFromNow(1),
      status: "SCHEDULED",
      caption: "Keseruan stan IM3 di Lapangan Simpang Lima Semarang kemarin! Banyak games seru dan voucher belanja gratis lho. 🎁",
      mediaUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&auto=format&fit=crop&q=80",
      branchName: "Semarang Pandanaran",
      picName: "Budi Santoso",
      outletId: "outlet-smg-002",
      subtasks: toJson([]),
    },
  ];

  for (const post of posts) {
    await prisma.contentPost.create({ data: post });
  }
}

// ============================================================================
// 11. DOCUMENTS & STRUCTURED MONTHLY REPORTS
// ============================================================================
async function seedDocumentsAndReports() {
  console.log("📂 Seeding documents catalog & executive quarterly reports...");
  const documents = [
    {
      id: "doc-001",
      name: "Panduan Brand Guidelines IM3 2026 Versi Lengkap",
      category: "Brand Guidelines",
      period: "2026",
      branchName: "Semarang Pandanaran",
      ownerPic: "Budi Santoso",
      fileType: "PDF" as DocFileType,
      fileSizeMb: 14.8,
      filePath: "https://storage.marcom-internal.corp/guidelines/IM3_Brand_Book_2026.pdf",
      description: "Standard Operating Procedure untuk penerapan logo, palet warna kuning #FFD800, tipografi, dan tata letak kanopi outlet.",
    },
    {
      id: "doc-002",
      name: "Rekap Arsip MoU Regional Central Java Q3-2026",
      category: "Legal & MoU",
      period: "Q3 2026",
      branchName: "Semarang Pandanaran",
      ownerPic: "Agus Prasetyo",
      fileType: "ZIP" as DocFileType,
      fileSizeMb: 88.5, // Large file QA scenario
      filePath: "https://storage.marcom-internal.corp/archives/2026/MOU_Central_Java_Q3_Archived.zip",
      description: "Arsip kompresi ZIP berisi seluruh scan PDF perjanjian kerjasama outlet di wilayah Semarang dan Solo.",
    },
    {
      id: "doc-003",
      name: "Template Perjanjian Kerjasama Gerai Eksklusif Tri",
      category: "Templates",
      period: "2026",
      branchName: "Solo Slamet Riyadi",
      ownerPic: "Rina Wijaya",
      fileType: "DOCX" as DocFileType,
      fileSizeMb: 2.1,
      filePath: "https://storage.marcom-internal.corp/templates/Draft_PKS_Gerai_Tri_2026.docx",
      description: "Draf master word template untuk kontrak kemitraan toko eksklusif.",
    },
    {
      id: "doc-004",
      name: "Data Mentah Log Audit GPS Penempatan POSM",
      category: "Audit Logs",
      period: "Oktober 2026",
      branchName: "Denpasar Teuku Umar",
      ownerPic: "Wayan Sudarma",
      fileType: "CSV" as DocFileType,
      fileSizeMb: 4.6,
      filePath: "https://storage.marcom-internal.corp/audit/gps_checkin_logs_oct2026.csv",
      description: "Ekspor tabel CSV koordinat check-in vendor beserta kalkulasi deviasi radius meter.",
    },
  ];

  for (const doc of documents) {
    await prisma.documentItem.create({ data: doc });
  }

  // Seed Monthly Reports
  const reports = [
    {
      id: "rep-2026-q3",
      month: "September",
      year: 2026,
      summary: {
        headline: "Realisasi Pemasangan POSM Q3 Mencapai 88% di Seluruh Regional Jawa Tengah & DIY",
        totalBudgetSpent: 145000000,
        completedPlacements: 18,
        activeOutlets: 10,
        mouComplianceRate: "92%",
      },
      activities: [
        "Audit berkala titik signboard di Semarang dan Solo",
        "Aktivasi campus roadshow di 3 universitas negeri",
        "Pemberian sertifikat kemitraan outlet terbaik",
      ],
      achievements: [
        "Peningkatan brand recall IM3 sebesar 14% di area kampus",
        "Penyelesaian sengketa sewa etalase di 2 outlet tradisional",
      ],
      keyIssues: [
        "Keterlambatan suplai bahan kain shopblind dari vendor percetakan",
        "Deviasi lokasi GPS pada check-in vendor di beberapa titik Bali",
      ],
      actionPlans: [
        "Menambah vendor cadangan untuk cetak kanopi tahan cuaca",
        "Mewajibkan validasi foto geolokasi dua tahap pada aplikasi",
      ],
    },
  ];

  for (const r of reports) {
    await prisma.monthlyReport.create({
      data: {
        id: r.id,
        month: r.month,
        year: r.year,
        summary: toJson(r.summary),
        activities: toJson(r.activities),
        achievements: toJson(r.achievements),
        keyIssues: toJson(r.keyIssues),
        actionPlans: toJson(r.actionPlans),
      },
    });
  }
}

// ============================================================================
// MAIN EXECUTION ORCHESTRATOR
// ============================================================================
async function main() {
  console.log("==================================================================");
  console.log("🚀 STARTING DETERMINISTIC COMPREHENSIVE QA DATABASE SEEDER");
  console.log("==================================================================");
  const startTime = Date.now();

  await cleanDatabase();
  await seedUsers();
  await seedMaterials();
  await seedBranches();
  await seedOutlets();
  await seedMous();
  await seedPlacements();
  await seedInventory();
  await seedFieldEvents();
  await seedBorrowRecords();
  await seedContentPosts();
  await seedDocumentsAndReports();

  const counts: Record<string, number> = {
    users: await prisma.user.count(),
    branches: await prisma.branch.count(),
    materials: await prisma.material.count(),
    outlets: await prisma.outlet.count(),
    mous: await prisma.mou.count(),
    placements: await prisma.placement.count(),
    inventoryItems: await prisma.inventoryItem.count(),
    fieldEvents: await prisma.fieldEvent.count(),
    borrowRecords: await prisma.borrowRecord.count(),
    borrowItems: await prisma.borrowItem.count(),
    contentPosts: await prisma.contentPost.count(),
    documentItems: await prisma.documentItem.count(),
    monthlyReports: await prisma.monthlyReport.count(),
  };

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log("\n==================================================================");
  console.log(`✨ SEED COMPLETED SUCCESSFULLY IN ${elapsed}s!`);
  console.log("==================================================================");
  console.table(counts);

  console.log("\n🔐 QA TEST CREDENTIALS (Password: changeme123):");
  console.log("  • Super Admin:       admin@vrelloup.dev");
  console.log("  • Field Staff 1:     staff.dewi@vrelloup.dev");
  console.log("  • Field Staff 2:     staff.budi@vrelloup.dev");
  console.log("  • Read-Only Viewer:  viewer.hendra@vrelloup.dev");
  console.log("  • Pending Account:   pending.siti@vrelloup.dev");
  console.log("  • Rejected Account:  rejected.agus@vrelloup.dev\n");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
