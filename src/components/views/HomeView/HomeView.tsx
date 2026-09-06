"use client";

import { useMemo } from "react";
import { useWorkspaceStore, SEED_USERS } from "@/lib/store/useWorkspaceStore";
import {
  getAssignedTo,
  getBlockers,
  getDueToday,
  getSprintSummary,
} from "@/lib/ai/brain";
import { formatDate, isOverdue } from "@/lib/utils";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import type { Task } from "@/types";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  User,
} from "lucide-react";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function TaskRow({ task, onOpen }: { task: Task; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
    >
      <CircleDashed className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <span className="flex-1 min-w-0 truncate text-xs font-medium text-slate-800 dark:text-slate-200">
        {task.title}
      </span>
      {task.dueDate && (
        <span
          className={`text-[11px] shrink-0 font-medium ${
            isOverdue(task.dueDate)
              ? "text-red-500"
              : "text-slate-400"
          }`}
        >
          {formatDate(task.dueDate)}
        </span>
      )}
      <PriorityBadge priority={task.priority} showLabel={false} />
    </button>
  );
}

export function HomeView() {
  const {
    tasks,
    workspaces,
    activeWorkspaceId,
    activeSpaceId,
    currentUserId,
    setSelectedTaskId,
    setActiveView,
  } = useWorkspaceStore();

  const currentWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0];
  const currentSpace = currentWorkspace?.spaces.find(
    (s) => s.id === activeSpaceId,
  );
  const statuses = useMemo(
    () => currentSpace?.statuses ?? [],
    [currentSpace?.statuses],
  );
  const members = currentWorkspace?.members ?? SEED_USERS;
  const me = members.find((u) => u.id === currentUserId) ?? members[0];

  const assigned = useMemo(
    () => getAssignedTo(tasks, statuses, me?.id ?? ""),
    [tasks, statuses, me],
  );
  const dueToday = useMemo(() => getDueToday(tasks, statuses), [tasks, statuses]);
  const overdue = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.dueDate &&
          isOverdue(t.dueDate) &&
          !statuses.some(
            (s) =>
              s.id === t.statusId && (s.category === "done" || s.category === "closed"),
          ),
      ),
    [tasks, statuses],
  );
  const blockers = useMemo(() => getBlockers(tasks, statuses), [tasks, statuses]);
  const summary = useMemo(() => getSprintSummary(tasks, statuses), [tasks, statuses]);

  const donut = useMemo(() => {
    if (summary.total === 0) return null;
    let acc = 0;
    const segs = summary.byStatus
      .filter((b) => b.count > 0)
      .map((b) => {
        const status = statuses.find((s) => s.name === b.name);
        const from = (acc / summary.total) * 100;
        acc += b.count;
        const to = (acc / summary.total) * 100;
        return `${status?.color ?? "#94A3B8"} ${from}% ${to}%`;
      });
    return `conic-gradient(${segs.join(", ")})`;
  }, [summary, statuses]);

  const openTask = (id: string) => setSelectedTaskId(id);

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 h-full bg-[#FAFBFC] dark:bg-[#0F1115]">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Greeting */}
        <div className="flex items-center gap-3">
          {me && <UserAvatar user={me} size="lg" />}
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {greeting()}, {me?.name.split(" ")[0] ?? "there"}
            </h1>
            <p className="text-xs text-slate-500">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}{" "}
              • {summary.active} active of {summary.total} tasks
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Assigned to Me */}
          <section className="rounded-xl bg-white dark:bg-[#18191B] border border-slate-200/80 dark:border-white/10 shadow-xs p-4">
            <header className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Assigned to Me
              </h2>
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {assigned.length}
              </span>
            </header>
            {assigned.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Nothing assigned — enjoy the clear plate. 🎉
              </p>
            ) : (
              <div className="space-y-0.5">
                {assigned.slice(0, 6).map((t) => (
                  <TaskRow key={t.id} task={t} onOpen={() => openTask(t.id)} />
                ))}
                {assigned.length > 6 && (
                  <button
                    type="button"
                    onClick={() => setActiveView("list")}
                    className="w-full pt-1 text-[11px] font-semibold text-[#7B68EE] hover:underline cursor-pointer"
                  >
                    View all {assigned.length} in List →
                  </button>
                )}
              </div>
            )}
          </section>

          {/* Due Today / Overdue */}
          <section className="rounded-xl bg-white dark:bg-[#18191B] border border-slate-200/80 dark:border-white/10 shadow-xs p-4">
            <header className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <CalendarClock className="w-3.5 h-3.5" /> Due Today / Overdue
              </h2>
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {dueToday.length + overdue.length}
              </span>
            </header>
            {dueToday.length === 0 && overdue.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                <CheckCircle2 className="w-4 h-4 inline text-emerald-500" /> All
                clear — no deadlines today.
              </p>
            ) : (
              <div className="space-y-3">
                {overdue.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-red-500 flex items-center gap-1 mb-1">
                      <AlertTriangle className="w-3 h-3" /> Overdue ({overdue.length})
                    </div>
                    <div className="space-y-0.5">
                      {overdue.slice(0, 4).map((t) => (
                        <TaskRow key={t.id} task={t} onOpen={() => openTask(t.id)} />
                      ))}
                    </div>
                  </div>
                )}
                {dueToday.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-500 mb-1">
                      Due today ({dueToday.length})
                    </div>
                    <div className="space-y-0.5">
                      {dueToday.slice(0, 4).map((t) => (
                        <TaskRow key={t.id} task={t} onOpen={() => openTask(t.id)} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Sprint progress */}
          <section className="rounded-xl bg-white dark:bg-[#18191B] border border-slate-200/80 dark:border-white/10 shadow-xs p-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Sprint Progress
            </h2>
            {summary.total === 0 || !donut ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No tasks yet.
              </p>
            ) : (
              <div className="flex items-center gap-4">
                <div
                  className="relative w-28 h-28 rounded-full shrink-0"
                  style={{ background: donut }}
                  role="img"
                  aria-label={`${summary.pct}% complete`}
                >
                  <div className="absolute inset-3 rounded-full bg-white dark:bg-[#18191B] flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {summary.pct}%
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {summary.done}/{summary.total} done
                    </span>
                  </div>
                </div>
                <ul className="space-y-1.5 min-w-0">
                  {summary.byStatus.map((b) => {
                    const color =
                      statuses.find((s) => s.name === b.name)?.color ?? "#94A3B8";
                    return (
                      <li
                        key={b.name}
                        className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-sm shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="truncate">{b.name}</span>
                        <span className="ml-auto font-bold pl-2">{b.count}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {blockers.length > 0 && (
              <p className="mt-3 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                ⚠ {blockers.length} item{blockers.length > 1 ? "s" : ""} need
                attention — ask Brain² to “show blockers”.
              </p>
            )}
          </section>
        </div>

        {/* Shortcut back to workspace */}
        <button
          type="button"
          onClick={() => setActiveView("list")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          Open workspace <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
