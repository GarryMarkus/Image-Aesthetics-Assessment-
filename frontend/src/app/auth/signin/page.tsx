"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { DarkroomCard, BracketButton } from "@/components/hud";
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles, UserCheck } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const setDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("PixelPrize2026!");
    setError(null);
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-12 sm:py-20 space-y-8 font-mono">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="text-[10px] text-primary-container uppercase tracking-widest font-bold flex items-center justify-center gap-1.5">
          <Lock className="w-3.5 h-3.5" />
          <span>{"//"} SECURE CREDENTIAL GATE</span>
        </div>
        <h1 className="font-headline text-3xl font-extrabold text-white tracking-tight uppercase">
          SIGN IN TO SALON
        </h1>
        <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
          Authenticate to enter submissions, review confidential AI diagnostic scorecards, or cast juror verdicts.
        </p>
      </div>

      {/* Main Sign-In Card */}
      <DarkroomCard
        headerTitle="VAULT ACCESS // JWT SESSION"
        telemetryTag="TLS_ENCRYPTED"
        className="p-6 space-y-6"
      >
        {error && (
          <div className="p-3 bg-status-error/15 border border-status-error/40 text-status-error text-xs rounded-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-on-surface-variant uppercase flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-primary-container" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. photographer@pixelprize.org"
              className="w-full bg-[#181918] border border-white/10 rounded-xs px-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-primary-container"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-on-surface-variant uppercase flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-primary-container" />
              <span>Password</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#181918] border border-white/10 rounded-xs px-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-primary-container"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 bg-primary-container text-black font-bold text-xs uppercase tracking-wider rounded-xs hover:bg-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>AUTHENTICATING MATRIX...</span>
            ) : (
              <>
                <span>ENTER VAULT</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast-Login Strip */}
        <div className="pt-4 border-t border-white/[0.08] space-y-2">
          <span className="text-[10px] text-on-surface-variant uppercase tracking-widest block">
            DEMO SEED ACCOUNTS:
          </span>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <button
              type="button"
              onClick={() => setDemoAccount("photographer@pixelprize.org")}
              className="px-2 py-1.5 bg-white/[0.04] hover:bg-white/10 border border-white/10 rounded-xs text-white text-left transition-colors truncate"
            >
              📷 Photographer
            </button>
            <button
              type="button"
              onClick={() => setDemoAccount("organizer@pixelprize.org")}
              className="px-2 py-1.5 bg-white/[0.04] hover:bg-white/10 border border-white/10 rounded-xs text-white text-left transition-colors truncate"
            >
              🏛️ Organizer
            </button>
            <button
              type="button"
              onClick={() => setDemoAccount("juror@pixelprize.org")}
              className="px-2 py-1.5 bg-white/[0.04] hover:bg-white/10 border border-white/10 rounded-xs text-white text-left transition-colors truncate"
            >
              ⚖️ Juror
            </button>
            <button
              type="button"
              onClick={() => setDemoAccount("admin@pixelprize.org")}
              className="px-2 py-1.5 bg-white/[0.04] hover:bg-white/10 border border-white/10 rounded-xs text-white text-left transition-colors truncate"
            >
              🛡️ Admin
            </button>
          </div>
        </div>
      </DarkroomCard>

      {/* Sign Up Redirect */}
      <div className="text-center text-xs text-on-surface-variant">
        <span>No credentials yet? </span>
        <Link
          href="/auth/signup"
          className="text-primary-container hover:underline uppercase font-bold"
        >
          Create Artist Account
        </Link>
      </div>
    </div>
  );
}
