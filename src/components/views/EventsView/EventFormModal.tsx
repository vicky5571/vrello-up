"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Flag,
  Plus,
  X,
  MapPin,
  Store,
  Coins,
} from "lucide-react";
import type {
  FieldEventItem,
  EventStatus,
  EventFootage,
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
import { canTransitionEvent } from "@/lib/marcom/eventMachine";
import { formatOutletSelectLabel } from "@/lib/marcom/outletRelations";

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: FieldEventItem | null;
  defaultDate?: string;
  branches: { id: string; name: string }[];
  members: User[];
  onSaved: (savedEvent: FieldEventItem, locationLabel?: string) => void;
  onOpenFootageModal?: (event: FieldEventItem, clipIdx?: number) => void;
}

export function EventFormModal({
  isOpen,
  onClose,
  event,
  defaultDate,
  branches,
  members,
  onSaved,
  onOpenFootageModal,
}: EventFormModalProps) {
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("Roadshow");
  const [eventBranchName, setEventBranchName] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventStartDate, setEventStartDate] = useState(
    defaultDate || new Date().toISOString().slice(0, 10)
  );
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventPicName, setEventPicName] = useState("");
  const [picMemberId, setPicMemberId] = useState<string>("");
  const [eventStatus, setEventStatus] = useState<EventStatus>("UPCOMING");
  const [eventBudget, setEventBudget] = useState<string>("0");
  const [eventTargetAttendee, setEventTargetAttendee] = useState<string>("100");
  const [eventAttendeeCount, setEventAttendeeCount] = useState<string>("0");
  const [eventNotes, setEventNotes] = useState("");

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

  // Subtasks checklist
  const [eventSubtasks, setEventSubtasks] = useState<
    { id: string; title: string; completed?: boolean }[]
  >([]);

  // Media attachments
  const [mediaAttachments, setMediaAttachments] = useState<TaskAttachment[]>([]);
  const [eventOutletId, setEventOutletId] = useState<string>("");
  const [outlets, setOutlets] = useState<Array<{ id: string; name: string; code: string; branchId?: string; city?: string }>>([]);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/marcom/outlets")
      .then((res) => (res.ok ? res.json() : []))
      .then((json) => {
        if (Array.isArray(json)) {
          setOutlets(json);
        } else if (json && Array.isArray(json.data)) {
          setOutlets(json.data);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  const filteredOutlets = useMemo(() => {
    if (!eventBranchName) return outlets;
    const selectedBranchObj = branches.find((b) => b.name.toLowerCase() === eventBranchName.toLowerCase());
    if (!selectedBranchObj) return outlets;
    const branchOutlets = outlets.filter((o) => o.branchId === selectedBranchObj.id);
    return branchOutlets.length > 0 ? branchOutlets : outlets;
  }, [outlets, eventBranchName, branches]);

  const handleStartDateChange = (val: string) => {
    setEventStartDate(val);
    if (eventEndDate && val && eventEndDate < val) {
      setEventEndDate(val);
    }
  };

  // Initialize or reset form state on open / event change
  useEffect(() => {
    if (!isOpen) return;

    if (event) {
      // Edit mode
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
    } else {
      // Create mode
      setEventName("");
      setEventType("Roadshow");
      setEventBranchName(branches[0]?.name || "Jakarta Central");
      setEventLocation("");
      setEventOutletId("");
      setEventStartDate(defaultDate || new Date().toISOString().slice(0, 10));
      setEventEndDate("");
      const defaultMember = members[0];
      setPicMemberId(defaultMember?.id || "");
      setEventPicName(defaultMember?.name || "Field Team Lead");
      setEventStatus("UPCOMING");
      setEventBudget("15000000");
      setEventTargetAttendee("250");
      setEventAttendeeCount("0");
      setEventNotes("");
      setMediaAttachments([]);
      setEventSubtasks(
        getEventChecklistTemplate("Roadshow").map((t, i) => ({
          id: `sub-init-${i}`,
          title: t,
          completed: false,
        }))
      );
    }
  }, [isOpen, event, defaultDate, branches, members]);

  // Keyboard escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Form submission
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
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
        mediaAttachments,
        checklist: eventSubtasks,
      };

      let savedId = event?.id;

      if (event?.id) {
        const res = await fetch(`/api/marcom/events/${event.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to update event");
        savedId = event.id;
      } else {
        const res = await fetch("/api/marcom/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create event");
        const created = await res.json();
        savedId = created.id;
      }

      const picMember =
        members.find((m) => m.id === picMemberId) ||
        findMemberForPic(members, eventPicName);

      const savedItem: FieldEventItem = {
        id: savedId || "",
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
        mediaAttachments,
        outletId: eventOutletId || null,
        checklist: eventSubtasks,
      };

      onSaved(savedItem, "Field Event");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save field event");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            {/* Modal Header (Sticky / Pinned) */}
            <div className="shrink-0 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <Flag className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {event ? "Edit Field Event" : "Create New Field Event"}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    On-ground brand activation, venue permits, budget & logistics
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEvent} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Scrollable Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Event Name & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Event / Activation Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Summer Mall Roadshow Vol. 2"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Activation Type
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden"
                  >
                    <option value="Roadshow">Mall Roadshow</option>
                    <option value="Launch">Store Launch</option>
                    <option value="Booth">Pop-up Booth</option>
                    <option value="Exhibition">Exhibition / Expo</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Community">Community Meetup</option>
                  </select>
                </div>
              </div>

              {/* Branch & Venue Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Organizing Branch
                  </label>
                  <select
                    value={eventBranchName}
                    onChange={(e) => setEventBranchName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden"
                  >
                    {branches.length > 0 ? (
                      branches.map((b) => (
                        <option key={b.id} value={b.name}>
                          {b.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Jakarta Central">Jakarta Central</option>
                        <option value="Surabaya West">Surabaya West</option>
                        <option value="Bandung Dago">Bandung Dago</option>
                        <option value="Bali Kuta">Bali Kuta</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Venue / Specific Location *
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
              </div>

              {/* Associated Outlet (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-slate-400" />
                    Associated Outlet (Optional)
                  </span>
                  {eventOutletId && (
                    <button
                      type="button"
                      onClick={() => setEventOutletId("")}
                      className="text-[10px] text-rose-500 hover:underline font-normal"
                    >
                      Clear link
                    </button>
                  )}
                </label>
                <select
                  value={eventOutletId}
                  onChange={(e) => {
                    const chosenId = e.target.value;
                    setEventOutletId(chosenId);
                    if (chosenId && !eventLocation) {
                      const found = outlets.find((o) => o.id === chosenId);
                      if (found) setEventLocation(found.name);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden"
                >
                  <option value="">-- None (Branch-Wide / Non-Store Event) --</option>
                  {filteredOutlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {formatOutletSelectLabel(o)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Schedule Dates & PIC */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={eventStartDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    min={eventStartDate}
                    value={eventEndDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && eventStartDate && val < eventStartDate) {
                        toast.error("End date cannot be earlier than start date");
                        setEventEndDate(eventStartDate);
                        return;
                      }
                      setEventEndDate(val);
                    }}
                    className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {eventEndDate && eventStartDate && eventEndDate > eventStartDate
                      ? "Multi-day activation"
                      : "Optional for multi-day events (min: start date)"}
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Person in Charge (PIC)
                  </label>
                  <select
                    value={picMemberId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPicMemberId(val);
                      if (val !== "custom") {
                        const m = members.find((mem) => mem.id === val);
                        if (m) setEventPicName(m.name);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden cursor-pointer"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                    <option value="custom">Custom PIC Name...</option>
                  </select>

                  {picMemberId === "custom" && (
                    <input
                      type="text"
                      placeholder="Enter PIC name..."
                      value={eventPicName}
                      onChange={(e) => setEventPicName(e.target.value)}
                      className="mt-1.5 w-full px-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 outline-hidden"
                    />
                  )}
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    PIC will receive this task on Kanban Board & &quot;My Tasks&quot;.
                  </span>
                </div>
              </div>

              {/* Status, Budget, Attendees */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={eventStatus}
                    onChange={(e) => setEventStatus(e.target.value as EventStatus)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden"
                  >
                    {[
                      { value: "UPCOMING", label: "Upcoming" },
                      { value: "ON_PROGRESS", label: "On Progress" },
                      { value: "COMPLETED", label: "Completed" },
                      { value: "CANCELLED", label: "Cancelled" },
                    ].map((opt) => {
                      const isAllowed =
                        !event?.id ||
                        canTransitionEvent(event.status, opt.value as EventStatus);
                      return (
                        <option
                          key={opt.value}
                          value={opt.value}
                          disabled={!isAllowed}
                        >
                          {opt.label}
                          {!isAllowed ? " (Not allowed)" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Budget (IDR)
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
                    Target Attendees
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
                    Actual Attendees
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
                    <div className="sm:col-span-2 md:col-span-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs">
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
                              : "Isi Target Attendees & Budget untuk melihat proyeksi"}
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

              {/* Notes & Permits */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Logistics, Permits & Operational Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Mall management permit approved. Need 3 wireless mics, stage backdrop 6x3m, electricity 5500W..."
                  value={eventNotes}
                  onChange={(e) => setEventNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden resize-y"
                />
              </div>

              {/* Media & Documentation Attachments */}
              <EventMediaSection
                mediaAttachments={mediaAttachments}
                setMediaAttachments={setMediaAttachments}
                onOpenPreview={
                  onOpenFootageModal
                    ? (idx) => {
                        onOpenFootageModal(
                          {
                            id: event?.id || "temp",
                            name: eventName || "Preview",
                            eventType,
                            status: eventStatus,
                            budget: Math.max(0, parseInt(eventBudget, 10) || 0),
                            targetAttendee: 0,
                            attendeeCount: 0,
                            mediaAttachments,
                          },
                          idx
                        );
                      }
                    : undefined
                }
              />

              {/* Borrowed Equipment (Edit Mode) */}
              {event?.id && (
                <EventBorrowedEquipmentSection eventId={event.id} />
              )}

              {/* Event Preparation Checklist (Subtasks) */}
              <EventChecklistSection
                eventType={eventType}
                eventSubtasks={eventSubtasks}
                setEventSubtasks={setEventSubtasks}
              />

              </div>

              {/* Action Buttons (Sticky / Pinned Footer) */}
              <div className="shrink-0 px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-2 z-10">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? "Saving..." : event ? "Update Event" : "Create Field Event"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </AnimatePresence>
    </>
  );
}
