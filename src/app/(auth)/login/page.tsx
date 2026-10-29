import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/LoginForm";

interface LoginPageProps {
  searchParams: Promise<{
    pending?: string;
    rejected?: string;
    error?: string;
    code?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();

  // Only fully approved users are redirected. Middleware blocks PENDING and
  // REJECTED sessions, so redirecting them to "/" would loop back to /login.
  if (session?.user?.status === "APPROVED") {
    redirect("/");
  }

  const params = await searchParams;
  const isPending =
    params.pending === "1" || session?.user?.status === "PENDING";
  const isRejected =
    params.rejected === "1" || session?.user?.status === "REJECTED";
  const errorParam = params.error;
  const codeParam = params.code;

  return (
    <LoginForm
      pending={isPending}
      rejected={isRejected}
      error={errorParam}
      code={codeParam}
    />
  );
}
