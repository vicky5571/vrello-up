import { monthIndex } from "@/lib/marcom/analytics";
import type { MouStatus } from "@/types";

export interface PlacementItemInput {
  id: string;
  status: "NOT_STARTED" | "ON_PROGRESS" | "DONE" | "ISSUE" | string;
  cost?: number | null;
  brand?: string | null;
  notes?: string | null;
  date?: Date | string | null;
  outlet?: { name?: string; code?: string } | null;
  material?: { name?: string; type?: string } | null;
}

export interface MouItemInput {
  id: string;
  partnerName: string;
  status: MouStatus | string;
  mouType?: string | null;
  compensationValue?: number | null;
  outletName?: string | null;
  startDate?: Date | string | null;
}

export interface ContentPostItemInput {
  id: string;
  title: string;
  platform?: string | null;
  format?: string | null;
  status?: string | null;
  publishDate?: Date | string | null;
}

export interface FieldEventItemInput {
  id: string;
  name: string;
  eventType?: string | null;
  status: "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED" | string;
  budget?: number | null;
  targetAttendee?: number | null;
  attendeeCount?: number | null;
  startDate?: Date | string | null;
  branchName?: string | null;
}

export interface GenerateReportDraftInput {
  month: string;
  year: number;
  placements?: PlacementItemInput[];
  mous?: MouItemInput[];
  contents?: ContentPostItemInput[];
  events?: FieldEventItemInput[];
}

export interface DraftActivityItem {
  type: "PLACEMENT" | "MOU" | "CONTENT" | "EVENT";
  title: string;
  status: string;
  date?: string | null;
  detail?: string;
}

export interface ReportDraftSummary {
  totalActivities: number;
  completedActivities: number;
  completionRate: number;
  placementsDone: number;
  placementsTotal: number;
  placementTotalCost: number;
  mousApproved: number;
  mousTotal: number;
  mouTotalCompensation: number;
  contentPublished: number;
  contentTotal: number;
  eventsCompleted: number;
  eventsTotal: number;
  eventsTotalAttendees: number;
  eventsTotalBudget: number;
}

export interface ReportDraftResult {
  month: string;
  year: number;
  summary: ReportDraftSummary;
  activities: DraftActivityItem[];
  achievements: string[];
  keyIssues: string[];
  actionPlans: string[];
}

function formatIDR(value: number): string {
  return "Rp " + Math.round(value).toLocaleString("id-ID");
}

/**
 * Returns UTC [start, end] date bounds for a given month and year.
 */
export function getMonthDateRange(month: string, year: number): { start: Date; end: Date } {
  let mIdx = monthIndex(month);
  if (mIdx < 0 || mIdx > 11) {
    mIdx = 0;
  }
  const start = new Date(Date.UTC(year, mIdx, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, mIdx + 1, 0, 23, 59, 59, 999));
  return { start, end };
}

/**
 * Pure engine that analyzes operational data across Placements, MOUs,
 * Content, and Events, producing an aggregated monthly report draft with
 * computed metrics and draft narratives.
 */
export function generateReportDraft(input: GenerateReportDraftInput): ReportDraftResult {
  const { month, year } = input;
  const placements = input.placements ?? [];
  const mous = input.mous ?? [];
  const contents = input.contents ?? [];
  const events = input.events ?? [];

  // --- Placements Metrics ---
  const placementsTotal = placements.length;
  const placementsDone = placements.filter((p) => p.status === "DONE").length;
  const placementsIssue = placements.filter((p) => p.status === "ISSUE").length;
  const placementsNotStarted = placements.filter((p) => p.status === "NOT_STARTED").length;
  const placementTotalCost = placements
    .filter((p) => p.status === "DONE")
    .reduce((acc, p) => acc + (p.cost || 0), 0);

  // --- MOUs Metrics ---
  const mousTotal = mous.length;
  const isMouApproved = (status: string) =>
    status === "APPROVED" || status === "DONE";
  const mousApproved = mous.filter((m) => isMouApproved(m.status)).length;
  const mouTotalCompensation = mous
    .filter((m) => isMouApproved(m.status))
    .reduce((acc, m) => acc + (m.compensationValue || 0), 0);

  // --- Content Metrics ---
  const contentTotal = contents.length;
  const contentPublished = contents.filter((c) => (c.status || "").toUpperCase() === "PUBLISHED").length;

  // --- Events Metrics ---
  const eventsTotal = events.length;
  const eventsCompleted = events.filter((e) => e.status === "COMPLETED").length;
  const eventsCancelled = events.filter((e) => e.status === "CANCELLED").length;
  const eventsTotalAttendees = events
    .filter((e) => e.status === "COMPLETED")
    .reduce((acc, e) => acc + (e.attendeeCount || 0), 0);
  const eventsTotalBudget = events
    .filter((e) => e.status !== "CANCELLED")
    .reduce((acc, e) => acc + (e.budget || 0), 0);

  // --- Overall Activity & Completion ---
  const totalActivities = placementsTotal + mousTotal + contentTotal + eventsTotal;
  const completedActivities = placementsDone + mousApproved + contentPublished + eventsCompleted;
  const completionRate =
    totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;

  // --- Structured Activities List ---
  const activities: DraftActivityItem[] = [];

  for (const p of placements) {
    const outletName = p.outlet?.name || "Outlet";
    const materialName = p.material?.name || "Materi POSM";
    activities.push({
      type: "PLACEMENT",
      title: `[POSM] ${materialName} di ${outletName}`,
      status: p.status,
      date: p.date ? new Date(p.date).toISOString().slice(0, 10) : null,
      detail: p.cost ? `Biaya: ${formatIDR(p.cost)}` : undefined,
    });
  }

  for (const m of mous) {
    activities.push({
      type: "MOU",
      title: `[MOU] Kemitraan ${m.partnerName}${m.outletName ? ` (${m.outletName})` : ""}`,
      status: m.status,
      date: m.startDate ? new Date(m.startDate).toISOString().slice(0, 10) : null,
      detail: m.compensationValue ? `Kompensasi: ${formatIDR(m.compensationValue)}` : undefined,
    });
  }

  for (const c of contents) {
    activities.push({
      type: "CONTENT",
      title: `[KONTEN] ${c.title} (${c.platform || "Media"})`,
      status: c.status || "DRAFT",
      date: c.publishDate ? new Date(c.publishDate).toISOString().slice(0, 10) : null,
      detail: c.format ? `Format: ${c.format}` : undefined,
    });
  }

  for (const e of events) {
    activities.push({
      type: "EVENT",
      title: `[EVENT] ${e.name}${e.branchName ? ` (${e.branchName})` : ""}`,
      status: e.status,
      date: e.startDate ? new Date(e.startDate).toISOString().slice(0, 10) : null,
      detail: `Audiens: ${e.attendeeCount || 0} orang${e.budget ? ` | Anggaran: ${formatIDR(e.budget)}` : ""}`,
    });
  }

  // --- Draft Achievements ---
  const achievements: string[] = [];
  if (placementsTotal > 0) {
    const rate = Math.round((placementsDone / placementsTotal) * 100);
    achievements.push(
      `Realisasi Materi POSM: Berhasil menyelesaikan pemasangan ${placementsDone} dari ${placementsTotal} titik (${rate}%) dengan total serapan biaya materi ${formatIDR(placementTotalCost)}.`,
    );
  }
  if (eventsCompleted > 0) {
    achievements.push(
      `Aktivitas Lapangan: Berhasil menyelenggarakan ${eventsCompleted} event dengan capaian partisipasi ${eventsTotalAttendees.toLocaleString("id-ID")} pengunjung.`,
    );
  }
  if (contentPublished > 0) {
    achievements.push(
      `Publikasi Media: Menayangkan ${contentPublished} konten promosi dan branding di berbagai kanal digital.`,
    );
  }
  if (mousApproved > 0) {
    achievements.push(
      `Kemitraan Strategis: Menyetujui ${mousApproved} kesepakatan kerjasama MOU dengan komitmen kompensasi sewa senilai ${formatIDR(mouTotalCompensation)}.`,
    );
  }
  if (achievements.length === 0) {
    achievements.push("Belum ada pencapaian operasional yang selesai tercatat pada periode ini.");
  }

  // --- Draft Key Issues ---
  const keyIssues: string[] = [];
  if (placementsIssue > 0) {
    keyIssues.push(
      `Terdapat ${placementsIssue} titik penempatan materi POSM yang mengalami kendala pemasangan di lapangan (status ISSUE).`,
    );
  }
  if (eventsCancelled > 0) {
    keyIssues.push(
      `Terdapat ${eventsCancelled} rencana kegiatan event lapangan yang dibatalkan (status CANCELLED).`,
    );
  }
  if (placementsNotStarted > 0 && placementsTotal > 3) {
    keyIssues.push(
      `Sebanyak ${placementsNotStarted} titik penempatan POSM masih dalam antrean dan belum dimulai pemasangannya.`,
    );
  }
  if (keyIssues.length === 0) {
    keyIssues.push("Seluruh kegiatan operasional berjalan lancar tanpa kendala kritis yang dilaporkan.");
  }

  // --- Draft Action Plans ---
  const actionPlans: string[] = [];
  if (placementsIssue > 0) {
    actionPlans.push(
      `Melakukan peninjauan ulang dan mediasi perizinan untuk ${placementsIssue} titik penempatan POSM bermasalah.`,
    );
  }
  if (eventsCancelled > 0) {
    actionPlans.push(
      "Melakukan evaluasi kendala pembatalan event serta menyusun agenda pengganti di kuartal berikutnya.",
    );
  }
  if (placementsTotal > 0) {
    actionPlans.push(
      "Melakukan audit berkala dan pemeliharaan fisik materi POSM yang telah terpasang di outlet mitra.",
    );
  }
  actionPlans.push(
    "Menyusun kalender konten dan sinkronisasi promosi program tematik untuk bulan berikutnya.",
  );

  return {
    month,
    year,
    summary: {
      totalActivities,
      completedActivities,
      completionRate,
      placementsDone,
      placementsTotal,
      placementTotalCost,
      mousApproved,
      mousTotal,
      mouTotalCompensation,
      contentPublished,
      contentTotal,
      eventsCompleted,
      eventsTotal,
      eventsTotalAttendees,
      eventsTotalBudget,
    },
    activities,
    achievements,
    keyIssues,
    actionPlans,
  };
}
