import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { verifyUserCredentials, findOrCreateOAuthUser } from "@/lib/auth/db-queries";
import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          redirect_uri: process.env.GITHUB_CALLBACK_URL || "http://localhost:3000/api/auth/callback/github"
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          redirect_uri: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/api/auth/callback/google"
        }
      }
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        try {
          const user = await verifyUserCredentials(
            credentials.email,
            credentials.password
          );

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          // Propager l'erreur avec le message spécifique
          if (error instanceof Error) {
            throw new Error(error.message);
          }
          throw new Error("Authentication failed");
        }
      }
    })
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Si l'authentification se fait via GitHub, créer ou mettre à jour l'utilisateur
      if (account && account.provider === 'github' && profile) {
        try {
          await findOrCreateOAuthUser(profile, 'github');
          return true;
        } catch (error) {
          console.error('Erreur lors de la création/mise à jour de l\'utilisateur GitHub:', error);
          return false;
        }
      }
      // Si l'authentification se fait via Google, créer ou mettre à jour l'utilisateur
      if (account && account.provider === 'google' && profile) {
        try {
          await findOrCreateOAuthUser(profile, 'google');
          return true;
        } catch (error) {
          console.error('Erreur lors de la création/mise à jour de l\'utilisateur Google:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Ajouter les informations utilisateur au token JWT à la connexion
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
