"use client";

import React from "react";
import Link from "next/link";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-purple-950 text-white flex flex-col">
      {/* Header container with a pill-like shape */}
      <div className="w-full px-8 my-6">
        <header className="py-4 px-8 bg-gray-900/80 border border-purple-800/50 rounded-full shadow-lg w-full">
          <div className="flex items-center justify-between">
            {/* Logo and brand name */}
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-purple-600 to-violet-500 text-white p-2 rounded-lg shadow-none flex items-center justify-center w-8 h-8">
                <span className="text-lg font-serif font-bold scale-x-[-1] inline-block">𓂀</span>
              </div>
              <h1 className="text-2xl font-serif font-bold text-white dark:text-purple-50">Vizion AI</h1>
            </Link>

            {/* Navigation links - hidden on mobile */}
            <nav className="hidden md:block">
              <ul className="flex items-center gap-8">
                {/* Add navigation items here when needed */}
              </ul>
            </nav>

            {/* Auth buttons */}
            <div className="flex items-center gap-3">
              <button className="bg-gray-900/80 px-4 py-2 rounded-md border border-gray-700 shadow-none text-white font-medium transition-all transform hover:bg-gray-800 hover:-translate-y-0.5">
                <span>Sign In</span>
              </button>
              <Link href="/signup" className="bg-purple-600 text-white font-medium px-4 py-2 rounded-md shadow-none transition-all transform hover:bg-purple-500 hover:-translate-y-0.5 inline-block">
                Sign Up
              </Link>
            </div>
          </div>
        </header>
      </div>

      {/* Main content */}
      <main className="shadow-none flex-grow flex items-stretch justify-center w-full">{children}</main>
      
      {/* Footer */}
      <footer className="bg-[#1a0a2e] py-4 border-t border-purple-900/30">
        <div className="container mx-auto px-8 flex flex-wrap justify-between items-center">
          <div className="text-sm text-slate-400">
            &copy; 2023 Squared. All rights reserved.
          </div>
          <nav className="flex flex-wrap gap-6 text-sm">
            <Link href="/create" className="text-slate-400 hover:text-white transition-colors">
              Create Project
            </Link>
            <Link href="/documentation" className="text-slate-400 hover:text-white transition-colors">
              Documentation
            </Link>
            <Link href="/examples" className="text-slate-400 hover:text-white transition-colors">
              Examples
            </Link>
            <Link href="/terms" className="text-slate-400 hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/contact" className="text-slate-400 hover:text-white transition-colors">
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
