import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const toJson = (v: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue;
const toDate = (s: string): Date => new Date(s);

// ---------------------------------------------------------------------------
// WorkspaceMember rows: vrello-up SEED_USERS
// (src/lib/store/useWorkspaceStore.ts), matched on email, MarcomRole via
// {Lead Architect: admin, Senior Frontend Engineer: staff, Product Designer: staff}
// ---------------------------------------------------------------------------
const SEED_MEMBERS = [
  { workspaceId: "ws-main", email: "alex@vrelloup.dev", role: "admin" },
  { workspaceId: "ws-main", email: "sarah@vrelloup.dev", role: "staff" },
  { workspaceId: "ws-main", email: "marcus@vrelloup.dev", role: "staff" },
] as const;

// ---------------------------------------------------------------------------
// Material catalogue derived from the distinct placement material types in
// dashboard src/data/placements.ts, mapped onto the MaterialType enum.
// ---------------------------------------------------------------------------
const MATERIAL_ID_BY_NAME: Record<string, string> = {
  Poster: "material-poster",
  Shopblind: "material-shopblind",
  Banner: "material-banner",
  "Branding / Signboard": "material-signboard",
  "Other Materials": "material-other",
};

const MATERIAL_DEFS = [
  { id: "material-poster", type: "POSTER", name: "Poster" },
  { id: "material-shopblind", type: "SHOPBLIND", name: "Shopblind" },
  { id: "material-banner", type: "BANNER", name: "Banner" },
  { id: "material-signboard", type: "BRANDING_SIGNBOARD", name: "Branding / Signboard" },
  { id: "material-other", type: "OTHER_MATERIALS", name: "Other Materials" },
] as const;

// ---------------------------------------------------------------------------
// Branch definitions adapted from dashboard src/data/branches.ts
// (branchDefinitions + deterministic derivation, verbatim logic).
// ---------------------------------------------------------------------------
const branchDefinitions = [
  { city: "Semarang", name: "Semarang Pusat", region: "Central Java", pic: "Budi Santoso", phone: "+62 811-2345-001", address: "Jl. Pandanaran No. 58, Semarang" },
  { city: "Semarang", name: "Semarang Barat", region: "Central Java", pic: "Agus Prasetyo", phone: "+62 811-2345-002", address: "Jl. Siliwangi No. 120, Semarang" },
  { city: "Semarang", name: "Semarang Timur", region: "Central Java", pic: "Dwi Haryanto", phone: "+62 811-2345-003", address: "Jl. Majapahit No. 340, Semarang" },
  { city: "Semarang", name: "Semarang Selatan", region: "Central Java", pic: "Eko Wahyudi", phone: "+62 811-2345-004", address: "Jl. Setiabudi No. 89, Banyumanik, Semarang" },
  { city: "Semarang", name: "Semarang Utara", region: "Central Java", pic: "Hendra Gunawan", phone: "+62 811-2345-005", address: "Jl. Pemuda No. 14, Semarang" },
  { city: "Solo", name: "Solo Slamet Riyadi", region: "Central Java", pic: "Rina Wijaya", phone: "+62 812-3456-006", address: "Jl. Slamet Riyadi No. 275, Surakarta" },
  { city: "Solo", name: "Solo Baru", region: "Central Java", pic: "Fajar Nugroho", phone: "+62 812-3456-007", address: "Jl. Ir. Soekarno No. 45, Sukoharjo" },
  { city: "Solo", name: "Solo Jebres", region: "Central Java", pic: "Tri Wibowo", phone: "+62 812-3456-008", address: "Jl. Kolonel Sutarto No. 102, Surakarta" },
  { city: "Solo", name: "Solo Laweyan", region: "Central Java", pic: "Bambang Pamungkas", phone: "+62 812-3456-009", address: "Jl. Dr. Radjiman No. 520, Surakarta" },
  { city: "Yogyakarta", name: "Yogyakarta Malioboro", region: "DI Yogyakarta", pic: "Siti Rahmawati", phone: "+62 813-4567-010", address: "Jl. Malioboro No. 62, Danurejan, Yogyakarta" },
  { city: "Yogyakarta", name: "Yogyakarta Kota Baru", region: "DI Yogyakarta", pic: "Andi Saputra", phone: "+62 813-4567-011", address: "Jl. Sudirman No. 40, Gondokusuman, Yogyakarta" },
  { city: "Yogyakarta", name: "Yogyakarta Tugu", region: "DI Yogyakarta", pic: "Rizky Firmansyah", phone: "+62 813-4567-012", address: "Jl. P. Mangkubumi No. 110, Yogyakarta" },
  { city: "Sleman", name: "Sleman Kaliurang", region: "DI Yogyakarta", pic: "Dimas Anggara", phone: "+62 813-4567-013", address: "Jl. Kaliurang KM 8.5, Sinduharjo, Sleman" },
  { city: "Sleman", name: "Sleman Seturan", region: "DI Yogyakarta", pic: "Putri Ayu", phone: "+62 813-4567-014", address: "Jl. Seturan Raya No. 18, Depok, Sleman" },
  { city: "Sleman", name: "Sleman Godean", region: "DI Yogyakarta", pic: "Aditya Kurniawan", phone: "+62 813-4567-015", address: "Jl. Godean KM 4, Gamping, Sleman" },
  { city: "Sleman", name: "Sleman Gejayan", region: "DI Yogyakarta", pic: "Maya Sari", phone: "+62 813-4567-016", address: "Jl. Afandi (Gejayan) No. 33, Sleman" },
  { city: "Sleman", name: "Sleman Jombor", region: "DI Yogyakarta", pic: "Reza Maulana", phone: "+62 813-4567-017", address: "Jl. Magelang KM 6.5, Mlati, Sleman" },
  { city: "Bantul", name: "Bantul Kota", region: "DI Yogyakarta", pic: "Nurul Hidayat", phone: "+62 813-4567-018", address: "Jl. Jend. Sudirman No. 80, Bantul" },
  { city: "Bantul", name: "Bantul Sewon", region: "DI Yogyakarta", pic: "Galih Pratama", phone: "+62 813-4567-019", address: "Jl. Parangtritis KM 6, Sewon, Bantul" },
  { city: "Gunungkidul", name: "Gunungkidul Wonosari", region: "DI Yogyakarta", pic: "Wahyu Setiawan", phone: "+62 813-4567-020", address: "Jl. Brigjen Katamso No. 25, Wonosari" },
  { city: "Kulon Progo", name: "Kulon Progo Wates", region: "DI Yogyakarta", pic: "Bayu Saputro", phone: "+62 813-4567-021", address: "Jl. Diponegoro No. 19, Wates, Kulon Progo" },
  { city: "Purwokerto", name: "Purwokerto Kota", region: "Central Java", pic: "Aris Munandar", phone: "+62 814-5678-022", address: "Jl. Jend. Sudirman No. 450, Purwokerto" },
  { city: "Purwokerto", name: "Purwokerto Dukuhwaluh", region: "Central Java", pic: "Doni Irawan", phone: "+62 814-5678-023", address: "Jl. Raden Patah No. 11, Purwokerto" },
  { city: "Purwokerto", name: "Purwokerto Karanglewas", region: "Central Java", pic: "Yudi Purnomo", phone: "+62 814-5678-024", address: "Jl. Raya Karanglewas No. 88, Purwokerto" },
  { city: "Banyumas", name: "Banyumas Ajibarang", region: "Central Java", pic: "Sri Mulyani", phone: "+62 814-5678-025", address: "Jl. Raya Ajibarang - Wangon KM 2, Banyumas" },
  { city: "Banyumas", name: "Banyumas Wangon", region: "Central Java", pic: "Teguh Widodo", phone: "+62 814-5678-026", address: "Jl. Raya Barat Wangon No. 40, Banyumas" },
  { city: "Cilacap", name: "Cilacap Kota", region: "Central Java", pic: "Ahmad Fauzi", phone: "+62 814-5678-027", address: "Jl. Gatot Subroto No. 64, Cilacap" },
  { city: "Cilacap", name: "Cilacap Kroya", region: "Central Java", pic: "Lestari Dewi", phone: "+62 814-5678-028", address: "Jl. Jenderal Sudirman No. 125, Kroya, Cilacap" },
  { city: "Cilacap", name: "Cilacap Majenang", region: "Central Java", pic: "Irfan Hakim", phone: "+62 814-5678-029", address: "Jl. Diponegoro No. 200, Majenang, Cilacap" },
  { city: "Magelang", name: "Magelang Kota", region: "Central Java", pic: "Citra Kirana", phone: "+62 815-6789-030", address: "Jl. Pemuda No. 156, Magelang Tengah" },
  { city: "Magelang", name: "Magelang Muntilan", region: "Central Java", pic: "Dedi Supriyadi", phone: "+62 815-6789-031", address: "Jl. Pemuda No. 88, Muntilan, Magelang" },
  { city: "Magelang", name: "Magelang Secang", region: "Central Java", pic: "Novi Indah", phone: "+62 815-6789-032", address: "Jl. Raya Magelang - Semarang KM 10, Secang" },
  { city: "Klaten", name: "Klaten Pemuda", region: "Central Java", pic: "Agung Wicaksono", phone: "+62 815-6789-033", address: "Jl. Pemuda No. 102, Klaten Tengah" },
  { city: "Klaten", name: "Klaten Delanggu", region: "Central Java", pic: "Ratna Sari", phone: "+62 815-6789-034", address: "Jl. Raya Solo - Yogya KM 22, Delanggu" },
  { city: "Klaten", name: "Klaten Pedan", region: "Central Java", pic: "Indra Kusuma", phone: "+62 815-6789-035", address: "Jl. Raya Pedan - Cawas No. 15, Klaten" },
  { city: "Pekalongan", name: "Pekalongan Kota", region: "Central Java", pic: "Zainal Abidin", phone: "+62 816-7890-036", address: "Jl. Hayam Wuruk No. 44, Pekalongan Barat" },
  { city: "Pekalongan", name: "Pekalongan Kajen", region: "Central Java", pic: "Farida Utami", phone: "+62 816-7890-037", address: "Jl. Mandurorejo No. 19, Kajen, Pekalongan" },
  { city: "Batang", name: "Batang Kota", region: "Central Java", pic: "Yoga Pratama", phone: "+62 816-7890-038", address: "Jl. Jenderal Sudirman No. 76, Batang" },
  { city: "Batang", name: "Batang Limpung", region: "Central Java", pic: "Siska Amelia", phone: "+62 816-7890-039", address: "Jl. Raya Limpung No. 32, Batang" },
  { city: "Tegal", name: "Tegal Kota", region: "Central Java", pic: "Mochammad Ali", phone: "+62 816-7890-040", address: "Jl. AR Hakim No. 89, Tegal Timur" },
  { city: "Tegal", name: "Tegal Slawi", region: "Central Java", pic: "Tia Monica", phone: "+62 816-7890-041", address: "Jl. Ahmad Yani No. 12, Slawi, Tegal" },
  { city: "Brebes", name: "Brebes Kota", region: "Central Java", pic: "Hadi Purwanto", phone: "+62 817-8901-042", address: "Jl. Jenderal Sudirman No. 110, Brebes" },
  { city: "Brebes", name: "Brebes Bumiayu", region: "Central Java", pic: "Anita Rahayu", phone: "+62 817-8901-043", address: "Jl. Raya Bumiayu No. 45, Brebes" },
  { city: "Pemalang", name: "Pemalang Kota", region: "Central Java", pic: "Kurnia Sandi", phone: "+62 817-8901-044", address: "Jl. Jenderal Sudirman No. 55, Pemalang" },
  { city: "Kudus", name: "Kudus Kota", region: "Central Java", pic: "Dian Permata", phone: "+62 817-8901-045", address: "Jl. Sunan Kudus No. 90, Kudus" },
  { city: "Kudus", name: "Kudus Jati", region: "Central Java", pic: "Rian Hidayat", phone: "+62 817-8901-046", address: "Jl. Raya Kudus - Pati KM 4, Jati, Kudus" },
  { city: "Jepara", name: "Jepara Kota", region: "Central Java", pic: "Nurul Annisa", phone: "+62 817-8901-047", address: "Jl. Pemuda No. 48, Jepara" },
  { city: "Pati", name: "Pati Kota", region: "Central Java", pic: "Surya Dharma", phone: "+62 818-9012-048", address: "Jl. Kolonel Sunandar No. 34, Pati" },
  { city: "Rembang", name: "Rembang Kota", region: "Central Java", pic: "Mega Puspita", phone: "+62 818-9012-049", address: "Jl. Diponegoro No. 80, Rembang" },
  { city: "Blora", name: "Blora Kota", region: "Central Java", pic: "Joko Susilo", phone: "+62 818-9012-050", address: "Jl. Pemuda No. 22, Blora" },
  { city: "Blora", name: "Blora Cepu", region: "Central Java", pic: "Eka Novita", phone: "+62 818-9012-051", address: "Jl. Diponegoro No. 67, Cepu, Blora" },
  { city: "Grobogan", name: "Grobogan Purwodadi", region: "Central Java", pic: "Hari Saputro", phone: "+62 818-9012-052", address: "Jl. R. Suprapto No. 101, Purwodadi" },
  { city: "Demak", name: "Demak Kota", region: "Central Java", pic: "Wulan Dari", phone: "+62 818-9012-053", address: "Jl. Sultan Fatah No. 15, Demak" },
  { city: "Kendal", name: "Kendal Kota", region: "Central Java", pic: "Rizaldy Akbar", phone: "+62 818-9012-054", address: "Jl. Soekarno-Hatta No. 180, Kendal" },
  { city: "Kendal", name: "Kendal Weleri", region: "Central Java", pic: "Desi Ratnasari", phone: "+62 818-9012-055", address: "Jl. Utama Timur No. 44, Weleri, Kendal" },
  { city: "Salatiga", name: "Salatiga Diponegoro", region: "Central Java", pic: "Antonius Bayu", phone: "+62 819-0123-056", address: "Jl. Diponegoro No. 112, Salatiga" },
  { city: "Boyolali", name: "Boyolali Pandanaran", region: "Central Java", pic: "Fitri Handayani", phone: "+62 819-0123-057", address: "Jl. Pandanaran No. 78, Boyolali" },
  { city: "Sukoharjo", name: "Sukoharjo Kota", region: "Central Java", pic: "Rudi Hartono", phone: "+62 819-0123-058", address: "Jl. Jenderal Sudirman No. 99, Sukoharjo" },
  { city: "Karanganyar", name: "Karanganyar Lawu", region: "Central Java", pic: "Lia Agustina", phone: "+62 819-0123-059", address: "Jl. Lawu No. 210, Karanganyar" },
  { city: "Sragen", name: "Sragen Sukowati", region: "Central Java", pic: "Gunawan Santosa", phone: "+62 819-0123-060", address: "Jl. Raya Sukowati No. 145, Sragen" },
  { city: "Wonogiri", name: "Wonogiri Kota", region: "Central Java", pic: "Putro Wicaksono", phone: "+62 819-0123-061", address: "Jl. Jenderal Ahmad Yani No. 50, Wonogiri" },
  { city: "Temanggung", name: "Temanggung Kota", region: "Central Java", pic: "Maya Anggraini", phone: "+62 819-0123-062", address: "Jl. MT Haryono No. 33, Temanggung" },
  { city: "Wonosobo", name: "Wonosobo Kota", region: "Central Java", pic: "Hafiz Ridwan", phone: "+62 819-0123-063", address: "Jl. Ahmad Yani No. 77, Wonosobo" },
  { city: "Purbalingga", name: "Purbalingga Kota", region: "Central Java", pic: "Dedi Irawan", phone: "+62 819-0123-064", address: "Jl. MT Haryono No. 18, Purbalingga" },
  { city: "Banjarnegara", name: "Banjarnegara Kota", region: "Central Java", pic: "Retno Palupi", phone: "+62 819-0123-065", address: "Jl. Dipayuda No. 24, Banjarnegara" },
  { city: "Kebumen", name: "Kebumen Kota", region: "Central Java", pic: "Heri Susanto", phone: "+62 819-0123-066", address: "Jl. Pahlawan No. 60, Kebumen" },
  { city: "Surabaya", name: "Surabaya Basuki Rahmat", region: "East Java", pic: "Taufik Hidayat", phone: "+62 821-1234-067", address: "Jl. Basuki Rahmat No. 106, Surabaya" },
  { city: "Surabaya", name: "Surabaya Mayjen Sungkono", region: "East Java", pic: "Kezia Olivia", phone: "+62 821-1234-068", address: "Jl. Mayjen Sungkono No. 89, Surabaya" },
  { city: "Surabaya", name: "Surabaya Rungkut", region: "East Java", pic: "Bagus Setiawan", phone: "+62 821-1234-069", address: "Jl. Rungkut Madya No. 45, Surabaya" },
  { city: "Surabaya", name: "Surabaya Kertajaya", region: "East Java", pic: "Nadia Putri", phone: "+62 821-1234-070", address: "Jl. Kertajaya Indah No. 28, Surabaya" },
  { city: "Sidoarjo", name: "Sidoarjo Kota", region: "East Java", pic: "Iqbal Ramadhan", phone: "+62 821-1234-071", address: "Jl. Pahlawan No. 12, Sidoarjo" },
  { city: "Malang", name: "Malang Ijen", region: "East Java", pic: "Vicky Pratama", phone: "+62 821-1234-072", address: "Jl. Besar Ijen No. 77, Klojen, Malang" },
  { city: "Malang", name: "Malang Soekarno Hatta", region: "East Java", pic: "Anisa Rahma", phone: "+62 821-1234-073", address: "Jl. Soekarno Hatta No. 40, Lowokwaru, Malang" },
  { city: "Batu", name: "Batu Diponegoro", region: "East Java", pic: "Kevin Sanjaya", phone: "+62 821-1234-074", address: "Jl. Diponegoro No. 85, Batu, Malang" },
  { city: "Kediri", name: "Kediri Dhoho", region: "East Java", pic: "Marthin L", phone: "+62 821-1234-075", address: "Jl. Dhoho No. 110, Kota Kediri" },
  { city: "Blitar", name: "Blitar Merdeka", region: "East Java", pic: "Soni Wicaksono", phone: "+62 821-1234-076", address: "Jl. Merdeka No. 64, Sukorejo, Blitar" },
  { city: "Madiun", name: "Madiun Pahlawan", region: "East Java", pic: "Agatha Cristie", phone: "+62 821-1234-077", address: "Jl. Pahlawan No. 58, Kota Madiun" },
  { city: "Jember", name: "Jember Gajah Mada", region: "East Java", pic: "Denny Caknan", phone: "+62 821-1234-078", address: "Jl. Gajah Mada No. 190, Kaliwates, Jember" },
  { city: "Banyuwangi", name: "Banyuwangi Kota", region: "East Java", pic: "Citra Monica", phone: "+62 821-1234-079", address: "Jl. Ahmad Yani No. 92, Banyuwangi" },
  { city: "Pasuruan", name: "Pasuruan Kota", region: "East Java", pic: "Asep Sunandar", phone: "+62 821-1234-080", address: "Jl. Panglima Sudirman No. 43, Pasuruan" },
  { city: "Probolinggo", name: "Probolinggo Soekarno Hatta", region: "East Java", pic: "Lala Karmela", phone: "+62 821-1234-081", address: "Jl. Soekarno-Hatta No. 120, Probolinggo" },
  { city: "Tuban", name: "Tuban Basuki Rahmat", region: "East Java", pic: "Feri Irawan", phone: "+62 821-1234-082", address: "Jl. Basuki Rahmat No. 71, Tuban" },
  { city: "Lamongan", name: "Lamongan Kota", region: "East Java", pic: "Kiki Amalia", phone: "+62 821-1234-083", address: "Jl. Lamongrejo No. 34, Lamongan" },
  { city: "Gresik", name: "Gresik Veteran", region: "East Java", pic: "Budi Darmadi", phone: "+62 821-1234-084", address: "Jl. Veteran No. 90, Gresik" },
  { city: "Bandung", name: "Bandung Dago", region: "West Java", pic: "Ridwan Kamil", phone: "+62 822-2345-085", address: "Jl. Ir. H. Juanda (Dago) No. 138, Bandung" },
  { city: "Bandung", name: "Bandung Riau", region: "West Java", pic: "Atalia Praratya", phone: "+62 822-2345-086", address: "Jl. L.L.R.E. Martadinata No. 55, Bandung" },
  { city: "Bandung", name: "Bandung Buah Batu", region: "West Java", pic: "Cecep Supriyatna", phone: "+62 822-2345-087", address: "Jl. Buah Batu No. 182, Bandung" },
  { city: "Cimahi", name: "Cimahi Amir Machmud", region: "West Java", pic: "Yana Mulyana", phone: "+62 822-2345-088", address: "Jl. Jend. H. Amir Machmud No. 300, Cimahi" },
  { city: "Bogor", name: "Bogor Pajajaran", region: "West Java", pic: "Bima Arya", phone: "+62 822-2345-089", address: "Jl. Pajajaran No. 88, Bogor Timur" },
  { city: "Depok", name: "Depok Margonda", region: "West Java", pic: "Nur Mahmudi", phone: "+62 822-2345-090", address: "Jl. Margonda Raya No. 250, Depok" },
  { city: "Bekasi", name: "Bekasi Ahmad Yani", region: "West Java", pic: "Rahmat Effendi", phone: "+62 822-2345-091", address: "Jl. Jend. Ahmad Yani No. 15, Bekasi Barat" },
  { city: "Cirebon", name: "Cirebon Kartini", region: "West Java", pic: "Nashrudin Azis", phone: "+62 822-2345-092", address: "Jl. RA Kartini No. 42, Kejaksan, Cirebon" },
  { city: "Tasikmalaya", name: "Tasikmalaya HZ Mustofa", region: "West Java", pic: "Budi Budiman", phone: "+62 822-2345-093", address: "Jl. KHZ Mustofa No. 145, Tasikmalaya" },
  { city: "Sukabumi", name: "Sukabumi Siliwangi", region: "West Java", pic: "Achmad Fahmi", phone: "+62 822-2345-094", address: "Jl. Siliwangi No. 78, Cikole, Sukabumi" },
  { city: "Jakarta", name: "Jakarta Selatan SCBD", region: "DKI Jakarta", pic: "Raffi Ahmad", phone: "+62 811-9876-095", address: "Pacific Place SCBD Lt. 8, Jl. Jend. Sudirman Kav 52, Jakarta Selatan" },
  { city: "Jakarta", name: "Jakarta Pusat Thamrin", region: "DKI Jakarta", pic: "Nagita Slavina", phone: "+62 811-9876-096", address: "Jl. M.H. Thamrin No. 28, Menteng, Jakarta Pusat" },
  { city: "Jakarta", name: "Jakarta Barat Puri", region: "DKI Jakarta", pic: "Daniel Mananta", phone: "+62 811-9876-097", address: "Jl. Puri Indah Raya No. 45, Kembangan, Jakarta Barat" },
  { city: "Jakarta", name: "Jakarta Timur Rawamangun", region: "DKI Jakarta", pic: "Luna Maya", phone: "+62 811-9876-098", address: "Jl. Pemuda No. 80, Rawamangun, Jakarta Timur" },
  { city: "Jakarta", name: "Jakarta Utara Kelapa Gading", region: "DKI Jakarta", pic: "Deddy Corbuzier", phone: "+62 811-9876-099", address: "Jl. Boulevard Barat Raya Blok LA-1, Kelapa Gading" },
  { city: "Tangerang", name: "Tangerang BSD City", region: "Banten", pic: "Boy William", phone: "+62 811-9876-100", address: "BSD Green Office Park 6, Jl. Grand Boulevard, Tangerang" },
  { city: "Tangerang", name: "Tangerang Karawaci", region: "Banten", pic: "Gita Gutawa", phone: "+62 811-9876-101", address: "Jl. Boulevard Palem Raya No. 12, Karawaci, Tangerang" },
  { city: "Serang", name: "Serang Ahmad Yani", region: "Banten", pic: "Syafrudin", phone: "+62 811-9876-102", address: "Jl. Ahmad Yani No. 19, Serang, Banten" },
  { city: "Cilegon", name: "Cilegon Cilegon Raya", region: "Banten", pic: "Helldy Agustian", phone: "+62 811-9876-103", address: "Jl. Raya Cilegon No. 104, Cilegon" },
  { city: "Denpasar", name: "Denpasar Teuku Umar", region: "Bali", pic: "Wayan Koster", phone: "+62 812-7890-104", address: "Jl. Teuku Umar No. 188, Denpasar Barat, Bali" },
  { city: "Denpasar", name: "Denpasar Sanur", region: "Bali", pic: "Made Mangku", phone: "+62 812-7890-105", address: "Jl. Bypass Ngurah Rai No. 240, Sanur, Denpasar" },
  { city: "Badung", name: "Badung Kuta Sunset", region: "Bali", pic: "Ketut Suastika", phone: "+62 812-7890-106", address: "Jl. Sunset Road No. 99, Kuta, Badung, Bali" },
];

// ---------------------------------------------------------------------------
// Outlet, MoU and Placement builders adapted from dashboard src/data/
// outlets.ts, mous.ts and placements.ts (verbatim generation logic).
// ---------------------------------------------------------------------------
const outletNamePrefixes = [
  "Toko Berkah Cellular",
  "Sentral Ponsel Jaya",
  "Indo Cellular Store",
  "Prima Gadget Outlet",
  "Mega Phone Plaza",
  "Surya Abadi Cellular",
  "Bintang Jaya Ponsel",
  "Maju Lancar Cell",
  "Mitra Sejati Telekom",
  "Sinar Mas Cellular",
  "Eka Jaya Phone",
  "Sahabat Cell Express",
  "Pilar Utama Ponsel",
  "Global Digital Outlet",
  "Nusantara Cell Hub",
  "Multi Ponsel Sentosa",
  "Cakrawala Mobile",
  "Duta Gadget Store",
  "Karya Utama Cellular",
  "Rezeki Cell Corner",
  "Kencana Ponsel",
  "Anugerah Cell Center",
  "Graha Gadgetindo",
  "Sentosa Prima Mobile",
  "Smart Link Communication",
  "Tridaya Phone Hub",
  "Metro Cell Station",
  "Planet Cellular Zone",
  "Barokah Ponsel",
  "Wijaya Mobile Point",
];

const outletTypes = ["TRADITIONAL", "MODERN_RETAIL", "EXCLUSIVE", "CAMPUS_OUTLET"] as const;
const outletTiers = ["TIER_1", "TIER_2", "TIER_3"] as const;

const partnerNames = [
  "PT Telekomunikasi Nusantara Mandiri",
  "CV Berkah Digitalindo Sejahtera",
  "PT Sinar Surya Abadi Tech",
  "Koperasi Mitra Usaha Telekomunikasi",
  "PT Gadget Raya International",
  "CV Maju Jaya Cellular Mandiri",
  "PT Global Digital Distribusi",
  "CV Sentosa Prima Communication",
  "PT Bintang Graha Ponselindo",
  "CV Karya Bersama Retailindo",
  "PT Tridaya Smart Network",
  "CV Anugerah Selular Utama",
  "PT Graha Media Komunika",
  "CV Cahaya Bintang Cellular",
  "PT Mahakarya Digital Kreasi",
];

const mouTypes = [
  "Compensation",
  "Exclusive Branding",
  "Event Sponsorship",
  "Space Rental",
  "Joint Promotion",
];

const mouStatuses = [
  "DONE",
  "DONE",
  "ON_PROGRESS",
  "ON_PROGRESS",
  "SUBMITTED",
  "DRAFT",
  "REJECTED",
] as const;

const placementMaterialTypes = [
  "Poster",
  "Shopblind",
  "Banner",
  "Branding / Signboard",
  "Other Materials",
];

const placementStatuses = [
  "DONE",
  "DONE",
  "DONE",
  "ON_PROGRESS",
  "ON_PROGRESS",
  "NOT_STARTED",
  "ISSUE",
] as const;

const samplePhotos = [
  {
    thumb: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=300&auto=format&fit=crop&q=60",
    full: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&auto=format&fit=crop&q=80",
    dim: "2m x 3m",
  },
  {
    thumb: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=300&auto=format&fit=crop&q=60",
    full: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&auto=format&fit=crop&q=80",
    dim: "1.5m x 2.5m",
  },
  {
    thumb: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=300&auto=format&fit=crop&q=60",
    full: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80",
    dim: "4m x 1.2m",
  },
  {
    thumb: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&auto=format&fit=crop&q=60",
    full: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80",
    dim: "3m x 6m",
  },
  {
    thumb: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=300&auto=format&fit=crop&q=60",
    full: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&auto=format&fit=crop&q=80",
    dim: "60cm x 90cm",
  },
  {
    thumb: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=300&auto=format&fit=crop&q=60",
    full: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80",
    dim: "1m x 2m Rollup",
  },
];

const placementCosts = [450000, 850000, 1500000, 3200000, 5800000, 950000];

const placementNotes = [
  "Installed at main front entrance facade with high street visibility.",
  "Installed behind cashier billing counter for maximum consumer impression.",
  "Replacement of previous faded banner with new seasonal Q3 campaign graphics.",
  "Awaiting landlord permit approval for outdoor wall mounting.",
  "Frame mounting completed. Lighting installation scheduled for tomorrow.",
  "Defect reported on corner bracket; maintenance team dispatched.",
  "Full outlet exterior branding with LED backlit fascia board.",
];

const compensationValues = [7500000, 12000000, 18500000, 24000000, 35000000, 50000000, 8500000];

// ---------------------------------------------------------------------------
// Event catalogue adapted from dashboard src/data/events.ts
// (eventDefinitions + deterministic derivation, verbatim logic).
// ---------------------------------------------------------------------------
const eventDefinitions = [
  {
    name: "Marcom Roadshow 2026: Youth Digital Festival",
    type: "Campus Roadshow",
    location: "Auditorium Graha Sabha Pramana UGM, Sleman",
    city: "Sleman",
    attendee: 2450,
    target: 2000,
    budget: 85000000,
    video: {
      title: "UGM_Youth_Digital_Festival_Aftermovie_4K.mp4",
      streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      duration: "04:45",
    },
    notes: "Massive youth turnout exceeding target by 22.5%. Excellent brand engagement with 1,200+ app downloads and SIM activations.",
  },
  {
    name: "Semarang Mega Tech & Gadget Expo 2026",
    type: "Exhibition / Expo",
    location: "Marina Convention Center, Semarang Barat",
    city: "Semarang",
    attendee: 5200,
    target: 5000,
    budget: 150000000,
    video: {
      title: "Semarang_Mega_Expo_Highlights_1080p.mp4",
      streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      duration: "06:12",
    },
    notes: "Main booth generated over 450M IDR in bundled partner sales. Coverage featured in 6 local press media outlets.",
  },
  {
    name: "Solo Culinary & Music Weekend Activation",
    type: "Brand Activation",
    location: "Benteng Vastenburg, Solo Slamet Riyadi",
    city: "Solo",
    attendee: 3800,
    target: 3500,
    budget: 65000000,
    video: {
      title: "Solo_Culinary_Weekend_Footage.mp4",
      streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      duration: "03:30",
    },
    notes: "Successful merchant QRIS transactions & loyalty promo vouchers distributed to 2,800 visitors.",
  },
  {
    name: "Purwokerto University On-Campus Experience Hub",
    type: "Campus Roadshow",
    location: "Gedung Soedirman Unsoed, Purwokerto",
    city: "Purwokerto",
    attendee: 1600,
    target: 1500,
    budget: 42000000,
    video: {
      title: "Unsoed_Purwokerto_Campus_Activation.mp4",
      streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      duration: "02:50",
    },
    notes: "Student package subscription campaign converted 640 new campus recurring users.",
  },
  {
    name: "Yogyakarta Gaming Community Championship 2026",
    type: "Community Gathering",
    location: "Jogja Expo Center (JEC), Bantul",
    city: "Yogyakarta",
    attendee: 1850,
    target: 2000,
    budget: 55000000,
    video: {
      title: "JEC_Gaming_Championship_Day1.mp4",
      streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      duration: "05:15",
    },
    notes: "Ongoing esports tournament finals. Live streaming broadcasted across YouTube and TikTok with 15k concurrent viewers.",
  },
  {
    name: "Magelang Borobudur Marathon Brand Sponsorship",
    type: "Sponsorship Event",
    location: "Taman Lumbini Candi Borobudur, Magelang",
    city: "Magelang",
    attendee: 8000,
    target: 8000,
    budget: 180000000,
    video: {
      title: "Borobudur_Marathon_Teaser_Promo.mp4",
      streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
      duration: "01:30",
    },
    notes: "Official connectivity & hydration partner. 15 branding gantries and 8 runner water stations prepared.",
  },
  {
    name: "Pekalongan Batik Night Carnival Activation",
    type: "Brand Activation",
    location: "Kawasan Budaya Jetayu, Pekalongan Kota",
    city: "Pekalongan",
    attendee: 4100,
    target: 3500,
    budget: 48000000,
    video: {
      title: "Pekalongan_Batik_Carnival_2026.mp4",
      streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
      duration: "04:10",
    },
    notes: "High social media impression with official hashtag reaching trending topic #3 regionally.",
  },
  {
    name: "Tegal Bahari SME & Merchant Festival",
    type: "Brand Activation",
    location: "Alun-Alun Kota Tegal, Tegal Kota",
    city: "Tegal",
    attendee: 3100,
    target: 3000,
    budget: 52000000,
    video: {
      title: "Tegal_Bahari_Festival_Summary.mp4",
      streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
      duration: "03:45",
    },
    notes: "Onboarded 78 new merchant retail stores into the regional partner tier programme.",
  },
  {
    name: "Kudus Kretek Heritage Music Experience",
    type: "Community Gathering",
    location: "Museum Kretek, Kudus Kota",
    city: "Kudus",
    attendee: 2900,
    target: 2500,
    budget: 45000000,
    video: {
      title: "Kudus_Heritage_Music_Night.mp4",
      streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4",
      duration: "03:15",
    },
    notes: "Brand sentiment positive score of 94% recorded from on-site survey tablets.",
  },
  {
    name: "Cilacap Coastal Sports & Community Run",
    type: "Brand Activation",
    location: "Pantai Teluk Penyu, Cilacap Kota",
    city: "Cilacap",
    attendee: 2100,
    target: 2000,
    budget: 38000000,
    video: {
      title: "Cilacap_Teluk_Penyu_Run.mp4",
      streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
      duration: "04:00",
    },
    notes: "1,500 branded athletic jerseys distributed with prominent Marcom placement logos.",
  },
  {
    name: "Surabaya National Tech Carnival 2026",
    type: "Product Launch",
    location: "Grand City Convention Hall, Surabaya Pusat",
    city: "Surabaya",
    attendee: 6800,
    target: 6000,
    budget: 220000000,
    video: {
      title: "Surabaya_Tech_Launch_Keynote.mp4",
      streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
      duration: "08:20",
    },
    notes: "Flagship regional product release with executive keynote and live media broadcast.",
  },
  {
    name: "Bandung Creative Hub Music Showcase",
    type: "Community Gathering",
    location: "Paris Van Java Mall Rooftop, Bandung Dago",
    city: "Bandung",
    attendee: 3400,
    target: 3000,
    budget: 72000000,
    video: {
      title: "Bandung_PVJ_Showcase_Highlights.mp4",
      streamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
      duration: "03:50",
    },
    notes: "Indie community partnership with exclusive streaming passes distributed.",
  },
];

// ---------------------------------------------------------------------------
// Document builders adapted from dashboard src/data/documents.ts
// (verbatim generation logic).
// ---------------------------------------------------------------------------
const docTemplates = [
  {
    name: "Report Placement Poster & Shopblind",
    category: "Placement",
    fileType: "XLSX",
    size: 4.8,
    desc: "Complete placement verification audit of all street posters, shopblinds, and lightbox fascias with GPS photo proofs and contractor invoice reconciliations.",
  },
  {
    name: "Report MoU Compensation & Partnership Agreement",
    category: "MoU",
    fileType: "PDF",
    size: 12.4,
    desc: "Legal signed bilateral agreement, compensation schedules, bank verification records, and partner revenue sharing commitments.",
  },
  {
    name: "Comprehensive Event & Brand Activation Report",
    category: "Event",
    fileType: "PDF",
    size: 28.5,
    desc: "Post-event evaluation deck covering attendee demographics, ROI metrics, video stream analytics, social buzz sentiment, and footage master links.",
  },
  {
    name: "Monthly Executive Marcom Performance Report",
    category: "Monthly",
    fileType: "PDF",
    size: 8.6,
    desc: "Executive summary for regional directors tracking MoUs, placements, activations, key blockers, budget burn rate, and strategic action plans.",
  },
  {
    name: "Weekly Marcom Progress & Operations Bulletin",
    category: "Weekly",
    fileType: "DOCX",
    size: 2.1,
    desc: "Weekly operational digest tracking field staff task completion, newly signed outlet partners, and urgent placement ticket updates.",
  },
  {
    name: "Regional Branch Audit & Readiness Dossier",
    category: "Branch",
    fileType: "PDF",
    size: 15.2,
    desc: "Detailed branch operational review detailing outlet network expansion, POS compliance, tier distribution, and local vendor SLAs.",
  },
  {
    name: "High-Res Media Footage & Documentation Ledger",
    category: "Documentation",
    fileType: "ZIP",
    size: 245.0,
    desc: "Archived 4K raw video rushes, drone footage, photo proof batches, and press clipping high-resolution assets.",
  },
  {
    name: "Q3 Promotional Campaign & Merchandising Strategy",
    category: "Campaign",
    fileType: "XLSX",
    size: 6.2,
    desc: "Regional campaign allocation matrix, prize giveaways, POS material distributor logistics, and incentive disbursement tracker.",
  },
];

const docPeriods = ["Q2 2026", "July 2026", "August 2026", "Q3 2026", "Q1 2026", "June 2026"];
const docStatuses = ["Done", "Done", "Submitted", "Pending", "Draft"];

// ---------------------------------------------------------------------------
// Monthly reports adapted from dashboard src/data/monthlyReports.ts
// (verbatim content; `supportingDocuments` has no target column in the
// ported MonthlyReport model and is intentionally not seeded).
// ---------------------------------------------------------------------------
const monthlyReports = [
  {
    id: "rep-2026-07",
    month: "July 2026",
    year: 2026,
    summary: {
      totalActivities: 148,
      totalEvents: 12,
      totalOutlets: 215,
      totalMous: 89,
      totalPlacements: 118,
      completionRate: 88.5,
      prevMonthCompletionRate: 76.2,
      growthPercentage: 12.3,
    },
    activities: [
      {
        id: "act-01",
        date: "2026-07-03",
        title: "Q3 Promotional Poster & Shopblind Rollout Wave 1",
        branchName: "Semarang Pusat",
        category: "Placement",
        status: "Completed",
        picName: "Budi Santoso",
        impact: "Deployed 24 new shopblinds and 30 acrylic counter posters across Tier-1 retail outlets.",
      },
      {
        id: "act-02",
        date: "2026-07-08",
        title: "Bilateral MoU Compensation Agreement Signing Ceremony",
        branchName: "Solo Slamet Riyadi",
        category: "MoU",
        status: "Completed",
        picName: "Rina Wijaya",
        impact: "Signed 15 high-volume retail partners with 1-year exclusive branding commitment.",
      },
      {
        id: "act-03",
        date: "2026-07-14",
        title: "Youth Digital Festival & Campus Roadshow 2026",
        branchName: "Sleman Kaliurang",
        category: "Event",
        status: "Completed",
        picName: "Dimas Anggara",
        impact: "2,450 student attendees, 1,200 app downloads, 4K aftermovie published to internal media center.",
      },
      {
        id: "act-04",
        date: "2026-07-21",
        title: "Regional Outlet POS Branding Audit & Refresh",
        branchName: "Purwokerto Kota",
        category: "Placement",
        status: "Completed",
        picName: "Aris Munandar",
        impact: "Replaced 18 damaged facade signboards; verified GPS timestamps for 100% compliance.",
      },
      {
        id: "act-05",
        date: "2026-07-28",
        title: "Merchant Community Gathering & Loyalty Promo Launch",
        branchName: "Yogyakarta Malioboro",
        category: "Community",
        status: "Completed",
        picName: "Siti Rahmawati",
        impact: "Engaged 85 local partner owners; onboarded 40 new merchant QRIS terminals.",
      },
    ],
    achievements: [
      { metric: "MoU Partner Onboarding", actual: 89, target: 80, variance: 11.25, status: "Achieved", unit: "Partners" },
      { metric: "Promotional Material Placements", actual: 118, target: 110, variance: 7.27, status: "Achieved", unit: "Outlets" },
      { metric: "Event Attendee Turnout", actual: 18450, target: 16000, variance: 15.31, status: "Achieved", unit: "Attendees" },
      { metric: "4K Video Footage Archival", actual: 12, target: 12, variance: 0.0, status: "Achieved", unit: "Master Cuts" },
      { metric: "Total Budget Disbursement Efficiency", actual: 94.2, target: 95.0, variance: -0.84, status: "On Track", unit: "%" },
    ],
    keyIssues: [
      {
        id: "iss-01",
        title: "Delayed Landlord Outdoor Permit for Billboard Gantry",
        branchName: "Magelang Kota",
        severity: "HIGH",
        status: "IN_PROGRESS",
        owner: "Citra Kirana",
        rootCause: "Local municipal zoning policy revisions required updated structural engineering endorsements.",
        mitigation: "Expedited civil engineer inspection report submitted; temporary ground banners deployed.",
      },
      {
        id: "iss-02",
        title: "Weather Disturbance during Outdoor Weekend Activation",
        branchName: "Cilacap Kota",
        severity: "MEDIUM",
        status: "RESOLVED",
        owner: "Ahmad Fauzi",
        rootCause: "Unseasonal heavy rainfall at Pantai Teluk Penyu required rapid canopy relocation.",
        mitigation: "Shifted live acoustic stage to covered pavilion without interrupting merchant exhibits.",
      },
      {
        id: "iss-03",
        title: "Vendor Printing Backlog for Q3 Acrylic Shopblinds",
        branchName: "Pekalongan Kota",
        severity: "LOW",
        status: "RESOLVED",
        owner: "Zainal Abidin",
        rootCause: "Primary printing vendor experienced equipment maintenance downtime.",
        mitigation: "Split order of 40 shopblinds to secondary certified regional printing partner in Semarang.",
      },
    ],
    actionPlans: [
      {
        id: "ap-01",
        task: "Complete legal review & compensation payout for Tier-1 Solo partner batch",
        branchName: "Solo Slamet Riyadi",
        pic: "Rina Wijaya",
        deadline: "2026-08-10",
        priority: "HIGH",
        status: "COMPLETED",
      },
      {
        id: "ap-02",
        task: "Execute Borobudur Marathon sponsorship branding installation",
        branchName: "Magelang Kota",
        pic: "Citra Kirana",
        deadline: "2026-08-18",
        priority: "HIGH",
        status: "IN_PROGRESS",
      },
      {
        id: "ap-03",
        task: "Publish full 4K drone footage archive for Sleman Youth Festival to Cloudflare R2",
        branchName: "Sleman Kaliurang",
        pic: "Dimas Anggara",
        deadline: "2026-08-05",
        priority: "MEDIUM",
        status: "COMPLETED",
      },
      {
        id: "ap-04",
        task: "Initiate quarterly retailer satisfaction survey across all Central Java outlets",
        branchName: "Semarang Pusat",
        pic: "Budi Santoso",
        deadline: "2026-08-25",
        priority: "LOW",
        status: "NOT_STARTED",
      },
    ],
  },
  {
    id: "rep-2026-08",
    month: "August 2026",
    year: 2026,
    summary: {
      totalActivities: 162,
      totalEvents: 15,
      totalOutlets: 225,
      totalMous: 96,
      totalPlacements: 126,
      completionRate: 91.2,
      prevMonthCompletionRate: 88.5,
      growthPercentage: 2.7,
    },
    activities: [
      {
        id: "act-08-01",
        date: "2026-08-05",
        title: "Independence Day Regional Promo Campaign Kickoff",
        branchName: "Semarang Pusat",
        category: "Campaign",
        status: "Completed",
        picName: "Budi Santoso",
        impact: "Deployed patriotic red-and-white store branding in 140 outlets across Central Java.",
      },
      {
        id: "act-08-02",
        date: "2026-08-12",
        title: "East Java Modern Retail MoU Expansion Wave",
        branchName: "Surabaya Basuki Rahmat",
        category: "MoU",
        status: "Completed",
        picName: "Taufik Hidayat",
        impact: "Signed 22 chain stores with automated monthly compensation billing integration.",
      },
      {
        id: "act-08-03",
        date: "2026-08-20",
        title: "Borobudur Heritage Brand Activation & Marathon Expo",
        branchName: "Magelang Kota",
        category: "Event",
        status: "Completed",
        picName: "Citra Kirana",
        impact: "8,000 runners engaged; captured 4K drone footage with live streaming replay.",
      },
    ],
    achievements: [
      { metric: "MoU Partner Onboarding", actual: 96, target: 90, variance: 6.67, status: "Achieved", unit: "Partners" },
      { metric: "Promotional Material Placements", actual: 126, target: 120, variance: 5.0, status: "Achieved", unit: "Outlets" },
      { metric: "Event Attendee Turnout", actual: 21500, target: 19000, variance: 13.16, status: "Achieved", unit: "Attendees" },
      { metric: "4K Video Footage Archival", actual: 15, target: 15, variance: 0.0, status: "Achieved", unit: "Master Cuts" },
      { metric: "Total Budget Disbursement Efficiency", actual: 96.8, target: 95.0, variance: 1.89, status: "Achieved", unit: "%" },
    ],
    keyIssues: [
      {
        id: "iss-08-01",
        title: "Transport Delivery Delay for West Java POS Materials",
        branchName: "Bandung Dago",
        severity: "MEDIUM",
        status: "RESOLVED",
        owner: "Ridwan Kamil",
        rootCause: "Toll road logistics congestion during long holiday weekend.",
        mitigation: "Re-routed priority shipments via express air freight cargo.",
      },
    ],
    actionPlans: [
      {
        id: "ap-08-01",
        task: "Finalize Q4 2026 Marketing Strategy & Media Budget Allocation",
        branchName: "Semarang Pusat",
        pic: "Budi Santoso",
        deadline: "2026-09-15",
        priority: "HIGH",
        status: "IN_PROGRESS",
      },
      {
        id: "ap-08-02",
        task: "Onboard 50 new Campus Outlets across Yogyakarta & Malang universities",
        branchName: "Sleman Seturan",
        pic: "Putri Ayu",
        deadline: "2026-09-30",
        priority: "HIGH",
        status: "NOT_STARTED",
      },
    ],
  },
];

async function main() {
  // Every write is an upsert keyed on a stable id, so re-running the seed
  // converges without duplicates.

  for (const m of SEED_MEMBERS) {
    await prisma.workspaceMember.upsert({
      where: { workspaceId_email: { workspaceId: m.workspaceId, email: m.email } },
      update: { role: m.role },
      create: { workspaceId: m.workspaceId, email: m.email, role: m.role },
    });
  }

  const branches = branchDefinitions.map((item, index) => {
    const branchNum = index + 1;
    const code = `BR-${String(branchNum).padStart(3, "0")}`;
    const totalOutlets = 12 + ((branchNum * 7) % 35);
    const mouDone = Math.floor(totalOutlets * (0.5 + ((branchNum % 5) * 0.08)));
    const placementDone = Math.floor(totalOutlets * (0.6 + ((branchNum % 4) * 0.07)));
    const overallProgress = Math.min(
      100,
      Math.round(((mouDone / totalOutlets) * 0.5 + (placementDone / totalOutlets) * 0.5) * 100),
    );
    let status: "DONE" | "ON_PROGRESS" | "PENDING" = "ON_PROGRESS";
    if (overallProgress >= 85) status = "DONE";
    else if (overallProgress < 60) status = "PENDING";
    return {
      id: `branch-${branchNum}`,
      code,
      name: item.name,
      region: item.region,
      city: item.city,
      status,
      picName: item.pic,
      picPhone: item.phone,
      address: item.address,
    };
  });
  for (const b of branches) {
    const { id, ...data } = b;
    await prisma.branch.upsert({ where: { id }, update: data, create: b });
  }

  for (const m of MATERIAL_DEFS) {
    await prisma.material.upsert({
      where: { id: m.id },
      update: { type: m.type, name: m.name },
      create: { id: m.id, type: m.type, name: m.name },
    });
  }

  const outlets = Array.from({ length: 225 }).map((_, index) => {
    const outletNum = index + 1;
    const branch = branches[index % branches.length];
    const prefix = outletNamePrefixes[index % outletNamePrefixes.length];
    return {
      id: `outlet-${outletNum}`,
      code: `OUT-${branch.code.replace("BR-", "")}-${String((index % 30) + 1).padStart(3, "0")}`,
      name: `${prefix} - ${branch.city} #${Math.floor(index / outletNamePrefixes.length) + 1}`,
      type: outletTypes[index % outletTypes.length],
      tier: outletTiers[(index + 1) % outletTiers.length],
      address: `${branch.address.split("No.")[0]}No. ${10 + ((index * 3) % 200)}, ${branch.city}`,
      city: branch.city,
      picName: `PIC ${branch.picName.split(" ")[0]} - ${outletNum}`,
      picPhone: `+62 821-${String(3000 + outletNum).padStart(4, "0")}-${String(100 + (outletNum % 900)).padStart(4, "0")}`,
      active: index % 18 !== 0,
      branchId: branch.id,
    };
  });
  for (const o of outlets) {
    const { id, ...data } = o;
    await prisma.outlet.upsert({ where: { id }, update: data, create: o });
  }

  const mous = Array.from({ length: 120 }).map((_, index) => {
    const mouNum = index + 1;
    const outlet = outlets[index % outlets.length];
    const branch = branches.find((b) => b.id === outlet.branchId) ?? branches[0];
    const mouType = mouTypes[index % mouTypes.length];
    const monthStr = String(1 + (index % 8)).padStart(2, "0");
    const dayStr = String(1 + (index % 27)).padStart(2, "0");
    return {
      id: `mou-${mouNum}`,
      branchId: branch.id,
      outletName: outlet.name,
      partnerName: partnerNames[index % partnerNames.length],
      mouType,
      submissionDate: toDate(`2026-${monthStr}-${dayStr}`),
      startDate: toDate(`2026-${monthStr}-01`),
      endDate: toDate(`2027-${monthStr}-01`),
      status: mouStatuses[index % mouStatuses.length],
      picName: branch.picName,
      docPath: `https://drive.google.com/file/d/1${String(index).padStart(4, "0")}xyz_mou_${branch.code}/view`,
      compensationValue: compensationValues[index % compensationValues.length],
      notes: `MoU partnership for ${mouType} at ${outlet.name}. Target ROI verified by Branch PIC ${branch.picName}.`,
    };
  });
  for (const m of mous) {
    const { id, ...data } = m;
    await prisma.mou.upsert({ where: { id }, update: data, create: m });
  }

  const placements = Array.from({ length: 130 }).map((_, index) => {
    const placementNum = index + 1;
    const outlet = outlets[index % outlets.length];
    const branch = branches.find((b) => b.id === outlet.branchId) ?? branches[0];
    const materialType = placementMaterialTypes[index % placementMaterialTypes.length];
    const photo = samplePhotos[index % samplePhotos.length];
    const monthStr = String(1 + (index % 8)).padStart(2, "0");
    const dayStr = String(1 + (index % 27)).padStart(2, "0");
    return {
      id: `placement-${placementNum}`,
      outletId: outlet.id,
      materialId: MATERIAL_ID_BY_NAME[materialType],
      status: placementStatuses[index % placementStatuses.length],
      date: toDate(`2026-${monthStr}-${dayStr}`),
      picName: branch.picName,
      photoUrl: photo.full,
      dimensions: photo.dim,
      cost: placementCosts[index % placementCosts.length],
      notes: placementNotes[index % placementNotes.length],
    };
  });
  for (const p of placements) {
    const { id, ...data } = p;
    await prisma.placement.upsert({ where: { id }, update: data, create: p });
  }

  const events = Array.from({ length: 32 }).map((_, index) => {
    const eventNum = index + 1;
    const base = eventDefinitions[index % eventDefinitions.length];
    const branch = branches.find((b) => b.city === base.city) ?? branches[index % branches.length];
    const monthStr = String(1 + (index % 8)).padStart(2, "0");
    const startDay = 5 + (index % 20);
    let status: "UPCOMING" | "ON_PROGRESS" | "COMPLETED" | "CANCELLED";
    if (index === 0 || index === 4) status = "ON_PROGRESS";
    else if (index === 5 || index > 28) status = "UPCOMING";
    else if (index === 15) status = "CANCELLED";
    else status = "COMPLETED";
    return {
      id: `event-${eventNum}`,
      name:
        index < eventDefinitions.length
          ? base.name
          : `${base.name} Vol. ${Math.floor(index / eventDefinitions.length) + 1}`,
      date: toDate(`2026-${monthStr}-${String(startDay).padStart(2, "0")}`),
      endDate: toDate(`2026-${monthStr}-${String(startDay + 2).padStart(2, "0")}`),
      location: base.location,
      branchName: branch.name,
      picName: branch.picName,
      eventType: base.type,
      status,
      budget: base.budget + index * 1500000,
      attendeeCount: status === "UPCOMING" ? 0 : base.attendee + ((index * 50) % 500),
      targetAttendee: base.target,
      notes: base.notes,
      footage: {
        id: `vid-${eventNum}`,
        title: `${branch.city}_${base.video.title}`,
        filePath: base.video.streamUrl,
        duration: base.video.duration,
      },
    };
  });
  for (const e of events) {
    const { id, footage, ...data } = e;
    await prisma.marcomEvent.upsert({ where: { id }, update: data, create: { id, ...data } });
    await prisma.eventFootage.upsert({
      where: { id: footage.id },
      update: { eventId: id, title: footage.title, filePath: footage.filePath, duration: footage.duration },
      create: { id: footage.id, eventId: id, title: footage.title, filePath: footage.filePath, duration: footage.duration },
    });
  }

  const storageProviders = ["Cloudflare R2", "AWS S3", "Google Drive"];
  const documents = Array.from({ length: 36 }).map((_, index) => {
    const docNum = index + 1;
    const template = docTemplates[index % docTemplates.length];
    const branch = branches[index % branches.length];
    const period = docPeriods[index % docPeriods.length];
    const storageProvider = storageProviders[index % storageProviders.length];
    const docName = `${template.name} - ${branch.city} (${period})`;
    const filePath =
      storageProvider === "Google Drive"
        ? `https://drive.google.com/file/d/1A8x9yZ_${branch.code}_${index}/view?usp=sharing`
        : `https://storage.marcom-internal.corp/assets/2026/${branch.code}/${docName.replace(/\s+/g, "_")}.${template.fileType.toLowerCase()}`;
    return {
      id: `doc-${docNum}`,
      name: docName,
      category: template.category,
      period,
      branchName: branch.name,
      ownerPic: branch.picName,
      status: docStatuses[index % docStatuses.length],
      fileType: template.fileType as "PDF" | "XLSX" | "DOCX" | "ZIP",
      fileSizeMb: template.size,
      filePath,
      description: template.desc,
    };
  });
  for (const d of documents) {
    const { id, ...data } = d;
    await prisma.documentItem.upsert({ where: { id }, update: data, create: d });
  }

  for (const r of monthlyReports) {
    const data = {
      month: r.month,
      year: r.year,
      summary: toJson(r.summary),
      activities: toJson(r.activities),
      achievements: toJson(r.achievements),
      keyIssues: toJson(r.keyIssues),
      actionPlans: toJson(r.actionPlans),
    };
    await prisma.monthlyReport.upsert({ where: { id: r.id }, update: data, create: { id: r.id, ...data } });
  }

  const counts: Record<string, number> = {
    workspaceMembers: await prisma.workspaceMember.count(),
    branches: await prisma.branch.count(),
    outlets: await prisma.outlet.count(),
    materials: await prisma.material.count(),
    placements: await prisma.placement.count(),
    mous: await prisma.mou.count(),
    events: await prisma.marcomEvent.count(),
    footage: await prisma.eventFootage.count(),
    documents: await prisma.documentItem.count(),
    monthlyReports: await prisma.monthlyReport.count(),
  };
  for (const [model, count] of Object.entries(counts)) console.log(`${model}: ${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
