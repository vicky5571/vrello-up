"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { AuthSync } from "@/components/auth/AuthSync";

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthSync />
      {children}
    </SessionProvider>
  );
}
