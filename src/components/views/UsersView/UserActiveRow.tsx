"use client";

import { Loader2, UserX, Building2, UserCheck, RotateCcw } from "lucide-react";
import type { AppUser, UserRole } from "@/types";
import { UserStatusBadge } from "./UserStatusBadge";
import { UserRoleSelect } from "./UserRoleSelect";
import { AppImage } from "@/components/ui/AppImage";
import {
  formatUserBranchBadges,
  type BranchLookupItem,
} from "@/lib/marcom/branchAssignmentHelpers";

interface UserActiveRowProps {
  user: AppUser;
  currentUserId: string;
  isBusy: boolean;
  actorRole?: UserRole;
  branches: BranchLookupItem[];
  onRoleChange: (user: AppUser, newRole: UserRole) => void;
  onDeactivate: (user: AppUser) => void;
  onEditBranches: (user: AppUser) => void;
  onApprove?: (user: AppUser) => void;
  onReactivate?: (user: AppUser) => void;
}

export function UserActiveRow({
  user,
  currentUserId,
  isBusy,
  actorRole,
  branches,
  onRoleChange,
  onDeactivate,
  onEditBranches,
  onApprove,
  onReactivate,
}: UserActiveRowProps) {
  const isCurrentUser = user.id === currentUserId;
  const isTargetAdmin = user.role === "admin";
  const isSupervisorBlocked = actorRole === "supervisor" && isTargetAdmin;
  const isDeactivateForbidden = isCurrentUser || isSupervisorBlocked;
  const buttonTitle = isCurrentUser
    ? "Tidak dapat menonaktifkan akun sendiri"
    : isSupervisorBlocked
    ? "Supervisor tidak dapat menonaktifkan akun Admin"
    : "Nonaktifkan akun";

  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-xs overflow-hidden shrink-0">
            {user.avatar ? (
              <AppImage src={user.avatar} alt={user.name} fill sizes="32px" className="object-cover" />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{user.name}</span>
            {isCurrentUser && (
              <span className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                Anda
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="py-3.5 px-4 text-muted-foreground">{user.email}</td>
      <td className="py-3.5 px-4">
        <UserRoleSelect
          value={user.role}
          onChange={(newRole) => onRoleChange(user, newRole)}
          disabled={isBusy || (isCurrentUser && user.role === "admin")}
          actorRole={actorRole}
        />
      </td>
      <td className="py-3.5 px-4">
        {user.role === "admin" ? (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
            Nasional
          </span>
        ) : (
          <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
            {formatUserBranchBadges(user.role, user.assignedBranchIds, branches).map(
              (b, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20"
                >
                  {b}
                </span>
              )
            )}
            {!isBusy && !isSupervisorBlocked && (
              <button
                type="button"
                onClick={() => onEditBranches(user)}
                title="Ubah Penugasan Cabang"
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Building2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </td>
      <td className="py-3.5 px-4">
        <UserStatusBadge status={user.status} />
      </td>
      <td className="py-3.5 px-4 text-muted-foreground text-xs">
        {user.lastLoginAt
          ? new Date(user.lastLoginAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Belum pernah"}
      </td>
      <td className="py-3.5 px-4 text-right">
        {user.status === "PENDING" && onApprove ? (
          <button
            type="button"
            onClick={() => onApprove(user)}
            disabled={isBusy}
            title="Setujui dan beri akses akun"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isBusy ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <UserCheck className="w-3.5 h-3.5" />
            )}
            <span>Setujui</span>
          </button>
        ) : user.status === "REJECTED" && onReactivate ? (
          <button
            type="button"
            onClick={() => onReactivate(user)}
            disabled={isBusy || isSupervisorBlocked}
            title={
              isSupervisorBlocked
                ? "Supervisor tidak dapat mengaktifkan akun Admin"
                : "Aktifkan kembali akun"
            }
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isBusy ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5" />
            )}
            <span>Aktifkan</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onDeactivate(user)}
            disabled={isBusy || isDeactivateForbidden}
            title={buttonTitle}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isBusy ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <UserX className="w-3.5 h-3.5" />
            )}
            <span>Nonaktifkan</span>
          </button>
        )}
      </td>
    </tr>
  );
}

