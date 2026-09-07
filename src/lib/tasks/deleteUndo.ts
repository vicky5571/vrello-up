import { toast } from "sonner";
import { useWorkspaceStore } from "@/lib/store/useWorkspaceStore";

/**
 * Success toast for task deletes with an Undo action.
 * Deletes are soft: tasks sit in trash for 30 days, so Undo simply
 * restores them. When the toast has expired, Trash still has them.
 */
export function toastTaskDeleted(ids: string[]): void {
  if (ids.length === 0) return;
  const label =
    ids.length === 1 ? "Task deleted" : `${ids.length} tasks deleted`;
  toast.success(label, {
    duration: 6000,
    action: {
      label: "Undo",
      onClick: () => {
        const restored = useWorkspaceStore.getState().restoreTasks(ids);
        if (restored > 0) {
          toast.success(
            restored === 1 ? "Task restored" : `${restored} tasks restored`,
          );
        } else {
          toast.error("Undo expired — restore from Trash instead");
        }
      },
    },
  });
}
