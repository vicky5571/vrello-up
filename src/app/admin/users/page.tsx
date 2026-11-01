import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canAccessUserManagement } from "@/lib/marcom/guards";

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!canAccessUserManagement(session.user.role)) {
    redirect("/");
  }

  redirect("/?view=users");
}

