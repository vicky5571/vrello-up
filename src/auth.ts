import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  verifyPassword,
  normalizeRole,
  normalizeStatus,
} from "@/lib/server/auth-helpers";
import type { UserRole, UserStatus } from "@/types";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const schema = z.object({
          email: z.string().email(),
          password: z.string().min(1),
        });

        const parsed = schema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || !user.password) {
          return null;
        }

        if (user.status === "PENDING") {
          throw new Error("PENDING");
        }

        if (user.status === "REJECTED") {
          throw new Error("REJECTED");
        }

        const isValid = await verifyPassword(parsed.data.password, user.password);
        if (!isValid) {
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatar,
          role: normalizeRole(user.role),
          status: normalizeStatus(user.status),
        };
      },
    }),
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
    process.env.AUTH_SECRET ||
    "vrello-auth-development-secret-32-chars-long",
  trustHost: true,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;

        const existing = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!existing) {
          await prisma.user.create({
            data: {
              name: user.name || user.email.split("@")[0],
              email: user.email,
              googleId: account.providerAccountId || user.id,
              avatar: user.image ?? "",
              role: "STAFF",
              status: "PENDING",
            },
          });
          return "/login?pending=1";
        }

        if (existing.status === "PENDING") {
          return "/login?pending=1";
        }

        if (existing.status === "REJECTED") {
          return "/login?rejected=1";
        }

        await prisma.user.update({
          where: { id: existing.id },
          data: { lastLoginAt: new Date() },
        });
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        const u = user as {
          id?: string;
          role?: UserRole;
          status?: UserStatus;
          email?: string | null;
        };
        if (u.role && u.status) {
          token.id = u.id ?? "";
          token.role = u.role;
          token.status = u.status;
        } else if (u.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: u.email },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = normalizeRole(dbUser.role);
            token.status = normalizeStatus(dbUser.status);
          }
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token.id) session.user.id = token.id as string;
        if (token.role) session.user.role = token.role as UserRole;
        if (token.status) session.user.status = token.status as UserStatus;
      }
      return session;
    },
  },
});
