import type { UserRole } from "@/types";
import { CustomDropdown } from "@/components/ui/CustomDropdown";

interface UserRoleSelectProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
  disabled?: boolean;
  actorRole?: UserRole;
}

const ALL_ROLE_OPTIONS = [
  { value: "admin" as const, label: "Admin" },
  { value: "supervisor" as const, label: "Supervisor" },
  { value: "staff" as const, label: "Staff" },
  { value: "viewer" as const, label: "Viewer" },
];

export function UserRoleSelect({
  value,
  onChange,
  disabled,
  actorRole,
}: UserRoleSelectProps) {
  const isSupervisorActor = actorRole === "supervisor";
  const isTargetAdmin = value === "admin";
  const isDisabled = disabled || (isSupervisorActor && isTargetAdmin);

  const options = isSupervisorActor
    ? ALL_ROLE_OPTIONS.filter((opt) => opt.value !== "admin")
    : ALL_ROLE_OPTIONS;

  return (
    <CustomDropdown<UserRole>
      value={value}
      onChange={onChange}
      disabled={isDisabled}
      options={options}
      ariaLabel="Change user role"
      className="w-28 text-xs font-medium"
      size="sm"
    />
  );
}
