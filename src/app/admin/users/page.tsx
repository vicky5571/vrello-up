import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { UsersView } from "@/components/views/UsersView/UsersView";

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  const [pending, active, rejected] = await Promise.all([
    prisma.user.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { status: "APPROVED" } }),
    prisma.user.count({ where: { status: "REJECTED" } }),
  ]);

  return (
    <UsersView
      initialCounts={{ pending, active, rejected }}
      currentUserId={session.user.id}
    />
  );
}

