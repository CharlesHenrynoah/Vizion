import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Étend l'objet User de NextAuth
   */
  interface User {
    id: string;
    name: string;
    email: string;
    image?: string;
  }

  /**
   * Étend l'objet Session de NextAuth
   */
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  /**
   * Étend l'objet JWT de NextAuth
   */
  interface JWT {
    id: string;
  }
}
