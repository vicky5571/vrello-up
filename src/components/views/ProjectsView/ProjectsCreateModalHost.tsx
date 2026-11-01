"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import { useGoogleDrivePicker } from "@/lib/marcom/useGoogleDrivePicker";
import { GoogleDriveLinkModal } from "@/components/ui/GoogleDriveLinkModal";
import type {
  MarcomPlacement,
  PostPlatform,
  PostFormat,
  PostStatus,
  FieldEventItem,
} from "@/types";
import {
  type CreateWorkItemRequest,
  sanitizeDateInput,
  getInitialPlacementPayload,
} from "./createModalHelpers";

const ContentPostModal = dynamic(() => import("@/components/views/ContentPlannerView/ContentPostModal").then((m) => m.ContentPostModal), { ssr: false });
const EventFormModal = dynamic(() => import("@/components/views/EventsView/EventFormModal").then((m) => m.EventFormModal), { ssr: false });
const PlacementFormModal = dynamic(() => import("@/components/views/PlacementsView/PlacementFormModal").then((m) => m.PlacementFormModal), { ssr: false });

export interface ProjectsCreateModalHostProps {
  createRequest: CreateWorkItemRequest | null;
  onClose: () => void;
  onRefresh?: () => Promise<void> | void;
}

export function ProjectsCreateModalHost({
  createRequest,
  onClose,
  onRefresh,
}: ProjectsCreateModalHostProps) {
  const branches = useMarcomDataStore((s) => s.branches);
  const outletsList = useMarcomDataStore((s) => s.outlets);
  const materialsList = useMarcomDataStore((s) => s.materials);
  const mousList = useMarcomDataStore((s) => s.mous);
  const placements = useMarcomDataStore((s) => s.placements);
  const members = useWorkspaceStore((s) => s.users);

  const fetchPosts = useMarcomDataStore((s) => s.fetchPosts);
  const fetchEvents = useMarcomDataStore((s) => s.fetchEvents);
  const fetchPlacements = useMarcomDataStore((s) => s.fetchPlacements);

  // Content Post Form State
  const [contentTitle, setContentTitle] = useState("");
  const [contentPlatform, setContentPlatform] = useState<PostPlatform>("instagram");
  const [contentFormat, setContentFormat] = useState<PostFormat>("image");
  const [contentPublishDate, setContentPublishDate] = useState(new Date().toISOString().slice(0, 10));
  const [contentStatus, setContentStatus] = useState<PostStatus>("SCHEDULED");
  const [contentCaption, setContentCaption] = useState("");
  const [contentMediaUrl, setContentMediaUrl] = useState("");
  const [contentOutletId, setContentOutletId] = useState("");
  const [contentRevisionNotes, setContentRevisionNotes] = useState("");
  const [isContentSaving, setIsContentSaving] = useState(false);

  // Placement Form State
  const [placementData, setPlacementData] = useState<Partial<MarcomPlacement> | null>(null);
  const [isPlacementSaving, setIsPlacementSaving] = useState(false);

  // Drive Picker for Content
  const { openSelector, isModalOpen: isDriveModalOpen, closeModal: closeDriveModal, handleManualAttach } =
    useGoogleDrivePicker();

  useEffect(() => {
    if (!createRequest) {
      setPlacementData(null);
      return;
    }
    const initialDate = sanitizeDateInput(createRequest.date);
    if (createRequest.type === "content") {
      setContentTitle("");
      setContentPlatform("instagram");
      setContentFormat("image");
      setContentPublishDate(initialDate);
      setContentStatus((createRequest.status as PostStatus) || "SCHEDULED");
      setContentCaption("");
      setContentMediaUrl("");
      setContentOutletId(createRequest.outletId || "");
      setContentRevisionNotes("");
    } else if (createRequest.type === "placement") {
      setPlacementData(getInitialPlacementPayload(createRequest));
    }
  }, [createRequest]);

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentTitle.trim()) {
      toast.error("Judul postingan wajib diisi");
      return;
    }
    setIsContentSaving(true);
    try {
      const res = await fetch("/api/marcom/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: contentTitle.trim(),
          platform: contentPlatform,
          format: contentFormat,
          publishDate: new Date(contentPublishDate).toISOString(),
          status: contentStatus,
          caption: contentCaption,
          mediaUrl: contentMediaUrl,
          outletId: contentOutletId || undefined,
          revisionNotes: contentRevisionNotes,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal membuat konten baru");
      }
      toast.success(`Postingan "${contentTitle}" berhasil dijadwalkan`);
      await fetchPosts();
      await onRefresh?.();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat konten");
    } finally {
      setIsContentSaving(false);
    }
  };

  const handleEventSaved = async (saved: FieldEventItem) => {
    toast.success(`Event "${saved.name}" berhasil dibuat`);
    await fetchEvents();
    await onRefresh?.();
    onClose();
  };

  const handleSavePlacement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placementData?.outletId || !placementData?.materialId) {
      toast.error("Pilih outlet dan materi POSM terlebih dahulu");
      return;
    }
    setIsPlacementSaving(true);
    try {
      const res = await fetch("/api/marcom/placements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(placementData),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal membuat placement baru");
      }
      toast.success("Penempatan POSM berhasil didaftarkan");
      await fetchPlacements();
      await onRefresh?.();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat placement");
    } finally {
      setIsPlacementSaving(false);
    }
  };

  if (!createRequest) return null;

  return (
    <>
      {createRequest.type === "content" && (
        <ContentPostModal
          isOpen={true}
          onClose={onClose}
          onSave={handleSaveContent}
          isSaving={isContentSaving}
          title={contentTitle}
          setTitle={setContentTitle}
          platform={contentPlatform}
          setPlatform={setContentPlatform}
          format={contentFormat}
          setFormat={setContentFormat}
          publishDate={contentPublishDate}
          setPublishDate={setContentPublishDate}
          status={contentStatus}
          setStatus={setContentStatus}
          caption={contentCaption}
          setCaption={setContentCaption}
          outletId={contentOutletId}
          setOutletId={setContentOutletId}
          mediaUrl={contentMediaUrl}
          setMediaUrl={setContentMediaUrl}
          revisionNotes={contentRevisionNotes}
          setRevisionNotes={setContentRevisionNotes}
          onOpenDriveSelector={() =>
            openSelector({
              defaultKind: "video",
              onSelect: (atts) => {
                if (atts[0]) {
                  setContentMediaUrl(atts[0].url);
                  toast.success("Lampiran berhasil ditautkan");
                }
              },
            })
          }
        />
      )}

      {createRequest.type === "event" && (
        <EventFormModal
          isOpen={true}
          onClose={onClose}
          event={null}
          defaultDate={sanitizeDateInput(createRequest.date)}
          branches={branches.map((b) => ({ id: b.id, name: b.name }))}
          members={members}
          onSaved={handleEventSaved}
        />
      )}

      {createRequest.type === "placement" && placementData && (
        <PlacementFormModal
          placement={placementData}
          setPlacement={setPlacementData}
          onClose={onClose}
          onSave={handleSavePlacement}
          isSaving={isPlacementSaving}
          outletsList={outletsList}
          materialsList={materialsList}
          mousList={mousList}
          placements={placements}
        />
      )}

      <GoogleDriveLinkModal
        isOpen={isDriveModalOpen}
        onClose={closeDriveModal}
        onAttach={handleManualAttach}
      />
    </>
  );
}
