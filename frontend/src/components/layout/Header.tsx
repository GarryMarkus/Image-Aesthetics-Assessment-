"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Sparkles, Menu, X, Compass, Layers, Trophy, Eye, LogOut, ShieldCheck, Briefcase } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout, role } = useAuth();

  const navLinks = [
    { label: "[THE HALL]", href: "/", icon: Layers },
    { label: "[COMPETITIONS]", href: "/competitions", icon: Compass },
    { label: "[LEADERBOARD]", href: "/leaderboard", icon: Trophy },
    { label: "[JUROR LIGHTBOX]", href: "/juror", icon: Eye },
  ];

  if (role === "ORGANIZER" || role === "ADMIN") {
    navLinks.push({ label: "[ORGANIZER]", href: "/organizer", icon: Briefcase });
  }

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#0d0e0d]/90 backdrop-blur-md border-b border-white/[0.05]">
      {/* Top hairline indicator strip */}
      <div className="w-full h-[1px] bg-primary-container" />
      
      <div className="h-16 w-full px-4 md:px-10 flex items-center justify-between gap-4">
        {/* Brand Wordmark & Version Pill */}
        <div className="flex items-center gap-4 shrink-0">
          <Link href="/" className="flex items-baseline gap-2 group" aria-label="Pixel Prize Home">
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

        {/* Global Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-2 font-mono text-[11px] tracking-wider uppercase" aria-label="Main Navigation">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-sm transition-colors ${
                  active
                    ? "bg-surface-container-high text-primary-container font-semibold border border-primary-container/20"
                    : "text-on-surface-variant hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* CTAs & Profile */}
        <div className="flex items-center gap-3 shrink-0 font-mono text-[11px]">
          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                className="hidden sm:inline-block text-primary-container hover:bg-surface-container px-3 py-1.5 uppercase transition-colors"
              >
                {role === "ORGANIZER" ? "{ORGANIZER}" : role === "JUROR" ? "{JUROR}" : "{CREATOR VAULT}"}
              </Link>
              
              <Link
                href="/competitions"
                className="bg-primary-container text-on-primary-fixed px-3 sm:px-4 py-1.5 hover:bg-white hover:text-black transition-all uppercase font-bold tracking-wider rounded-sm flex items-center gap-1.5 shadow-sm shadow-primary-container/20"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden xs:inline">{`{ENTER CONTEST}`}</span>
                <span className="xs:hidden">ENTER</span>
              </Link>

              <Link
                href="/dashboard"
                className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.1] flex items-center justify-center text-white transition-colors ml-1"
                title={`${user?.name || user?.username} (${role})`}
                aria-label="Creator Dashboard & Profile"
              >
                <User className="w-4 h-4 text-primary-container" />
              </Link>

              <button
                onClick={logout}
                title="Sign out of dossier"
                className="p-1.5 text-on-surface-variant hover:text-status-error transition-colors ml-0.5"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="text-white hover:text-primary-container px-3 py-1.5 uppercase transition-colors font-bold"
              >
                {"{SIGN IN}"}
              </Link>

              <Link
                href="/auth/signup"
                className="bg-primary-container text-black px-3 sm:px-4 py-1.5 hover:bg-white transition-all uppercase font-bold tracking-wider rounded-sm flex items-center gap-1.5 shadow-sm shadow-primary-container/20"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>JOIN SALON</span>
              </Link>
            </>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-sm text-on-surface-variant hover:text-white hover:bg-white/10 transition-colors ml-1"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-primary-container" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden w-full bg-[#0d0e0d] border-b border-white/15 px-4 py-5 space-y-4 font-mono shadow-2xl">
          <div className="text-[10px] text-primary-container uppercase tracking-widest font-bold pb-2 border-b border-white/[0.06]">
            {"//"} ARCHIVAL NAVIGATION CONSOLE
          </div>

          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs uppercase tracking-wider transition-colors ${
                    active
                      ? "bg-surface-container-high text-primary-container font-semibold border-l-2 border-primary-container"
                      : "text-on-surface-variant hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs">
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-primary-container font-bold uppercase"
                >
                  {`{${user?.username || "MY DASHBOARD"}}`}
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-status-error font-bold uppercase"
                >
                  LOGOUT
                </button>
              </>
            ) : (
              <div className="w-full flex items-center justify-between">
                <Link
                  href="/auth/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white hover:text-primary-container uppercase font-bold"
                >
                  SIGN IN
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-primary-container uppercase font-bold"
                >
                  CREATE ACCOUNT
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
