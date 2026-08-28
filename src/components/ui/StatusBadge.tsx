import { Status } from "@/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status?: Status;
  statusName?: string;
  color?: string;
  className?: string;
  size?: "sm" | "md";
}

export function StatusBadge({
  status,
  statusName,
  color,
  className,
  size = "md",
}: StatusBadgeProps) {
  const label = status?.name || statusName || "UNKNOWN";
  const statusColor = status?.color || color || "#64748B";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold rounded-md uppercase tracking-wider transition-all",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className,
      )}
      style={{
        backgroundColor: `${statusColor}15`,
        color: statusColor,
        border: `1px solid ${statusColor}35`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: statusColor }}
      />
      {label}
    </span>
  );
}
