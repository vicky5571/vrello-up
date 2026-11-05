// ============================================================================
// vrello-up — Production-Grade Marcom & Operational Management Seed Script
// Brand Coverage: Indosat Ooredoo Hutchison (IM3 & Tri)
// Architecture: Single-Tenant Enterprise System (ADR-0001 through ADR-0055)
// ============================================================================

import {
  PrismaClient,
  Prisma,
  DbUserRole,
  DbUserStatus,
  BranchStatus,
  OutletType,
  OutletStatus,
  Brand,
  MaterialType,
  MouStatus,
  PlacementStatus,
  EventStatus,
  EquipmentStatus,
  BorrowStatus,
  EquipmentCondition,
  DocFileType,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const toJson = (v: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue;

const now = new Date();
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
const daysFromNow = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

// ============================================================================
// 1. TRUNCATION PROTOCOL (Reverse Foreign-Key Dependency Order)
// ============================================================================
async function cleanDatabase() {
  console.log("🧹 [1/11] Cleaning database tables in reverse foreign-key order...");
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
  console.log("   ✅ Database tables successfully truncated.");
}

// ============================================================================
// 2. AUTHENTICATION & USERS SEED (model User)
// ============================================================================
async function seedUsers() {
  console.log("👤 [2/11] Seeding authenticated QA user matrix...");
  const passwordHash = await bcrypt.hash(
    process.env.SEED_ADMIN_PASSWORD ?? "changeme123",
    10
  );

  const users: Array<{
    id: string;
    name: string;
    email: string;
    role: DbUserRole;
    status: DbUserStatus;
    avatar: string;
    assignedBranchIds: string[];
  }> = [
    // 1. Super Admin (Global Scope, Unrestricted Access)
    {
      id: "user-admin",
      name: "Budi Pratama (Super Admin)",
      email: process.env.SEED_ADMIN_EMAIL ?? "admin@vrelloup.dev",
      role: DbUserRole.ADMIN,
      status: DbUserStatus.APPROVED,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
      assignedBranchIds: [],
    },
    // 2. Area Supervisor: Jabodetabek Cluster
    {
      id: "user-spv-jkt",
      name: "Hendra Kusuma (SPV Jabodetabek)",
      email: "spv.hendra@vrelloup.dev",
      role: DbUserRole.SUPERVISOR,
      status: DbUserStatus.APPROVED,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
      assignedBranchIds: ["branch-jkt-01", "branch-tgr-01"],
    },
    // 3. Area Supervisor: West Java Cluster
    {
      id: "user-spv-jabar",
      name: "Maya Safitri (SPV Jawa Barat)",
      email: "spv.maya@vrelloup.dev",
      role: DbUserRole.SUPERVISOR,
      status: DbUserStatus.APPROVED,
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
      assignedBranchIds: ["branch-bdg-01", "branch-crb-01"],
    },
    // 4. Area Supervisor: Semarang Pandanaran (Central Java)
    {
      id: "user-spv-smg",
      name: "Raden Mas Hartono (SPV Semarang Pandanaran)",
      email: "spv.semarang@vrelloup.dev",
      role: DbUserRole.SUPERVISOR,
      status: DbUserStatus.APPROVED,
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80",
      assignedBranchIds: ["branch-1"],
    },
    // 5. Field Staff: IM3 Jakarta Pusat
    {
      id: "user-staff-dewi",
      name: "Dewi Lestari",
      email: "staff.dewi@vrelloup.dev",
      role: DbUserRole.STAFF,
      status: DbUserStatus.APPROVED,
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
      assignedBranchIds: ["branch-jkt-01"],
    },
    // 6. Field Staff: Tri Semarang
    {
      id: "user-staff-budi",
      name: "Budi Santoso",
      email: "staff.budi@vrelloup.dev",
      role: DbUserRole.STAFF,
      status: DbUserStatus.APPROVED,
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
      assignedBranchIds: ["branch-1"],
    },
    // 6. Field Staff: IM3 Surabaya
    {
      id: "user-staff-dimas",
      name: "Dimas Anggara",
      email: "staff.dimas@vrelloup.dev",
      role: DbUserRole.STAFF,
      status: DbUserStatus.APPROVED,
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80",
      assignedBranchIds: ["branch-sby-01"],
    },
    // 7. Field Staff: Tri Bali & Nusra
    {
      id: "user-staff-rina",
      name: "Rina Wijaya",
      email: "staff.rina@vrelloup.dev",
      role: DbUserRole.STAFF,
      status: DbUserStatus.APPROVED,
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80",
      assignedBranchIds: ["branch-dps-01"],
    },
    // 8. Field Staff: IM3 Medan
    {
      id: "user-staff-fauzi",
      name: "Ahmad Fauzi",
      email: "staff.fauzi@vrelloup.dev",
      role: DbUserRole.STAFF,
      status: DbUserStatus.APPROVED,
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80",
      assignedBranchIds: ["branch-mdn-01"],
    },
    // 9. Warehouse Logistics Officer: Central Warehouse Jakarta (Four-Eyes RBAC)
    {
      id: "user-wh-joko",
      name: "Joko Widodo (Warehouse Lead Jakarta)",
      email: "warehouse.joko@vrelloup.dev",
      role: DbUserRole.WAREHOUSE,
      status: DbUserStatus.APPROVED,
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80",
      assignedBranchIds: ["branch-jkt-01", "branch-tgr-01"],
    },
    // 10. Warehouse Logistics Officer: Hub Semarang
    {
      id: "user-wh-slamet",
      name: "Slamet Riyadi (Warehouse Lead Semarang)",
      email: "warehouse.slamet@vrelloup.dev",
      role: DbUserRole.WAREHOUSE,
      status: DbUserStatus.APPROVED,
      avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80",
      assignedBranchIds: ["branch-1"],
    },
    // 11. Auditor / Executive Viewer (Read-Only)
    {
      id: "user-viewer-hendra",
      name: "Hendra Pratama (Auditor)",
      email: "viewer.hendra@vrelloup.dev",
      role: DbUserRole.VIEWER,
      status: DbUserStatus.APPROVED,
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
      assignedBranchIds: [],
    },
    // 12. QA Edge Case: Self-Registered Account Pending Approval
    {
      id: "user-pending-siti",
      name: "Siti Rahma (Self-Registered Applicant)",
      email: "pending.siti@vrelloup.dev",
      role: DbUserRole.STAFF,
      status: DbUserStatus.PENDING,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
      assignedBranchIds: ["branch-bdg-01"],
    },
    // 13. QA Edge Case: Rejected Account with Audit Trail
    {
      id: "user-rejected-agus",
      name: "Agus Setiawan (Blacklisted Contractor)",
      email: "rejected.agus@vrelloup.dev",
      role: DbUserRole.STAFF,
      status: DbUserStatus.REJECTED,
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
      assignedBranchIds: ["branch-jkt-01"],
    },
  ];

  for (const u of users) {
    await prisma.user.create({
      data: {
        ...u,
        password: passwordHash,
        lastLoginAt: u.status === DbUserStatus.APPROVED ? daysAgo(1) : null,
      },
    });
  }
  console.log(`   ✅ Seeded ${users.length} authenticated users.`);
}

// ============================================================================
// 3. REGIONAL BRANCHES SEED (model Branch)
// ============================================================================
async function seedBranches() {
  console.log("🏢 [3/11] Seeding regional operational branches...");
  const branches = [
    {
      id: "branch-jkt-01",
      code: "BR-JKT-01",
      name: "Jakarta Pusat & Thamrin",
      region: "Jabodetabek",
      city: "Jakarta Pusat",
      status: BranchStatus.DONE,
      picName: "Bambang Pamungkas",
      picPhone: "081211112222",
      address: "Gedung Indosat KPPTI, Jl. Medan Merdeka Barat No. 21, Gambir, Jakarta Pusat 10110",
    },
    {
      id: "branch-tgr-01",
      code: "BR-TGR-01",
      name: "Tangerang Selatan BSD",
      region: "Jabodetabek",
      city: "Tangerang Selatan",
      status: BranchStatus.ON_PROGRESS,
      picName: "Citra Kirana",
      picPhone: "081233334444",
      address: "Ruko BSD Sektor 7 Blok A No. 12-14, Jl. Pahlawan Seribu, Serpong, Tangerang Selatan 15322",
    },
    {
      id: "branch-bdg-01",
      code: "BR-BDG-01",
      name: "Bandung Dago Raya",
      region: "Jawa Barat",
      city: "Bandung",
      status: BranchStatus.DONE,
      picName: "Deden Ridwan",
      picPhone: "081555556666",
      address: "Jl. Ir. H. Juanda No. 145, Dago, Coblong, Kota Bandung, Jawa Barat 40135",
    },
    {
      id: "branch-crb-01",
      code: "BR-CRB-01",
      name: "Cirebon Kartini",
      region: "Jawa Barat",
      city: "Cirebon",
      status: BranchStatus.PENDING,
      picName: "Irfan Hakim",
      picPhone: "081577778888",
      address: "Jl. R.A. Kartini No. 48, Kejaksan, Kota Cirebon, Jawa Barat 45122",
    },
    {
      id: "branch-1",
      code: "BR-SMG-01",
      name: "Semarang Pandanaran",
      region: "Jawa Tengah",
      city: "Semarang",
      status: BranchStatus.DONE,
      picName: "Budi Santoso",
      picPhone: "08112345001",
      address: "Jl. Pandanaran No. 131, Mugassari, Semarang Selatan, Kota Semarang, Jawa Tengah 50249",
    },
    {
      id: "branch-4",
      code: "BR-SLO-02",
      name: "Solo Baru Sukoharjo",
      region: "Jawa Tengah",
      city: "Sukoharjo",
      status: BranchStatus.ON_PROGRESS,
      picName: "Fajar Nugroho",
      picPhone: "081234560077",
      address: "Jl. Ir. Soekarno No. 45, Solo Baru, Sukoharjo, Jawa Tengah 57552",
    },
    {
      id: "branch-sby-01",
      code: "BR-SBY-01",
      name: "Surabaya Pemuda",
      region: "Jawa Timur",
      city: "Surabaya",
      status: BranchStatus.DONE,
      picName: "Eko Prasetyo",
      picPhone: "081299990000",
      address: "Jl. Pemuda No. 88, Embong Kaliasin, Genteng, Kota Surabaya, Jawa Timur 60271",
    },
    {
      id: "branch-dps-01",
      code: "BR-DPS-01",
      name: "Denpasar Teuku Umar",
      region: "Bali-Nusra",
      city: "Denpasar",
      status: BranchStatus.ON_PROGRESS,
      picName: "Wayan Sudarma",
      picPhone: "081377778888",
      address: "Jl. Teuku Umar No. 120, Dauh Puri Kauh, Denpasar Barat, Kota Denpasar, Bali 80113",
    },
    {
      id: "branch-mdn-01",
      code: "BR-MDN-01",
      name: "Medan Balai Kota",
      region: "Sumatera Utara",
      city: "Medan",
      status: BranchStatus.DONE,
      picName: "Zulkifli Siregar",
      picPhone: "081266667777",
      address: "Jl. Balai Kota No. 1, Kesawan, Medan Barat, Kota Medan, Sumatera Utara 20111",
    },
  ];

  for (const b of branches) {
    await prisma.branch.create({ data: b });
  }
  console.log(`   ✅ Seeded ${branches.length} operational branches.`);
}


// ============================================================================
// 4. MATERIALS CATALOG SEED (model Material)
// ============================================================================
async function seedMaterials() {
  console.log("🎨 [4/11] Seeding POSM branding materials catalog...");
  const materials = [
    {
      id: "material-poster",
      type: MaterialType.POSTER,
      name: "Poster Promosi A2 Art Carton 260g Full Color",
      requiresMou: false,
    },
    {
      id: "material-shopblind",
      type: MaterialType.SHOPBLIND,
      name: "Shopblind Kanvas Outdoor 300x100cm UV Resistant",
      requiresMou: true,
    },
    {
      id: "material-banner",
      type: MaterialType.BANNER,
      name: "X-Banner Indoor 60x160cm Albatros + Matte Lamination",
      requiresMou: false,
    },
    {
      id: "material-signboard",
      type: MaterialType.BRANDING_SIGNBOARD,
      name: "Signboard Acrylic LED 240x80cm Backlit Aluminium Frame",
      requiresMou: true,
    },
    {
      id: "material-sticker",
      type: MaterialType.OTHER_MATERIALS,
      name: "Neon Box Gantung 90x60cm Double Sided Slim Profile",
      requiresMou: true,
    },
    {
      id: "material-facade",
      type: MaterialType.BANNER,
      name: "Roll-up Banner Premium 85x200cm Stainless Steel Base",
      requiresMou: false,
    },
  ];

  for (const m of materials) {
    await prisma.material.create({ data: m });
  }
  console.log(`   ✅ Seeded ${materials.length} branding materials.`);
}

// ============================================================================
// 5. RETAIL OUTLET & POSM NETWORK SEED (model Outlet)
// ============================================================================
async function seedOutlets() {
  console.log("🏪 [5/11] Seeding retail outlet network & lifecycle states...");
  const outlets = [
    // --- Jabodetabek: Jakarta Pusat (branch-jkt-01) ---
    {
      id: "outlet-jkt-001",
      code: "JKT-THM-001",
      name: "Gerai IM3 Thamrin KPPTI",
      type: OutletType.EXCLUSIVE,
      address: "Lobby Gedung KPPTI, Jl. Medan Merdeka Barat No. 21, Gambir, Jakarta Pusat",
      city: "Jakarta Pusat",
      picName: "Bambang Pamungkas",
      picPhone: "081211112222",
      active: true,
      brand: Brand.IM3,
      latitude: -6.1754,
      longitude: 106.8228,
      branchId: "branch-jkt-01",
      status: OutletStatus.APPROVED,
      photoUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80",
      submittedBy: "staff.dewi@vrelloup.dev",
      rejectionReason: "",
      approvedBy: "Budi Pratama (Super Admin)",
      approvedAt: daysAgo(60),
      deletedAt: null,
    },
    {
      id: "outlet-jkt-002",
      code: "JKT-CPK-002",
      name: "Toko Sinar Rejeki Cell Cempaka Putih",
      type: OutletType.TRADITIONAL,
      address: "Jl. Cempaka Putih Tengah No. 42, Cempaka Putih, Jakarta Pusat",
      city: "Jakarta Pusat",
      picName: "H. Suryanto",
      picPhone: "081288881234",
      active: true,
      brand: Brand.IM3,
      latitude: -6.1823,
      longitude: 106.8687,
      branchId: "branch-jkt-01",
      status: OutletStatus.APPROVED,
      photoUrl: "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=500&auto=format&fit=crop&q=80",
      submittedBy: "staff.dewi@vrelloup.dev",
      rejectionReason: "",
      approvedBy: "Budi Pratama (Super Admin)",
      approvedAt: daysAgo(45),
      deletedAt: null,
    },
    {
      id: "outlet-jkt-003",
      code: "JKT-SAL-003",
      name: "Campus Store Universitas Salemba",
      type: OutletType.CAMPUS_OUTLET,
      address: "Kantin Pusat Kampus UI Salemba, Jl. Salemba Raya No. 4, Senen, Jakarta Pusat",
      city: "Jakarta Pusat",
      picName: "Rizky Ramadhan",
      picPhone: "089677771234",
      active: true,
      brand: Brand.TRI,
      latitude: -6.1952,
      longitude: 106.8504,
      branchId: "branch-jkt-01",
      status: OutletStatus.APPROVED,
      photoUrl: "https://images.unsplash.com/photo-1562774053-701939374585?w=500&auto=format&fit=crop&q=80",
      submittedBy: "staff.dewi@vrelloup.dev",
      rejectionReason: "",
      approvedBy: "Budi Pratama (Super Admin)",
      approvedAt: daysAgo(30),
      deletedAt: null,
    },
    // --- Jabodetabek: Tangerang Selatan (branch-tgr-01) ---
    {
      id: "outlet-tgr-001",
      code: "TGR-BSD-001",
      name: "3Store Mall @ Alam Sutera",
      type: OutletType.EXCLUSIVE,
      address: "Mall Alam Sutera Lantai 1 Unit 12B, Jl. Jalur Sutera Barat, Panunggangan Timur, Pinang, Tangerang",
      city: "Tangerang Selatan",
      picName: "Citra Kirana",
      picPhone: "081233334444",
      active: true,
      brand: Brand.TRI,
      latitude: -6.2227,
      longitude: 106.6534,
      branchId: "branch-tgr-01",
      status: OutletStatus.APPROVED,
      photoUrl: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=500&auto=format&fit=crop&q=80",
      submittedBy: "staff.dewi@vrelloup.dev",
      rejectionReason: "",
      approvedBy: "Budi Pratama (Super Admin)",
      approvedAt: daysAgo(50),
      deletedAt: null,
    },
    {
      id: "outlet-tgr-002",
      code: "TGR-SRP-002",
      name: "Raja Ponsel Serpong Jaya",
      type: OutletType.MODERN_RETAIL,
      address: "Ruko ITC BSD No. 8-9, Jl. Pahlawan Seribu, Serpong, Tangerang Selatan",
      city: "Tangerang Selatan",
      picName: "David Gunawan",
      picPhone: "081312349999",
      active: true,
      brand: Brand.IM3,
      latitude: -6.2995,
      longitude: 106.6669,
      branchId: "branch-tgr-01",
      status: OutletStatus.APPROVED,
      photoUrl: "https://images.unsplash.com/photo-1580913428023-02c695666d61?w=500&auto=format&fit=crop&q=80",
      submittedBy: "staff.dewi@vrelloup.dev",
      rejectionReason: "",
      approvedBy: "Budi Pratama (Super Admin)",
      approvedAt: daysAgo(25),
      deletedAt: null,
    },
    // --- Jawa Barat: Bandung (branch-bdg-01) ---
    {
      id: "outlet-bdg-001",
      code: "BDG-DGO-001",
      name: "Gerai IM3 Dago Flagship",
      type: OutletType.EXCLUSIVE,
      address: "Jl. Ir. H. Juanda No. 145, Dago, Coblong, Kota Bandung",
      city: "Bandung",
      picName: "Deden Ridwan",
      picPhone: "081555556666",
      active: true,
      brand: Brand.IM3,
      latitude: -6.8858,
      longitude: 107.6142,
      branchId: "branch-bdg-01",
      status: OutletStatus.APPROVED,
      photoUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&auto=format&fit=crop&q=80",
      submittedBy: "spv.maya@vrelloup.dev",
      rejectionReason: "",
      approvedBy: "Budi Pratama (Super Admin)",
      approvedAt: daysAgo(40),
      deletedAt: null,
    },
    {
      id: "outlet-bdg-002",
      code: "BDG-ITB-002",
      name: "Tri Corner Ganesha Salman ITB",
      type: OutletType.CAMPUS_OUTLET,
      address: "Kantin Kayu Depan Masjid Salman ITB, Jl. Ganesha No. 7, Siliwangi, Coblong, Bandung",
      city: "Bandung",
      picName: "Hilman Firdaus",
      picPhone: "089865432100",
      active: true,
      brand: Brand.TRI,
      latitude: -6.8933,
      longitude: 107.6097,
      branchId: "branch-bdg-01",
      status: OutletStatus.APPROVED,
      photoUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=500&auto=format&fit=crop&q=80",
      submittedBy: "spv.maya@vrelloup.dev",
      rejectionReason: "",
      approvedBy: "Budi Pratama (Super Admin)",
      approvedAt: daysAgo(35),
      deletedAt: null,
    },
    {
      id: "outlet-bdg-003",
      code: "BDG-BEC-003",
      name: "Dunia Seluler BEC Bandung",
      type: OutletType.MODERN_RETAIL,
      address: "Bandung Electronic Center Lt. 1 Blok B-08, Jl. Purnawarman No. 13-15, Babakan Ciamis, Sumur Bandung",
      city: "Bandung",
      picName: "Yudi Purnomo",
      picPhone: "081577771234",
      active: true,
      brand: Brand.IM3,
      latitude: -6.9082,
      longitude: 107.6092,
      branchId: "branch-bdg-01",
      status: OutletStatus.APPROVED,
      photoUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=500&auto=format&fit=crop&q=80",
      submittedBy: "spv.maya@vrelloup.dev",
      rejectionReason: "",
      approvedBy: "Budi Pratama (Super Admin)",
      approvedAt: daysAgo(20),
      deletedAt: null,
    },
    // --- Jawa Barat: Cirebon (branch-crb-01) ---
    {
      id: "outlet-crb-001",
      code: "CRB-CSB-001",
      name: "Sentral Pulsa Grage Cirebon",
      type: OutletType.MODERN_RETAIL,
      address: "Ruko Grage Mall Blok A No. 5, Jl. Tentara Pelajar No. 1, Kejaksan, Kota Cirebon",
      city: "Cirebon",
      picName: "Irfan Hakim",
      picPhone: "081577778888",
      active: true,
      brand: Brand.IM3,
      latitude: -6.7118,
      longitude: 108.5552,
      branchId: "branch-crb-01",
      status: OutletStatus.APPROVED,
      photoUrl: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&auto=format&fit=crop&q=80",
      submittedBy: "spv.maya@vrelloup.dev",
      rejectionReason: "",
      approvedBy: "Budi Pratama (Super Admin)",
      approvedAt: daysAgo(15),
      deletedAt: null,
    },
    // --- Jawa Tengah: Semarang (branch-1) ---
    {
      id: "outlet-smg-001",
      code: "SMG-PND-001",
      name: "Berkah Sinar Jaya Cellular (Gerai IM3 Pandanaran)",
      type: OutletType.EXCLUSIVE,
      address: "Jl. Pandanaran No. 131, Mugassari, Semarang Selatan, Kota Semarang",
      city: "Semarang",
      picName: "Budi Santoso",
      picPhone: "08112345001",
      active: true,
      brand: Brand.IM3,
      latitude: -6.9897,
      longitude: 110.4136,
      branchId: "branch-1",
      status: OutletStatus.APPROVED,
      photoUrl: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=500&auto=format&fit=crop&q=80",
      submittedBy: "staff.budi@vrelloup.dev",
      rejectionReason: "",
      approvedBy: "Budi Pratama (Super Admin)",
      approvedAt: daysAgo(75),
      deletedAt: null,
    },
    {
      id: "outlet-smg-002",
      code: "SMG-UND-002",
      name: "Warung Sinyal Tembalang Undip",
      type: OutletType.CAMPUS_OUTLET,
      address: "Jl. Prof. Soedarto No. 12, Tembalang, Kota Semarang",
      city: "Semarang",
      picName: "Arya Prasetya",
      picPhone: "089512345678",
      active: true,
      brand: Brand.TRI,
      latitude: -7.0508,
      longitude: 110.4357,
      branchId: "branch-1",
      status: OutletStatus.APPROVED,
      photoUrl: "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=500&auto=format&fit=crop&q=80",
      submittedBy: "staff.budi@vrelloup.dev",
      rejectionReason: "",
      approvedBy: "Budi Pratama (Super Admin)",
      approvedAt: daysAgo(50),
      deletedAt: null,
    },
    {
      id: "outlet-yog-001",
      code: "OUT-YOG-001",
      name: "Campus Cell Corner UGM",
      type: OutletType.CAMPUS_OUTLET,
      address: "Jl. Kaliurang KM 5, Caturtunggal, Depok, Sleman, DI Yogyakarta",
      city: "Sleman",
      picName: "Dimas Anggara",
      picPhone: "081311223344",
      active: true,
      brand: Brand.IM3,
      latitude: -7.7612,
      longitude: 110.3789,
      branchId: "branch-1",
      status: OutletStatus.APPROVED,
      photoUrl: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=500&auto=format&fit=crop&q=80",
      submittedBy: "staff.dimas@vrelloup.dev",
      rejectionReason: "",
      approvedBy: "Budi Pratama (Super Admin)",
      approvedAt: daysAgo(120),
      deletedAt: null,
    },
    {
      id: "outlet-smg-003",
      code: "SMG-SIM-003",
      name: "Pojok Seluler Simpang Lima",
      type: OutletType.TRADITIONAL,
      address: "Plaza Simpang Lima Lt. Dasar No. 18, Jl. Ahmad Yani No. 1, Semarang",
      city: "Semarang",
      picName: "Tri Handoko",
      picPhone: "081223456789",
      active: true,
      brand: Brand.IM3,
      latitude: -6.9926,
      longitude: 110.4239,
      branchId: "branch-1",
      status: OutletStatus.APPROVED,
      photoUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80",
      submittedBy: "staff.budi@vrelloup.dev",
      rejectionReason: "",
      approvedBy: "Budi Pratama (Super Admin)",
      approvedAt: daysAgo(25),
      deletedAt: null,
    },
    // --- Jawa Timur: Surabaya (branch-sby-01) ---
    {
      id: "outlet-sby-001",
      code: "SBY-PMD-001",
      name: "3Store Surabaya Plaza Marina",
      type: OutletType.EXCLUSIVE,
      address: "Plaza Marina Lt. 2 Blok A-15, Jl. Raya Margorejo No. 97-99, Wonocolo, Surabaya",
      city: "Surabaya",
      picName: "Eko Prasetyo",
      picPhone: "081299990000",
      active: true,
      brand: Brand.TRI,
      latitude: -7.3168,
      longitude: 112.7482,
      branchId: "branch-sby-01",
      status: OutletStatus.APPROVED,
      photoUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80",
      submittedBy: "staff.dimas@vrelloup.dev",
      rejectionReason: "",
      approvedBy: "Budi Pratama (Super Admin)",
      approvedAt: daysAgo(60),
      deletedAt: null,
    },
    {
      id: "outlet-sby-002",
      code: "SBY-WTC-002",
      name: "Mega Cell WTC Surabaya Galeria",
      type: OutletType.MODERN_RETAIL,
      address: "WTC Surabaya Lt. 3 R-312, Jl. Pemuda No. 27-31, Embong Kaliasin, Genteng, Surabaya",
      city: "Surabaya",
      picName: "Gunawan Santoso",
      picPhone: "081333445566",
      active: true,
      brand: Brand.IM3,
      latitude: -7.2635,
      longitude: 112.7471,
      branchId: "branch-sby-01",
      status: OutletStatus.APPROVED,
      photoUrl: "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=500&auto=format&fit=crop&q=80",
      submittedBy: "staff.dimas@vrelloup.dev",
      rejectionReason: "",
      approvedBy: "Budi Pratama (Super Admin)",
      approvedAt: daysAgo(30),
      deletedAt: null,
    },
    // --- Bali & Nusra: Denpasar (branch-dps-01) ---
    {
      id: "outlet-dps-001",
      code: "DPS-TKU-001",
      name: "Gerai IM3 Denpasar Teuku Umar",
      type: OutletType.EXCLUSIVE,
      address: "Jl. Teuku Umar No. 120, Dauh Puri Kauh, Denpasar Barat, Denpasar",
      city: "Denpasar",
      picName: "Wayan Sudarma",
      picPhone: "081377778888",
      active: true,
      brand: Brand.IM3,
      latitude: -8.6748,
      longitude: 115.2075,
      branchId: "branch-dps-01",
      status: OutletStatus.APPROVED,
      photoUrl: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=500&auto=format&fit=crop&q=80",
      submittedBy: "staff.rina@vrelloup.dev",
      rejectionReason: "",
      approvedBy: "Budi Pratama (Super Admin)",
      approvedAt: daysAgo(45),
      deletedAt: null,
    },
    {
      id: "outlet-dps-002",
      code: "DPS-KTA-002",
      name: "Dewata Cellular Sunset Kuta",
      type: OutletType.MODERN_RETAIL,
      address: "Jl. Sunset Road No. 88X, Kuta, Kabupaten Badung, Bali",
      city: "Denpasar",
      picName: "Made Wirawan",
      picPhone: "089612348888",
      active: true,
      brand: Brand.TRI,
      latitude: -8.7051,
      longitude: 115.1764,
      branchId: "branch-dps-01",
      status: OutletStatus.APPROVED,
      photoUrl: "https://images.unsplash.com/photo-1580913428023-02c695666d61?w=500&auto=format&fit=crop&q=80",
      submittedBy: "staff.rina@vrelloup.dev",
      rejectionReason: "",
      approvedBy: "Budi Pratama (Super Admin)",
      approvedAt: daysAgo(15),
      deletedAt: null,
    },
    // --- Sumatera Utara: Medan (branch-mdn-01) ---
    {
      id: "outlet-mdn-001",
      code: "MDN-BLK-001",
      name: "Gerai IM3 Medan Balai Kota",
      type: OutletType.EXCLUSIVE,
      address: "Jl. Balai Kota No. 1, Kesawan, Medan Barat, Kota Medan",
      city: "Medan",
      picName: "Zulkifli Siregar",
      picPhone: "081266667777",
      active: true,
      brand: Brand.IM3,
      latitude: 3.5902,
      longitude: 98.6784,
      branchId: "branch-mdn-01",
      status: OutletStatus.APPROVED,
      photoUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&auto=format&fit=crop&q=80",
      submittedBy: "staff.fauzi@vrelloup.dev",
      rejectionReason: "",
      approvedBy: "Budi Pratama (Super Admin)",
      approvedAt: daysAgo(55),
      deletedAt: null,
    },
    // --- QA Scenario: 2 Draft Submissions (PENDING_APPROVAL) ---
    {
      id: "outlet-draft-001",
      code: "DRAFT-JKT-001",
      name: "Kios Pulsa Sahabat Thamrin",
      type: OutletType.TRADITIONAL,
      address: "Jl. Kebon Kacang IX No. 18, Tanah Abang, Jakarta Pusat",
      city: "Jakarta Pusat",
      picName: "Supriyanto",
      picPhone: "081255554321",
      active: false,
      brand: Brand.IM3,
      latitude: -6.1912,
      longitude: 106.8189,
      branchId: "branch-jkt-01",
      status: OutletStatus.PENDING_APPROVAL,
      photoUrl: "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=500&auto=format&fit=crop&q=80",
      submittedBy: "staff.dewi@vrelloup.dev",
      rejectionReason: "",
      approvedBy: "",
      approvedAt: null,
      deletedAt: null,
    },
    {
      id: "outlet-mgl-001",
      code: "DRAFT-BDG-002",
      name: "Dago Gadget Express",
      type: OutletType.MODERN_RETAIL,
      address: "Jl. Dipati Ukur No. 54, Lebakgede, Coblong, Kota Bandung",
      city: "Bandung",
      picName: "Asep Sunandar",
      picPhone: "081544443333",
      active: false,
      brand: Brand.TRI,
      latitude: -6.8925,
      longitude: 107.6186,
      branchId: "branch-bdg-01",
      status: OutletStatus.PENDING_APPROVAL,
      photoUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=500&auto=format&fit=crop&q=80",
      submittedBy: "spv.maya@vrelloup.dev",
      rejectionReason: "",
      approvedBy: "",
      approvedAt: null,
      deletedAt: null,
    },
    // --- QA Scenario: 1 Rejected Outlet Draft with explicit Audit Reason ---
    {
      id: "outlet-slo-002",
      code: "REJ-CRB-001",
      name: "Warung Sinyal Kartini",
      type: OutletType.TRADITIONAL,
      address: "Jl. R.A. Kartini Gang Melati No. 3, Kejaksan, Kota Cirebon",
      city: "Cirebon",
      picName: "Kurniawan",
      picPhone: "081599998888",
      active: false,
      brand: Brand.IM3,
      latitude: -6.7135,
      longitude: 108.5521,
      branchId: "branch-crb-01",
      status: OutletStatus.REJECTED,
      photoUrl: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&auto=format&fit=crop&q=80",
      submittedBy: "staff.dewi@vrelloup.dev",
      rejectionReason: "Foto outlet buram dan titik koordinat tidak sesuai dengan alamat fisik",
      approvedBy: "Budi Pratama (Super Admin)",
      approvedAt: daysAgo(3),
      deletedAt: null,
    },
    // --- ADR-0053 Soft-Delete Invariant: 2 Soft-Deleted Outlets with Historical Placements ---
    {
      id: "outlet-del-001",
      code: "HIST-SMG-901",
      name: "Toko Abadi Cell Simpang Lima (Closed)",
      type: OutletType.TRADITIONAL,
      address: "Jl. Pahlawan No. 2, Pleburan, Semarang Selatan, Kota Semarang",
      city: "Semarang",
      picName: "Slamet Rahardjo",
      picPhone: "081277778888",
      active: false,
      brand: Brand.IM3,
      latitude: -6.9942,
      longitude: 110.4208,
      branchId: "branch-1",
      status: OutletStatus.APPROVED,
      photoUrl: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=500&auto=format&fit=crop&q=80",
      submittedBy: "staff.budi@vrelloup.dev",
      rejectionReason: "",
      approvedBy: "Budi Pratama (Super Admin)",
      approvedAt: daysAgo(90),
      deletedAt: daysAgo(10),
    },
    {
      id: "outlet-del-002",
      code: "HIST-SBY-902",
      name: "Mitra Ponsel Pemuda (Relocated)",
      type: OutletType.MODERN_RETAIL,
      address: "Jl. Basuki Rahmat No. 45, Tegalsari, Kota Surabaya",
      city: "Surabaya",
      picName: "Bambang Sudiro",
      picPhone: "081388887777",
      active: false,
      brand: Brand.TRI,
      latitude: -7.2685,
      longitude: 112.7412,
      branchId: "branch-sby-01",
      status: OutletStatus.APPROVED,
      photoUrl: "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=500&auto=format&fit=crop&q=80",
      submittedBy: "staff.dimas@vrelloup.dev",
      rejectionReason: "",
      approvedBy: "Budi Pratama (Super Admin)",
      approvedAt: daysAgo(85),
      deletedAt: daysAgo(15),
    },
  ];

  for (const o of outlets) {
    await prisma.outlet.create({ data: o });
  }
  console.log(`   ✅ Seeded ${outlets.length} retail outlets (including drafts & soft-deleted).`);
}


// ============================================================================
// 6. MEDIA CONTRACTS SEED (model Mou)
// ============================================================================
async function seedMous() {
  console.log("📑 [6/11] Seeding media contracts (MoU) & revision workflows...");
  const mous = [
    // 1. APPROVED Active Commercial Contract (Signboard + Shopblind)
    {
      id: "mou-001",
      branchId: "branch-jkt-01",
      outletId: "outlet-jkt-002",
      outletName: "Toko Sinar Rejeki Cell Cempaka Putih",
      partnerName: "H. Suryanto",
      mouType: "STANDARD_COMMERCIAL",
      submissionDate: daysAgo(40),
      startDate: daysAgo(30),
      endDate: daysFromNow(335),
      status: MouStatus.APPROVED,
      picName: "Dewi Lestari",
      picPhone: "081288881234",
      docPath: "https://storage.marcom-internal.corp/mou/2026/mou_jkt_001_signed.pdf",
      docPaths: [
        "https://storage.marcom-internal.corp/mou/2026/mou_jkt_001_signed.pdf",
        "https://storage.marcom-internal.corp/mou/2026/ktp_pemilik_cempaka.pdf",
        "https://storage.marcom-internal.corp/mou/2026/pajak_reklame_jkt_2026.pdf",
      ],
      compensationValue: 8500000,
      notes: "Perjanjian sewa bidang tampak depan ruko untuk Signboard Acrylic LED & Shopblind outdoor selama 12 bulan.",
    },
    // 2. DONE Completed Contract (Expired Last Month)
    {
      id: "mou-002",
      branchId: "branch-bdg-01",
      outletId: "outlet-bdg-003",
      outletName: "Dunia Seluler BEC Bandung",
      partnerName: "Yudi Purnomo",
      mouType: "EXCLUSIVE_PREMIUM",
      submissionDate: daysAgo(395),
      startDate: daysAgo(365),
      endDate: daysAgo(5),
      status: MouStatus.DONE,
      picName: "Deden Ridwan",
      picPhone: "081577771234",
      docPath: "https://storage.marcom-internal.corp/mou/2025/mou_bdg_bec_2025_done.pdf",
      docPaths: [
        "https://storage.marcom-internal.corp/mou/2025/mou_bdg_bec_2025_done.pdf",
        "https://storage.marcom-internal.corp/mou/2025/bast_selesai_sewa_bec.pdf",
      ],
      compensationValue: 12000000,
      notes: "Kontrak sewa pilar branding atrium BEC telah selesai dan pembayaran kompensasi lunas 100%.",
    },
    // 3. REVISION Workflow State (ADR-0051 Multi-Doc & Revision Loop)
    {
      id: "mou-003",
      branchId: "branch-1",
      outletId: "outlet-smg-003",
      outletName: "Pojok Seluler Simpang Lima",
      partnerName: "Tri Handoko",
      mouType: "STANDARD_COMMERCIAL",
      submissionDate: daysAgo(10),
      startDate: null,
      endDate: null,
      status: MouStatus.REVISION,
      picName: "Budi Santoso",
      picPhone: "081223456789",
      docPath: "https://storage.marcom-internal.corp/mou/2026/draf_mou_smg_003_rev1.pdf",
      docPaths: [
        "https://storage.marcom-internal.corp/mou/2026/draf_mou_smg_003_rev1.pdf",
        "https://storage.marcom-internal.corp/mou/2026/lampiran_foto_titik_signboard.jpg",
      ],
      compensationValue: 6000000,
      notes: "CATATAN REVISI SUPERVISOR: Mohon lampirkan fotokopi KTP pemilik ruko dan revisi klausul kompensasi daya listrik neon box sebelum diajukan ulang.",
    },
    // 4. SUBMITTED Awaiting Approval Gate
    {
      id: "mou-004",
      branchId: "branch-sby-01",
      outletId: "outlet-sby-002",
      outletName: "Mega Cell WTC Surabaya Galeria",
      partnerName: "Gunawan Santoso",
      mouType: "EXCLUSIVE_PREMIUM",
      submissionDate: daysAgo(4),
      startDate: null,
      endDate: null,
      status: MouStatus.SUBMITTED,
      picName: "Dimas Anggara",
      picPhone: "081333445566",
      docPath: "https://storage.marcom-internal.corp/mou/2026/mou_sub_wtc_surabaya.pdf",
      docPaths: [
        "https://storage.marcom-internal.corp/mou/2026/mou_sub_wtc_surabaya.pdf",
        "https://storage.marcom-internal.corp/mou/2026/surat_kuasa_pengelola_wtc.pdf",
      ],
      compensationValue: 15000000,
      notes: "Pengajuan sewa koridor depan gerai WTC untuk penempatan 2 unit Neon Box dan 1 Signboard LED utama.",
    },
    // 5. DRAFT Operational Work In Progress
    {
      id: "mou-005",
      branchId: "branch-dps-01",
      outletId: "outlet-dps-002",
      outletName: "Dewata Cellular Sunset Kuta",
      partnerName: "Made Wirawan",
      mouType: "STANDARD_COMMERCIAL",
      submissionDate: daysAgo(2),
      startDate: null,
      endDate: null,
      status: MouStatus.DRAFT,
      picName: "Rina Wijaya",
      picPhone: "089612348888",
      docPath: "https://storage.marcom-internal.corp/mou/2026/draf_awal_kuta_2026.docx",
      docPaths: [
        "https://storage.marcom-internal.corp/mou/2026/draf_awal_kuta_2026.docx",
      ],
      compensationValue: 7500000,
      notes: "Draf awal perjanjian sedang disusun oleh tim operasional Bali dan verifikasi harga sewa lokal.",
    },
    // 6. REJECTED Contract Proposal with Compliance Reason
    {
      id: "mou-006",
      branchId: "branch-crb-01",
      outletId: "outlet-crb-001",
      outletName: "Sentral Pulsa Grage Cirebon",
      partnerName: "Irfan Hakim",
      mouType: "STANDARD_COMMERCIAL",
      submissionDate: daysAgo(20),
      startDate: null,
      endDate: null,
      status: MouStatus.REJECTED,
      picName: "Maya Safitri (SPV Jabar & Jateng)",
      picPhone: "081577778888",
      docPath: "https://storage.marcom-internal.corp/mou/2026/mou_crb_rejected_audit.pdf",
      docPaths: [
        "https://storage.marcom-internal.corp/mou/2026/mou_crb_rejected_audit.pdf",
      ],
      compensationValue: 10000000,
      notes: "DITOLAK AUDIT LEGAL: Nilai kompensasi melebihi batas benchmark tarif perizinan reklame Pemkot Cirebon tahun berjalan.",
    },
    // 7. APPROVED Campus Sponsorship Agreement
    {
      id: "mou-007",
      branchId: "branch-bdg-01",
      outletId: "outlet-bdg-002",
      outletName: "Tri Corner Ganesha Salman ITB",
      partnerName: "Hilman Firdaus",
      mouType: "CAMPUS_PARTNERSHIP",
      submissionDate: daysAgo(45),
      startDate: daysAgo(30),
      endDate: daysFromNow(150),
      status: MouStatus.APPROVED,
      picName: "Maya Safitri (SPV Jabar & Jateng)",
      picPhone: "089865432100",
      docPath: "https://storage.marcom-internal.corp/mou/2026/mou_itb_salman_signed.pdf",
      docPaths: [
        "https://storage.marcom-internal.corp/mou/2026/mou_itb_salman_signed.pdf",
        "https://storage.marcom-internal.corp/mou/2026/rekomendasi_kemahasiswaan_itb.pdf",
      ],
      compensationValue: 5000000,
      notes: "Kemitraan aktivasi stan promosi Tri Happy dan penempatan branding kanopi kantin selama 6 bulan.",
    },
    // 8. APPROVED Traditional Retail Shopblind Bundle
    {
      id: "mou-008",
      branchId: "branch-mdn-01",
      outletId: "outlet-mdn-001",
      outletName: "Gerai IM3 Medan Balai Kota",
      partnerName: "Zulkifli Siregar",
      mouType: "STANDARD_COMMERCIAL",
      submissionDate: daysAgo(60),
      startDate: daysAgo(50),
      endDate: daysFromNow(315),
      status: MouStatus.APPROVED,
      picName: "Ahmad Fauzi",
      picPhone: "081266667777",
      docPath: "https://storage.marcom-internal.corp/mou/2026/mou_mdn_001_signed.pdf",
      docPaths: [
        "https://storage.marcom-internal.corp/mou/2026/mou_mdn_001_signed.pdf",
        "https://storage.marcom-internal.corp/mou/2026/bukti_pembayaran_pajak_medan.pdf",
      ],
      compensationValue: 9000000,
      notes: "Branding fasad luar gerai Medan dengan Signboard LED 240x80cm dan Shopblind outdoor sepanjang 6 meter.",
    },
  ];

  for (const m of mous) {
    await prisma.mou.create({ data: m });
  }
  console.log(`   ✅ Seeded ${mous.length} media contracts across all lifecycle states.`);
}

// ============================================================================
// 7. POSM FIELD PLACEMENTS SEED (model Placement)
// ============================================================================
async function seedPlacements() {
  console.log("📍 [7/11] Seeding POSM field placements & GPS auditing telemetry...");
  const placements = [
    // --- Placements linked to mou-001 (outlet-jkt-002) ---
    {
      id: "plc-001",
      outletId: "outlet-jkt-002",
      materialId: "material-signboard", // Signboard LED
      mouId: "mou-001",
      status: PlacementStatus.DONE,
      brand: Brand.IM3,
      date: daysAgo(28),
      picName: "Dewi Lestari",
      photoUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80",
      dimensions: "240 x 80 cm",
      cost: 3200000,
      notes: "Pemasangan Signboard Acrylic LED tampak depan selesai. Lampu menyala sempurna dan kabel rapi.",
      latitude: -6.1823,
      longitude: 106.8687,
      shareLocationUrl: "https://maps.google.com/?q=-6.1823,106.8687",
      locationNotes: "Titik koordinat GPS terverifikasi presisi di depan gerbang ruko Cempaka Putih.",
      quarter: "Q1 2026",
      campaignTheme: "Pesta Sinyal Merdeka IM3",
      isLocationValid: true,
      locationDeviation: 4.8,
    },
    {
      id: "plc-002",
      outletId: "outlet-jkt-002",
      materialId: "material-shopblind", // Shopblind
      mouId: "mou-001",
      status: PlacementStatus.DONE,
      brand: Brand.IM3,
      date: daysAgo(27),
      picName: "Dewi Lestari",
      photoUrl: "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=600&auto=format&fit=crop&q=80",
      dimensions: "300 x 100 cm",
      cost: 1450000,
      notes: "Shopblind kanvas terpasang kuat pada kanopi kanvas toko dengan tali pengikat baja.",
      latitude: -6.1823,
      longitude: 106.8687,
      shareLocationUrl: "https://maps.google.com/?q=-6.1823,106.8687",
      locationNotes: "GPS match sempurna.",
      quarter: "Q1 2026",
      campaignTheme: "Pesta Sinyal Merdeka IM3",
      isLocationValid: true,
      locationDeviation: 5.1,
    },
    // --- Placements in outlet-jkt-001 (Gerai IM3 KPPTI) ---
    {
      id: "plc-003",
      outletId: "outlet-jkt-001",
      materialId: "material-facade", // Roll-up Banner
      mouId: null,
      status: PlacementStatus.DONE,
      brand: Brand.IM3,
      date: daysAgo(55),
      picName: "Dewi Lestari",
      photoUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80",
      dimensions: "85 x 200 cm",
      cost: 450000,
      notes: "Roll-up banner promosi paket Freedom Internet 50GB di lobby customer service.",
      latitude: -6.1754,
      longitude: 106.8228,
      shareLocationUrl: "https://maps.google.com/?q=-6.1754,106.8228",
      locationNotes: "Lobby Gedung KPPTI verified.",
      quarter: "Q1 2026",
      campaignTheme: "Ramadan Berkah IM3 2026",
      isLocationValid: true,
      locationDeviation: 3.2,
    },
    // --- Placements in outlet-jkt-003 (Campus Store UI Salemba) ---
    {
      id: "plc-004",
      outletId: "outlet-jkt-003",
      materialId: "material-poster", // Poster
      mouId: null,
      status: PlacementStatus.DONE,
      brand: Brand.TRI,
      date: daysAgo(20),
      picName: "Dewi Lestari",
      photoUrl: "https://images.unsplash.com/photo-1562774053-701939374585?w=600&auto=format&fit=crop&q=80",
      dimensions: "42 x 59.4 cm",
      cost: 85000,
      notes: "Poster kuota Happy Tri ditempel di mading kantin dan etalase utama.",
      latitude: -6.1952,
      longitude: 106.8504,
      shareLocationUrl: "https://maps.google.com/?q=-6.1952,106.8504",
      locationNotes: "Verifikasi radius kantin UI Salemba.",
      quarter: "Q2 2026",
      campaignTheme: "Generasi Happy Tri 2026",
      isLocationValid: true,
      locationDeviation: 6.7,
    },
    // --- QA Scenario: ISSUE Placement (Owner Canopy Renovation Delay) ---
    {
      id: "plc-005",
      outletId: "outlet-tgr-002",
      materialId: "material-signboard", // Signboard LED
      mouId: null,
      status: PlacementStatus.ISSUE,
      brand: Brand.IM3,
      date: daysAgo(10),
      picName: "Dewi Lestari",
      photoUrl: "https://images.unsplash.com/photo-1580913428023-02c695666d61?w=600&auto=format&fit=crop&q=80",
      dimensions: "240 x 80 cm",
      cost: 3200000,
      notes: "KENDALA LAPANGAN: Pemilik ruko meminta penundaan pemasangan rangka Signboard karena sedang dilakukan renovasi genteng dan kanopi baja ringan.",
      latitude: -6.2995,
      longitude: 106.6669,
      shareLocationUrl: "https://maps.google.com/?q=-6.2995,106.6669",
      locationNotes: "Verifikasi langsung di lokasi ruko ITC BSD bersama pemilik toko.",
      quarter: "Q3 2026",
      campaignTheme: "Pesta Sinyal Merdeka IM3",
      isLocationValid: true,
      locationDeviation: 8.9,
    },
    // --- QA Scenario: DEVIATED/SPOOFED GPS Placement (Out of tolerance radius) ---
    {
      id: "plc-006",
      outletId: "outlet-tgr-001",
      materialId: "material-banner", // X-Banner
      mouId: null,
      status: PlacementStatus.ON_PROGRESS,
      brand: Brand.TRI,
      date: daysAgo(5),
      picName: "Dewi Lestari",
      photoUrl: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=600&auto=format&fit=crop&q=80",
      dimensions: "60 x 160 cm",
      cost: 220000,
      notes: "AUDIT GPS GAGAL: Foto diunggah oleh vendor saat teknisi masih berada di rest area tol, bukan di dalam mall.",
      latitude: -6.2054, // Far from outlet (-6.2227)
      longitude: 106.6382,
      shareLocationUrl: "https://maps.google.com/?q=-6.2054,106.6382",
      locationNotes: "Pemasangan diverifikasi di luar toleransi radius 100m dari toko (Deviasi 2.450 meter).",
      quarter: "Q3 2026",
      campaignTheme: "Generasi Happy Tri 2026",
      isLocationValid: false,
      locationDeviation: 2450.0,
    },
    // --- Placements in Bandung (outlet-bdg-001 & outlet-bdg-002) ---
    {
      id: "plc-007",
      outletId: "outlet-bdg-001",
      materialId: "material-sticker", // Neon Box
      mouId: null,
      status: PlacementStatus.DONE,
      brand: Brand.IM3,
      date: daysAgo(35),
      picName: "Deden Ridwan",
      photoUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80",
      dimensions: "90 x 60 cm",
      cost: 1850000,
      notes: "Neon Box gantung terpasang di atas pintu masuk lobby Gerai IM3 Dago.",
      latitude: -6.8858,
      longitude: 107.6142,
      shareLocationUrl: "https://maps.google.com/?q=-6.8858,107.6142",
      locationNotes: "GPS akurat di Dago 145.",
      quarter: "Q1 2026",
      campaignTheme: "Ramadan Berkah IM3 2026",
      isLocationValid: true,
      locationDeviation: 2.1,
    },
    {
      id: "plc-008",
      outletId: "outlet-bdg-002",
      materialId: "material-shopblind", // Shopblind Kanopi Kantin ITB
      mouId: "mou-007",
      status: PlacementStatus.DONE,
      brand: Brand.TRI,
      date: daysAgo(25),
      picName: "Hilman Firdaus",
      photoUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80",
      dimensions: "300 x 100 cm",
      cost: 1450000,
      notes: "Shopblind kanvas branding Tri Generasi Happy pada kanopi stan kantin Salman ITB.",
      latitude: -6.8933,
      longitude: 107.6097,
      shareLocationUrl: "https://maps.google.com/?q=-6.8933,107.6097",
      locationNotes: "GPS match area kantin ITB.",
      quarter: "Q2 2026",
      campaignTheme: "Back to Campus Tri 2026",
      isLocationValid: true,
      locationDeviation: 7.4,
    },
    // --- Placements in Semarang (outlet-smg-001 & outlet-smg-002) ---
    {
      id: "plc-009",
      outletId: "outlet-smg-001",
      materialId: "material-signboard", // Signboard LED Pandanaran
      mouId: null,
      status: PlacementStatus.DONE,
      brand: Brand.IM3,
      date: daysAgo(70),
      picName: "Budi Santoso",
      photoUrl: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&auto=format&fit=crop&q=80",
      dimensions: "240 x 80 cm",
      cost: 3200000,
      notes: "Signboard Acrylic LED gerai utama Pandanaran terpasang megah menghadap jalan protokol.",
      latitude: -6.9897,
      longitude: 110.4136,
      shareLocationUrl: "https://maps.google.com/?q=-6.9897,110.4136",
      locationNotes: "Pandanaran 131 GPS verified.",
      quarter: "Q1 2026",
      campaignTheme: "Ramadan Berkah IM3 2026",
      isLocationValid: true,
      locationDeviation: 4.1,
    },
    {
      id: "plc-010",
      outletId: "outlet-smg-002",
      materialId: "material-banner", // X-Banner Undip
      mouId: null,
      status: PlacementStatus.DONE,
      brand: Brand.TRI,
      date: daysAgo(45),
      picName: "Budi Santoso",
      photoUrl: "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=600&auto=format&fit=crop&q=80",
      dimensions: "60 x 160 cm",
      cost: 220000,
      notes: "X-Banner paket kuota mahasiswa Tri di depan kasir outlet Tembalang.",
      latitude: -7.0508,
      longitude: 110.4357,
      shareLocationUrl: "https://maps.google.com/?q=-7.0508,110.4357",
      locationNotes: "Tembalang Undip match.",
      quarter: "Q2 2026",
      campaignTheme: "Back to Campus Tri 2026",
      isLocationValid: true,
      locationDeviation: 5.5,
    },
    // --- Placements in Surabaya (outlet-sby-001 & outlet-sby-002) ---
    {
      id: "plc-011",
      outletId: "outlet-sby-001",
      materialId: "material-facade", // Roll-up Banner Marina
      mouId: null,
      status: PlacementStatus.DONE,
      brand: Brand.TRI,
      date: daysAgo(50),
      picName: "Dimas Anggara",
      photoUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80",
      dimensions: "85 x 200 cm",
      cost: 450000,
      notes: "Roll-up banner promosi Tri Kebut Semalam di pintu masuk gerai Plaza Marina.",
      latitude: -7.3168,
      longitude: 112.7482,
      shareLocationUrl: "https://maps.google.com/?q=-7.3168,112.7482",
      locationNotes: "Plaza Marina Lt 2 verified.",
      quarter: "Q1 2026",
      campaignTheme: "Generasi Happy Tri 2026",
      isLocationValid: true,
      locationDeviation: 3.8,
    },
    {
      id: "plc-012",
      outletId: "outlet-sby-002",
      materialId: "material-signboard", // Signboard LED WTC
      mouId: "mou-004",
      status: PlacementStatus.NOT_STARTED,
      brand: Brand.IM3,
      date: null,
      picName: "Dimas Anggara",
      photoUrl: "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=600&auto=format&fit=crop&q=80",
      dimensions: "240 x 80 cm",
      cost: 3500000,
      notes: "Menunggu persetujuan MoU dari manajemen WTC Surabaya sebelum jadwal instalasi fisik dijadwalkan.",
      latitude: -7.2635,
      longitude: 112.7471,
      shareLocationUrl: "https://maps.google.com/?q=-7.2635,112.7471",
      locationNotes: "WTC Surabaya target location.",
      quarter: "Q3 2026",
      campaignTheme: "Pesta Sinyal Merdeka IM3",
      isLocationValid: true,
      locationDeviation: 0.0,
    },
    // --- Placements in Bali (outlet-dps-001) ---
    {
      id: "plc-013",
      outletId: "outlet-dps-001",
      materialId: "material-sticker", // Neon Box Teuku Umar
      mouId: null,
      status: PlacementStatus.DONE,
      brand: Brand.IM3,
      date: daysAgo(40),
      picName: "Rina Wijaya",
      photoUrl: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=600&auto=format&fit=crop&q=80",
      dimensions: "90 x 60 cm",
      cost: 1850000,
      notes: "Neon box dua sisi menyala terang di trotoar depan gerai Denpasar.",
      latitude: -8.6748,
      longitude: 115.2075,
      shareLocationUrl: "https://maps.google.com/?q=-8.6748,115.2075",
      locationNotes: "Teuku Umar verified.",
      quarter: "Q2 2026",
      campaignTheme: "Ramadan Berkah IM3 2026",
      isLocationValid: true,
      locationDeviation: 5.9,
    },
    // --- Placements in Medan (outlet-mdn-001) ---
    {
      id: "plc-014",
      outletId: "outlet-mdn-001",
      materialId: "material-signboard", // Signboard LED Medan
      mouId: "mou-008",
      status: PlacementStatus.DONE,
      brand: Brand.IM3,
      date: daysAgo(48),
      picName: "Ahmad Fauzi",
      photoUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80",
      dimensions: "240 x 80 cm",
      cost: 3400000,
      notes: "Signboard Acrylic LED gerai Medan selesai dipasang oleh vendor lokal CV Sumatera Reklame.",
      latitude: 3.5902,
      longitude: 98.6784,
      shareLocationUrl: "https://maps.google.com/?q=3.5902,98.6784",
      locationNotes: "Balai Kota Medan verified.",
      quarter: "Q1 2026",
      campaignTheme: "Ramadan Berkah IM3 2026",
      isLocationValid: true,
      locationDeviation: 6.3,
    },
    {
      id: "plc-015",
      outletId: "outlet-crb-001",
      materialId: "material-poster", // Poster
      mouId: null,
      status: PlacementStatus.DONE,
      brand: Brand.IM3,
      date: daysAgo(14),
      picName: "Irfan Hakim",
      photoUrl: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&auto=format&fit=crop&q=80",
      dimensions: "42 x 59.4 cm",
      cost: 95000,
      notes: "Poster promo Freedom Internet ditempel pada etalase kaca depan counter Grage Cirebon.",
      latitude: -6.7118,
      longitude: 108.5552,
      shareLocationUrl: "https://maps.google.com/?q=-6.7118,108.5552",
      locationNotes: "Grage Mall Cirebon match.",
      quarter: "Q2 2026",
      campaignTheme: "Pesta Sinyal Merdeka IM3",
      isLocationValid: true,
      locationDeviation: 4.5,
    },
    {
      id: "plc-016",
      outletId: "outlet-tgr-001",
      materialId: "material-facade", // Roll-up Banner
      mouId: null,
      status: PlacementStatus.DONE,
      brand: Brand.TRI,
      date: daysAgo(25),
      picName: "Citra Kirana",
      photoUrl: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=600&auto=format&fit=crop&q=80",
      dimensions: "85 x 200 cm",
      cost: 450000,
      notes: "Roll-up banner promosi paket kuota Tri Happy di pintu masuk 3Store Mall Alam Sutera.",
      latitude: -6.2227,
      longitude: 106.6534,
      shareLocationUrl: "https://maps.google.com/?q=-6.2227,106.6534",
      locationNotes: "Alam Sutera verified.",
      quarter: "Q1 2026",
      campaignTheme: "Generasi Happy Tri 2026",
      isLocationValid: true,
      locationDeviation: 3.4,
    },
    {
      id: "plc-017",
      outletId: "outlet-bdg-003",
      materialId: "material-signboard", // Signboard LED
      mouId: "mou-002",
      status: PlacementStatus.DONE,
      brand: Brand.IM3,
      date: daysAgo(18),
      picName: "Deden Ridwan",
      photoUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&auto=format&fit=crop&q=80",
      dimensions: "240 x 80 cm",
      cost: 3200000,
      notes: "Signboard Acrylic LED branding koridor BEC Bandung menyala terang.",
      latitude: -6.9082,
      longitude: 107.6092,
      shareLocationUrl: "https://maps.google.com/?q=-6.9082,107.6092",
      locationNotes: "BEC Bandung verified.",
      quarter: "Q4 2026",
      campaignTheme: "Ramadan Berkah IM3 2026",
      isLocationValid: true,
      locationDeviation: 5.7,
    },
    {
      id: "plc-018",
      outletId: "outlet-smg-003",
      materialId: "material-sticker", // Neon Box
      mouId: "mou-003",
      status: PlacementStatus.ON_PROGRESS,
      brand: Brand.IM3,
      date: daysAgo(5),
      picName: "Budi Santoso",
      photoUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80",
      dimensions: "90 x 60 cm",
      cost: 1850000,
      notes: "Pemasangan bracket neon box gantung sedang difabrikasi bengkel las Simpang Lima.",
      latitude: -6.9926,
      longitude: 110.4239,
      shareLocationUrl: "https://maps.google.com/?q=-6.9926,110.4239",
      locationNotes: "Simpang Lima verified.",
      quarter: "Q4 2026",
      campaignTheme: "Pesta Sinyal Merdeka IM3",
      isLocationValid: true,
      locationDeviation: 4.9,
    },
    {
      id: "plc-019",
      outletId: "outlet-dps-002",
      materialId: "material-shopblind", // Shopblind
      mouId: "mou-005",
      status: PlacementStatus.NOT_STARTED,
      brand: Brand.TRI,
      date: null,
      picName: "Rina Wijaya",
      photoUrl: "https://images.unsplash.com/photo-1580913428023-02c695666d61?w=600&auto=format&fit=crop&q=80",
      dimensions: "300 x 100 cm",
      cost: 1450000,
      notes: "Menunggu finalisasi draf MoU sewa kanopi ruko Sunset Road Kuta sebelum cetak kanvas.",
      latitude: -8.7051,
      longitude: 115.1764,
      shareLocationUrl: "https://maps.google.com/?q=-8.7051,115.1764",
      locationNotes: "Sunset Road Kuta verified.",
      quarter: "Q4 2026",
      campaignTheme: "Back to Campus Tri 2026",
      isLocationValid: true,
      locationDeviation: 0.0,
    },
    {
      id: "plc-020",
      outletId: "outlet-jkt-001",
      materialId: "material-banner", // X-Banner
      mouId: null,
      status: PlacementStatus.DONE,
      brand: Brand.IM3,
      date: daysAgo(30),
      picName: "Dewi Lestari",
      photoUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80",
      dimensions: "60 x 160 cm",
      cost: 220000,
      notes: "X-Banner penukaran poin IM3 terpasang rapi di area kasir pembayaran.",
      latitude: -6.1754,
      longitude: 106.8228,
      shareLocationUrl: "https://maps.google.com/?q=-6.1754,106.8228",
      locationNotes: "KPPTI verified.",
      quarter: "Q3 2026",
      campaignTheme: "Pesta Sinyal Merdeka IM3",
      isLocationValid: true,
      locationDeviation: 2.8,
    },
    // --- ADR-0053 HISTORICAL PLACEMENTS LINKED TO SOFT-DELETED OUTLETS ---
    // (Validates PostgreSQL ON DELETE RESTRICT protection & query isolation)
    {
      id: "plc-hist-901",
      outletId: "outlet-del-001", // Soft-deleted outlet
      materialId: "material-shopblind", // Shopblind
      mouId: null,
      status: PlacementStatus.DONE,
      brand: Brand.IM3,
      date: daysAgo(120),
      picName: "Budi Santoso",
      photoUrl: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&auto=format&fit=crop&q=80",
      dimensions: "300 x 100 cm",
      cost: 1450000,
      notes: "HISTORIKAL ARSIP: Pemasangan shopblind kanvas sebelum toko tutup permanen pada akhir Q3 2026.",
      latitude: -6.9942,
      longitude: 110.4208,
      shareLocationUrl: "https://maps.google.com/?q=-6.9942,110.4208",
      locationNotes: "Data historis audit belanja promosi tersimpan permanen.",
      quarter: "Q3 2026",
      campaignTheme: "Pesta Sinyal Merdeka IM3",
      isLocationValid: true,
      locationDeviation: 4.0,
    },
    {
      id: "plc-hist-902",
      outletId: "outlet-del-002", // Soft-deleted outlet
      materialId: "material-signboard", // Signboard LED
      mouId: null,
      status: PlacementStatus.DONE,
      brand: Brand.TRI,
      date: daysAgo(115),
      picName: "Dimas Anggara",
      photoUrl: "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=600&auto=format&fit=crop&q=80",
      dimensions: "240 x 80 cm",
      cost: 3200000,
      notes: "HISTORIKAL ARSIP: Signboard branding Tri terpasang sebelum relokasi ruko ke Jl. Basuki Rahmat.",
      latitude: -7.2685,
      longitude: 112.7412,
      shareLocationUrl: "https://maps.google.com/?q=-7.2685,112.7412",
      locationNotes: "Catatan belanja inventaris promosi terisolasi.",
      quarter: "Q3 2026",
      campaignTheme: "Generasi Happy Tri 2026",
      isLocationValid: true,
      locationDeviation: 5.2,
    },
  ];

  for (const p of placements) {
    await prisma.placement.create({ data: p });
  }
  console.log(`   ✅ Seeded ${placements.length} POSM placements (including GPS audits & historical soft-deleted records).`);
}


// ============================================================================
// 8. FIELD MARKETING EVENTS SEED (model FieldEvent)
// ============================================================================
async function seedEvents() {
  console.log("🎪 [8/11] Seeding field marketing events & unreturned warning scenarios...");
  const events = [
    // 1. ADR-0054 CRITICAL TEST CASE A: COMPLETED Event with Unreturned Active Borrow Record!
    // Triggers pervasive warning banners across EventDrawer, EventCardsView, EventTableView,
    // Outlet360Drawer, and PipelineMatrixTable Column 4.
    {
      id: "event-001",
      name: "Roadshow Colabonation Campus Tour UGM & UNY",
      eventType: "CAMPUS_ROADSHOW",
      startDate: daysAgo(5),
      endDate: daysAgo(3),
      location: "Plaza Boulevard UGM, Bulaksumur, Caturtunggal, Sleman, D.I. Yogyakarta",
      branchName: "Semarang Pandanaran",
      picName: "Budi Santoso",
      status: EventStatus.COMPLETED,
      budget: 35000000,
      targetAttendee: 2500,
      attendeeCount: 2840,
      notes: "Event roadshow aktivasi kartu perdana mahasiswa baru dengan booth turnamen mini Mobile Legends. PERINGATAN LOGISTIK: Acara telah selesai namun peralatan sound system dan tenda belum diserahterimakan kembali ke gudang Semarang.",
      outletId: "outlet-smg-002",
      mediaAttachments: toJson([
        {
          id: "med-ev-001",
          name: "Highlight Roadshow UGM Day 1.mp4",
          url: "https://storage.marcom-internal.corp/events/2026/ugm_roadshow_highlight.mp4",
          size: "45.2 MB",
          mimeType: "video/mp4",
          uploadedAt: daysAgo(4).toISOString(),
        },
        {
          id: "med-ev-002",
          name: "Dokumentasi Crowd Turnamen MLBB.jpg",
          url: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80",
          size: "3.4 MB",
          mimeType: "image/jpeg",
          uploadedAt: daysAgo(3).toISOString(),
        },
      ]),
    },
    // 2. ADR-0054 CLEAN CASE B: COMPLETED Event with Fully Returned Equipment
    {
      id: "event-002",
      name: "Bazaar Ramadhan UMKM Festival Simpang Lima",
      eventType: "COMMUNITY_BAZAAR",
      startDate: daysAgo(20),
      endDate: daysAgo(17),
      location: "Lapangan Pancasila Simpang Lima, Pleburan, Semarang Selatan, Semarang",
      branchName: "Semarang Pandanaran",
      picName: "Budi Santoso",
      status: EventStatus.COMPLETED,
      budget: 18500000,
      targetAttendee: 1200,
      attendeeCount: 1450,
      notes: "Stan penjualan sembako tebus murah IM3 dan redeem poin reward. Seluruh peralatan stan telah dikembalikan ke gudang secara lengkap dan bersih.",
      outletId: "outlet-smg-001",
      mediaAttachments: toJson([
        {
          id: "med-ev-003",
          name: "Foto Stan Bazaar Simpang Lima.jpg",
          url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80",
          size: "2.8 MB",
          mimeType: "image/jpeg",
          uploadedAt: daysAgo(17).toISOString(),
        },
      ]),
    },
    // 3. ON_PROGRESS Event with Linked Overdue Loan (Field Investigation)
    {
      id: "event-003",
      name: "Car Free Day Sehat Bersama Tri Solo Slamet Riyadi",
      eventType: "CFD_ACTIVATION",
      startDate: daysAgo(6),
      endDate: daysFromNow(1),
      location: "Jl. Slamet Riyadi KM 3, Sriwedari, Laweyan, Surakarta",
      branchName: "Semarang Pandanaran",
      picName: "Budi Santoso",
      status: EventStatus.ON_PROGRESS,
      budget: 12500000,
      targetAttendee: 800,
      attendeeCount: 650,
      notes: "Senam zumba massal CFD dan bagi-bagi merchandise starter pack Tri Happy. Tim sedang menindaklanjuti keterlambatan pengembalian genset dan kabel rol.",
      outletId: "outlet-smg-003",
      mediaAttachments: toJson([
        {
          id: "med-ev-004",
          name: "Foto Senam Sehat CFD Solo.jpg",
          url: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=80",
          size: "4.1 MB",
          mimeType: "image/jpeg",
          uploadedAt: daysAgo(5).toISOString(),
        },
      ]),
    },
    // 4. UPCOMING Mega Activation Event
    {
      id: "event-004",
      name: "Konser Musik Senja Colabonation Pantai Kuta",
      eventType: "MUSIC_CONCERT",
      startDate: daysFromNow(8),
      endDate: daysFromNow(10),
      location: "Area Panggung Terbuka Pantai Kuta, Badung, Bali",
      branchName: "Denpasar Teuku Umar",
      picName: "Wayan Sudarma",
      status: EventStatus.UPCOMING,
      budget: 65000000,
      targetAttendee: 5000,
      attendeeCount: 0,
      notes: "Konser kolaborasi musisi indie nasional dengan stan live streaming internet 5G IM3. Peminjaman peralatan audio telah disetujui supervisor dan menunggu proses serah terima gudang.",
      outletId: "outlet-dps-001",
      mediaAttachments: toJson([]),
    },
    // 5. CANCELLED Event (Weather Emergency Protocol)
    {
      id: "event-005",
      name: "Festival Kuliner & Musik Lapangan Gasibu Bandung",
      eventType: "COMMUNITY_BAZAAR",
      startDate: daysAgo(12),
      endDate: daysAgo(12),
      location: "Plaza Lapangan Gasibu, Jl. Diponegoro, Citarum, Bandung Wetan, Bandung",
      branchName: "Bandung Dago Raya",
      picName: "Deden Ridwan",
      status: EventStatus.CANCELLED,
      budget: 22000000,
      targetAttendee: 1500,
      attendeeCount: 0,
      notes: "DIBATALKAN: Peringatan cuaca ekstrem BMKG hujan badai disertai angin kencang di area Bandung Utara. Anggaran dialihkan ke aktivasi digital Q4.",
      outletId: "outlet-bdg-001",
      mediaAttachments: toJson([]),
    },
    // 6. UPCOMING Exhibition Booth Jakarta
    {
      id: "event-006",
      name: "Jakarta Mega Gadget Expo JCC Senayan",
      eventType: "EXHIBITION_BOOTH",
      startDate: daysFromNow(15),
      endDate: daysFromNow(18),
      location: "Hall B Jakarta Convention Center, Jl. Gatot Subroto, Senayan, Jakarta Pusat",
      branchName: "Jakarta Pusat & Thamrin",
      picName: "Dewi Lestari",
      status: EventStatus.UPCOMING,
      budget: 48000000,
      targetAttendee: 4000,
      attendeeCount: 0,
      notes: "Partisipasi pameran tahunan gadget nasional dengan counter registrasi eSIM dan paket roaming internasional.",
      outletId: "outlet-jkt-001",
      mediaAttachments: toJson([]),
    },
  ];

  for (const e of events) {
    await prisma.fieldEvent.create({ data: e });
  }
  console.log(`   ✅ Seeded ${events.length} field marketing events.`);
}

// ============================================================================
// 9. WAREHOUSE EQUIPMENT INVENTORY CATALOG (model InventoryItem)
// ============================================================================
async function seedInventory() {
  console.log("📦 [9/11] Seeding warehouse equipment inventory catalog...");
  // Exact mathematical consistency:
  // availableUnits = totalUnits - currentlyBorrowedUnits (ACTIVE & OVERDUE loans) - unreplacedWriteOffs
  const items = [
    // Audio & Sound System
    {
      id: "inv-001",
      code: "SND-WMC-001",
      name: "Shure BLX288/PG58 Dual Wireless Vocal System",
      category: "Audio & Sound System",
      brand: "Shure",
      description: "Set mikrofon wireless handheld ganda untuk MC panggung dan roadshow outdoor dengan jangkauan 100m.",
      totalUnits: 6,
      availableUnits: 3, // 2 out in brw-003 (ACTIVE), 1 out in brw-004 (OVERDUE)
      photoUrl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=500&auto=format&fit=crop&q=80",
      storageLocation: "Central Warehouse Jakarta - Rack A1",
      status: EquipmentStatus.AVAILABLE,
      notes: "Kondisi sangat baik, baterai AA alkaline terpisah.",
    },
    {
      id: "inv-002",
      code: "SND-SPK-002",
      name: "JBL EON ONE MK2 All-In-One Battery Powered Column PA",
      category: "Audio & Sound System",
      brand: "JBL Professional",
      description: "Speaker portable column array 1500W dengan baterai swap tahan 6 jam untuk aktivasi outdoor CFD & bazaar.",
      totalUnits: 4,
      availableUnits: 2, // 1 out in brw-003 (ACTIVE), 1 in repair/service center (brw-005 damage inspection)
      photoUrl: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500&auto=format&fit=crop&q=80",
      storageLocation: "Central Warehouse Jakarta - Bay B2",
      status: EquipmentStatus.AVAILABLE,
      notes: "1 unit dalam servis tweeter di service center resmi (ADR-0050 QA Case).",
    },
    {
      id: "inv-003",
      code: "SND-MCW-003",
      name: "Saramonic Blink 500 B2 Wireless Dual Lavalier Mic",
      category: "Audio & Sound System",
      brand: "Saramonic",
      description: "Klip mikrofon wireless untuk pembuat konten video liputan media dan influencer lapangan.",
      totalUnits: 3,
      availableUnits: 0,
      photoUrl: "https://images.unsplash.com/photo-1583778176476-4a8b02a64c01?w=500&auto=format&fit=crop&q=80",
      storageLocation: "Service Center Vendor Saramonic",
      status: EquipmentStatus.MAINTENANCE,
      notes: "Dalam perbaikan receiver unit yang tidak sinkron ke kamera.",
    },
    // Visual & Display
    {
      id: "inv-004",
      code: "VIS-LED-001",
      name: "Samsung 65 Inch Commercial Display 4K UHD QB65B",
      category: "Visual & Display",
      brand: "Samsung",
      description: "Smart signage TV 65 inci resolusi 4K dengan kecerahan tinggi 350 nits untuk display leaderboard turnamen.",
      totalUnits: 4,
      availableUnits: 3, // 1 out in brw-003 (ACTIVE)
      photoUrl: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&auto=format&fit=crop&q=80",
      storageLocation: "Hub Warehouse Semarang - Box TV-01",
      status: EquipmentStatus.AVAILABLE,
      notes: "Lengkap dengan flightcase roda busa pengaman.",
    },
    {
      id: "inv-005",
      code: "VIS-PRJ-002",
      name: "Epson EB-2250U 5000 Lumens WUXGA Full HD Projector",
      category: "Visual & Display",
      brand: "Epson",
      description: "Proyektor bisnis berdaya sorot 5000 lumens untuk presentasi roadshow kampus dan seminar outdoor senja.",
      totalUnits: 3,
      availableUnits: 2, // 1 out in brw-004 (OVERDUE)
      photoUrl: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500&auto=format&fit=crop&q=80",
      storageLocation: "Central Warehouse Jakarta - Rak C3",
      status: EquipmentStatus.AVAILABLE,
      notes: "Lengkap dengan kabel HDMI 15 meter dan remote kontrol.",
    },
    {
      id: "inv-006",
      code: "VIS-STD-003",
      name: "Standing Bracket TV Floor Stand Heavy Duty 55-75 Inch",
      category: "Visual & Display",
      brand: "Brateck Heavy",
      description: "Tiang bracket TV lantai beroda dengan rak laptop tambahan berbahan baja kokoh.",
      totalUnits: 5,
      availableUnits: 4, // 1 out in brw-003 (ACTIVE)
      photoUrl: "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500&auto=format&fit=crop&q=80",
      storageLocation: "Hub Warehouse Semarang - Area Bracket",
      status: EquipmentStatus.AVAILABLE,
      notes: "Semua baut pengunci dan kunci L lengkap di tas kanvas.",
    },
    // Booth & Staging
    {
      id: "inv-007",
      code: "TND-001",
      name: "Tenda Lipat Hexagonal 3x3m Rangka Aluminium IM3 Yellow",
      category: "Booth & Staging",
      brand: "MasterTent Pro",
      description: "Tenda booth lipat cepat rangka aluminium segi enam tebal dengan atap kanvas anti air warna kuning khas IM3.",
      totalUnits: 10,
      availableUnits: 5, // 3 out in brw-003 (ACTIVE), 2 out in brw-004 (OVERDUE)
      photoUrl: "https://images.unsplash.com/photo-1510519138161-58474ebf8484?w=500&auto=format&fit=crop&q=80",
      storageLocation: "Hub Warehouse Semarang - Palet Tenda A",
      status: EquipmentStatus.AVAILABLE,
      notes: "Sertakan 4 pasak besi dan kantong pemberat pasir di setiap paket.",
    },
    {
      id: "inv-008",
      code: "BTH-TND-002",
      name: "Tenda Lipat Hexagonal 3x3m Rangka Aluminium Tri Happy",
      category: "Booth & Staging",
      brand: "MasterTent Pro",
      description: "Tenda booth promosi Tri Happy dengan dinding samping transparan mika dan logo Tri besar.",
      totalUnits: 8,
      availableUnits: 8, // 0 out (brw-001 is PENDING)
      photoUrl: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=500&auto=format&fit=crop&q=80",
      storageLocation: "Central Warehouse Jakarta - Palet Tenda B",
      status: EquipmentStatus.AVAILABLE,
      notes: "Kondisi prima siap kirim.",
    },
    {
      id: "inv-009",
      code: "BTH-TBL-003",
      name: "Meja Lipat Bar Portable 180cm + 2 Kursi Lipat Lapangan",
      category: "Booth & Staging",
      brand: "Krisbow Heavy Duty",
      description: "Meja lipat plastik tebal HDPE tahan benturan dilengkapi taplak meja elastis branding IM3.",
      totalUnits: 12,
      availableUnits: 8, // 4 out in brw-003 (ACTIVE)
      photoUrl: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=500&auto=format&fit=crop&q=80",
      storageLocation: "Hub Warehouse Semarang - Rak Meja",
      status: EquipmentStatus.AVAILABLE,
      notes: "Taplak meja bersih tersimpan dalam plastik tertutup.",
    },
    {
      id: "inv-010",
      code: "BTH-POP-004",
      name: "Backdrop Pop-Up Magnetic Curve 3x3m IM3 Colabonation",
      category: "Booth & Staging",
      brand: "Expand Media",
      description: "Rangka backdrop melengkung magnetik portabel dengan hardcase troli beroda untuk photo booth selfie.",
      totalUnits: 4,
      availableUnits: 3, // 1 out in brw-003 (ACTIVE)
      photoUrl: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=500&auto=format&fit=crop&q=80",
      storageLocation: "Hub Warehouse Semarang - Box BD-02",
      status: EquipmentStatus.AVAILABLE,
      notes: "Panel magnetik diperiksa tidak ada yang sobek atau terlipat.",
    },
    // Power & Electrical
    {
      id: "inv-011",
      code: "PWR-GEN-001",
      name: "Genset Inverter Silent Honda EU30is 3000 Watt",
      category: "Power & Electrical",
      brand: "Honda Power",
      description: "Genset inverter super silent dengan tingkat kebisingan rendah 58 dB, aman untuk perangkat audio & TV outdoor.",
      totalUnits: 2,
      availableUnits: 1, // 1 out in brw-003 (ACTIVE)
      photoUrl: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=500&auto=format&fit=crop&q=80",
      storageLocation: "Central Warehouse Jakarta - Area Genset",
      status: EquipmentStatus.AVAILABLE,
      notes: "Oli mesin baru diganti, tangki bahan bakar dikosongkan saat disimpan di gudang.",
    },
    {
      id: "inv-012",
      code: "PWR-KBL-002",
      name: "Kabel Rol Heavy Duty Outdoor 50m Waterproof IP44",
      category: "Power & Electrical",
      brand: "Uticon Heavy Cable",
      description: "Kabel sambung tembaga murni 3x2.5mm panjang 50 meter dengan 4 stopkontak soket berpelindung air.",
      totalUnits: 8,
      availableUnits: 5, // 2 out in brw-003 (ACTIVE), 1 out in brw-004 (OVERDUE)
      photoUrl: "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=500&auto=format&fit=crop&q=80",
      storageLocation: "Hub Warehouse Semarang - Rak Kabel",
      status: EquipmentStatus.AVAILABLE,
      notes: "Sudah dilengkapi fuse pengaman over-voltage.",
    },
    // Merchandise & Engagement Assets
    {
      id: "inv-013",
      code: "MRC-SPL-001",
      name: "Spin Wheel Lucky Draw Akrilik Portable 60cm Custom",
      category: "Merchandise Assets",
      brand: "Display Craft",
      description: "Papan putar roda undian hadiah berjarum bunyi klik seru untuk games interaktif aktivasi stan.",
      totalUnits: 5,
      availableUnits: 4, // 1 out in brw-003 (ACTIVE)
      photoUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=80",
      storageLocation: "Hub Warehouse Semarang - Rak Games",
      status: EquipmentStatus.AVAILABLE,
      notes: "Bisa ditulis spidol whiteboard dan dihapus kembali.",
    },
    {
      id: "inv-014",
      code: "MRC-DIS-002",
      name: "Showcase Display Kartu Perdana Akrilik 3 Tingkat",
      category: "Merchandise Assets",
      brand: "Acrylic King",
      description: "Display etalase meja akrilik bening untuk memajang paket perdana IM3 Platinum dan Tri AlwaysOn.",
      totalUnits: 15,
      availableUnits: 15, // 0 out
      photoUrl: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop&q=80",
      storageLocation: "Central Warehouse Jakarta - Box Akrilik",
      status: EquipmentStatus.AVAILABLE,
      notes: "Lengkap kunci gembok mini di tiap rak.",
    },
  ];

  for (const it of items) {
    await prisma.inventoryItem.create({ data: it });
  }
  console.log(`   ✅ Seeded ${items.length} warehouse inventory items with mathematically verified unit counts.`);
}


// ============================================================================
// 10. EQUIPMENT BORROW RECORDS & SETTLEMENTS SEED (model BorrowRecord & BorrowItem)
// ============================================================================
async function seedBorrowRecords() {
  console.log("🚚 [10/11] Seeding equipment borrow workflows, inspections, & compensation settlements...");

  // 1. PENDING Request (Awaiting Supervisor Approval)
  await prisma.borrowRecord.create({
    data: {
      id: "brw-001",
      borrowCode: "BRW-20261101-001",
      borrowerName: "Dewi Lestari",
      borrowerPhone: "081288881234",
      borrowerDivision: "Field Marketing Jabodetabek",
      picName: "Dewi Lestari",
      eventId: null,
      eventLocation: "Kampus UI Salemba, Jakarta Pusat",
      borrowDate: daysFromNow(2),
      returnDueDate: daysFromNow(4),
      returnDate: null,
      status: BorrowStatus.PENDING,
      purpose: "Aktivasi stan booth edukasi paket internet mahasiswa baru Tri Happy di kantin Salemba.",
      notes: "Menunggu persetujuan SPV sebelum pengambilan barang di gudang KPPTI.",
      approvedBy: "",
      approvedAt: null,
      items: {
        create: [
          {
            inventoryItemId: "inv-008", // Tenda Tri Happy
            quantity: 2,
            conditionOut: EquipmentCondition.GOOD,
            goodUnits: 2,
            minorDamageUnits: 0,
            majorDamageUnits: 0,
            lostUnits: 0,
            notes: "2 unit tenda booth Tri siap pakai.",
          },
        ],
      },
    },
  });

  // 2. APPROVED Request (Waiting Warehouse Handover)
  await prisma.borrowRecord.create({
    data: {
      id: "brw-002",
      borrowCode: "BRW-20261102-002",
      borrowerName: "Wayan Sudarma",
      borrowerPhone: "081377778888",
      borrowerDivision: "Field Marketing Bali",
      picName: "Wayan Sudarma",
      eventId: "event-004", // Konser Kuta
      eventLocation: "Area Panggung Pantai Kuta, Badung, Bali",
      borrowDate: daysFromNow(7),
      returnDueDate: daysFromNow(11),
      returnDate: null,
      status: BorrowStatus.APPROVED,
      purpose: "Konser Musik Senja Colabonation Pantai Kuta bersama musisi indie nasional.",
      notes: "Sudah disetujui SPV Jabodetabek & Bali. Pengambilan dijadwalkan H-1 konser di gudang transit.",
      approvedBy: "Hendra Kusuma (SPV Jabodetabek)",
      approvedAt: daysAgo(1),
      items: {
        create: [
          {
            inventoryItemId: "inv-001", // Shure Mic
            quantity: 2,
            conditionOut: EquipmentCondition.GOOD,
            goodUnits: 2,
            minorDamageUnits: 0,
            majorDamageUnits: 0,
            lostUnits: 0,
            notes: "Mikrofon cadangan untuk MC dan bintang tamu konser.",
          },
        ],
      },
    },
  });

  // 3. ADR-0054 CRITICAL TEST CASE A: ACTIVE Loan Linked to COMPLETED Event!
  // Triggers pervasive warning banners: EventDrawer, EventCardsView, EventTableView,
  // Outlet360Drawer, and PipelineMatrixTable Column 4.
  await prisma.borrowRecord.create({
    data: {
      id: "brw-003",
      borrowCode: "BRW-20261030-003",
      borrowerName: "Dimas Anggara",
      borrowerPhone: "081333445566",
      borrowerDivision: "Activation & Roadshow Team",
      picName: "Dimas Anggara",
      eventId: "event-001", // Roadshow UGM (COMPLETED!)
      eventLocation: "Plaza Boulevard UGM, Yogyakarta",
      borrowDate: daysAgo(7),
      returnDueDate: daysFromNow(2),
      returnDate: null,
      status: BorrowStatus.ACTIVE,
      purpose: "Roadshow Colabonation Campus Tour UGM — Peminjaman perlengkapan booth turnamen gaming dan sound system.",
      notes: "PERINGATAN AUDIT: Event telah selesai ditutup di sistem pada H-3, namun peralatan 17 unit masih berada di bawah tanggung jawab tim lapangan.",
      approvedBy: "Maya Safitri (SPV Jabar & Jateng)",
      approvedAt: daysAgo(7),
      items: {
        create: [
          {
            inventoryItemId: "inv-001", // Shure Mic (2)
            quantity: 2,
            conditionOut: EquipmentCondition.GOOD,
            goodUnits: 2,
            minorDamageUnits: 0,
            majorDamageUnits: 0,
            lostUnits: 0,
            notes: "2 unit Mic Wireless Shure lengkap flightcase.",
          },
          {
            inventoryItemId: "inv-002", // JBL PA (1)
            quantity: 1,
            conditionOut: EquipmentCondition.GOOD,
            goodUnits: 1,
            minorDamageUnits: 0,
            majorDamageUnits: 0,
            lostUnits: 0,
            notes: "1 unit Speaker portable column JBL EON ONE MK2.",
          },
          {
            inventoryItemId: "inv-004", // Samsung TV (1)
            quantity: 1,
            conditionOut: EquipmentCondition.GOOD,
            goodUnits: 1,
            minorDamageUnits: 0,
            majorDamageUnits: 0,
            lostUnits: 0,
            notes: "1 unit TV Samsung 65 inci display turnamen.",
          },
          {
            inventoryItemId: "inv-006", // Standing Bracket (1)
            quantity: 1,
            conditionOut: EquipmentCondition.GOOD,
            goodUnits: 1,
            minorDamageUnits: 0,
            majorDamageUnits: 0,
            lostUnits: 0,
            notes: "1 unit Standing Bracket TV beroda.",
          },
          {
            inventoryItemId: "inv-007", // Tenda IM3 Yellow (3)
            quantity: 3,
            conditionOut: EquipmentCondition.GOOD,
            goodUnits: 3,
            minorDamageUnits: 0,
            majorDamageUnits: 0,
            lostUnits: 0,
            notes: "3 unit Tenda Lipat Hexagonal 3x3m IM3.",
          },
          {
            inventoryItemId: "inv-009", // Meja Lipat Bar (4)
            quantity: 4,
            conditionOut: EquipmentCondition.GOOD,
            goodUnits: 4,
            minorDamageUnits: 0,
            majorDamageUnits: 0,
            lostUnits: 0,
            notes: "4 unit Meja Lipat Bar 180cm + taplak meja IM3.",
          },
          {
            inventoryItemId: "inv-010", // Backdrop Pop-Up (1)
            quantity: 1,
            conditionOut: EquipmentCondition.GOOD,
            goodUnits: 1,
            minorDamageUnits: 0,
            majorDamageUnits: 0,
            lostUnits: 0,
            notes: "1 set Backdrop Pop-Up Magnetic Curve 3x3m Colabonation.",
          },
          {
            inventoryItemId: "inv-011", // Genset Silent (1)
            quantity: 1,
            conditionOut: EquipmentCondition.GOOD,
            goodUnits: 1,
            minorDamageUnits: 0,
            majorDamageUnits: 0,
            lostUnits: 0,
            notes: "1 unit Genset Inverter Silent Honda EU30is 3000W.",
          },
          {
            inventoryItemId: "inv-012", // Kabel Rol 50m (2)
            quantity: 2,
            conditionOut: EquipmentCondition.GOOD,
            goodUnits: 2,
            minorDamageUnits: 0,
            majorDamageUnits: 0,
            lostUnits: 0,
            notes: "2 rol Kabel Rol Outdoor 50 meter IP44.",
          },
          {
            inventoryItemId: "inv-013", // Spin Wheel (1)
            quantity: 1,
            conditionOut: EquipmentCondition.GOOD,
            goodUnits: 1,
            minorDamageUnits: 0,
            majorDamageUnits: 0,
            lostUnits: 0,
            notes: "1 unit Spin Wheel Lucky Draw Akrilik Portable.",
          },
        ],
      },
    },
  });

  // 4. OVERDUE Loan (Due 5 days ago, Linked to CFD Event)
  await prisma.borrowRecord.create({
    data: {
      id: "brw-004",
      borrowCode: "BRW-20261025-004",
      borrowerName: "Budi Santoso",
      borrowerPhone: "08112345001",
      borrowerDivision: "Field Marketing Semarang",
      picName: "Budi Santoso",
      eventId: "event-003", // CFD Solo
      eventLocation: "Jl. Slamet Riyadi KM 3, Surakarta",
      borrowDate: daysAgo(12),
      returnDueDate: daysAgo(5),
      returnDate: null,
      status: BorrowStatus.OVERDUE,
      purpose: "Senam CFD dan stan pendaftaran perdana Tri Happy di Solo.",
      notes: "TERLAMBAT: Jatuh tempo pengembalian terlewati 5 hari. Petugas gudang telah mengirim peringatan resmi ke PIC.",
      approvedBy: "Maya Safitri (SPV Jabar & Jateng)",
      approvedAt: daysAgo(12),
      items: {
        create: [
          {
            inventoryItemId: "inv-001", // Shure Mic (1)
            quantity: 1,
            conditionOut: EquipmentCondition.GOOD,
            goodUnits: 1,
            minorDamageUnits: 0,
            majorDamageUnits: 0,
            lostUnits: 0,
            notes: "1 unit Mic Shure untuk instruktur senam.",
          },
          {
            inventoryItemId: "inv-005", // Epson Projector (1)
            quantity: 1,
            conditionOut: EquipmentCondition.GOOD,
            goodUnits: 1,
            minorDamageUnits: 0,
            majorDamageUnits: 0,
            lostUnits: 0,
            notes: "1 unit Proyektor Epson 5000 lumens.",
          },
          {
            inventoryItemId: "inv-007", // Tenda IM3 (2)
            quantity: 2,
            conditionOut: EquipmentCondition.GOOD,
            goodUnits: 2,
            minorDamageUnits: 0,
            majorDamageUnits: 0,
            lostUnits: 0,
            notes: "2 unit Tenda Lipat Hexagonal 3x3m.",
          },
          {
            inventoryItemId: "inv-012", // Kabel Rol (1)
            quantity: 1,
            conditionOut: EquipmentCondition.GOOD,
            goodUnits: 1,
            minorDamageUnits: 0,
            majorDamageUnits: 0,
            lostUnits: 0,
            notes: "1 rol Kabel Rol 50 meter.",
          },
        ],
      },
    },
  });

  // 5. ADR-0050 RETURN INSPECTION BREAKDOWN WITH PENDING SETTLEMENT
  await prisma.borrowRecord.create({
    data: {
      id: "brw-005",
      borrowCode: "BRW-20261015-005",
      borrowerName: "Dewi Lestari",
      borrowerPhone: "081288881234",
      borrowerDivision: "Field Marketing Jabodetabek",
      picName: "Dewi Lestari",
      eventId: null,
      eventLocation: "Pameran Komputer Mall Artha Gading, Jakarta",
      borrowDate: daysAgo(22),
      returnDueDate: daysAgo(15),
      returnDate: daysAgo(14),
      status: BorrowStatus.RETURNED,
      purpose: "Stan promosi modem WiFi Indosat HiFi di exhibition mall.",
      notes: "Pengembalian selesai dengan temuan kerusakan fisik pada 1 unit speaker. Proses kompensasi sedang diverifikasi.",
      approvedBy: "Hendra Kusuma (SPV Jabodetabek)",
      approvedAt: daysAgo(22),
      returnNotes: "Ditemukan kerusakan driver tweeter robek dan kabel adaptor aus akibat tertimpa besi kanopi.",
      compensationAmount: 850000,
      compensationStatus: "PENDING_SETTLEMENT",
      compensationNotes: "Biaya estimasi servis driver tweeter dan perbaikan kabel power dari service center resmi JBL.",
      damagePhotos: [
        "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80",
      ],
      settlementType: "NONE",
      settledAmount: 0,
      settledAt: null,
      settledBy: "",
      settlementNotes: "",
      settlementProofUrls: [],
      items: {
        create: [
          {
            inventoryItemId: "inv-002", // JBL Column PA (4)
            quantity: 4,
            conditionOut: EquipmentCondition.GOOD,
            conditionIn: EquipmentCondition.MAJOR_DAMAGE,
            goodUnits: 2,
            minorDamageUnits: 1,
            majorDamageUnits: 1, // Sent to repair
            lostUnits: 0,
            notes: "2 unit mulus, 1 unit baret minor di handle, 1 unit tweeter rusak (dikirim ke servis).",
          },
        ],
      },
    },
  });

  // 6. ADR-0052 SETTLEMENT VIA CASH TRANSFER & WRITE-OFF
  await prisma.borrowRecord.create({
    data: {
      id: "brw-006",
      borrowCode: "BRW-20261005-006",
      borrowerName: "Ahmad Fauzi",
      borrowerPhone: "081266667777",
      borrowerDivision: "Field Marketing Medan",
      picName: "Ahmad Fauzi",
      eventId: null,
      eventLocation: "Plaza Medan Fair, Medan",
      borrowDate: daysAgo(35),
      returnDueDate: daysAgo(28),
      returnDate: daysAgo(27),
      status: BorrowStatus.RETURNED,
      purpose: "Eksibisi peluncuran paket kuota roaming umroh IM3 Medan.",
      notes: "Penyelesaian kompensasi kehilangan 1 unit bracket TV telah diselesaikan secara transfer perbankan.",
      approvedBy: "Budi Pratama (Super Admin)",
      approvedAt: daysAgo(35),
      returnNotes: "1 unit bracket TV hilang di venue mall setelah acara selesai.",
      compensationAmount: 1500000,
      compensationStatus: "RESOLVED",
      compensationNotes: "Vendor EO bertanggung jawab penuh mengganti biaya unit yang hilang sebesar Rp 1.500.000.",
      damagePhotos: [
        "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600&auto=format&fit=crop&q=80",
      ],
      settlementType: "CASH_TRANSFER",
      settledAmount: 1500000,
      settledAt: daysAgo(2),
      settledBy: "Budi Pratama (Super Admin)",
      settlementNotes: "Penggantian biaya 1 unit tripod stand bracket via transfer bank Mandiri ke rekening kas marcom. Dana telah masuk dan diverifikasi keuangan.",
      settlementProofUrls: [
        "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
      ],
      items: {
        create: [
          {
            inventoryItemId: "inv-006", // Standing Bracket TV (2)
            quantity: 2,
            conditionOut: EquipmentCondition.GOOD,
            conditionIn: EquipmentCondition.LOST,
            goodUnits: 1,
            minorDamageUnits: 0,
            majorDamageUnits: 0,
            lostUnits: 1,
            notes: "1 unit kembali kondisi baik, 1 unit hilang dan diselesaikan lewat kompensasi tunai.",
          },
        ],
      },
    },
  });

  // 7. ADR-0052 SETTLEMENT VIA ITEM REPLACEMENT & STOCK RESTORATION
  await prisma.borrowRecord.create({
    data: {
      id: "brw-007",
      borrowCode: "BRW-20261010-007",
      borrowerName: "Budi Santoso",
      borrowerPhone: "08112345001",
      borrowerDivision: "Field Marketing Semarang",
      picName: "Budi Santoso",
      eventId: null,
      eventLocation: "Gedung Wanita Semarang",
      borrowDate: daysAgo(28),
      returnDueDate: daysAgo(21),
      returnDate: daysAgo(20),
      status: BorrowStatus.RETURNED,
      purpose: "Seminar wirausaha UMKM go digital bersama IM3.",
      notes: "Kabel rol yang putus akibat terlindas mobil box vendor telah diganti unit baru merek yang sama.",
      approvedBy: "Maya Safitri (SPV Jabar & Jateng)",
      approvedAt: daysAgo(28),
      returnNotes: "1 rol kabel putus total, disetujui penggantian unit baru setara.",
      compensationAmount: 0,
      compensationStatus: "RESOLVED",
      compensationNotes: "Penyelesaian melalui penggantian barang (Item Replacement) kabel rol Uticon 50m baru dalam segel.",
      damagePhotos: [
        "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=600&auto=format&fit=crop&q=80",
      ],
      settlementType: "ITEM_REPLACEMENT",
      settledAmount: 0,
      settledAt: daysAgo(4),
      settledBy: "Slamet Riyadi (Warehouse Lead Semarang)",
      settlementNotes: "Fisik kabel baru telah diinspeksi warehouse officer, berfungsi 100%, dan dimasukkan kembali ke inventaris gudang.",
      settlementProofUrls: [
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80",
      ],
      items: {
        create: [
          {
            inventoryItemId: "inv-012", // Kabel Rol Outdoor (1)
            quantity: 1,
            conditionOut: EquipmentCondition.GOOD,
            conditionIn: EquipmentCondition.GOOD, // Restored with new replacement unit
            goodUnits: 1,
            minorDamageUnits: 0,
            majorDamageUnits: 0,
            lostUnits: 0,
            notes: "Barang pengganti baru diterima di gudang Semarang.",
          },
        ],
      },
    },
  });

  // 8. ADR-0054 CASE B: CLEAN RETURN LINKED TO COMPLETED EVENT
  await prisma.borrowRecord.create({
    data: {
      id: "brw-008",
      borrowCode: "BRW-20261012-008",
      borrowerName: "Budi Santoso",
      borrowerPhone: "08112345001",
      borrowerDivision: "Field Marketing Semarang",
      picName: "Budi Santoso",
      eventId: "event-002", // Bazaar Ramadhan (COMPLETED!)
      eventLocation: "Lapangan Pancasila Simpang Lima, Semarang",
      borrowDate: daysAgo(21),
      returnDueDate: daysAgo(16),
      returnDate: daysAgo(16),
      status: BorrowStatus.RETURNED,
      purpose: "Aktivasi stan bazaar Simpang Lima Semarang.",
      notes: "Pengembalian bersih tanpa kendala, seluruh peralatan kembali lengkap.",
      approvedBy: "Maya Safitri (SPV Jabar & Jateng)",
      approvedAt: daysAgo(21),
      returnNotes: "Kondisi fisik diperiksa lengkap dan bersih.",
      compensationAmount: 0,
      compensationStatus: "NONE",
      compensationNotes: "",
      damagePhotos: [],
      settlementType: "NONE",
      settledAmount: 0,
      settledAt: null,
      settledBy: "",
      settlementNotes: "",
      settlementProofUrls: [],
      items: {
        create: [
          {
            inventoryItemId: "inv-007", // Tenda IM3 (2)
            quantity: 2,
            conditionOut: EquipmentCondition.GOOD,
            conditionIn: EquipmentCondition.GOOD,
            goodUnits: 2,
            minorDamageUnits: 0,
            majorDamageUnits: 0,
            lostUnits: 0,
            notes: "2 unit tenda kembali utuh beserta pasak besi.",
          },
          {
            inventoryItemId: "inv-009", // Meja Lipat Bar (2)
            quantity: 2,
            conditionOut: EquipmentCondition.GOOD,
            conditionIn: EquipmentCondition.GOOD,
            goodUnits: 2,
            minorDamageUnits: 0,
            majorDamageUnits: 0,
            lostUnits: 0,
            notes: "2 unit meja lipat dan taplak kembali bersih.",
          },
        ],
      },
    },
  });

  console.log("   ✅ Seeded 8 comprehensive borrow records with return inspections & settlements.");
}


// ============================================================================
// 11. CONTENT PLANNER POSTS SEED (model ContentPost)
// ============================================================================
async function seedContentPosts() {
  console.log("📱 [11/11] Seeding social media campaigns, subtasks, & media attachments...");
  const posts = [
    {
      id: "post-001",
      title: "Reels: Keseruan Colabonation Campus Tour UGM 2026",
      platform: "Instagram",
      format: "Reels",
      publishDate: daysAgo(3),
      status: "PUBLISHED",
      caption: "Keseruan bareng temen-temen UGM di Colabonation Campus Tour! Turnamen MLBB pecah banget, siapa nih yang dapet paket kuota Freedom Internet 100GB? 🚀🔥 Tag squad mabar kamu di kolom komentar! #IM3Colabonation #KeseruanUGM #SinyalMerdeka",
      mediaUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80",
      mediaAttachments: toJson([
        {
          id: "med-cp-001",
          url: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80",
          name: "Cover Reels UGM.jpg",
          size: "2.1 MB",
          mimeType: "image/jpeg",
        },
      ]),
      branchName: "Semarang Pandanaran",
      picName: "Budi Santoso",
      revisionNotes: "",
      subtasks: toJson([
        { id: "st-001", text: "Take footage 4K slow-mo panggung turnamen", completed: true },
        { id: "st-002", text: "Editing video transisi beat lagu Colabonation", completed: true },
        { id: "st-003", text: "Approval caption dari Tim Brand HQ", completed: true },
        { id: "st-004", text: "Posting jadwal prime time 19:00 WIB", completed: true },
      ]),
      outletId: "outlet-smg-002",
    },
    {
      id: "post-002",
      title: "TikTok: Spill Trik Beli Paket AlwaysOn Murah Banget",
      platform: "TikTok",
      format: "Reels",
      publishDate: daysAgo(1),
      status: "PUBLISHED",
      caption: "Gak usah panik kuota abis pas lagi maraton drakor! Pakai Tri AlwaysOn masa aktif setahun penuh, kantong mahasiswa tetep aman santai~ Cobain sekarang di outlet terdekat! 💃✨ #TriIndonesia #TriAlwaysOn #TipsHematMahasiswa",
      mediaUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80",
      mediaAttachments: toJson([
        {
          id: "med-cp-002",
          url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80",
          name: "Thumbnail TikTok Tri.jpg",
          size: "1.9 MB",
          mimeType: "image/jpeg",
        },
      ]),
      branchName: "Bandung Dago Raya",
      picName: "Hilman Firdaus",
      revisionNotes: "",
      subtasks: toJson([
        { id: "st-005", text: "Shooting talent mahasiswa di kantin Salman ITB", completed: true },
        { id: "st-006", text: "Tambahkan sound effect viral TikTok", completed: true },
        { id: "st-007", text: "Publish dan monitor komentar FYP", completed: true },
      ]),
      outletId: "outlet-bdg-002",
    },
    {
      id: "post-003",
      title: "Carousel: Panduan Lengkap Beralih ke eSIM IM3 Bebas Ribet",
      platform: "Instagram",
      format: "Carousel",
      publishDate: daysFromNow(2),
      status: "SCHEDULED",
      caption: "Tinggalkan kartu fisik yang gampang patah! Ini dia 5 langkah mudah upgrade ke eSIM IM3 langsung dari smartphone kamu tanpa harus antre lama. Geser ke kiri untuk baca tutorial lengkapnya! 👉📲 #eSIMIM3 #EraDigitalIM3 #UpgradeeSIM",
      mediaUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=80",
      mediaAttachments: toJson([
        {
          id: "med-cp-003",
          url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=80",
          name: "Slide 1 Cover eSIM.jpg",
          size: "2.4 MB",
          mimeType: "image/jpeg",
        },
      ]),
      branchName: "Jakarta Pusat & Thamrin",
      picName: "Dewi Lestari",
      revisionNotes: "",
      subtasks: toJson([
        { id: "st-008", text: "Desain 6 slide infografis sesuai brand guideline IM3", completed: true },
        { id: "st-009", text: "Review legal disclaimer syarat perangkat kompatibel", completed: true },
        { id: "st-010", text: "Setup auto-publish Meta Business Suite", completed: false },
      ]),
      outletId: "outlet-jkt-001",
    },
    {
      id: "post-004",
      title: "Story Promo: Flash Sale Diskon Perdana Tri di Mall Alam Sutera",
      platform: "Instagram",
      format: "Story",
      publishDate: daysFromNow(1),
      status: "SCHEDULED",
      caption: "FLASH SALE KHUSUS HARI INI! Kunjungi 3Store Mall @ Alam Sutera lantai 1 dan dapatkan starter pack Happy 30GB cuma Rp 25.000! Swipe up untuk lokasi toko! 🛍️⚡",
      mediaUrl: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&auto=format&fit=crop&q=80",
      mediaAttachments: toJson([]),
      branchName: "Tangerang Selatan BSD",
      picName: "Citra Kirana",
      revisionNotes: "",
      subtasks: toJson([
        { id: "st-011", text: "Buat motion sticker countdown", completed: true },
        { id: "st-012", text: "Pasang link direct Google Maps outlet", completed: false },
      ]),
      outletId: "outlet-tgr-001",
    },
    {
      id: "post-005",
      title: "YouTube Video: Review Coverage Sinyal IM3 5G di Pantai Kuta",
      platform: "YouTube",
      format: "Static Post",
      publishDate: daysFromNow(5),
      status: "DRAFT",
      caption: "Seberapa kencang internet 5G IM3 pas sunset di Kuta Bali? Kami uji kecepatan live streaming 4K dan upload file video puluhan gigabyte di tengah keramaian turis! Tonton video lengkapnya di kanal YouTube kami.",
      mediaUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
      mediaAttachments: toJson([]),
      branchName: "Denpasar Teuku Umar",
      picName: "Rina Wijaya",
      revisionNotes: "",
      subtasks: toJson([
        { id: "st-013", text: "Speedtest di 5 titik keramaian Pantai Kuta", completed: false },
        { id: "st-014", text: "Voice over narasi bahasa Inggris & Indonesia", completed: false },
        { id: "st-015", text: "Thumbnail custom CTR tinggi", completed: false },
      ]),
      outletId: "outlet-dps-001",
    },
    {
      id: "post-006",
      title: "Facebook Post: Pengumuman Pemenang Lucky Draw Bazaar Ramadhan",
      platform: "Facebook",
      format: "Static Post",
      publishDate: daysAgo(8),
      status: "PUBLISHED",
      caption: "Selamat kepada para pemenang undian hadiah motor listrik dan smartphone 5G Bazaar Ramadhan Simpang Lima Semarang! Daftar nama lengkap pemenang resmi terlampir pada gambar. Hati-hati terhadap penipuan yang mengatasnamakan IM3 Indosat.",
      mediaUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80",
      mediaAttachments: toJson([]),
      branchName: "Semarang Pandanaran",
      picName: "Budi Santoso",
      revisionNotes: "",
      subtasks: toJson([
        { id: "st-016", text: "Verifikasi nomor KTP & nomor SIM pemenang", completed: true },
        { id: "st-017", text: "Approval legal notaris", completed: true },
      ]),
      outletId: "outlet-smg-001",
    },
    {
      id: "post-007",
      title: "Reels: Tutorial Registrasi Kartu Perdana WNA di Bandara Ngurah Rai",
      platform: "Instagram",
      format: "Reels",
      publishDate: null,
      status: "REVISION_NEEDED",
      caption: "Welcome to Bali! Here is a simple guide for international tourists to activate IM3 Tourist Tourist Passport SIM card upon arrival at Ngurah Rai Airport.",
      mediaUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80",
      mediaAttachments: toJson([]),
      branchName: "Denpasar Teuku Umar",
      picName: "Rina Wijaya",
      revisionNotes: "CATATAN TIM LEGAL HQ: Mohon sertakan logo regulasi Kominfo terkait validasi nomor paspor WNA dan hapus background musik berhak cipta.",
      subtasks: toJson([
        { id: "st-018", text: "Revisi teks disclaimer aturan registrasi WNA", completed: false },
        { id: "st-019", text: "Ganti audio latar dengan musik bebas royalti", completed: false },
      ]),
      outletId: "outlet-dps-001",
    },
    {
      id: "post-008",
      title: "TikTok: Dance Challenge Jingle Terbaru IM3 Seru",
      platform: "TikTok",
      format: "Reels",
      publishDate: daysFromNow(4),
      status: "SCHEDULED",
      caption: "Bikin hari kamu makin seru bareng #JingleIM3Challenge! Ada hadiah total puluhan juta rupiah buat koreo paling gokil. Tunggu apa lagi, ikutan sekarang juga! 💃🕺🎧",
      mediaUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80",
      mediaAttachments: toJson([]),
      branchName: "Jakarta Pusat & Thamrin",
      picName: "Dewi Lestari",
      revisionNotes: "",
      subtasks: toJson([
        { id: "st-020", text: "Briefing 3 mega influencer TikTok", completed: true },
        { id: "st-021", text: "Promoted hashtag setup di TikTok Ads Manager", completed: false },
      ]),
      outletId: "outlet-jkt-001",
    },
    {
      id: "post-009",
      title: "Instagram Carousel: 5 Tempat Nongkrong Hits Bandung Sinyal IM3 Kencang",
      platform: "Instagram",
      format: "Carousel",
      publishDate: daysAgo(6),
      status: "PUBLISHED",
      caption: "Cari spot WFC yang gak pake buffer di Bandung? Ini dia 5 rekomendasi kafe asik di Dago & Riau dengan koneksi internet IM3 super stabil! Simpan postingan ini buat referensi akhir pekan kamu ya! ☕💻 #IM3Bandung #WFCHits #KulinerBandung",
      mediaUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80",
      mediaAttachments: toJson([]),
      branchName: "Bandung Dago Raya",
      picName: "Deden Ridwan",
      revisionNotes: "",
      subtasks: toJson([
        { id: "st-022", text: "Kurasi foto 5 coffee shop mitra", completed: true },
        { id: "st-023", text: "Speedtest langsung di tiap lokasi", completed: true },
      ]),
      outletId: "outlet-bdg-001",
    },
    {
      id: "post-010",
      title: "TikTok: Unboxing Starterpack Tri Happy Edisi Mahasiswa Baru",
      platform: "TikTok",
      format: "Reels",
      publishDate: daysAgo(4),
      status: "PUBLISHED",
      caption: "Unboxing perdana Tri Happy 50GB + bonus kuota streaming YouTube dan TikTok sepuasnya! Pas banget buat anak kosan hemat. Beli langsung di campus store kampus kamu ya! 📦🎒 #TriHappy #MahasiswaBaru #UnboxingStarterpack",
      mediaUrl: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80",
      mediaAttachments: toJson([]),
      branchName: "Semarang Pandanaran",
      picName: "Arya Prasetya",
      revisionNotes: "",
      subtasks: toJson([
        { id: "st-024", text: "Shoot detail kemasan starterpack", completed: true },
        { id: "st-025", text: "Voice over energetik", completed: true },
      ]),
      outletId: "outlet-smg-002",
    },
    {
      id: "post-011",
      title: "YouTube Community: Jadwal Live Streaming Konser Musik Kuta",
      platform: "YouTube",
      format: "Static Post",
      publishDate: daysFromNow(6),
      status: "SCHEDULED",
      caption: "Siap-siap sing along bareng musisi favorit kamu di Konser Musik Senja Colabonation Pantai Kuta! Catat jam live streaming-nya di channel YouTube resmi IM3 Indosat hari Sabtu jam 16:30 WITA! 🌅🎸 #ColabonationKuta #IM3LiveConcert",
      mediaUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80",
      mediaAttachments: toJson([]),
      branchName: "Denpasar Teuku Umar",
      picName: "Wayan Sudarma",
      revisionNotes: "",
      subtasks: toJson([
        { id: "st-026", text: "Desain poster jadwal rundown konser", completed: true },
        { id: "st-027", text: "Konfigurasi link YouTube Live Event", completed: false },
      ]),
      outletId: "outlet-dps-001",
    },
    {
      id: "post-012",
      title: "Facebook Post: Waspada Penipuan Undian Berhadiah Mengatasnamakan IM3",
      platform: "Facebook",
      format: "Static Post",
      publishDate: daysAgo(11),
      status: "PUBLISHED",
      caption: "Himbauan Keamanan: Indosat Ooredoo Hutchison tidak pernah memungut biaya apapun bagi pemenang program promo atau undian resmi. Pastikan selalu mengecek informasi resmi hanya melalui website im3.id atau aplikasi myIM3. #HimbauanKeamanan #AntiPenipuan #IM3Official",
      mediaUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80",
      mediaAttachments: toJson([]),
      branchName: "Jakarta Pusat & Thamrin",
      picName: "Dewi Lestari",
      revisionNotes: "",
      subtasks: toJson([
        { id: "st-028", text: "Verifikasi teks legal compliance", completed: true },
        { id: "st-029", text: "Posting serentak di halaman resmi Facebook", completed: true },
      ]),
      outletId: "outlet-jkt-001",
    },
    {
      id: "post-013",
      title: "Instagram Story: Behind the Scene Tim Lapangan Pasang Signboard Medan",
      platform: "Instagram",
      format: "Story",
      publishDate: daysAgo(2),
      status: "PUBLISHED",
      caption: "Dedikasi tim marcom Medan menembus panas terik demi memastikan branding gerai Balai Kota tampil prima dan memukau masyarakat Medan! Semangat tanpa batas! 💪🔥 #BehindTheScene #TimMarcomMedan #IM3Merata",
      mediaUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80",
      mediaAttachments: toJson([]),
      branchName: "Medan Balai Kota",
      picName: "Ahmad Fauzi",
      revisionNotes: "",
      subtasks: toJson([
        { id: "st-030", text: "Dokumentasi timelapse teknisi pasang signboard", completed: true },
      ]),
      outletId: "outlet-mdn-001",
    },
    {
      id: "post-014",
      title: "TikTok: Skit Komedi Beda Kecepatan Sinyal Sebelum & Sesudah Pakai Tri",
      platform: "TikTok",
      format: "Reels",
      publishDate: null,
      status: "DRAFT",
      caption: "POV: Kamu lagi push rank tapi sinyal temen kamu ngajak ribut vs pas udah ganti kartu Tri AlwaysOn! Auto MVP tanpa ampun! 🎮🤣 #KomediGamer #TriAlwaysOn #AntiLag",
      mediaUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80",
      mediaAttachments: toJson([]),
      branchName: "Surabaya Pemuda",
      picName: "Dimas Anggara",
      revisionNotes: "",
      subtasks: toJson([
        { id: "st-031", text: "Bikin naskah komedi bareng talent gamer lokal Surabaya", completed: false },
        { id: "st-032", text: "Rekam footage gameplay MLBB", completed: false },
      ]),
      outletId: "outlet-sby-001",
    },
  ];

  for (const p of posts) {
    await prisma.contentPost.create({ data: p });
  }
  console.log(`   ✅ Seeded ${posts.length} social media campaigns.`);
}

// ============================================================================
// 12. DOCUMENTS & EXECUTIVE MONTHLY REPORTS SEED
// ============================================================================
async function seedDocumentsAndReports() {
  console.log("📊 [12/11] Seeding document library & executive performance reports...");

  // Documents Library
  const documents = [
    {
      id: "doc-001",
      name: "SOP Standar Pemasangan Signboard & Shopblind Outdoor 2026.pdf",
      category: "SOP & Guidelines",
      period: "2026",
      branchName: "Jakarta Pusat & Thamrin",
      ownerPic: "Budi Pratama (Super Admin)",
      fileType: DocFileType.PDF,
      fileSizeMb: 12.8,
      filePath: "https://storage.marcom-internal.corp/docs/sop_posm_installation_2026.pdf",
      description: "Panduan teknis dan standar keselamatan kerja vendor pemasangan media reklame luar ruang.",
    },
    {
      id: "doc-002",
      name: "Template Perjanjian Kerjasama Sewa Lahan Toko (MoU) Bahasa Indonesia.docx",
      category: "Legal Contracts",
      period: "2026",
      branchName: "Jakarta Pusat & Thamrin",
      ownerPic: "Hendra Kusuma (SPV Jabodetabek)",
      fileType: DocFileType.DOCX,
      fileSizeMb: 3.4,
      filePath: "https://storage.marcom-internal.corp/docs/template_mou_legal_2026.docx",
      description: "Draf baku perjanjian legal perpanjangan hak branding fasad ruko mitra retailer tradisional.",
    },
    {
      id: "doc-003",
      name: "Rekapitulasi Belanja POSM & Audit Deviasi GPS Seluruh Wilayah Q3 2026.xlsx",
      category: "Audit & Finance",
      period: "Q3 2026",
      branchName: "Semarang Pandanaran",
      ownerPic: "Hendra Pratama (Auditor)",
      fileType: DocFileType.XLSX,
      fileSizeMb: 8.7,
      filePath: "https://storage.marcom-internal.corp/docs/rekap_posm_gps_audit_q3_2026.xlsx",
      description: "Tabel audit kepatuhan titik instalasi material promosi dan komparasi koordinat fisik outlet.",
    },
    {
      id: "doc-004",
      name: "Paket Desain Grafis Vektor Logo IM3 & Tri Format AI & EPS.zip",
      category: "Brand Assets",
      period: "2026",
      branchName: "Bandung Dago Raya",
      ownerPic: "Maya Safitri (SPV Jabar & Jateng)",
      fileType: DocFileType.ZIP,
      fileSizeMb: 84.5,
      filePath: "https://storage.marcom-internal.corp/docs/vector_brand_assets_im3_tri_2026.zip",
      description: "Master file logo beresolusi tinggi, palet warna CMYK, dan pedoman font tipografi resmi.",
    },
    {
      id: "doc-005",
      name: "Buku Panduan Tata Kelola & Kompensasi Inventaris Gudang Lapangan.pdf",
      category: "Logistics",
      period: "2026",
      branchName: "Semarang Pandanaran",
      ownerPic: "Joko Widodo (Warehouse Lead Jakarta)",
      fileType: DocFileType.PDF,
      fileSizeMb: 6.2,
      filePath: "https://storage.marcom-internal.corp/docs/buku_panduan_gudang_kompensasi_2026.pdf",
      description: "Petunjuk teknis inspeksi pengembalian barang, penaksiran kerusakan, dan penyelesaian kompensasi ganti rugi (ADR-0050 & ADR-0052).",
    },
    {
      id: "doc-006",
      name: "Infografis Alur Pengajuan MoU Branding Fasad Ruko Mitra 2026.png",
      category: "Infographics",
      period: "2026",
      branchName: "Jakarta Pusat & Thamrin",
      ownerPic: "Budi Pratama (Super Admin)",
      fileType: DocFileType.PNG,
      fileSizeMb: 4.8,
      filePath: "https://storage.marcom-internal.corp/docs/infografis_alur_mou_2026.png",
      description: "Bagan visual langkah pengajuan perjanjian kerjasama dari inisiasi draf hingga persetujuan legal.",
    },
    {
      id: "doc-007",
      name: "Laporan Hasil Survey Kelayakan Titik Reklame Jawa Timur Q2 2026.pdf",
      category: "Audit & Finance",
      period: "Q2 2026",
      branchName: "Surabaya Pemuda",
      ownerPic: "Eko Prasetyo",
      fileType: DocFileType.PDF,
      fileSizeMb: 15.2,
      filePath: "https://storage.marcom-internal.corp/docs/laporan_survey_reklame_jatim_q2.pdf",
      description: "Hasil observasi trafik pejalan kaki dan kendaraan bermotor di depan toko-toko kandidat branding.",
    },
    {
      id: "doc-008",
      name: "Daftar Standar Harga Satuan Bahan Material POSM Regional 2026.xlsx",
      category: "Procurement",
      period: "2026",
      branchName: "Jakarta Pusat & Thamrin",
      ownerPic: "Hendra Pratama (Auditor)",
      fileType: DocFileType.XLSX,
      fileSizeMb: 5.1,
      filePath: "https://storage.marcom-internal.corp/docs/standar_harga_posm_2026.xlsx",
      description: "Plafon biaya maksimum pengadaan signboard, neon box, dan spanduk per meter persegi per pulau.",
    },
    {
      id: "doc-009",
      name: "Format Berita Acara Serah Terima Gudang & Kondisi Fisik Alat (BAST).docx",
      category: "Logistics",
      period: "2026",
      branchName: "Semarang Pandanaran",
      ownerPic: "Slamet Riyadi (Warehouse Lead Semarang)",
      fileType: DocFileType.DOCX,
      fileSizeMb: 2.1,
      filePath: "https://storage.marcom-internal.corp/docs/format_bast_gudang_alat_2026.docx",
      description: "Formulir standar serah terima peminjaman dan pengembalian barang operasional marketing lapangan.",
    },
    {
      id: "doc-010",
      name: "Pedoman Identitas Visual Co-Branding IM3 & Tri Edisi 2026.pdf",
      category: "Brand Assets",
      period: "2026",
      branchName: "Bandung Dago Raya",
      ownerPic: "Maya Safitri (SPV Jabar & Jateng)",
      fileType: DocFileType.PDF,
      fileSizeMb: 24.6,
      filePath: "https://storage.marcom-internal.corp/docs/pedoman_co_branding_im3_tri_2026.pdf",
      description: "Ketentuan proporsi logo, jarak batas aman, dan tata letak banner promosi bersama IM3 dan Tri.",
    },
  ];

  for (const d of documents) {
    await prisma.documentItem.create({ data: d });
  }

  // Monthly Reports
  const reports = [
    {
      id: "rep-2026-06",
      month: "June",
      year: 2026,
      summary: toJson({
        totalOutletsActive: 12,
        newPosmInstalled: 10,
        totalEventsCompleted: 2,
        totalBudgetCommittedIdr: 75000000,
        averageGpsDeviationMeters: 6.1,
      }),
      activities: toJson([
        "Kick-off kampanye Back to Campus Tri serentak di Jawa Barat dan Jawa Tengah.",
        "Renovasi fasad 3 gerai exclusive di kota tier-1.",
      ]),
      achievements: toJson([
        "Penandatanganan 4 kontrak kerjasama sewa jangka panjang.",
        "Penetrasi kartu perdana mahasiswa baru naik 24% pasca aktivasi kampus.",
      ]),
      keyIssues: toJson([
        "Keterbatasan stok tenda lipat di hub logistik regional.",
      ]),
      actionPlans: toJson([
        "Pengadaan tambahan 8 unit tenda lipat hexagonal berangka aluminium kokoh.",
      ]),
    },
    {
      id: "rep-2026-07",
      month: "July",
      year: 2026,
      summary: toJson({
        totalOutletsActive: 14,
        newPosmInstalled: 12,
        totalEventsCompleted: 3,
        totalBudgetCommittedIdr: 88000000,
        averageGpsDeviationMeters: 5.8,
      }),
      activities: toJson([
        "Aktivasi festival kuliner dan senam sehat CFD di Surakarta dan Bandung.",
        "Pemasangan shopblind kanopi di area foodcourt kampus.",
      ]),
      achievements: toJson([
        "Kelulusan 100% audit perizinan reklame di Pemkot Semarang dan Bandung.",
      ]),
      keyIssues: toJson([
        "Keterlambatan laporan dokumentasi foto dari vendor rekanan.",
      ]),
      actionPlans: toJson([
        "Penerapan validasi GPS ketat dengan toleransi maksimal deviasi 100 meter dari toko.",
      ]),
    },
    {
      id: "rep-2026-08",
      month: "August",
      year: 2026,
      summary: toJson({
        totalOutletsActive: 16,
        newPosmInstalled: 18,
        totalEventsCompleted: 4,
        totalBudgetCommittedIdr: 125000000,
        averageGpsDeviationMeters: 5.4,
      }),
      activities: toJson([
        "Ekspansi branding toko tradisional di cluster Semarang dan Solo raya.",
        "Pelaksanaan konser musik kemerdekaan di Pantai Kuta dengan kehadiran 2.800 penonton.",
        "Audit berkala inventaris peralatan roadshow di gudang pusat Jakarta.",
      ]),
      achievements: toJson([
        "Pencapaian target instalasi Signboard LED 115% terhadap target awal.",
        "Zero incident keselamatan kerja selama proses pemasangan shopblind outdoor.",
        "Tingkat kepatuhan audit GPS penempatan material mencapai 96.8%.",
      ]),
      keyIssues: toJson([
        "Kenaikan tarif pajak reklame lokal di beberapa titik jalan protokol Jawa Barat.",
        "Keterlambatan serah terima kembali peralatan sound system pasca event roadshow kampus.",
      ]),
      actionPlans: toJson([
        "Pemberlakuan alur kerja peringatan otomatis (warning workflow) saat penutupan acara lapangan.",
        "Optimalisasi sistem approval digital MoU untuk memangkas lead time verifikasi menjadi maksimal 3 hari kerja.",
      ]),
    },
    {
      id: "rep-2026-09",
      month: "September",
      year: 2026,
      summary: toJson({
        totalOutletsActive: 18,
        newPosmInstalled: 14,
        totalEventsCompleted: 3,
        totalBudgetCommittedIdr: 98000000,
        averageGpsDeviationMeters: 4.8,
      }),
      activities: toJson([
        "Aktivasi roadshow kampus menyambut mahasiswa baru di Yogyakarta dan Bandung.",
        "Pemasangan Neon Box di gerai ritel modern Plaza Marina Surabaya.",
        "Audit triwulanan kepatuhan perizinan media outdoor.",
      ]),
      achievements: toJson([
        "Penambahan 2 gerai exclusive baru di cluster Jabodetabek dan Denpasar.",
        "Penyelesaian 100% kompensasi kerusakan peralatan inventaris melalui metode cash transfer dan item replacement.",
      ]),
      keyIssues: toJson([
        "Fluktuasi cuaca hujan lebat yang menunda pemasangan rangka kanopi di Cirebon.",
      ]),
      actionPlans: toJson([
        "Peningkatan koordinasi jadwal teknisi vendor pemasangan dengan prakiraan cuaca BMKG.",
        "Penerapan four-eyes approval pada proses inspeksi pengembalian barang gudang.",
      ]),
    },
  ];

  for (const r of reports) {
    await prisma.monthlyReport.create({ data: r });
  }

  console.log(`   ✅ Seeded ${documents.length} document assets and ${reports.length} monthly executive reports.`);
}

// ============================================================================
// MAIN RUNNER & SYSTEM SUMMARY
// ============================================================================
async function main() {
  const startTime = Date.now();
  console.log("\n==================================================================");
  console.log("🚀 STARTING VRELLO-UP PRODUCTION DATABASE SEEDING");
  console.log("   Brand Focus: Indosat Ooredoo Hutchison (IM3 & Tri)");
  console.log("   Architecture: Enterprise Single-Tenant (ADR-0001 - ADR-0055)");
  console.log("==================================================================\n");

  await cleanDatabase();
  await seedUsers();
  await seedBranches();
  await seedMaterials();
  await seedOutlets();
  await seedMous();
  await seedPlacements();
  await seedEvents();
  await seedInventory();
  await seedBorrowRecords();
  await seedContentPosts();
  await seedDocumentsAndReports();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  const counts = {
    users: await prisma.user.count(),
    branches: await prisma.branch.count(),
    materials: await prisma.material.count(),
    outlets: await prisma.outlet.count(),
    mous: await prisma.mou.count(),
    placements: await prisma.placement.count(),
    events: await prisma.fieldEvent.count(),
    inventoryItems: await prisma.inventoryItem.count(),
    borrowRecords: await prisma.borrowRecord.count(),
    borrowItems: await prisma.borrowItem.count(),
    contentPosts: await prisma.contentPost.count(),
    documentItems: await prisma.documentItem.count(),
    monthlyReports: await prisma.monthlyReport.count(),
  };

  console.log("\n==================================================================");
  console.log(`✨ SEEDING FINISHED WITH ZERO ERRORS IN ${elapsed}s!`);
  console.log("==================================================================");
  console.table(counts);

  console.log("\n🔐 AUTHENTICATED QA TEST CREDENTIALS (Password: changeme123):");
  console.log("  • Super Admin:       admin@vrelloup.dev           (Global Scope)");
  console.log("  • SPV Jabodetabek:   spv.hendra@vrelloup.dev      (Multi-Branch)");
  console.log("  • SPV Jawa Barat:    spv.maya@vrelloup.dev        (West Java Scope)");
  console.log("  • SPV Semarang:      spv.semarang@vrelloup.dev    (Semarang Pandanaran Scope)");
  console.log("  • Staff IM3 Jakarta: staff.dewi@vrelloup.dev      (Branch Scope)");
  console.log("  • Staff Tri Semarang:staff.budi@vrelloup.dev      (Branch Scope)");
  console.log("  • Warehouse Jakarta: warehouse.joko@vrelloup.dev  (Warehouse RBAC)");
  console.log("  • Warehouse Semarang:warehouse.slamet@vrelloup.dev(Warehouse RBAC)");
  console.log("  • HQ Auditor/Viewer: viewer.hendra@vrelloup.dev   (Read-Only)");
  console.log("  • Pending Account:   pending.siti@vrelloup.dev    (Self-Registered)");
  console.log("  • Rejected Account:  rejected.agus@vrelloup.dev   (Blacklisted)\n");
}

main()
  .catch((e) => {
    console.error("❌ SEEDING FATAL ERROR:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
