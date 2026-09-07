"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Flag, Plus, Edit2, CheckSquare, RefreshCw } from "lucide-react";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";
import { useMarcomPermissions } from "@/lib/marcom/permissions";
import { formatIDR } from "@/lib/utils";
import {
  MarcomTableShell,
  createMarcomColumnHelper,
} from "@/components/views/shared/MarcomTableShell";

export type EventStatus = "UPCOMING" | "ON_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface EventFootage {
  id: string;
  eventId: string;
  title: string;
  filePath: string;
  duration: string;
}

export interface MarcomEvent {
  id: string;
  name: string;
  date: string | null;
  endDate: string | null;
  location: string;
  branchName: string;
  picName: string;
  eventType: string;
  status: EventStatus;
  budget: number;
  attendeeCount: number;
  targetAttendee: number;
  notes: string;
  footage: EventFootage[];
}

const columnHelper = createMarcomColumnHelper<MarcomEvent>();

const STATUS_STYLES: Record<EventStatus, string> = {
  UPCOMING: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  ON_PROGRESS: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  COMPLETED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  CANCELLED: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

function isVideo(path: string) {
  return path.toLowerCase().endsWith(".mp4");
}

interface BranchOption {
  id: string;
  name: string;
}

export function EventsView() {
  const { can } = useMarcomPermissions();
  const { tasks, createTask, setSelectedTaskId, workspaces, activeWorkspaceId } = useWorkspaceStore();

  const [events, setEvents] = useState<MarcomEvent[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalEvent, setModalEvent] = useState<Partial<MarcomEvent> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const canManage = can("CREATE_EVENT");

  const handleTrackAsTask = (event: MarcomEvent) => {
    const existing = tasks.find((t) => t.relatedMarcomId === event.id);
    if (existing) {
      setSelectedTaskId(existing.id);
      toast.info("Opened existing event execution task");
      return;
    }
    const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
    const members = currentWorkspace?.members || [];
    const firstFootage = event.footage?.[0]?.filePath;
    const statusId = event.status === "COMPLETED" ? "status-done" : "status-in-progress";
    const task = createTask({
      listId: "list-field-ops",
      title: `[Event] ${event.name} (${event.branchName})`,
      description: `<p><strong>Location:</strong> ${event.location || "TBD"}</p><p><strong>Target Attendees:</strong> ${event.targetAttendee}</p><p><strong>Budget:</strong> ${formatIDR(event.budget)}</p><p>${event.notes || ""}</p>`,
      statusId,
      priority: event.status === "UPCOMING" ? "high" : "normal",
      assignees: members[0] ? [members[0]] : [],
      dueDate: event.date ? event.date.slice(0, 10) : undefined,
      startDate: event.date ? event.date.slice(0, 10) : undefined,
      relatedMarcomId: event.id,
      mediaUrl: firstFootage || undefined,
      tags: [],
      subtasks: [
        { id: `st-ev-${Date.now()}-1`, title: `Venue booking & local permits (${event.location || "Venue"})`, completed: false, createdAt: new Date().toISOString() },
        { id: `st-ev-${Date.now()}-2`, title: "Stage, sound, & branding production setup", completed: false, createdAt: new Date().toISOString() },
        { id: `st-ev-${Date.now()}-3`, title: "Capture 4K video footage & b-roll clips", completed: Boolean(event.footage?.length), createdAt: new Date().toISOString() },
        { id: `st-ev-${Date.now()}-4`, title: "Compile attendee counts & post event summary", completed: false, createdAt: new Date().toISOString() },
      ],
      orderIndex: Math.max(-1, ...tasks.filter((t) => t.statusId === statusId).map((t) => t.orderIndex)) + 1,
    });
    toast.success("Event execution task created in Field Operations!");
    setSelectedTaskId(task.id);
  };

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [resEvents, resBranches] = await Promise.all([fetch("/api/marcom/events"), fetch("/api/marcom/branches")]);
      if (!resEvents.ok) throw new Error(`Request failed (${resEvents.status})`);
      const jsonEvents = await resEvents.json();
      setEvents(Array.isArray(jsonEvents.data) ? jsonEvents.data : []);
      if (resBranches.ok) {
        const jsonBranches = await resBranches.json();
        setBranches(Array.isArray(jsonBranches.data) ? jsonBranches.data : []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load events");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEvent) return;
    const { id, name, eventType, branchName, date, endDate, location, picName, budget, attendeeCount, targetAttendee, status, notes } = modalEvent;
    if (!name?.trim() || !eventType?.trim()) {
      toast.error("Event Name and Type are required");
      return;
    }
    setIsSaving(true);
    try {
      const isEditing = Boolean(id);
      const url = isEditing ? `/api/marcom/events/${id}` : "/api/marcom/events";
      const method = isEditing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name!.trim(),
          eventType: eventType!.trim(),
          branchName: branchName?.trim() || undefined,
          date: date?.trim() || undefined,
          endDate: endDate?.trim() || undefined,
          location: location?.trim() || undefined,
          picName: picName?.trim() || undefined,
          budget: Number(budget) || 0,
          attendeeCount: Number(attendeeCount) || 0,
          targetAttendee: Number(targetAttendee) || 0,
          status: status || "UPCOMING",
          notes: notes?.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed with status ${res.status}`);
      }
      toast.success(isEditing ? "Event updated successfully" : "Event created successfully");
      setModalEvent(null);
      await fetchEvents();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setIsSaving(false);
    }
  };

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.display({
          id: "select",
          header: ({ table }) => (
            <div className="flex items-center justify-center">
              <input type="checkbox" aria-label="Select all events" checked={table.getIsAllRowsSelected()} ref={(el) => { if (el) el.indeterminate = table.getIsSomeRowsSelected(); }} onChange={table.getToggleAllRowsSelectedHandler()} className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600" />
            </div>
          ),
          cell: ({ row }) => (
            <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" aria-label={`Select event ${row.original.name}`} checked={row.getIsSelected()} disabled={!row.getCanSelect()} onChange={row.getToggleSelectedHandler()} className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600" />
            </div>
          ),
          size: 36, minSize: 36, maxSize: 36, enableSorting: false,
        }),
        columnHelper.display({
          id: "name",
          header: "Event",
          size: 220, minSize: 140,
          cell: ({ row }) => <span className="truncate font-semibold text-slate-900 dark:text-slate-100">{row.original.name}</span>,
        }),
        columnHelper.accessor("eventType", { id: "type", header: "Type", size: 160, minSize: 120 }),
        columnHelper.accessor("location", { id: "location", header: "Location", size: 180, minSize: 120 }),
        columnHelper.accessor("status", {
          id: "status",
          header: "Status",
          size: 130, minSize: 110,
          cell: ({ row }) => <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${STATUS_STYLES[row.original.status] ?? STATUS_STYLES.UPCOMING}`}>{row.original.status.replaceAll("_", " ")}</span>,
        }),
        columnHelper.display({
          id: "footage",
          header: "Footage",
          size: 90, minSize: 70, enableSorting: false,
          cell: ({ row }) => <span className="text-slate-500 dark:text-slate-400">{row.original.footage?.length ?? 0}</span>,
        }),
        columnHelper.display({
          id: "expander",
          header: () => null,
          size: 40, minSize: 40, maxSize: 40, enableSorting: false,
          cell: () => <div className="flex justify-end"><span className="w-4 h-4 text-slate-400 flex items-center justify-center">›</span></div>,
        }),
      ]),
    [],
  );

  const deleteOne = useCallback(async (id: string) => {
    const res = await fetch(`/api/marcom/events/${id}`, { method: "DELETE" });
    return res.ok;
  }, []);

  return (
    <>
      <MarcomTableShell
        data={events}
        columns={columns}
        getRowId={(row) => row.id}
        initialSorting={[{ id: "name", desc: false }]}
        title="Events"
        titleIcon={Flag}
        entityName="event"
        entityPlural="events"
        isLoading={isLoading}
        error={error}
        onRefresh={fetchEvents}
        canDelete={canManage}
        deleteRequiresMessage="Delete requires admin or staff role"
        onDeleteOne={deleteOne}
        canAdd={canManage}
        onAdd={() => setModalEvent({ name: "", eventType: "Launch", branchName: branches[0]?.name || "", status: "UPCOMING", budget: 0, targetAttendee: 100, attendeeCount: 0 })}
        addLabel="Add Event"
        addIcon={Plus}
        addClassName="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-xs cursor-pointer"
        renderExpanded={(event) => (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">Date</div>
                <div className="text-slate-700 dark:text-slate-300">{event.date ? new Date(event.date).toLocaleDateString() : "—"} {" → "} {event.endDate ? new Date(event.endDate).toLocaleDateString() : "—"}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">PIC</div>
                <div className="text-slate-700 dark:text-slate-300">{event.picName || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">Attendees</div>
                <div className="text-slate-700 dark:text-slate-300">{event.attendeeCount}/{event.targetAttendee}</div>
              </div>
              <div className="sm:col-span-3">
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">Notes</div>
                <div className="text-slate-700 dark:text-slate-300">{event.notes || "—"}</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Track event permits, logistics, setup, and social coverage:</span>
              <div className="flex items-center gap-2">
                {canManage && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); setModalEvent(event); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs cursor-pointer">
                    <Edit2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>Edit Event</span>
                  </button>
                )}
                <button type="button" onClick={(e) => { e.stopPropagation(); handleTrackAsTask(event); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-2xs cursor-pointer">
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Track as Task Progress</span>
                </button>
              </div>
            </div>
            {event.footage && event.footage.length > 0 && (
              <div className="mt-3">
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">Footage ({event.footage.length})</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {event.footage.map((clip) => (
                    <div key={clip.id} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2">
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5 truncate">{clip.title}</div>
                      {isVideo(clip.filePath) ? <video controls preload="metadata" src={clip.filePath} className="w-full rounded-md bg-black" /> : <a href={clip.filePath} target="_blank" rel="noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all">{clip.filePath}</a>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        emptyLabel="No events found."
      />

      {modalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#18191B] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/80 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Flag className="w-4 h-4 text-teal-600" />
                <span>{modalEvent.id ? "Edit Event" : "Create New Event"}</span>
              </h3>
              <button type="button" onClick={() => setModalEvent(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg">✕</button>
            </div>
            <form onSubmit={handleSaveEvent} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Event Name *</label>
                <input type="text" required placeholder="e.g., Grand Opening & Product Showcase" value={modalEvent.name || ""} onChange={(e) => setModalEvent({ ...modalEvent, name: e.target.value })} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Event Type *</label>
                  <input type="text" required placeholder="Launch, Workshop, Exhibition..." value={modalEvent.eventType || "Launch"} onChange={(e) => setModalEvent({ ...modalEvent, eventType: e.target.value })} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Branch</label>
                  <select value={modalEvent.branchName || branches[0]?.name || ""} onChange={(e) => setModalEvent({ ...modalEvent, branchName: e.target.value })} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
                    <option value="">No branch</option>
                    {branches.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Start Date</label>
                  <input type="date" value={modalEvent.date ? modalEvent.date.slice(0, 10) : ""} onChange={(e) => setModalEvent({ ...modalEvent, date: e.target.value })} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">End Date</label>
                  <input type="date" value={modalEvent.endDate ? modalEvent.endDate.slice(0, 10) : ""} onChange={(e) => setModalEvent({ ...modalEvent, endDate: e.target.value })} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Location</label>
                  <input type="text" placeholder="e.g., Main Atrium or Branch Plaza" value={modalEvent.location || ""} onChange={(e) => setModalEvent({ ...modalEvent, location: e.target.value })} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">PIC / Contact Person</label>
                  <input type="text" placeholder="e.g., Sarah Jenkins" value={modalEvent.picName || ""} onChange={(e) => setModalEvent({ ...modalEvent, picName: e.target.value })} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Status</label>
                  <select value={modalEvent.status || "UPCOMING"} onChange={(e) => setModalEvent({ ...modalEvent, status: e.target.value as EventStatus })} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="ON_PROGRESS">ON_PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Attendees</label>
                  <input type="number" min="0" value={modalEvent.targetAttendee ?? 100} onChange={(e) => setModalEvent({ ...modalEvent, targetAttendee: e.target.value ? Number(e.target.value) : 0 })} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Actual Attendees</label>
                  <input type="number" min="0" value={modalEvent.attendeeCount ?? 0} onChange={(e) => setModalEvent({ ...modalEvent, attendeeCount: e.target.value ? Number(e.target.value) : 0 })} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Budget (IDR)</label>
                <input type="number" min="0" value={modalEvent.budget ?? 0} onChange={(e) => setModalEvent({ ...modalEvent, budget: e.target.value ? Number(e.target.value) : 0 })} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Notes</label>
                <textarea rows={2} placeholder="Special instructions, vendor info, permit notes..." value={modalEvent.notes || ""} onChange={(e) => setModalEvent({ ...modalEvent, notes: e.target.value })} className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setModalEvent(null)} disabled={isSaving} className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-4 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5">
                  {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{modalEvent.id ? "Save Changes" : "Create Event"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
