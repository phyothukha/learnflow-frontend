import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/auth-error",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.name = user.name;
        token.email = user.email;
        token.roles = user.roles;
        token.permissions = user.permissions;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.roles = token.roles;
      session.user.role = token.roles[0] ?? "";
      session.user.permissions = token.permissions;
      session.user.isAdmin = token.roles.includes("admin");
      session.user.accessToken = token.accessToken;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
