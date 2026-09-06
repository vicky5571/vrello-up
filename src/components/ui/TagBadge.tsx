import type { Tag } from "@/types";
import { cn } from "@/lib/utils";

interface TagBadgeProps {
  tag: Pick<Tag, "name" | "color">;
  className?: string;
}

export function TagBadge({ tag, className }: TagBadgeProps) {
  return (
    <span
      className={cn(
        "text-[10px] font-semibold px-2 py-0.5 rounded-md",
        className,
      )}
      style={{
        backgroundColor: `${tag.color}15`,
        color: tag.color,
        border: `1px solid ${tag.color}30`,
      }}
    >
      {tag.name}
    </span>
  );
}
