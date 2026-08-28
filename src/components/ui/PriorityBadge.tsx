import { Priority } from "@/types";
import { AlertCircle, ArrowUp, ArrowDown, Minus, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
  showLabel?: boolean;
}

export function PriorityBadge({
  priority,
  className,
  showLabel = true,
}: PriorityBadgeProps) {
  switch (priority) {
    case "urgent":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20",
            className,
          )}
        >
          <Flame className="w-3.5 h-3.5" />
          {showLabel && "Urgent"}
        </span>
      );
    case "high":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-orange-500/10 text-orange-500 border border-orange-500/20",
            className,
          )}
        >
          <ArrowUp className="w-3.5 h-3.5" />
          {showLabel && "High"}
        </span>
      );
    case "normal":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20",
            className,
          )}
        >
          <Minus className="w-3.5 h-3.5" />
          {showLabel && "Normal"}
        </span>
      );
    case "low":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20",
            className,
          )}
        >
          <ArrowDown className="w-3.5 h-3.5" />
          {showLabel && "Low"}
        </span>
      );
    default:
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-500/5 text-slate-400 border border-slate-500/10",
            className,
          )}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          {showLabel && "None"}
        </span>
      );
  }
}
