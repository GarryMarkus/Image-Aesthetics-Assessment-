"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";
import { DarkroomCard } from "@/components/hud";
import { UserPlus, Mail, Lock, User as UserIcon, ArrowRight, ShieldCheck } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("PARTICIPANT");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await register(email, username, password, name, role);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please check your details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-12 sm:py-20 space-y-8 font-mono">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="text-[10px] text-primary-container uppercase tracking-widest font-bold flex items-center justify-center gap-1.5">
          <UserPlus className="w-3.5 h-3.5" />
          <span>{"//"} ARTIST REGISTRATION &amp; DOSSIER</span>
        </div>
        <h1 className="font-headline text-3xl font-extrabold text-white tracking-tight uppercase">
          JOIN PIXEL PRIZE
        </h1>
        <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
          Create your creator identity to compete in juried salons, submit optical masterworks, and claim podium awards.
        </p>
      </div>

      {/* Main Registration Card */}
      <DarkroomCard
        headerTitle="NEW ARTIST PROFILE"
        telemetryTag="ECDSA_VERIFIED"
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
              <UserIcon className="w-3.5 h-3.5 text-primary-container" />
              <span>Full Name</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kenji Sato"
              className="w-full bg-[#181918] border border-white/10 rounded-xs px-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-primary-container"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-on-surface-variant uppercase flex items-center gap-1.5">
              <span className="text-primary-container font-mono">@</span>
              <span>Username</span>
            </label>
            <input
              type="text"
              required
              minLength={3}
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              placeholder="e.g. kenji_lens"
              className="w-full bg-[#181918] border border-white/10 rounded-xs px-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-primary-container"
            />
          </div>

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
              placeholder="e.g. kenji@tokyophoto.org"
              className="w-full bg-[#181918] border border-white/10 rounded-xs px-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-primary-container"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-on-surface-variant uppercase flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-primary-container" />
              <span>Password (min. 6 characters)</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#181918] border border-white/10 rounded-xs px-3 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-primary-container"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-on-surface-variant uppercase block">
              Platform Role
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setRole("PARTICIPANT")}
                className={`p-2.5 border rounded-xs text-center transition-all ${
                  role === "PARTICIPANT"
                    ? "bg-primary-container/15 border-primary-container text-primary-container font-bold"
                    : "bg-white/[0.03] border-white/10 text-on-surface-variant hover:text-white"
                }`}
              >
                📷 PHOTOGRAPHER
              </button>
              <button
                type="button"
                onClick={() => setRole("ORGANIZER")}
                className={`p-2.5 border rounded-xs text-center transition-all ${
                  role === "ORGANIZER"
                    ? "bg-primary-container/15 border-primary-container text-primary-container font-bold"
                    : "bg-white/[0.03] border-white/10 text-on-surface-variant hover:text-white"
                }`}
              >
                🏛️ SALON ORGANIZER
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-3 py-3 bg-primary-container text-black font-bold text-xs uppercase tracking-wider rounded-xs hover:bg-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>ENROLLING DOSSIER...</span>
            ) : (
              <>
                <span>REGISTER DOSSIER</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </DarkroomCard>

      {/* Sign In Link */}
      <div className="text-center text-xs text-on-surface-variant">
        <span>Already have an authenticated dossier? </span>
        <Link
          href="/auth/signin"
          className="text-primary-container hover:underline uppercase font-bold"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
