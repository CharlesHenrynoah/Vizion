"use client";

import React from "react";
import Link from "next/link";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-100 to-blue-200 bg-fixed text-black flex flex-col">
      {/* Header container with a pill-like shape */}
      <div className="w-full px-8 my-6">
        <header className="py-4 px-8 bg-white/60 border border-blue-400/50 rounded-full shadow-lg w-full backdrop-blur-sm">
          <div className="flex items-center justify-between">
            {/* Logo and brand name */}
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-blue-400 to-blue-300 text-white p-2 rounded-lg shadow-none flex items-center justify-center w-8 h-8">
                <span className="text-lg font-serif font-bold scale-x-[-1] inline-block">𓂀</span>
              </div>
              <h1 className="text-2xl font-serif font-bold text-blue-400 dark:text-blue-50">Vizion AI</h1>
            </Link>

            {/* Navigation links - hidden on mobile */}
            <nav className="hidden md:block">
              <ul className="flex items-center gap-8">
                {/* Add navigation items here when needed */}
              </ul>
            </nav>

            {/* Auth buttons */}
            <div className="flex items-center gap-3">
              <Link href="/login" className="bg-white/60 px-4 py-2 rounded-md border border-blue-300/50 shadow-none text-blue-400 font-medium transition-all transform hover:bg-white/80 hover:-translate-y-0.5 backdrop-blur-sm">
                <span>Sign In</span>
              </Link>
              <Link href="/signup" className="bg-blue-400 text-white font-medium px-4 py-2 rounded-md shadow-none transition-all transform hover:bg-blue-300 hover:-translate-y-0.5 inline-block">
                Sign Up
              </Link>
            </div>
          </div>
        </header>
      </div>

      {/* Main content */}
      <main className="shadow-none flex-grow flex items-stretch justify-center w-full">{children}</main>
      
      {/* Footer */}
      <footer className="py-4 border-t border-blue-400/30 bg-white/60 backdrop-blur-sm">
        <div className="container mx-auto px-8 flex flex-wrap justify-between items-center">
          <div className="text-sm text-blue-400">
            &copy; 2025 Vizion AI. All rights reserved.
          </div>
          <nav className="flex flex-wrap gap-6 text-sm">
            <Link href="/signup" className="text-blue-400 hover:text-blue-500 transition-colors">
              Create Project
            </Link>
            <Link href="/documentation" className="text-blue-400 hover:text-blue-500 transition-colors">
              Documentation
            </Link>
            <Link href="/examples" className="text-blue-400 hover:text-blue-500 transition-colors">
              Examples
            </Link>
            <Link href="/terms" className="text-blue-400 hover:text-blue-500 transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="text-blue-400 hover:text-blue-500 transition-colors">
              Privacy
            </Link>
            <Link href="/contact" className="text-blue-400 hover:text-blue-500 transition-colors">
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
