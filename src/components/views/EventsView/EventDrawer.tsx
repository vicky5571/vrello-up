"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  X,
  Trash2,
  RefreshCw,
  Flag,
  MapPin,
  Store,
  Coins,
  AlertTriangle,
} from "lucide-react";
import type {
  FieldEventItem,
  EventStatus,
  User,
  TaskAttachment,
} from "@/types";
import { cn, formatIDR } from "@/lib/utils";
import {
  getEventChecklistTemplate,
  findMemberForPic,
} from "@/lib/marcom/eventChecklist";
import { EventChecklistSection } from "./EventChecklistSection";
import { EventBorrowedEquipmentSection } from "./EventBorrowedEquipmentSection";
import { EventMediaSection } from "./EventMediaSection";
import { EventCompleteWarningModal } from "./EventCompleteWarningModal";
import { canTransitionEvent } from "@/lib/marcom/eventMachine";
import { formatOutletSelectLabel } from "@/lib/marcom/outletRelations";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { useMarcomDataStore } from "@/lib/marcom/marcomDataStore";
import { getEventEquipmentSummary } from "@/lib/marcom/eventEquipmentHelpers";

export interface EventDrawerProps {
  event: FieldEventItem | null;
  onClose: () => void;
  onUpdateEvent: (updated: FieldEventItem) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<boolean>;
  branches: { id: string; name: string }[];
  members: User[];
  onOpenFootageModal?: (event: FieldEventItem, clipIdx?: number) => void;
}

const EVENT_STATUSES: { value: EventStatus; label: string; badgeClass: string }[] = [
  {
    value: "UPCOMING",
    label: "Upcoming",
    badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  },
  {
    value: "ON_PROGRESS",
    label: "On Progress",
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  },
  {
    value: "COMPLETED",
    label: "Completed",
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  },
  {
    value: "CANCELLED",
    label: "Cancelled",
    badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
  },
];

export function EventDrawer({
  event,
  onClose,
  onUpdateEvent,
  onDeleteEvent,
  branches,
  members,
  onOpenFootageModal,
}: EventDrawerProps) {
  // Form State
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("Roadshow");
  const [eventBranchName, setEventBranchName] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventOutletId, setEventOutletId] = useState<string>("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventPicName, setEventPicName] = useState("");
  const [picMemberId, setPicMemberId] = useState<string>("");
  const [eventStatus, setEventStatus] = useState<EventStatus>("UPCOMING");
  const [eventBudget, setEventBudget] = useState<string>("0");
  const [eventTargetAttendee, setEventTargetAttendee] = useState<string>("100");
  const [eventAttendeeCount, setEventAttendeeCount] = useState<string>("0");
  const [eventNotes, setEventNotes] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaAttachments, setMediaAttachments] = useState<TaskAttachment[]>([]);
  const [eventSubtasks, setEventSubtasks] = useState<
    { id: string; title: string; completed?: boolean }[]
  >([]);

  const [outlets, setOutlets] = useState<
    Array<{ id: string; name: string; code: string; branchId?: string; city?: string }>
  >([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const borrowRecords = useMarcomDataStore((s) => s.borrowRecords);
  const equipmentSummary = useMemo(
    () => (event ? getEventEquipmentSummary(borrowRecords, event.id) : null),
    [borrowRecords, event]
  );
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);

  // ponytail: debt DEBT-EVENT-LOGISTICS-001 (intercept completed if unreturned equipment)
  const handleStatusChange = (newStatus: EventStatus) => {
    if (newStatus === "COMPLETED" && equipmentSummary?.hasUnreturned) {
      setIsWarningModalOpen(true);
      return;
    }
    setEventStatus(newStatus);
  };

  const handleCancelWarning = () => {
    setIsWarningModalOpen(false);
    document
      .getElementById("borrowed-equipment-section")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const handleConfirmComplete = () => {
    setIsWarningModalOpen(false);
    setEventStatus("COMPLETED");
  };

  const handleNumberInputChange = (
    value: string,
    setter: (val: string) => void
  ) => {
    if (value === "") {
      setter("");
      return;
    }
    const clean = value.replace(/[^0-9]/g, "");
    const normalized = clean.replace(/^0+(?=\d)/, "");
    setter(normalized);
  };

  // Load outlets
  useEffect(() => {
    fetch("/api/marcom/outlets?status=APPROVED")
      .then((res) => (res.ok ? res.json() : []))
      .then((json) => {
        if (Array.isArray(json)) {
          setOutlets(json);
        } else if (json && Array.isArray(json.data)) {
          setOutlets(json.data);
        }
      })
      .catch(() => {});
  }, []);

  const filteredOutlets = useMemo(() => {
    if (!eventBranchName) return outlets;
    const selectedBranchObj = branches.find(
      (b) => b.name.toLowerCase() === eventBranchName.toLowerCase()
    );
    if (!selectedBranchObj) return outlets;
    const branchOutlets = outlets.filter((o) => o.branchId === selectedBranchObj.id);
    return branchOutlets.length > 0 ? branchOutlets : outlets;
  }, [outlets, eventBranchName, branches]);

  // Sync state with event prop
  useEffect(() => {
    if (!event) return;

    setEventName(event.name || "");
    setEventType(event.eventType || "Roadshow");
    setEventBranchName(event.branchName || branches[0]?.name || "Jakarta Central");
    setEventLocation(event.location || "");
    setEventOutletId(event.outletId || "");

    const dateVal = event.startDate || event.date;
    setEventStartDate(dateVal ? dateVal.slice(0, 10) : "");
    setEventEndDate(event.endDate ? event.endDate.slice(0, 10) : "");
    setEventStatus(event.status || "UPCOMING");
    setEventBudget(String(event.budget ?? 0));
    setEventTargetAttendee(String(event.targetAttendee ?? 100));
    setEventAttendeeCount(String(event.attendeeCount ?? 0));
    setEventNotes(event.notes || "");

    const existingAttachments: TaskAttachment[] =
      Array.isArray(event.mediaAttachments) && event.mediaAttachments.length > 0
        ? event.mediaAttachments
        : [
            ...(event.footage?.map((f, i) => ({
              id: f.id || `legacy-footage-${i}`,
              name: f.title || `Footage ${i + 1}`,
              sizeBytes: 0,
              type: "video" as const,
              url: f.filePath,
              source: "gdrive" as const,
              uploadedAt: new Date().toISOString(),
            })) || []),
            ...(event.mediaUrl
              ? [
                  {
                    id: `legacy-mediaUrl-${Date.now()}`,
                    name: "Field Documentation Archive",
                    sizeBytes: 0,
                    type: "document" as const,
                    url: event.mediaUrl,
                    source: "gdrive" as const,
                    isSharedFolder: true,
                    uploadedAt: new Date().toISOString(),
                  },
                ]
              : []),
          ];
    setMediaAttachments(existingAttachments);
    setMediaUrl(event.mediaUrl || existingAttachments[0]?.url || "");

    const matched = findMemberForPic(members, event.picName);
    setPicMemberId(matched?.id || "custom");
    setEventPicName(event.picName || "");

    const checklistItems = event.checklist || event.subtasks || [];
    setEventSubtasks(
      checklistItems.length > 0
        ? checklistItems.map((s, i) => ({
            id: s.id || `sub-edit-${i}`,
            title: s.title,
            completed: Boolean(s.completed),
          }))
        : getEventChecklistTemplate(event.eventType || "Roadshow").map((t, i) => ({
            id: `sub-edit-${i}`,
            title: t,
            completed: false,
          }))
    );
  }, [event, branches, members]);

  // Keyboard escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!event) return null;

  const currentStatusMeta =
    EVENT_STATUSES.find((s) => s.value === eventStatus) || EVENT_STATUSES[0];

  const handleSave = async () => {
    if (!eventName.trim()) {
      toast.error("Event name is required");
      return;
    }

    if (eventEndDate && eventStartDate && eventEndDate < eventStartDate) {
      toast.error("End date cannot be earlier than start date");
      return;
    }

    const parsedBudget = Math.max(0, parseInt(eventBudget, 10) || 0);
    const parsedTargetAttendee = Math.max(0, parseInt(eventTargetAttendee, 10) || 0);
    const parsedAttendeeCount = Math.max(0, parseInt(eventAttendeeCount, 10) || 0);
    const effectiveMediaUrl = mediaUrl.trim() || mediaAttachments[0]?.url || "";

    setIsSaving(true);
    try {
      const payload = {
        name: eventName.trim(),
        eventType,
        branchName: eventBranchName,
        location: eventLocation.trim(),
        outletId: eventOutletId || null,
        date: eventStartDate || undefined,
        endDate: eventEndDate || undefined,
        picName: eventPicName.trim(),
        status: eventStatus,
        budget: parsedBudget,
        targetAttendee: parsedTargetAttendee,
        attendeeCount: parsedAttendeeCount,
        notes: eventNotes.trim(),
        mediaUrl: effectiveMediaUrl,
        mediaAttachments,
        checklist: eventSubtasks,
      };

      const res = await fetch(`/api/marcom/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update event");

      const picMember =
        members.find((m) => m.id === picMemberId) ||
        findMemberForPic(members, eventPicName);

      const updatedItem: FieldEventItem = {
        ...event,
        name: eventName.trim(),
        eventType,
        branchName: eventBranchName,
        location: eventLocation,
        startDate: eventStartDate || null,
        date: eventStartDate || null,
        endDate: eventEndDate || null,
        picName: picMember?.name || eventPicName,
        status: eventStatus,
        budget: parsedBudget,
        targetAttendee: parsedTargetAttendee,
        attendeeCount: parsedAttendeeCount,
        notes: eventNotes,
        mediaUrl: effectiveMediaUrl,
        mediaAttachments,
        outletId: eventOutletId || null,
        checklist: eventSubtasks,
      };

      await onUpdateEvent(updatedItem);
      toast.success("Perubahan field event berhasil disimpan");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui field event");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus event "${event.name}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const success = await onDeleteEvent(event.id);
      if (success) {
        onClose();
      }
    } catch {
      toast.error("Gagal menghapus event");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity cursor-pointer z-40"
      />

      {/* Drawer container (560px wide) */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative z-50 w-full sm:w-[560px] h-full bg-white dark:bg-[#18191B] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header (Sticky) */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 shrink-0">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border",
                  "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                )}
              >
                <Flag className="w-3.5 h-3.5" />
                <span className="capitalize">{eventType}</span>
              </span>

              {/* Status Selector Dropdown */}
              <div className="relative">
                <select
                  value={eventStatus}
                  onChange={(e) => handleStatusChange(e.target.value as EventStatus)}
                  className={cn(
                    "px-2.5 py-1 text-xs font-bold rounded-lg border uppercase tracking-wider cursor-pointer outline-hidden transition-all",
                    currentStatusMeta.badgeClass
                  )}
                >
                  {EVENT_STATUSES.map((opt) => {
                    const isAllowed =
                      opt.value === eventStatus ||
                      canTransitionEvent(event.status, opt.value);
                    return (
                      <option
                        key={opt.value}
                        value={opt.value}
                        disabled={!isAllowed}
                        className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 normal-case font-medium"
                      >
                        {opt.label} {!isAllowed ? "(Tidak diizinkan)" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Tutup (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Editable Title Input */}
          <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="Nama Event / Aktivasi..."
            className="w-full text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-hidden transition-colors py-1"
          />

          {/* Unreturned Equipment Permanent Warning Banner */}
          {eventStatus === "COMPLETED" && equipmentSummary?.hasUnreturned && (
            <div className="mt-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block">
                  Peringatan: {equipmentSummary.totalUnits} Unit Alat Masih di Lapangan
                </span>
                <span className="text-[11px] text-amber-700 dark:text-amber-300">
                  Acara ini ditandai selesai dengan alat inventaris yang belum kembali ke gudang. Harap segera koordinasikan pengembalian fisik.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 2. Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Activation Type & Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipe Aktivasi
              </label>
              <CustomDropdown
                value={eventType}
                onChange={(newType) => {
                  setEventType(newType);
                  if (eventSubtasks.length === 0) {
                    setEventSubtasks(
                      getEventChecklistTemplate(newType).map((t, i) => ({
                        id: `sub-init-${i}`,
                        title: t,
                        completed: false,
                      }))
                    );
                  }
                }}
                options={[
                  { value: "Roadshow", label: "Mall Roadshow" },
                  { value: "Launch", label: "Store Launch" },
                  { value: "Booth", label: "Pop-up Booth" },
                  { value: "Exhibition", label: "Exhibition / Expo" },
                  { value: "Workshop", label: "Workshop" },
                  { value: "Community", label: "Community Meetup" },
                ]}
                size="md"
                className="w-full"
                menuClassName="w-full min-w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cabang Penyelenggara
              </label>
              <CustomDropdown
                value={eventBranchName}
                onChange={(val) => setEventBranchName(val)}
                options={
                  branches.length > 0
                    ? branches.map((b) => ({ value: b.name, label: b.name }))
                    : [
                        { value: "Jakarta Central", label: "Jakarta Central" },
                        { value: "Surabaya West", label: "Surabaya West" },
                        { value: "Bandung Dago", label: "Bandung Dago" },
                        { value: "Bali Kuta", label: "Bali Kuta" },
                      ]
                }
                size="md"
                searchable={branches.length >= 6}
                searchPlaceholder="Cari cabang..."
                className="w-full"
                menuClassName="w-full min-w-full"
              />
            </div>
          </div>

          {/* Location & Outlet */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lokasi / Venue *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Central Park Mall Atrium Lt. LG"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-slate-400" />
                  Outlet Terkait (Opsional)
                </span>
                {eventOutletId && (
                  <button
                    type="button"
                    onClick={() => setEventOutletId("")}
                    className="text-[10px] text-rose-500 hover:underline font-normal cursor-pointer"
                  >
                    Hapus tautan
                  </button>
                )}
              </label>
              <CustomDropdown
                value={eventOutletId}
                onChange={(chosenId) => {
                  setEventOutletId(chosenId);
                  if (chosenId && !eventLocation) {
                    const found = outlets.find((o) => o.id === chosenId);
                    if (found) setEventLocation(found.name);
                  }
                }}
                options={[
                  { value: "", label: "-- Tidak Terikat Outlet Khusus --" },
                  ...filteredOutlets.map((o) => ({
                    value: o.id,
                    label: formatOutletSelectLabel(o),
                  })),
                ]}
                size="md"
                searchable
                searchPlaceholder="Cari kode atau nama outlet..."
                className="w-full"
                menuClassName="w-full min-w-full max-w-lg"
                placeholder="-- Tidak Terikat Outlet Khusus --"
              />
            </div>
          </div>

          {/* Schedule Dates & PIC */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={eventStartDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setEventStartDate(val);
                  if (eventEndDate && val && eventEndDate < val) {
                    setEventEndDate(val);
                  }
                }}
                className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Selesai
              </label>
              <input
                type="date"
                min={eventStartDate}
                value={eventEndDate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && eventStartDate && val < eventStartDate) {
                    toast.error("Tanggal selesai tidak boleh sebelum tanggal mulai");
                    setEventEndDate(eventStartDate);
                    return;
                  }
                  setEventEndDate(val);
                }}
                className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {eventEndDate && eventStartDate && eventEndDate > eventStartDate
                  ? "Aktivasi multi-hari"
                  : "Opsional jika hanya 1 hari"}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Person in Charge (PIC)
              </label>
              <CustomDropdown
                value={picMemberId}
                onChange={(val) => {
                  setPicMemberId(val);
                  if (val !== "custom") {
                    const m = members.find((mem) => mem.id === val);
                    if (m) setEventPicName(m.name);
                  }
                }}
                options={[
                  ...members.map((m) => ({
                    value: m.id,
                    label: `${m.name} (${m.email})`,
                  })),
                  { value: "custom", label: "Custom PIC Name..." },
                ]}
                size="md"
                searchable={members.length >= 6}
                searchPlaceholder="Cari anggota tim PIC..."
                className="w-full"
                menuClassName="w-full min-w-full max-w-md"
              />

              {picMemberId === "custom" && (
                <input
                  type="text"
                  placeholder="Nama PIC custom..."
                  value={eventPicName}
                  onChange={(e) => setEventPicName(e.target.value)}
                  className="mt-1.5 w-full px-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 outline-hidden"
                />
              )}
            </div>
          </div>

          {/* Budget & Attendees Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Anggaran Biaya (IDR)
              </label>
              <input
                type="number"
                min={0}
                step={500000}
                placeholder="0"
                value={eventBudget}
                onChange={(e) => handleNumberInputChange(e.target.value, setEventBudget)}
                className="w-full px-3 py-2 rounded-lg text-xs font-mono font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden"
              />
              <span className="text-[10px] text-emerald-600 font-mono mt-0.5 block">
                {formatIDR(Math.max(0, parseInt(eventBudget, 10) || 0))}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Pengunjung
              </label>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={eventTargetAttendee}
                onChange={(e) => handleNumberInputChange(e.target.value, setEventTargetAttendee)}
                className="w-full px-3 py-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pengunjung Riil (Aktual)
              </label>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={eventAttendeeCount}
                onChange={(e) => handleNumberInputChange(e.target.value, setEventAttendeeCount)}
                className="w-full px-3 py-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden"
              />
            </div>

            {/* Live Unit Economics & ROI Preview */}
            {(() => {
              const parsedBudget = Math.max(0, parseInt(eventBudget, 10) || 0);
              const parsedTarget = Math.max(0, parseInt(eventTargetAttendee, 10) || 0);
              const parsedActual = Math.max(0, parseInt(eventAttendeeCount, 10) || 0);
              if (parsedBudget === 0 && parsedTarget === 0 && parsedActual === 0) return null;
              return (
                <div className="sm:col-span-3 p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Proyeksi Biaya per Pengunjung
                      </span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {parsedTarget > 0 && parsedBudget > 0
                          ? `${formatIDR(Math.round(parsedBudget / parsedTarget))} / orang (Target)`
                          : "Isi Target & Anggaran untuk proyeksi"}
                      </span>
                    </div>
                  </div>

                  {parsedActual > 0 && parsedBudget > 0 && (
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Realisasi Riil
                        </span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatIDR(Math.round(parsedBudget / parsedActual))} / org
                        </span>
                      </div>
                      {parsedTarget > 0 && (
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                            parsedActual >= parsedTarget
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
                          )}
                        >
                          {Math.round((parsedActual / parsedTarget) * 100)}% Capaian
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Operational Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Catatan Logistik, Perizinan & Operasional
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Izin mall approved. Perlu 3 wireless mic, backdrop panggung 6x3m, daya listrik 5500W..."
              value={eventNotes}
              onChange={(e) => setEventNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden resize-y"
            />
          </div>

          {/* Media & Documentation Attachments */}
          <EventMediaSection
            mediaAttachments={mediaAttachments}
            setMediaAttachments={setMediaAttachments}
            mediaUrl={mediaUrl}
            setMediaUrl={setMediaUrl}
            eventName={eventName}
            onOpenPreview={
              onOpenFootageModal
                ? (idx) => {
                    onOpenFootageModal(
                      {
                        ...event,
                        name: eventName || event.name,
                        eventType,
                        status: eventStatus,
                        mediaUrl: mediaUrl.trim() || mediaAttachments[0]?.url || "",
                        mediaAttachments,
                      },
                      idx
                    );
                  }
                : undefined
            }
          />

          {/* Borrowed Equipment Section */}
          <div id="borrowed-equipment-section">
            <EventBorrowedEquipmentSection eventId={event.id} />
          </div>

          {/* Checklist Section */}
          <EventChecklistSection
            eventType={eventType}
            eventSubtasks={eventSubtasks}
            setEventSubtasks={setEventSubtasks}
          />
        </div>

        {/* 3. Footer Actions (Sticky) */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer disabled:opacity-40"
          >
            {isDeleting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            <span>Hapus Event</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Perubahan</span>
              )}
            </button>
          </div>
        </div>

        {/* Unreturned Equipment Completion Warning Intercept Modal */}
        <EventCompleteWarningModal
          isOpen={isWarningModalOpen}
          eventName={eventName || event.name}
          unreturnedItems={equipmentSummary?.unreturnedList || []}
          onConfirmComplete={handleConfirmComplete}
          onCancel={handleCancelWarning}
        />
      </motion.div>
    </div>
  );
}

