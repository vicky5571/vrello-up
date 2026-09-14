import type { User, Subtask, Priority, Task } from "@/types";
import { formatIDR } from "@/lib/utils";

export const DEFAULT_EVENT_CHECKLISTS: Record<string, string[]> = {
  Roadshow: [
    "Survei venue & izin operasional mall/lokasi",
    "Sewa sound system & lighting",
    "Cetak backdrop & rollup banner",
    "Briefing SPG, MC & field crew",
    "Setup booth & display produk",
    "Evaluasi pengunjung & rekap data lead",
  ],
  Launch: [
    "Konfirmasi sewa venue & perizinan",
    "Undangan media, KOL & tamu VIP",
    "Panggung, backdrop & sound system setup",
    "Catering & merchandise goodie bag",
    "Live streaming & dokumentasi video",
    "Press release & monitoring publikasi",
  ],
  Exhibition: [
    "Registrasi booth & skema denah lokasi",
    "Display produk utama & instalasi POSM",
    "Brosur, flyer katalog & voucher promosi",
    "Jadwal shift crew & seragam tim",
    "Pencatatan lead pengunjung & rekap penjualan",
  ],
  Booth: [
    "Izin penempatan booth & daya listrik",
    "Rollup banner & brosur promosi",
    "Display dummy produk & sample tester",
    "Penugasan crew stand & QR code absensi",
  ],
  Workshop: [
    "Materi presentasi & hands-on training kit",
    "Sound system & proyektor layar",
    "Snack box & coffee break",
    "Sertifikat peserta & form feedback",
  ],
  Community: [
    "Reservasi lokasi gathering komunitas",
    "Agenda acara, games interaktif & doorprize",
    "Merchandise eksklusif komunitas",
    "Sesi foto bersama & dokumentasi medsos",
  ],
  default: [
    "Konfirmasi lokasi & izin pelaksanaan",
    "Persiapan materi & perlengkapan logistik",
    "Briefing PIC & tim pelaksana",
    "Pelaksanaan event & dokumentasi",
    "Laporan rekapitulasi & evaluasi",
  ],
};

/**
 * Returns a contextual checklist template based on the event type.
 */
export function getEventChecklistTemplate(eventType: string): string[] {
  if (!eventType) return DEFAULT_EVENT_CHECKLISTS.default;
  const normalizedKey = Object.keys(DEFAULT_EVENT_CHECKLISTS).find(
    (k) => k.toLowerCase() === eventType.trim().toLowerCase()
  );
  return normalizedKey
    ? DEFAULT_EVENT_CHECKLISTS[normalizedKey]
    : DEFAULT_EVENT_CHECKLISTS.default;
}

/**
 * Resolves a User member given a PIC ID or name.
 */
export function findMemberForPic(
  members: User[],
  picIdOrName?: string
): User | undefined {
  if (!picIdOrName || !Array.isArray(members)) return undefined;
  const q = picIdOrName.trim().toLowerCase();

  // 1. Direct ID match
  const byId = members.find((m) => m.id === picIdOrName);
  if (byId) return byId;

  // 2. Exact or case-insensitive name match
  const byName = members.find((m) => m.name.toLowerCase() === q);
  if (byName) return byName;

  // 3. Email match
  const byEmail = members.find((m) => m.email.toLowerCase() === q);
  if (byEmail) return byEmail;

  // 4. Starts with / includes match
  return members.find(
    (m) =>
      m.name.toLowerCase().includes(q) || q.includes(m.name.toLowerCase())
  );
}

export interface EventDataInput {
  id: string;
  name: string;
  eventType: string;
  branchName?: string;
  location?: string;
  startDate?: string | null;
  date?: string | null;
  endDate?: string | null;
  picName?: string;
  status?: string;
  budget?: number;
  targetAttendee?: number;
  attendeeCount?: number;
  notes?: string;
}

export function buildEventDescription(data: {
  location?: string;
  branchName?: string;
  eventType?: string;
  budget?: number;
  targetAttendee?: number;
  notes?: string;
}): string {
  const parts: string[] = [];
  if (data.location) {
    parts.push(`<p><strong>Location:</strong> ${data.location}</p>`);
  }
  if (data.branchName) {
    parts.push(`<p><strong>Branch:</strong> ${data.branchName}</p>`);
  }
  if (data.eventType) {
    parts.push(`<p><strong>Type:</strong> ${data.eventType}</p>`);
  }
  if (data.budget !== undefined) {
    parts.push(`<p><strong>Budget:</strong> ${formatIDR(data.budget)}</p>`);
  }
  if (data.targetAttendee !== undefined) {
    parts.push(`<p><strong>Target Attendees:</strong> ${data.targetAttendee}</p>`);
  }
  if (data.notes) {
    parts.push(`<p><strong>Logistics & Notes:</strong> ${data.notes}</p>`);
  }
  return parts.join("") || "<p>Field activation task</p>";
}

export interface BuildEventTaskPayloadParams {
  event: EventDataInput;
  listId: string;
  statusId: string;
  members: User[];
  picIdOrName?: string;
  subtasks: Subtask[];
  priority?: Priority;
}

export function buildEventTaskPayload({
  event,
  listId,
  statusId,
  members,
  picIdOrName,
  subtasks,
  priority = "high",
}: BuildEventTaskPayloadParams): Omit<Task, "id" | "createdAt" | "updatedAt"> {
  const picMember = findMemberForPic(members, picIdOrName || event.picName);
  const assignees: User[] = picMember
    ? [picMember]
    : members[0]
    ? [members[0]]
    : [];

  const rawDate = event.startDate || event.date;
  const dueDate = rawDate ? rawDate.slice(0, 10) : undefined;

  const description = buildEventDescription({
    location: event.location,
    branchName: event.branchName,
    eventType: event.eventType,
    budget: event.budget,
    targetAttendee: event.targetAttendee,
    notes: event.notes,
  });

  return {
    listId,
    title: `[Field Event] ${event.name.trim()}`,
    description,
    statusId,
    priority,
    assignees,
    dueDate,
    orderIndex: 0,
    tags: [],
    subtasks,
    relatedMarcomId: event.id,
  };
}
