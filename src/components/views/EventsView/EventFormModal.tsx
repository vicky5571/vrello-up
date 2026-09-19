"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Flag,
  Plus,
  X,
  MapPin,
  Folder,
  Film,
  Video,
  Play,
  Layers,
} from "lucide-react";
import type {
  FieldEventItem,
  EventStatus,
  EventFootage,
  Task,
  Subtask,
  Space,
  User,
} from "@/types";
import { formatIDR } from "@/lib/utils";
import {
  getWorkspaceSpacesAndLists,
  findSpaceByListId,
  getDefaultDestinationForChannel,
} from "@/lib/tasks/targetSpaceList";
import {
  getEventChecklistTemplate,
  findMemberForPic,
  buildEventDescription,
  mapEventStatusToTaskStatusId,
} from "@/lib/tasks/eventTaskSync";
import { useGoogleDrivePicker } from "@/lib/marcom/useGoogleDrivePicker";
import { GoogleDriveLinkModal } from "@/components/ui/GoogleDriveLinkModal";
import { EventChecklistSection } from "./EventChecklistSection";

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: FieldEventItem | null;
  defaultDate?: string;
  branches: { id: string; name: string }[];
  members: User[];
  rawSpaces: Space[];
  activeWorkspaceId: string;
  tasks: Task[];
  createTask: (payload: Omit<Task, "id" | "createdAt" | "updatedAt" | "listId"> & {
    listId?: string | null;
  }) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  onSaved: (savedEvent: FieldEventItem, locationLabel: string) => void;
  onOpenFootageModal?: (event: FieldEventItem, clipIdx?: number) => void;
}

export function EventFormModal({
  isOpen,
  onClose,
  event,
  defaultDate,
  branches,
  members,
  rawSpaces,
  activeWorkspaceId,
  tasks,
  createTask,
  updateTask,
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

  // Footage attachments
  const [eventFootageList, setEventFootageList] = useState<EventFootage[]>([]);
  const [newFootageTitle, setNewFootageTitle] = useState("");
  const [newFootageDuration, setNewFootageDuration] = useState("");
  const [newFootagePath, setNewFootagePath] = useState("");
  const [eventMediaUrl, setEventMediaUrl] = useState("");

  // Destination Space & List
  const flatSpaces = useMemo(() => getWorkspaceSpacesAndLists(rawSpaces), [rawSpaces]);
  const [targetSpaceId, setTargetSpaceId] = useState<string>("");
  const [targetListId, setTargetListId] = useState<string>("");
  const [createExecutionTask, setCreateExecutionTask] = useState(true);

  const selectedTargetSpace = useMemo(
    () => flatSpaces.find((s) => s.id === targetSpaceId) || flatSpaces[0],
    [flatSpaces, targetSpaceId]
  );
  const targetLists = useMemo(
    () => selectedTargetSpace?.lists || [],
    [selectedTargetSpace]
  );

  const handleTargetSpaceChange = (newSpaceId: string) => {
    setTargetSpaceId(newSpaceId);
    const dest = getDefaultDestinationForChannel(rawSpaces, "on_ground", newSpaceId);
    setTargetListId(dest.listId);
  };

  const handleStartDateChange = (val: string) => {
    setEventStartDate(val);
    if (eventEndDate && val && eventEndDate < val) {
      setEventEndDate(val);
    }
  };

  // Google Drive Picker
  const {
    openSelector: openDriveSelector,
    isModalOpen: isDriveModalOpen,
    closeModal: closeDriveModal,
    handleManualAttach,
  } = useGoogleDrivePicker();

  // Initialize or reset form state on open / event change
  useEffect(() => {
    if (!isOpen) return;

    if (event) {
      // Edit mode
      setEventName(event.name || "");
      setEventType(event.eventType || "Roadshow");
      setEventBranchName(event.branchName || branches[0]?.name || "Jakarta Central");
      setEventLocation(event.location || "");
      const dateVal = event.startDate || event.date;
      setEventStartDate(dateVal ? dateVal.slice(0, 10) : "");
      setEventEndDate(event.endDate ? event.endDate.slice(0, 10) : "");
      setEventStatus(event.status || "UPCOMING");
      setEventBudget(String(event.budget ?? 0));
      setEventTargetAttendee(String(event.targetAttendee ?? 100));
      setEventAttendeeCount(String(event.attendeeCount ?? 0));
      setEventNotes(event.notes || "");
      setEventMediaUrl(event.mediaUrl || "");
      setEventFootageList(event.footage || []);
      setNewFootageTitle("");
      setNewFootageDuration("");
      setNewFootagePath("");
      setCreateExecutionTask(true);

      const existingTask = tasks.find((t) => t.relatedMarcomId === event.id);
      if (existingTask) {
        const owningSpace = findSpaceByListId(rawSpaces, existingTask.listId);
        if (owningSpace) {
          setTargetSpaceId(owningSpace.id);
          setTargetListId(existingTask.listId);
        }
        const assignedUser = existingTask.assignees?.[0];
        if (assignedUser) {
          setPicMemberId(assignedUser.id);
          setEventPicName(assignedUser.name);
        } else {
          const matched = findMemberForPic(members, event.picName);
          setPicMemberId(matched?.id || "custom");
          setEventPicName(event.picName || "");
        }
        setEventSubtasks(
          Array.isArray(existingTask.subtasks) && existingTask.subtasks.length > 0
            ? existingTask.subtasks.map((s, i) => ({
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
        const dest = getDefaultDestinationForChannel(rawSpaces, "on_ground");
        setTargetSpaceId(dest.spaceId);
        setTargetListId(dest.listId);
        const matched = findMemberForPic(members, event.picName);
        setPicMemberId(matched?.id || members[0]?.id || "custom");
        setEventPicName(event.picName || members[0]?.name || "");
        setEventSubtasks(
          getEventChecklistTemplate(event.eventType || "Roadshow").map((t, i) => ({
            id: `sub-edit-${i}`,
            title: t,
            completed: false,
          }))
        );
      }
    } else {
      // Create mode
      setEventName("");
      setEventType("Roadshow");
      setEventBranchName(branches[0]?.name || "Jakarta Central");
      setEventLocation("");
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
      setEventMediaUrl("");
      setEventFootageList([]);
      setNewFootageTitle("");
      setNewFootageDuration("");
      setNewFootagePath("");
      setCreateExecutionTask(true);
      setEventSubtasks(
        getEventChecklistTemplate("Roadshow").map((t, i) => ({
          id: `sub-init-${i}`,
          title: t,
          completed: false,
        }))
      );

      const dest = getDefaultDestinationForChannel(rawSpaces, "on_ground");
      setTargetSpaceId(dest.spaceId);
      setTargetListId(dest.listId);
    }
  }, [isOpen, event, defaultDate, branches, members, rawSpaces, tasks]);

  // Keyboard escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Footage management
  const handleAddFootage = () => {
    if (!newFootageTitle.trim()) {
      toast.error("Footage clip title is required");
      return;
    }
    if (!newFootagePath.trim()) {
      toast.error("Video URL / Google Drive link is required");
      return;
    }
    const newFootage: EventFootage = {
      id: `vid-${Date.now()}`,
      eventId: event?.id || "",
      title: newFootageTitle.trim(),
      filePath: newFootagePath.trim(),
      duration: newFootageDuration.trim() || "01:30",
    };
    setEventFootageList((prev) => [...prev, newFootage]);
    setNewFootageTitle("");
    setNewFootageDuration("");
    setNewFootagePath("");
    toast.success("Footage clip added successfully");
  };

  const handleRemoveFootage = (id: string) => {
    setEventFootageList((prev) => prev.filter((f) => f.id !== id));
  };

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
        date: eventStartDate || undefined,
        endDate: eventEndDate || undefined,
        picName: eventPicName.trim(),
        status: eventStatus,
        budget: parsedBudget,
        targetAttendee: parsedTargetAttendee,
        attendeeCount: parsedAttendeeCount,
        notes: eventNotes.trim(),
        mediaUrl: eventMediaUrl.trim() || undefined,
        footage: eventFootageList,
        workspaceId: activeWorkspaceId,
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

      const targetSpace = rawSpaces.find((s) => s.id === targetSpaceId);
      const chosenListId = targetListId || targetSpace?.lists[0]?.id || "list-field-ops";
      const targetStatus = mapEventStatusToTaskStatusId(
        eventStatus,
        targetSpace?.statuses || []
      );

      const formattedSubtasks: Subtask[] = eventSubtasks.map((s, i) => ({
        id: s.id || `sub-${Date.now()}-${i}`,
        title: s.title,
        completed: Boolean(s.completed),
        createdAt: new Date().toISOString(),
      }));

      // Sync Execution Task in designated Space & List
      const existingTask = savedId
        ? tasks.find((t) => t.relatedMarcomId === savedId)
        : undefined;

      if (!existingTask && createExecutionTask && savedId) {
        createTask({
          listId: chosenListId,
          title: `[Field Event] ${eventName.trim()}`,
          description: buildEventDescription({
            location: eventLocation,
            branchName: eventBranchName,
            eventType,
            budget: parsedBudget,
            targetAttendee: parsedTargetAttendee,
            notes: eventNotes,
          }),
          statusId: targetStatus,
          priority: "high",
          assignees: picMember ? [picMember] : members[0] ? [members[0]] : [],
          dueDate: eventStartDate || undefined,
          orderIndex: 0,
          tags: [],
          subtasks: formattedSubtasks,
          relatedMarcomId: savedId,
        });
      } else if (existingTask) {
        const updates: Partial<Task> = {
          title: `[Field Event] ${eventName.trim()}`,
          description: buildEventDescription({
            location: eventLocation,
            branchName: eventBranchName,
            eventType,
            budget: parsedBudget,
            targetAttendee: parsedTargetAttendee,
            notes: eventNotes,
          }),
          statusId: targetStatus,
          dueDate: eventStartDate || undefined,
          assignees: picMember ? [picMember] : [],
          subtasks: formattedSubtasks,
        };
        if (targetListId && targetListId !== existingTask.listId) {
          updates.listId = targetListId;
        }
        updateTask(existingTask.id, updates);
      }

      const targetListName =
        targetSpace?.lists.find((l) => l.id === targetListId)?.name ||
        targetSpace?.folders
          .flatMap((f) => f.lists)
          .find((l) => l.id === targetListId)?.name ||
        "List";
      const locationLabel = `${targetSpace?.name || "Space"} › ${targetListName}`;

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
        mediaUrl: eventMediaUrl.trim() || null,
        footage: eventFootageList,
      };

      onSaved(savedItem, locationLabel);
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
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <Flag className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {event ? "Edit Field Event" : "Create New Field Event"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    On-ground brand activation, venue permits, budget & logistics
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEvent} className="space-y-4">
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
                    <option value="UPCOMING">Upcoming</option>
                    <option value="ON_PROGRESS">On Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
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

              {/* Storage Destination & Raw Documentation Folder */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
                    <Folder className="w-4 h-4 text-amber-500" />
                    <span>Field Documentation Archive (Storage Destination)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      openDriveSelector({
                        defaultKind: "all",
                        onSelect: (atts) => {
                          if (atts[0]) {
                            setEventMediaUrl(atts[0].url);
                            toast.success("Google Drive documentation folder selected");
                          }
                        },
                      })
                    }
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Select from Google Drive</span>
                  </button>
                </div>
                <input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/... or cloud storage URL for raw footage archive"
                  value={eventMediaUrl}
                  onChange={(e) => setEventMediaUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-hidden font-mono text-[11px]"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Folder link where the media team archives all event photos, raw footage, and coverage assets.
                </p>
              </div>

              {/* B-roll Video Footage Manager */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
                    <Film className="w-4 h-4 text-blue-500" />
                    <span>B-Roll Video Clips & Highlight Documentation</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {eventFootageList.length} clips attached
                  </span>
                </div>

                {eventFootageList.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {eventFootageList.map((f, idx) => (
                      <div
                        key={f.id || idx}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <Video className="w-4 h-4 text-blue-500 shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {f.title}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                ({f.duration || "01:30"})
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 truncate block font-mono">
                              {f.filePath}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {onOpenFootageModal && (
                            <button
                              type="button"
                              onClick={() => {
                                onOpenFootageModal(
                                  {
                                    id: event?.id || "temp",
                                    name: eventName || "Preview",
                                    eventType,
                                    status: eventStatus,
                                    budget: Math.max(0, parseInt(eventBudget, 10) || 0),
                                    targetAttendee: 0,
                                    attendeeCount: 0,
                                    footage: eventFootageList,
                                    mediaUrl: eventMediaUrl,
                                  },
                                  idx
                                );
                              }}
                              className="p-1 rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                              title="Play / Preview video"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Play</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveFootage(f.id)}
                            className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer transition-colors"
                            title="Remove clip"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add footage input form */}
                <div className="p-3 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white/60 dark:bg-slate-800/40 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    <span>Add New Clip:</span>
                    <button
                      type="button"
                      onClick={() =>
                        openDriveSelector({
                          defaultKind: "video",
                          onSelect: (atts) => {
                            if (atts[0]) {
                              setNewFootagePath(atts[0].url);
                              if (!newFootageTitle.trim()) {
                                setNewFootageTitle(atts[0].name.replace(/\.[^/.]+$/, ""));
                              }
                              toast.success("Google Drive video selected");
                            }
                          },
                        })
                      }
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Select from Google Drive</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Clip Title (e.g. Crowd Highlights)"
                      value={newFootageTitle}
                      onChange={(e) => setNewFootageTitle(e.target.value)}
                      className="sm:col-span-2 px-2.5 py-1.5 rounded-md text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                    <input
                      type="text"
                      placeholder="Duration (e.g. 02:15)"
                      value={newFootageDuration}
                      onChange={(e) => setNewFootageDuration(e.target.value)}
                      className="px-2.5 py-1.5 rounded-md text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="Video URL (Google Drive / Direct MP4 / WebM / Cloud URL)"
                      value={newFootagePath}
                      onChange={(e) => setNewFootagePath(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-md text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={handleAddFootage}
                      className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Clip
                    </button>
                  </div>
                </div>
              </div>

              {/* Event Preparation Checklist (Subtasks) */}
              <EventChecklistSection
                eventType={eventType}
                eventSubtasks={eventSubtasks}
                setEventSubtasks={setEventSubtasks}
              />

              {/* Target Space & List Destination */}
              <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Target Space & List (Task Storage Destination)
                    </span>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={createExecutionTask}
                      onChange={(e) => setCreateExecutionTask(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Sync to Kanban Board
                  </label>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Select the Workspace Space and List where this event task will be created and tracked alongside its checklist.
                </p>

                {createExecutionTask && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                          Select Space
                        </label>
                        <select
                          value={targetSpaceId}
                          onChange={(e) => handleTargetSpaceChange(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 outline-hidden font-medium cursor-pointer"
                        >
                          {flatSpaces.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                          Select List
                        </label>
                        <select
                          value={targetListId}
                          onChange={(e) => setTargetListId(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 outline-hidden font-medium cursor-pointer"
                        >
                          {targetLists.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Live destination preview pill */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 pt-1">
                      <span className="text-slate-400">Destination:</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-blue-200/50 dark:border-blue-900/40">
                        <Layers className="w-3 h-3" />
                        {selectedTargetSpace?.name || "Space"} › {targetLists.find((l) => l.id === targetListId)?.name || "List"}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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

      {/* Google Drive Link Modal */}
      <GoogleDriveLinkModal
        isOpen={isDriveModalOpen}
        onClose={closeDriveModal}
        onAttach={handleManualAttach}
        defaultKind="video"
      />
    </>
  );
}
