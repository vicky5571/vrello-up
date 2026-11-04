"use client";

import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, CheckSquare, Image as ImageIcon, MapPin, Users } from "lucide-react";
import { ContentPostItem } from "@/types";
import { PlatformIcon } from "@/components/ui/BrandIcons";
import { AppImage } from "@/components/ui/AppImage";
import { findMemberForPic } from "@/lib/marcom/eventChecklist";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { PLATFORM_CONFIG } from "./contentConstants";
import { formatDate, cn } from "@/lib/utils";

interface ContentBoardCardProps {
  post: ContentPostItem;
  onSelect: (post: ContentPostItem) => void;
  isOverlay?: boolean;
}

export const ContentBoardCard = memo(function ContentBoardCard({
  post,
  onSelect,
  isOverlay = false,
}: ContentBoardCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: post.id,
    disabled: isOverlay,
    data: {
      type: "ContentPost",
      post,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const platformMeta = PLATFORM_CONFIG[post.platform] || {
    label: post.platform,
    badgeClass: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  };

  const subtasks = post.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.completed).length;

  const users = useWorkspaceStore((s) => s.users);
  const picMember = findMemberForPic(users, post.picName);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(post)}
      className={cn(
        "group relative rounded-xl border p-3.5 select-none transition-all duration-150 cursor-grab active:cursor-grabbing",
        isOverlay
          ? "bg-white dark:bg-[#18191B] border-blue-500 shadow-2xl ring-2 ring-blue-500/20 rotate-1 scale-[1.02]"
          : isDragging
            ? "bg-slate-100/70 dark:bg-slate-800/40 border-2 border-dashed border-blue-400/50 opacity-40 shadow-none pointer-events-none"
            : "bg-white dark:bg-[#18191B] border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-xs hover:border-slate-300 dark:hover:border-slate-700"
      )}
    >
      <div className={cn(isDragging && "invisible pointer-events-none", "space-y-2.5")}>
        {/* Header: Platform & Format */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <PlatformIcon platform={post.platform} className="w-4 h-4 shrink-0" />
            <span
              className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-md border truncate uppercase tracking-wider",
                platformMeta.badgeClass
              )}
            >
              {platformMeta.label}
            </span>
          </div>

          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
            {post.format}
          </span>
        </div>

        {/* Title */}
        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {post.title}
        </h4>

        {/* Release Date moved up below title */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 min-w-0">
          <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span className="truncate">
            {post.publishDate ? formatDate(post.publishDate) : "Belum terjadwal"}
          </span>
        </div>

        {/* Branch / Outlet */}
        {(post.branchName || post.outlet?.name) && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="truncate">{post.branchName || post.outlet?.name}</span>
          </div>
        )}

        {/* Card Footer: PIC, Subtasks, Media */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 min-w-0 flex-1">
            {picMember ? (
              <AppImage
                src={picMember.avatar}
                alt={picMember.name}
                fill
                sizes="avatar"
                containerClassName="w-4 h-4 rounded-full bg-slate-200 shrink-0"
                className="w-full h-full object-cover rounded-full"
                fallbackIcon={<Users className="w-2.5 h-2.5 text-slate-400" />}
              />
            ) : (
              <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
            <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
              {picMember?.name || post.picName || "Unassigned"}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {subtasks.length > 0 && (
              <span
                className={cn(
                  "flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded",
                  completedSubtasks === subtasks.length
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                )}
                title={`${completedSubtasks}/${subtasks.length} subtasks completed`}
              >
                <CheckSquare className="w-2.5 h-2.5" />
                {completedSubtasks}/{subtasks.length}
              </span>
            )}

            {(post.mediaUrl || post.mediaAttachments?.length) ? (
              <span
                title={`${post.mediaAttachments?.length ?? 1} media file(s) attached`}
                className="flex items-center gap-0.5 text-blue-500"
              >
                <ImageIcon className="w-3 h-3" />
                {post.mediaAttachments && post.mediaAttachments.length > 1 && (
                  <span className="text-[9px] font-bold tabular-nums leading-none">
                    {post.mediaAttachments.length}
                  </span>
                )}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
});

