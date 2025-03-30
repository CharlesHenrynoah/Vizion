import type React from "react"
import ClientLayout from "./ClientLayout"

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
    <div className="shadow-none">
      <ClientLayout>{children}</ClientLayout>
    </div>
  );
}

import './globals.css'