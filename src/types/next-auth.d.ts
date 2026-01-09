import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      email?: string;
      name?: string;
      uid?: string;
      role: "ADMIN" | "STUDENT";
      deptId?: string;
      program?: string;
      year?: string;
      division?: string;
      batch?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    username: string;
    email?: string;
    name?: string;
    uid?: string;
    role: "ADMIN" | "STUDENT";
    deptId?: string;
    division?: string;
    batch?: string;
      program?: string;
      year?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    email?: string;
    name?: string;
    uid?: string;
    role: "ADMIN" | "STUDENT";
    deptId?: string;
    division?: string;
    batch?: string;
      program?: string;
      year?: string;
  }
}
