import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  redirect("/?view=users");
}

