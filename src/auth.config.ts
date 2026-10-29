import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

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
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
