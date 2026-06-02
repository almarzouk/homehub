import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "./db";
import User from "@/models/User";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      // Base logic from authConfig
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.householdId = (user as { householdId?: string }).householdId;
      }
      // Refresh householdId from DB if missing in stale JWT
      if (token.id && !token.householdId && trigger !== "signIn") {
        try {
          await connectDB();
          const dbUser = await User.findById(token.id).lean() as { householdId?: unknown } | null;
          if (dbUser?.householdId) {
            token.householdId = String(dbUser.householdId);
          }
        } catch { /* ignore */ }
      }
      return token;
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          await connectDB();

          const user = await User.findOne({
            email: (credentials.email as string).toLowerCase(),
          });

          if (!user) return null;

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isValid) return null;

          // Block blocked users from logging in
          if (user.isBlocked) return null;

          // Block unapproved users (isApproved === false; undefined = legacy approved)
          if (user.isApproved === false) return null;

          return {
            id: String(user._id),
            name: user.name,
            email: user.email,
            role: user.role,
            householdId: user.householdId ? String(user.householdId) : undefined,
          };
        } catch (error) {
          console.error("[Auth] authorize error:", error);
          return null;
        }
      },
    }),
  ],
});
