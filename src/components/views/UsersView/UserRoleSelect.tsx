import type { UserRole } from "@/types";

interface UserRoleSelectProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
  disabled?: boolean;
}

export function UserRoleSelect({ value, onChange, disabled }: UserRoleSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as UserRole)}
      disabled={disabled}
      className="text-xs font-medium rounded-lg border border-border bg-background px-2.5 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 cursor-pointer"
    >
      <option value="admin">Admin</option>
      <option value="staff">Staff</option>
      <option value="viewer">Viewer</option>
    </select>
  );
}

