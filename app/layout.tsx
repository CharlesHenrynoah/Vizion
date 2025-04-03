import type React from "react"
import './globals.css'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-options"
import NextAuthSessionProvider from "@/components/providers/session-provider"

// Supprime les avertissements d'hydratation en mode développement
// @ts-ignore Cette ligne n'est pas typée mais est une directive valide pour Next.js
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Vizion AI',
  description: 'Your Vizion AI app description',
  icons: {
    icon: '/favicon.ico',
  }
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getServerSession(authOptions)
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body suppressHydrationWarning>
        <NextAuthSessionProvider session={session}>
          {children}
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}