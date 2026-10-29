import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";
import type { UserRole, UserStatus } from "@/types";

export default {
  providers: [
    Credentials({ credentials: { email: {}, password: {} } }),
    Google({
      clientId:
        process.env.AUTH_GOOGLE_ID ||
        process.env.GOOGLE_CLIENT_ID ||
        "development-google-client-id",
      clientSecret:
        process.env.AUTH_GOOGLE_SECRET ||
        process.env.GOOGLE_CLIENT_SECRET ||
        "development-google-client-secret",
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret:
    process.env.AUTH_SECRET || "vrello-auth-development-secret-32-chars-long",
  trustHost: true,
  callbacks: {
    authorized({ auth }) {
      if (!auth?.user) return false;
      // The middleware runs on the Edge runtime and cannot query the database.
      // `status` is read from the JWT claims stamped at sign-in, so a user
      // demoted to PENDING/REJECTED is blocked on their next request.
      return auth.user.status === "APPROVED";
    },
    session({ session, token }) {
      // Required by the middleware: the default session only exposes
      // name/email/image, so `auth.user.status` would be undefined without
      // this mapping. No database access happens here.
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.status = token.status as UserStatus;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
