import { PostPlatform, PostFormat } from "@/types";
import { cn } from "@/lib/utils";
import { PlatformIcon } from "./BrandIcons";

interface PlatformBadgeProps {
  platform?: PostPlatform;
  format?: PostFormat;
  className?: string;
  compact?: boolean;
}

const PLATFORM_MAP: Record<
  PostPlatform,
  { label: string; bg: string; text: string; border: string }
> = {
  instagram: {
    label: "Instagram",
    bg: "bg-pink-500/10 dark:bg-pink-500/20",
    text: "text-pink-600 dark:text-pink-400",
    border: "border-pink-500/30",
  },
  tiktok: {
    label: "TikTok",
    bg: "bg-cyan-500/10 dark:bg-cyan-500/20",
    text: "text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-500/30",
  },
  youtube: {
    label: "YouTube",
    bg: "bg-red-500/10 dark:bg-red-500/20",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-500/30",
  },
  linkedin: {
    label: "LinkedIn",
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/30",
  },
  facebook: {
    label: "Facebook",
    bg: "bg-indigo-500/10 dark:bg-indigo-500/20",
    text: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-500/30",
  },
  twitter: {
    label: "Twitter / X",
    bg: "bg-slate-500/10 dark:bg-slate-500/20",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-500/30",
  },
  blog: {
    label: "Blog",
    bg: "bg-amber-500/10 dark:bg-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/30",
  },
  press: {
    label: "Press",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/30",
  },
};

export function PlatformBadge({
  platform,
  format,
  className,
  compact = false,
}: PlatformBadgeProps) {
  if (!platform) return null;

  const item = PLATFORM_MAP[platform] || PLATFORM_MAP.instagram;

  if (compact) {
    return (
      <span
        title={`${item.label} ${format ? `(${format})` : ""}`}
        className={cn(
          "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border",
          item.bg,
          item.text,
          item.border,
          className,
        )}
      >
        <PlatformIcon platform={platform} className="w-3 h-3" />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0",
        item.bg,
        item.text,
        item.border,
        className,
      )}
    >
      <PlatformIcon platform={platform} className="w-3 h-3 shrink-0" />
      <span>{item.label}</span>
      {format && (
        <span className="opacity-70 capitalize font-medium">· {format}</span>
      )}
    </span>
  );
}
