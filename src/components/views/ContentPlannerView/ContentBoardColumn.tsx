"use client";

import { memo } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { ContentPostItem, PostStatus } from "@/types";
import { CONTENT_STATUS_CONFIG } from "@/lib/marcom/contentWorkflow";
import { ContentBoardCard } from "./ContentBoardCard";
import { cn } from "@/lib/utils";

interface ContentBoardColumnProps {
  status: PostStatus;
  posts: ContentPostItem[];
  onSelectPost: (post: ContentPostItem) => void;
  onAddPost?: (status: PostStatus) => void;
}

export const ContentBoardColumn = memo(function ContentBoardColumn({
  status,
  posts,
  onSelectPost,
  onAddPost,
}: ContentBoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: {
      type: "Column",
      status,
    },
  });

  const meta = CONTENT_STATUS_CONFIG[status] || {
    label: status,
    color: "#64748B",
    bgColor: "rgba(100, 116, 139, 0.1)",
  };

  const postIds = posts.map((p) => p.id);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-72 sm:w-80 shrink-0 flex flex-col max-h-full rounded-2xl border transition-colors duration-150 overflow-hidden",
        isOver
          ? "bg-slate-200/80 dark:bg-slate-800/80 border-blue-400 dark:border-blue-500 shadow-md ring-2 ring-blue-500/20"
          : "bg-slate-100/70 dark:bg-[#121315] border-slate-200/80 dark:border-slate-800/80 shadow-2xs"
      )}
    >
      {/* Column Header */}
      <div className="p-3.5 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: meta.color }}
          />
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {meta.label}
          </h3>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {posts.length}
          </span>
        </div>

        {onAddPost && (
          <button
            type="button"
            onClick={() => onAddPost(status)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            title={`Add post in ${meta.label}`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Cards Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 min-h-[160px]">
        <SortableContext items={postIds} strategy={verticalListSortingStrategy}>
          {posts.map((post) => (
            <ContentBoardCard
              key={post.id}
              post={post}
              onSelect={onSelectPost}
            />
          ))}
        </SortableContext>

        {posts.length === 0 && (
          <div className="h-28 flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800/80 rounded-xl text-center p-3 text-slate-400">
            <span className="text-xs text-slate-400/80">No posts</span>
          </div>
        )}
      </div>
    </div>
  );
});

