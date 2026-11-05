"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Flag,
  X,
  MapPin,
  Store,
  Coins,
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
import { EventMediaSection } from "./EventMediaSection";
import { formatOutletSelectLabel } from "@/lib/marcom/outletRelations";
import { CustomDropdown } from "@/components/ui/CustomDropdown";

export interface EventCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
  branches: { id: string; name: string }[];
  members: User[];
  onCreated: (createdEvent: FieldEventItem) => void;
}

export function EventCreateModal({
  isOpen,
  onClose,
  defaultDate,
  branches,
  members,
  onCreated,
}: EventCreateModalProps) {
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
  const [eventBudget, setEventBudget] = useState<string>("15000000");
  const [eventTargetAttendee, setEventTargetAttendee] = useState<string>("250");
  const [eventAttendeeCount, setEventAttendeeCount] = useState<string>("0");
  const [eventNotes, setEventNotes] = useState("");
  const [eventOutletId, setEventOutletId] = useState<string>("");
  const [mediaAttachments, setMediaAttachments] = useState<TaskAttachment[]>([]);
  const [mediaUrl, setMediaUrl] = useState<string>("");
  const [outlets, setOutlets] = useState<
    Array<{ id: string; name: string; code: string; branchId?: string; city?: string }>
  >([]);

  // Subtasks checklist initialized with default template
  const [eventSubtasks, setEventSubtasks] = useState<
    { id: string; title: string; completed?: boolean }[]
  >([]);

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

  // Load outlets when modal opens
  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen]);

  const filteredOutlets = useMemo(() => {
    if (!eventBranchName) return outlets;
    const selectedBranchObj = branches.find(
      (b) => b.name.toLowerCase() === eventBranchName.toLowerCase()
    );
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

  // Reset form state on open
  useEffect(() => {
    if (!isOpen) return;
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
    setEventSubtasks(
      getEventChecklistTemplate("Roadshow").map((t, i) => ({
        id: `sub-init-${i}`,
        title: t,
        completed: false,
      }))
    );
    setMediaAttachments([]);
    setMediaUrl("");
  }, [isOpen, defaultDate, branches, members]);

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
  const handleCreateEvent = async (e: React.FormEvent) => {
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
      const resolvedMediaUrl = mediaUrl.trim() || mediaAttachments[0]?.url || "";

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
        checklist: eventSubtasks,
        mediaAttachments,
        mediaUrl: resolvedMediaUrl,
      };

      const res = await fetch("/api/marcom/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create event");
      const created = await res.json();

      const picMember =
        members.find((m) => m.id === picMemberId) ||
        findMemberForPic(members, eventPicName);

      const createdItem: FieldEventItem = {
        id: created.id,
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
        mediaUrl: created.mediaUrl || resolvedMediaUrl,
        outletId: eventOutletId || null,
        checklist: eventSubtasks,
      };

      onCreated(createdItem);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create field event");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        >
          {/* Modal Header */}
          <div className="shrink-0 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 z-10">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <Flag className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Create New Field Event
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
          <form onSubmit={handleCreateEvent} className="flex flex-col flex-1 min-h-0 overflow-hidden">
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
                  <CustomDropdown
                    value={eventType}
                    onChange={(newType) => {
                      setEventType(newType);
                      setEventSubtasks(
                        getEventChecklistTemplate(newType).map((t, i) => ({
                          id: `sub-init-${i}`,
                          title: t,
                          completed: false,
                        }))
                      );
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
              </div>

              {/* Branch & Venue Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Organizing Branch
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
                      className="text-[10px] text-rose-500 hover:underline font-normal cursor-pointer"
                    >
                      Clear link
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
                    { value: "", label: "-- None (Branch-Wide / Non-Store Event) --" },
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
                  placeholder="-- None (Branch-Wide / Non-Store Event) --"
                />
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
                      : "Optional for multi-day events"}
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
                  <CustomDropdown<EventStatus>
                    value={eventStatus}
                    onChange={(val) => setEventStatus(val)}
                    options={[
                      { value: "UPCOMING", label: "Upcoming" },
                      { value: "ON_PROGRESS", label: "On Progress" },
                      { value: "COMPLETED", label: "Completed" },
                      { value: "CANCELLED", label: "Cancelled" },
                    ]}
                    size="md"
                    className="w-full"
                    menuClassName="w-full min-w-full"
                  />
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

              {/* Event Media & Documentation Section */}
              <EventMediaSection
                mediaAttachments={mediaAttachments}
                setMediaAttachments={setMediaAttachments}
                mediaUrl={mediaUrl}
                setMediaUrl={setMediaUrl}
                eventName={eventName}
              />

              {/* Event Preparation Checklist (Subtasks) */}
              <EventChecklistSection
                eventType={eventType}
                eventSubtasks={eventSubtasks}
                setEventSubtasks={setEventSubtasks}
              />
            </div>

            {/* Action Buttons (Sticky Footer) */}
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
                {isSaving ? "Creating..." : "Create Field Event"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

