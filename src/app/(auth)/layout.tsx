import type { ReactNode } from "react";
import Link from "next/link";
import { CheckSquare } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-background px-4 py-12 sm:px-6 lg:px-8 selection:bg-primary/20">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
          <Link
            href="/login"
            className="flex items-center gap-2.5 font-bold text-2xl tracking-tight text-foreground transition-opacity hover:opacity-90"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-primary/80 flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/25">
              <CheckSquare className="h-5 w-5" />
            </div>
            <span>Vrello</span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}

