"use client";

import React, { useState, useEffect } from "react";
import { Submission } from "@/types";
import { mockSubmissions } from "@/mocks/fixtures";
import { DarkroomCard, BracketButton, DarkroomSkeleton } from "@/components/hud";
import {
  User,
  Sparkles,
  Eye,
  ShieldAlert,
  Compass,
} from "lucide-react";

export default function ParticipantDashboardPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserEntries() {
      // In mock mode, show entrant's submissions
      setSubmissions(mockSubmissions);
      setLoading(false);
    }
    loadUserEntries();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SHORTLISTED":
        return {
          label: "SHORTLISTED (TOP 10)",
          classes: "bg-podium-gold/15 text-podium-gold border-podium-gold/30 font-bold",
        };
      case "SCORED":
        return {
          label: "SCORED // COMPLETE",
          classes: "bg-primary-container/15 text-primary-container border-primary-container/30",
        };
      case "IN_QUEUE":
        return {
          label: "IN_QUEUE // APPRAISING",
          classes: "bg-[#6366f1]/15 text-[#818cf8] border-[#6366f1]/30",
        };
      case "FLAGGED_DISQUALIFIED":
        return {
          label: "DISQUALIFIED",
          classes: "bg-status-error/15 text-status-error border-status-error/30 font-bold",
        };
      default:
        return {
          label: status,
          classes: "bg-white/10 text-white border-white/20",
        };
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-10 py-10 md:py-14 space-y-10 font-mono">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/[0.08] pb-6">
        <div className="space-y-2">
          <div className="text-[10px] text-primary-container uppercase tracking-widest font-bold flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            <span>{"//"} CREATOR PORTAL &amp; SUBMISSION VAULT</span>
          </div>
          <h1 className="font-headline text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase">
            MY COMPETITION DASHBOARD
          </h1>
          <p className="text-xs text-on-surface-variant max-w-xl">
            Track live AI scoring status, view private 8-axis diagnostic feedback scorecards, and monitor shortlisted placements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <BracketButton
            variant="outline"
            bracketStyle="bracket"
            size="sm"
            href="/dashboard/appeals"
            leftIcon={<ShieldAlert className="w-4 h-4 text-amber-400" />}
          >
            DISPUTE APPEALS
          </BracketButton>
          <BracketButton
            variant="primary"
            bracketStyle="none"
            size="sm"
            href="/competitions"
            leftIcon={<Compass className="w-4 h-4" />}
          >
            EXPLORE SALONS
          </BracketButton>
        </div>
      </div>

      {/* Stats Summary Matrix */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DarkroomCard headerTitle="SUBMITTED WORKS" telemetryTag="PORTFOLIO">
          <div className="flex items-baseline justify-between mt-1">
            <span className="font-headline text-3xl font-black text-white">
              {submissions.length}
            </span>
            <span className="text-[10px] text-on-surface-variant">ACTIVE ENTRIES</span>
          </div>
        </DarkroomCard>

        <DarkroomCard headerTitle="TOP SHORTLISTED" telemetryTag="FINALIST">
          <div className="flex items-baseline justify-between mt-1">
            <span className="font-headline text-3xl font-black text-podium-gold">
              {submissions.filter((s) => s.status === "SHORTLISTED").length}
            </span>
            <span className="text-[10px] text-podium-gold font-bold">IN JURY LIGHTBOX</span>
          </div>
        </DarkroomCard>

        <DarkroomCard headerTitle="MEAN ARTIMUSE SCORE" telemetryTag="AVERAGE">
          <div className="flex items-baseline justify-between mt-1">
            <span className="font-headline text-3xl font-black text-primary-container">
              92.9
            </span>
            <span className="text-[10px] text-primary-container font-bold">TOP 4.2%</span>
          </div>
        </DarkroomCard>

        <DarkroomCard headerTitle="SENSOR PASS RATE" telemetryTag="OPTICAL">
          <div className="flex items-baseline justify-between mt-1">
            <span className="font-headline text-3xl font-black text-emerald-400">
              100%
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">AUTHENTIC OPTICS</span>
          </div>
        </DarkroomCard>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        <div className="text-xs uppercase tracking-widest text-on-surface-variant font-bold pb-2 border-b border-white/[0.06]">
          {"//"} MY REGISTERED COMPETITION ENTRIES
        </div>

        {loading ? (
          <div className="space-y-4">
            <DarkroomSkeleton height="120px" />
            <DarkroomSkeleton height="120px" />
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub) => {
              const status = getStatusBadge(sub.status);
              const imageSrc = sub.image?.thumbWebpUrl || sub.image?.originalUrl || "";

              return (
                <div
                  key={sub.id}
                  className="bg-surface-container-low border border-white/[0.08] hover:border-white/20 p-4 sm:p-5 rounded-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  {/* Left: Thumbnail & Meta */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-16 rounded-xs overflow-hidden bg-black border border-white/10 shrink-0">
                      <img
                        src={imageSrc}
                        alt={sub.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-primary-container uppercase font-bold tracking-widest">
                          {sub.category?.code || "SALON"}
                        </span>
                        <span>•</span>
                        <span className="text-[10px] text-on-surface-variant">
                          SUBMISSION ID::{sub.id}
                        </span>
                      </div>

                      <h3 className="font-headline text-base sm:text-lg font-bold text-white uppercase truncate max-w-md">
                        {sub.title}
                      </h3>

                      <div className="text-xs text-on-surface-variant flex items-center gap-2">
                        <span>{sub.exif?.cameraModel || "Optical Sensor"}</span>
                        <span>•</span>
                        <span>{sub.communityVotesCount.toLocaleString()} votes</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Score, Status & Actions */}
                  <div className="flex flex-wrap items-center gap-3 self-end md:self-center">
                    {/* Status Chip */}
                    <span
                      className={`px-2.5 py-1 rounded-xs border text-[10px] uppercase tracking-wider ${status.classes}`}
                    >
                      {status.label}
                    </span>

                    {/* Total Score Badge */}
                    {sub.totalScore && (
                      <div className="px-3 py-1 bg-surface-container rounded-xs border border-white/10 text-center">
                        <div className="text-[9px] text-on-surface-variant uppercase">SCORE</div>
                        <div className="font-headline text-base font-extrabold text-primary-container">
                          {sub.totalScore.toFixed(1)}
                        </div>
                      </div>
                    )}

                    {/* Action Links */}
                    <BracketButton
                      variant="primary"
                      bracketStyle="bracket"
                      size="sm"
                      href={`/submissions/${sub.id}/scorecard`}
                      leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                    >
                      SCORECARD
                    </BracketButton>

                    <BracketButton
                      variant="secondary"
                      bracketStyle="bracket"
                      size="sm"
                      href={`/submissions/${sub.id}`}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                    >
                      VIEW
                    </BracketButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
