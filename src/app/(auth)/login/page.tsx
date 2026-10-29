import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/LoginForm";

interface LoginPageProps {
  searchParams: Promise<{
    pending?: string;
    rejected?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();

  if (session?.user) {
    redirect("/");
  }

  const params = await searchParams;
  const isPending = params.pending === "1";
  const isRejected = params.rejected === "1";

  return <LoginForm pending={isPending} rejected={isRejected} />;
}

