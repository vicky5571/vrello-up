import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default async function RegisterPage() {
  const session = await auth();

  // Middleware blocks PENDING/REJECTED sessions, so sending them to "/" would
  // bounce them back. They are routed to /login where the status banner shows.
  if (session?.user) {
    redirect(session.user.status === "APPROVED" ? "/" : "/login");
  }

  return <RegisterForm />;
}

