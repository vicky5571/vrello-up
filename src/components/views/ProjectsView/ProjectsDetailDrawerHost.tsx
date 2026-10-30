"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import type {
  MarcomWorkItem,
  ContentPostItem,
  FieldEventItem,
  MarcomPlacement,
} from "@/types";

const ContentDrawer = dynamic(
  () =>
    import("@/components/views/ContentPlannerView/ContentDrawer").then(
      (m) => m.ContentDrawer,
    ),
  { ssr: false },
);

const EventFormModal = dynamic(
  () =>
    import("@/components/views/EventsView/EventFormModal").then(
      (m) => m.EventFormModal,
    ),
  { ssr: false },
);

const PlacementDetailDrawer = dynamic(
  () =>
    import("@/components/views/PlacementsView/PlacementDetailDrawer").then(
      (m) => m.PlacementDetailDrawer,
    ),
  { ssr: false },
);

const PlacementFormModal = dynamic(
  () =>
    import("@/components/views/PlacementsView/PlacementFormModal").then(
      (m) => m.PlacementFormModal,
    ),
  { ssr: false },
);

export interface ProjectsDetailDrawerHostProps {
  selectedItem: MarcomWorkItem | null;
  onClose: () => void;
  onRefresh?: () => Promise<void> | void;
}

export function ProjectsDetailDrawerHost({
  selectedItem,
  onClose,
  onRefresh,
}: ProjectsDetailDrawerHostProps) {
  const updateCachedPost = useMarcomDataStore((s) => s.updateCachedPost);
  const removeCachedPost = useMarcomDataStore((s) => s.removeCachedPost);
  const updateCachedEvent = useMarcomDataStore((s) => s.updateCachedEvent);
  const updateCachedPlacement = useMarcomDataStore((s) => s.updateCachedPlacement);
  const branches = useMarcomDataStore((s) => s.branches);
  const outletsList = useMarcomDataStore((s) => s.outlets);
  const materialsList = useMarcomDataStore((s) => s.materials);
  const mousList = useMarcomDataStore((s) => s.mous);
  const placements = useMarcomDataStore((s) => s.placements);
  const members = useWorkspaceStore((s) => s.users);

  const { can } = useMarcomPermissions();
  const canManage = can("CREATE_PLACEMENT");

  const [editingPlacement, setEditingPlacement] =
    useState<Partial<MarcomPlacement> | null>(null);
  const [isPlacementSaving, setIsPlacementSaving] = useState(false);

  // Content Post Handlers
  const handleUpdatePost = useCallback(
    async (updated: ContentPostItem) => {
      try {
        const res = await fetch(`/api/marcom/content/${updated.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: updated.title,
            platform: updated.platform,
            format: updated.format,
            publishDate: updated.publishDate || undefined,
            status: updated.status,
            caption: updated.caption,
            mediaUrl: updated.mediaUrl,
            branchName: updated.branchName,
            revisionNotes: updated.revisionNotes,
            subtasks: updated.subtasks,
          }),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || `Failed with status ${res.status}`);
        }

        const savedItem: ContentPostItem = await res.json();
        updateCachedPost(savedItem);
        toast.success("Post berhasil diperbarui");
        if (onRefresh) await onRefresh();
      } catch (err) {
        console.error("Failed to update post:", err);
        toast.error("Gagal memperbarui post");
        throw err;
      }
    },
    [updateCachedPost, onRefresh],
  );

  const handleDeletePost = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/marcom/content/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete post");
        removeCachedPost(id);
        toast.success("Post berhasil dihapus");
        onClose();
        if (onRefresh) await onRefresh();
      } catch (err) {
        console.error("Failed to delete post:", err);
        toast.error("Gagal menghapus post");
        throw err;
      }
    },
    [removeCachedPost, onClose, onRefresh],
  );

  // Field Event Handlers
  const handleEventSaved = useCallback(
    (savedEvent: FieldEventItem) => {
      updateCachedEvent(savedEvent);
      toast.success("Field event berhasil disimpan");
      onClose();
      if (onRefresh) onRefresh();
    },
    [updateCachedEvent, onClose, onRefresh],
  );

  // Placement Form Save Handler
  const handleSavePlacement = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingPlacement || !editingPlacement.id) return;
      setIsPlacementSaving(true);
      try {
        const res = await fetch(`/api/marcom/placements/${editingPlacement.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingPlacement),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || `Failed with status ${res.status}`);
        }

        const savedPlacement: MarcomPlacement = await res.json();
        updateCachedPlacement(savedPlacement);
        setEditingPlacement(null);
        toast.success("Placement berhasil diperbarui");
        if (onRefresh) await onRefresh();
      } catch (err) {
        console.error("Failed to save placement:", err);
        toast.error("Gagal menyimpan placement");
      } finally {
        setIsPlacementSaving(false);
      }
    },
    [editingPlacement, updateCachedPlacement, onRefresh],
  );

  if (!selectedItem) return null;

  return (
    <>
      {selectedItem._type === "content" && (
        <ContentDrawer
          post={selectedItem as ContentPostItem}
          onClose={onClose}
          onUpdatePost={handleUpdatePost}
          onDeletePost={handleDeletePost}
        />
      )}

      {selectedItem._type === "event" && (
        <EventFormModal
          isOpen={true}
          event={selectedItem as FieldEventItem}
          onClose={onClose}
          branches={branches.map((b) => ({ id: b.id, name: b.name }))}
          members={members}
          onSaved={handleEventSaved}
        />
      )}

      {selectedItem._type === "placement" && (
        <PlacementDetailDrawer
          placement={selectedItem as MarcomPlacement}
          onClose={onClose}
          onEdit={(p) => setEditingPlacement(p)}
          canManage={canManage}
        />
      )}

      {editingPlacement && (
        <PlacementFormModal
          placement={editingPlacement}
          setPlacement={setEditingPlacement}
          onClose={() => setEditingPlacement(null)}
          onSave={handleSavePlacement}
          isSaving={isPlacementSaving}
          outletsList={outletsList}
          materialsList={materialsList}
          mousList={mousList}
          placements={placements}
        />
      )}
    </>
  );
}
