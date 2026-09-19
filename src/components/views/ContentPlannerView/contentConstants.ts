import type { PostPlatform } from "@/types";

export const PLATFORM_CONFIG: Record<
  PostPlatform,
  { label: string; badgeClass: string }
> = {
  instagram: {
    label: "Instagram",
    badgeClass: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
  },
  tiktok: {
    label: "TikTok",
    badgeClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  },
  youtube: {
    label: "YouTube",
    badgeClass: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
  facebook: {
    label: "Facebook",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  linkedin: {
    label: "LinkedIn",
    badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  },
  twitter: {
    label: "X (Twitter)",
    badgeClass: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
  },
  blog: {
    label: "Blog / SEO",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  press: {
    label: "Press Release",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
};

export const DEFAULT_POST_SUBTASKS = [
  "Hook & outline scripting",
  "A-roll filming & audio capture",
  "CapCut rough cut & b-roll assembly",
  "Brand color grade & sound design",
  "Publishing caption, alt-text, & hashtags",
];

