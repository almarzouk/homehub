import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "./db";
import User from "@/models/User";
import { authConfig } from "./auth.config";
import { CredentialsSignin } from "next-auth";

class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials";
}

class BlockedUserError extends CredentialsSignin {
  code = "blocked";
}

class PendingApprovalError extends CredentialsSignin {
  code = "not_approved";
}

class AuthServerError extends CredentialsSignin {
  code = "server_error";
}

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
        token.onboardingCompleted = (user as { onboardingCompleted?: boolean }).onboardingCompleted;
      }
      // Always refresh onboardingCompleted from DB (JWT can be stale after setup)
      if (token.id) {
        try {
          await connectDB();
          const dbUser = await User.findById(token.id).lean() as {
            householdId?: unknown;
            onboardingCompleted?: boolean;
          } | null;
          if (dbUser?.householdId) {
            token.householdId = String(dbUser.householdId);
          }
          if (dbUser && typeof dbUser.onboardingCompleted === "boolean") {
            token.onboardingCompleted = dbUser.onboardingCompleted;
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
        if (!credentials?.email || !credentials?.password) {
          throw new InvalidCredentialsError();
        }

        const email = (credentials.email as string).trim().toLowerCase();
        if (!email) throw new InvalidCredentialsError();

        try {
          await connectDB();

          const user = await User.findOne({ email });

          if (!user) throw new InvalidCredentialsError();

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isValid) throw new InvalidCredentialsError();

          if (user.isBlocked) throw new BlockedUserError();
          if (user.isApproved === false) throw new PendingApprovalError();

          return {
            id: String(user._id),
            name: user.name,
            email: user.email,
            role: user.role,
            householdId: user.householdId ? String(user.householdId) : undefined,
            onboardingCompleted: user.onboardingCompleted,
          };
        } catch (error) {
          if (error instanceof CredentialsSignin) throw error;
          console.error("[Auth] authorize error:", error);
          throw new AuthServerError();
        }
      },
    }),
  ],
});
