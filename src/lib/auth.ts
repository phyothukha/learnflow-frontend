import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { serverAxios } from "@/lib/axios";
import { authConfig } from "@/lib/auth.config";

interface LoginResponse {
  token: string;
  user: {
    Id: string;
    Email: string;
    Name: string;
    Roles: string[];
    Permissions: string[];
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const { data } = await serverAxios.post<LoginResponse>(
            "/v1/Auth/login",
            {
              email: credentials.email,
              password: credentials.password,
            },
          );

          return {
            id: data.user.Id,
            name: data.user.Name,
            email: data.user.Email,
            roles: data.user.Roles ?? [],
            permissions: data.user.Permissions ?? [],
            accessToken: data.token,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
});
