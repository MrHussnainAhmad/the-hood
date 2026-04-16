import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const TOKEN_USER_SYNC_INTERVAL_SECONDS = 90;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        remember: { label: "Remember", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            isBanned: true,
            providerEmployeeRange: true,
            companyVerificationStatus: true,
          },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        if (user.isBanned) {
          throw new Error("Your account is banned. Please contact support.");
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isCorrectPassword) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isBanned: user.isBanned,
          providerEmployeeRange: user.providerEmployeeRange,
          companyVerificationStatus: user.companyVerificationStatus,
          remember: credentials.remember === "true",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.isBanned = Boolean(user.isBanned);
        token.providerEmployeeRange = user.providerEmployeeRange;
        token.companyVerificationStatus = user.companyVerificationStatus;
        token.remember = Boolean(user.remember);
        const nowInSeconds = Math.floor(Date.now() / 1000);
        token.exp = nowInSeconds + (token.remember ? 30 * 24 * 60 * 60 : 24 * 60 * 60);
        token.userSyncAt = nowInSeconds;
      }
      
      // Handle session updates
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }
      
      const nowInSeconds = Math.floor(Date.now() / 1000);
      const shouldSyncUser =
        trigger === "update" ||
        !token.userSyncAt ||
        nowInSeconds - Number(token.userSyncAt) >= TOKEN_USER_SYNC_INTERVAL_SECONDS;

      if (token.id && shouldSyncUser) {
        let latestUser: {
          role: string;
          isBanned: boolean;
          providerEmployeeRange?: string | null;
          companyVerificationStatus?: string | null;
        } | null = null;

        try {
          latestUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: {
              role: true,
              isBanned: true,
              providerEmployeeRange: true,
              companyVerificationStatus: true,
            },
          });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          if (message.includes("Unknown field `providerEmployeeRange`")) {
            latestUser = await prisma.user.findUnique({
              where: { id: token.id as string },
              select: { role: true, isBanned: true },
            });
          } else {
            throw error;
          }
        }

        if (latestUser) {
          token.role = latestUser.role;
          token.isBanned = latestUser.isBanned;
          token.providerEmployeeRange = latestUser.providerEmployeeRange;
          token.companyVerificationStatus = latestUser.companyVerificationStatus;
        }
        token.userSyncAt = nowInSeconds;
      }

      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.isBanned = Boolean(token.isBanned);
        session.user.providerEmployeeRange = (token.providerEmployeeRange as string) || null;
        session.user.companyVerificationStatus = (token.companyVerificationStatus as string) || null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
