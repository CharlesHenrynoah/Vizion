import type React from "react"
import './globals.css'

export const metadata = {
  title: 'Vizion AI',
  description: 'Your Vizion AI app description',
  icons: {
    icon: '/favicon.ico',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}