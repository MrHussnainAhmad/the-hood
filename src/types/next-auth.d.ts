import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      isBanned: boolean;
      providerEmployeeRange?: string | null;
      companyVerificationStatus?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    isBanned: boolean;
    providerEmployeeRange?: string | null;
    companyVerificationStatus?: string | null;
    remember?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    id: string;
    isBanned: boolean;
    providerEmployeeRange?: string | null;
    companyVerificationStatus?: string | null;
    remember?: boolean;
    userSyncAt?: number;
  }
}
