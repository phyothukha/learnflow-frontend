import { DefaultSession } from "next-auth";
import "next-auth/jwt";

interface SessionUser extends NonNullable<DefaultSession["user"]> {
  id: string;
  role: string;
  roles: string[];
  permissions: string[];
  isAdmin: boolean;
  accessToken: string;
}

declare module "next-auth" {
  interface Session {
    user: SessionUser;
  }

  interface User {
    id?: string;
    roles: string[];
    permissions: string[];
    accessToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    roles: string[];
    permissions: string[];
    accessToken: string;
  }
}
