import type { UserRole } from "@/types";
import { CustomDropdown } from "@/components/ui/CustomDropdown";

interface UserRoleSelectProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
  disabled?: boolean;
}

export function UserRoleSelect({ value, onChange, disabled }: UserRoleSelectProps) {
  return (
    <CustomDropdown<UserRole>
      value={value}
      onChange={onChange}
      disabled={disabled}
      options={[
        { value: "admin", label: "Admin" },
        { value: "supervisor", label: "Supervisor" },
        { value: "staff", label: "Staff" },
        { value: "viewer", label: "Viewer" },
      ]}
      ariaLabel="Change user role"
      className="w-28 text-xs font-medium"
      size="sm"
    />
  );
}
