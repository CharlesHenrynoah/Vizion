"use client";

import React from "react";
import Link from "next/link";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header container with a pill-like shape */}
      <div className="mx-auto my-6 max-w-6xl px-4">
        <header className="py-4 px-8 bg-gray-900 border border-gray-700 rounded-full shadow-none">
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
              <button className="bg-gradient-to-b from-gray-800 to-black px-3 py-1.5 rounded-md border border-gray-700 shadow-none text-white font-serif transition-all transform hover:-translate-y-0.5">
                <span className="font-medium">Sign In</span>
              </button>
              <Link href="/signup" className="bg-purple-600 text-white font-serif px-3 py-1.5 rounded-md shadow-none transition-all transform hover:-translate-y-0.5 inline-block">
                Sign Up
              </Link>
            </div>
          </div>
        </header>
      </div>

      {/* Main content */}
      <main className="shadow-none">{children}</main>
    </div>
  );
}

