import type React from "react"
import ClientLayout from "./ClientLayout"
import './globals.css'

export const metadata = {
  title: 'Vizion',
  description: 'Your Vizion app description',
  icons: {
    icon: '/favicon.ico',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Wrap ClientLayout with a div that explicitly disables shadows
  return (
    <html lang="en">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}