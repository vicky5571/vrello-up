"use client";

import { useState, useMemo, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  closestCenter,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { ContentPostItem, PostStatus } from "@/types";
import {
  canTransitionContentStatus,
} from "@/lib/marcom/contentWorkflow";
import { ContentBoardColumn } from "./ContentBoardColumn";
import { ContentBoardCard } from "./ContentBoardCard";

const BOARD_STATUSES: PostStatus[] = [
  "DRAFT",
  "IN_REVIEW",
  "REVISION",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
];

interface ContentBoardViewProps {
  posts: ContentPostItem[];
  onSelectPost: (post: ContentPostItem) => void;
  onUpdateStatus: (post: ContentPostItem, newStatus: PostStatus) => Promise<void> | void;
  onAddPost?: (status: PostStatus) => void;
}

export function ContentBoardView({
  posts,
  onSelectPost,
  onUpdateStatus,
  onAddPost,
}: ContentBoardViewProps) {
  const [activePost, setActivePost] = useState<ContentPostItem | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const visibleStatuses = useMemo(() => {
    return showArchived ? [...BOARD_STATUSES, "ARCHIVED" as PostStatus] : BOARD_STATUSES;
  }, [showArchived]);

  // Group posts by status
  const postsByStatus = useMemo(() => {
    const map = new Map<PostStatus, ContentPostItem[]>();
    for (const status of visibleStatuses) {
      map.set(status, []);
    }
    for (const post of posts) {
      const list = map.get(post.status);
      if (list) {
        list.push(post);
      }
    }
    return map;
  }, [posts, visibleStatuses]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    if (event.active.data.current?.type === "ContentPost") {
      setActivePost(event.active.data.current.post as ContentPostItem);
    }
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActivePost(null);

      if (!over) return;

      const draggedPost = active.data.current?.post as ContentPostItem | undefined;
      if (!draggedPost) return;

      let targetStatus: PostStatus | null = null;
      if (over.data.current?.type === "Column") {
        targetStatus = over.data.current.status as PostStatus;
      } else if (over.data.current?.type === "ContentPost") {
        targetStatus = (over.data.current.post as ContentPostItem).status;
      }

      if (!targetStatus || targetStatus === draggedPost.status) {
        return;
      }

      const check = canTransitionContentStatus(draggedPost.status, targetStatus);
      if (!check.allowed) {
        toast.error(check.reason || "Status transition not allowed");
        return;
      }

      await onUpdateStatus(draggedPost, targetStatus);
    },
    [onUpdateStatus]
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar controls */}
      <div className="flex items-center justify-between pb-3 px-1 text-xs">
        <span className="text-slate-500 font-medium">
          Drag cards across columns to advance content lifecycle
        </span>
        <button
          type="button"
          onClick={() => setShowArchived((v) => !v)}
          className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          {showArchived ? "Hide Archived" : "Show Archived"}
        </button>
      </div>

      {/* Board Scrollable View */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4 pt-1 items-start min-h-0">
          {visibleStatuses.map((status) => (
            <ContentBoardColumn
              key={status}
              status={status}
              posts={postsByStatus.get(status) || []}
              onSelectPost={onSelectPost}
              onAddPost={onAddPost}
            />
          ))}
        </div>

        <DragOverlay>
          {activePost ? (
            <ContentBoardCard post={activePost} onSelect={() => {}} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

