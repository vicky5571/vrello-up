import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  verifyPassword,
  normalizeRole,
  normalizeStatus,
  normalizeEmail,
  resolveJwtClaims,
  handleGoogleSignInLogic,
  PendingAccountError,
  RejectedAccountError,
} from "@/lib/server/auth-helpers";
import authConfig from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
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

        let user;
        try {
          user = await prisma.user.findUnique({
            where: { email: normalizeEmail(parsed.data.email) },
          });
        } catch (dbError) {
          console.error("[auth] Database query failed during credentials authorize:", dbError);
          throw dbError;
        }

        if (!user || !user.password) {
          return null;
        }

        if (user.status === "PENDING") {
          throw new PendingAccountError();
        }

        if (user.status === "REJECTED") {
          throw new RejectedAccountError();
        }

        const isValid = await verifyPassword(parsed.data.password, user.password);
        if (!isValid) {
          return null;
        }

        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });
        } catch (updateError) {
          console.warn("[auth] Failed to update lastLoginAt:", updateError);
        }

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
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          return await handleGoogleSignInLogic({
            user,
            account,
            seedAdminEmail: process.env.SEED_ADMIN_EMAIL,
            findUserByEmail: (email) =>
              prisma.user.findUnique({
                where: { email },
                select: {
                  id: true,
                  status: true,
                  role: true,
                  googleId: true,
                  avatar: true,
                },
              }),
            createUser: (data) => prisma.user.create({ data }),
            updateUser: (id, data) => prisma.user.update({ where: { id }, data }),
          });
        } catch (err) {
          console.error("[auth] Google signIn error:", err);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        const claims = await resolveJwtClaims({
          user,
          findUserByEmail: (email) =>
            prisma.user.findUnique({
              where: { email },
              select: { id: true, role: true, status: true },
            }),
        });

        // Incomplete claims must never reach the session callback.
        // Returning null makes Auth.js clear the session cookie.
        if (!claims) return null;

        token.id = claims.id;
        token.role = claims.role;
        token.status = claims.status;
        return token;
      }

      // Session refresh: invalidate tokens issued before the claims existed.
      if (!token.id || !token.role || !token.status) return null;

      return token;
    },
  },
});
