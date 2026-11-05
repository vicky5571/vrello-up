import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default async function RegisterPage() {
  const session = await auth();

  // Middleware blocks PENDING/REJECTED sessions, so sending them to "/" would
  // bounce them back. They are routed to /login where the status banner shows.
  if (session?.user) {
    redirect(session.user.status === "APPROVED" ? "/" : "/login");
  }

  const branches = await prisma.branch.findMany({
    select: { id: true, name: true, city: true },
    orderBy: { name: "asc" },
  });

  return <RegisterForm branches={branches} />;
}
