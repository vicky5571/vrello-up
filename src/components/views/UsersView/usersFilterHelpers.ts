import type { AppUser } from "@/types";

/**
 * Filters a list of AppUsers by search query matching name, email, or role.
 */
export function filterUsers(users: AppUser[], query: string): AppUser[] {
  const q = query.trim().toLowerCase();
  if (!q) return users;

  return users.filter((u) => {
    const nameMatch = u.name?.toLowerCase().includes(q) ?? false;
    const emailMatch = u.email?.toLowerCase().includes(q) ?? false;
    const roleMatch = u.role?.toLowerCase().includes(q) ?? false;
    return nameMatch || emailMatch || roleMatch;
  });
}
