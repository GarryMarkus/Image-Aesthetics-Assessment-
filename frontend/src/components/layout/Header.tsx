"use client";

import React from "react";
import Link from "next/link";
import { User, Sparkles } from "lucide-react";

export function Header() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#0d0e0d]/90 backdrop-blur-md border-b border-white/[0.05]">
      {/* Top hairline indicator strip */}
      <div className="w-full h-[1px] bg-primary-container" />
      
      <div className="h-16 w-full px-4 md:px-10 flex items-center justify-between gap-4">
        {/* Brand Wordmark & Version Pill */}
        <div className="flex items-center gap-4 shrink-0">
          <Link href="/" className="flex items-baseline gap-2 group">
            <span className="font-pixel text-xl md:text-2xl tracking-wider text-white group-hover:text-primary-container transition-colors uppercase">
              PIXEL PRIZE
            </span>
            <span className="hidden sm:inline-block font-mono text-[10px] tracking-widest text-on-surface-variant">
              <span className="text-primary-container">[</span>
              LIVE / ENGINE V4.2
              <span className="text-primary-container">]</span>
            </span>
          </Link>
        </div>

        {/* Global Navigation Links */}
        <nav className="hidden lg:flex items-center gap-2 font-mono text-[11px] tracking-wider uppercase">
          <Link
            href="/"
            className="px-3 py-1.5 bg-surface-container-high text-primary-container font-semibold transition-colors rounded-sm"
          >
            [THE HALL]
          </Link>
          <Link
            href="/competitions"
            className="px-3 py-1.5 text-on-surface-variant hover:text-white transition-colors"
          >
            [COMPETITIONS]
          </Link>
          <Link
            href="/leaderboard"
            className="px-3 py-1.5 text-on-surface-variant hover:text-white transition-colors"
          >
            [LEADERBOARD]
          </Link>
          <Link
            href="/juror"
            className="px-3 py-1.5 text-on-surface-variant hover:text-white transition-colors"
          >
            [JUROR LIGHTBOX]
          </Link>
        </nav>

        {/* CTAs & Profile */}
        <div className="flex items-center gap-3 shrink-0 font-mono text-[11px]">
          <Link
            href="/auth/signin"
            className="hidden sm:inline-block text-primary-container hover:bg-surface-container px-3 py-1.5 uppercase transition-colors"
          >
            {`{SIGN IN}`}
          </Link>
          
          <Link
            href="/competitions"
            className="bg-primary-container text-on-primary-fixed px-4 py-1.5 hover:bg-white hover:text-black transition-all uppercase font-bold tracking-wider rounded-sm flex items-center gap-1.5 shadow-sm shadow-primary-container/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{`{ENTER CONTEST}`}</span>
          </Link>

          <Link
            href="/settings"
            className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.1] flex items-center justify-center text-white transition-colors ml-1"
            title="User Profile"
          >
            <User className="w-4 h-4 text-on-surface-variant hover:text-primary-container transition-colors" />
          </Link>
        </div>
      </div>
    </header>
  );
}
