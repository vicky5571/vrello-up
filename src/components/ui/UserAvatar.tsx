import { User } from "@/types";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";

interface UserAvatarProps {
  user?: User;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  showTooltip?: boolean;
}

export function UserAvatar({
  user,
  size = "md",
  className,
  showTooltip = true,
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    xs: "w-5 h-5 text-[10px]",
    sm: "w-6 h-6 text-xs",
    md: "w-7 h-7 text-xs",
    lg: "w-9 h-9 text-sm",
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div
      title={showTooltip && user ? `${user.name} (${user.email})` : undefined}
      className={cn(
        "relative rounded-full overflow-hidden flex items-center justify-center font-medium bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30 shrink-0 select-none",
        sizeClasses[size],
        className,
      )}
    >
      {user?.avatar && !imgError ? (
        <Image
          src={user.avatar}
          alt={user.name || "User Avatar"}
          fill
          sizes="36px"
          className="object-cover"
          onError={() => setImgError(true)}
          unoptimized
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

export function AvatarGroup({
  users,
  max = 3,
  size = "sm",
}: {
  users: User[];
  max?: number;
  size?: "xs" | "sm" | "md";
}) {
  if (!users || users.length === 0) return null;

  const visibleUsers = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className="flex items-center -space-x-1.5 overflow-hidden">
      {visibleUsers.map((u) => (
        <UserAvatar
          key={u.id}
          user={u}
          size={size}
          className="ring-2 ring-background"
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            "rounded-full flex items-center justify-center font-semibold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ring-2 ring-background text-[10px] w-6 h-6 shrink-0",
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
