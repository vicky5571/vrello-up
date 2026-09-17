import type { PostStatus, ContentPostItem } from "@/types";

export interface ContentStatusMeta {
  status: PostStatus;
  label: string;
  badgeClass: string;
  color: string;
  bgColor: string;
  description: string;
  requiresReviewNotes?: boolean;
}

export const CONTENT_STATUS_CONFIG: Record<PostStatus, ContentStatusMeta> = {
  DRAFT: {
    status: "DRAFT",
    label: "Draft",
    badgeClass: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    color: "#64748B",
    bgColor: "rgba(100, 116, 139, 0.1)",
    description: "Konsep ide atau draf copywriting awal",
  },
  IN_REVIEW: {
    status: "IN_REVIEW",
    label: "In Review",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    color: "#D97706",
    bgColor: "rgba(217, 119, 6, 0.1)",
    description: "Menunggu peninjauan dari Creative Lead / Marcom Manager",
  },
  REVISION: {
    status: "REVISION",
    label: "Revision",
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    color: "#E11D48",
    bgColor: "rgba(225, 29, 72, 0.1)",
    description: "Perlu perbaikan visual atau copywriting sesuai catatan",
    requiresReviewNotes: true,
  },
  APPROVED: {
    status: "APPROVED",
    label: "Approved",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    color: "#2563EB",
    bgColor: "rgba(37, 99, 235, 0.1)",
    description: "Disetujui dan siap masuk antrean produksi / penjadwalan",
  },
  SCHEDULED: {
    status: "SCHEDULED",
    label: "Scheduled",
    badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    color: "#9333EA",
    bgColor: "rgba(147, 51, 234, 0.1)",
    description: "Siap tayang secara otomatis sesuai tanggal publikasi",
  },
  PUBLISHED: {
    status: "PUBLISHED",
    label: "Published",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    color: "#10B981",
    bgColor: "rgba(16, 185, 129, 0.1)",
    description: "Konten telah ditayangkan secara live di media sosial",
  },
  ARCHIVED: {
    status: "ARCHIVED",
    label: "Archived",
    badgeClass: "bg-slate-400/10 text-slate-500 dark:text-slate-500 border-slate-400/20",
    color: "#94A3B8",
    bgColor: "rgba(148, 163, 184, 0.1)",
    description: "Konten telah diarsipkan",
  },
};

/**
 * Returns UI metadata for a content post status.
 */
export function getContentStatusMeta(status?: string | null): ContentStatusMeta {
  if (!status || !(status in CONTENT_STATUS_CONFIG)) {
    return CONTENT_STATUS_CONFIG.DRAFT;
  }
  return CONTENT_STATUS_CONFIG[status as PostStatus];
}

/**
 * Validates whether a status transition is permitted in the creative pipeline.
 */
export function canTransitionContentStatus(
  current: string,
  target: string,
  role = "staff",
): { allowed: boolean; reason?: string } {
  const c = (current || "DRAFT").toUpperCase();
  const t = (target || "DRAFT").toUpperCase();

  if (c === t) {
    return { allowed: true };
  }

  // Viewers cannot change status
  if (role === "viewer") {
    return { allowed: false, reason: "Peran Viewer hanya memiliki akses baca." };
  }

  const allowedTransitions: Record<string, string[]> = {
    DRAFT: ["IN_REVIEW", "SCHEDULED", "ARCHIVED"],
    IN_REVIEW: ["APPROVED", "REVISION", "DRAFT", "ARCHIVED"],
    REVISION: ["IN_REVIEW", "DRAFT", "ARCHIVED"],
    APPROVED: ["SCHEDULED", "PUBLISHED", "REVISION", "ARCHIVED"],
    SCHEDULED: ["PUBLISHED", "REVISION", "APPROVED", "ARCHIVED"],
    PUBLISHED: ["ARCHIVED"],
    ARCHIVED: ["DRAFT"],
  };

  const validNextStates = allowedTransitions[c] || [];
  if (!validNextStates.includes(t)) {
    return {
      allowed: false,
      reason: `Transisi dari "${getContentStatusMeta(c).label}" ke "${getContentStatusMeta(t).label}" tidak diizinkan.`,
    };
  }

  return { allowed: true };
}

export interface ContentPipelineKPIs {
  totalPosts: number;
  inReviewCount: number;
  revisionCount: number;
  approvedCount: number;
  scheduledCount: number;
  publishedCount: number;
  publishedRate: number;
  platformBreakdown: Record<string, number>;
}

/**
 * Aggregates high-signal KPIs for the content creation & approval pipeline.
 */
export function calculateContentPipelineKPIs(
  posts: ContentPostItem[],
): ContentPipelineKPIs {
  if (!Array.isArray(posts) || posts.length === 0) {
    return {
      totalPosts: 0,
      inReviewCount: 0,
      revisionCount: 0,
      approvedCount: 0,
      scheduledCount: 0,
      publishedCount: 0,
      publishedRate: 0,
      platformBreakdown: {},
    };
  }

  let inReviewCount = 0;
  let revisionCount = 0;
  let approvedCount = 0;
  let scheduledCount = 0;
  let publishedCount = 0;
  const platformBreakdown: Record<string, number> = {};

  for (const p of posts) {
    const s = (p.status || "DRAFT").toUpperCase();
    if (s === "IN_REVIEW") inReviewCount++;
    else if (s === "REVISION") revisionCount++;
    else if (s === "APPROVED") approvedCount++;
    else if (s === "SCHEDULED") scheduledCount++;
    else if (s === "PUBLISHED") publishedCount++;

    const plat = (p.platform || "instagram").toLowerCase();
    platformBreakdown[plat] = (platformBreakdown[plat] || 0) + 1;
  }

  const activePostsCount = posts.filter(
    (p) => (p.status || "").toUpperCase() !== "ARCHIVED",
  ).length;

  const publishedRate =
    activePostsCount > 0
      ? Math.round((publishedCount / activePostsCount) * 100)
      : 0;

  return {
    totalPosts: posts.length,
    inReviewCount,
    revisionCount,
    approvedCount,
    scheduledCount,
    publishedCount,
    publishedRate,
    platformBreakdown,
  };
}
