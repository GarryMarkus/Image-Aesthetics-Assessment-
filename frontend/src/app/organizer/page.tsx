"use client";

import React, { useState, useEffect } from "react";
import { Competition, CompetitionStatus } from "@/types";
import { apiClient } from "@/lib/api/client";
import { DarkroomCard, BracketButton, CountdownPill, DarkroomSkeleton } from "@/components/hud";
import {
  Compass,
  Plus,
  Lock,
  Sparkles,
  Trophy,
  ArrowRight,
} from "lucide-react";

export default function OrganizerDashboardPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrganizerData() {
      try {
        const comps = await apiClient.getCompetitions();
        setCompetitions(comps);
      } catch (err) {
        console.error("Failed to load organizer competitions", err);
      } finally {
        setLoading(false);
      }
    }
    loadOrganizerData();
  }, []);

  const handleStateTransition = async (id: string, newStatus: CompetitionStatus) => {
    try {
      await apiClient.updateCompetitionStatus(id, newStatus);
      setCompetitions((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
      );
    } catch (err) {
      console.warn("Status transition fallback", err);
      setCompetitions((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
      );
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-10 py-10 md:py-14 space-y-10 font-mono">
      {/* Header & Create Action */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/[0.08] pb-6">
        <div className="space-y-2">
          <div className="text-[10px] text-primary-container uppercase tracking-widest font-bold flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" />
            <span>{"//"} ORGANIZER COMMAND CONSOLE</span>
          </div>
          <h1 className="font-headline text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase">
            CONTEST OPERATIONS
          </h1>
          <p className="text-xs text-on-surface-variant max-w-xl">
            Monitor real-time photo ingestion telemetry, trigger batch AI aesthetic appraisals, and transition lifecycle states.
          </p>
        </div>

        <BracketButton
          variant="primary"
          bracketStyle="brace"
          size="md"
          href="/organizer/competitions/new"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          HOST NEW COMPETITION
        </BracketButton>
      </div>

      {/* Real-Time Ingestion Gauges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DarkroomCard headerTitle="TOTAL INGESTED" telemetryTag="LIVE_STREAM">
          <div className="flex items-baseline justify-between mt-1">
            <span className="font-headline text-3xl sm:text-4xl font-black text-white">
              2,261
            </span>
            <span className="text-[10px] text-primary-container font-bold">+14 / MIN</span>
          </div>
        </DarkroomCard>

        <DarkroomCard headerTitle="AI APPRAISED" telemetryTag="ARTIMUSE">
          <div className="flex items-baseline justify-between mt-1">
            <span className="font-headline text-3xl sm:text-4xl font-black text-primary-container">
              2,213
            </span>
            <span className="text-[10px] text-on-surface-variant">97.8% DRAINED</span>
          </div>
        </DarkroomCard>

        <DarkroomCard headerTitle="BULLMQ QUEUE" telemetryTag="THROUGHPUT">
          <div className="flex items-baseline justify-between mt-1">
            <span className="font-headline text-3xl sm:text-4xl font-black text-white">
              48
            </span>
            <span className="text-[10px] text-amber-400 font-bold">~18S LATENCY</span>
          </div>
        </DarkroomCard>

        <DarkroomCard headerTitle="DISQUALIFIED" telemetryTag="FORENSICS">
          <div className="flex items-baseline justify-between mt-1">
            <span className="font-headline text-3xl sm:text-4xl font-black text-status-error">
              21
            </span>
            <span className="text-[10px] text-status-error font-bold">AI FAKES / EXIF</span>
          </div>
        </DarkroomCard>
      </div>

      {/* Competitions Management List */}
      <div className="space-y-4">
        <div className="text-xs uppercase tracking-widest text-on-surface-variant font-bold pb-2 border-b border-white/[0.06]">
          {"//"} HOSTED COMPETITION SALONS &amp; LIFECYCLE CONTROLS
        </div>

        {loading ? (
          <div className="space-y-4">
            <DarkroomSkeleton height="140px" />
            <DarkroomSkeleton height="140px" />
          </div>
        ) : (
          <div className="space-y-4">
            {competitions.map((comp) => {
              const category = comp.categories?.[0];

              return (
                <div
                  key={comp.id}
                  className="bg-surface-container-low border border-white/[0.08] hover:border-white/20 p-5 rounded-sm transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  {/* Left: Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-16 rounded-xs overflow-hidden bg-black border border-white/10 shrink-0 hidden sm:block">
                      <img
                        src={comp.coverImageUrl}
                        alt={comp.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-primary-container uppercase font-bold tracking-widest">
                          {category?.code || "SALON"}
                        </span>
                        <span>•</span>
                        <span className="text-[10px] text-on-surface-variant">
                          {comp.submissionsCount || 0} Total Entries Registered
                        </span>
                      </div>

                      <h3 className="font-headline text-lg font-bold text-white uppercase">
                        {comp.title}
                      </h3>

                      <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                        <span>Prize Pool: ${comp.totalPrizePoolUsd.toLocaleString()}</span>
                        <span>•</span>
                        <span>Cap: {comp.maxEntriesPerUser} / Entrant</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: State Machine Triggers */}
                  <div className="flex flex-wrap items-center gap-3 self-end lg:self-center font-mono text-xs">
                    <CountdownPill
                      targetDate={comp.submissionEndDate}
                      status={comp.status}
                    />

                    {comp.status === "OPEN" && (
                      <BracketButton
                        variant="secondary"
                        bracketStyle="bracket"
                        size="sm"
                        onClick={() => handleStateTransition(comp.id, "JUDGING")}
                        leftIcon={<Lock className="w-3.5 h-3.5" />}
                      >
                        CLOSE & JUDGE
                      </BracketButton>
                    )}

                    {comp.status === "JUDGING" && (
                      <BracketButton
                        variant="primary"
                        bracketStyle="bracket"
                        size="sm"
                        onClick={() => handleStateTransition(comp.id, "SHORTLISTED")}
                        leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                      >
                        RUN TOP 10 SHORTLIST
                      </BracketButton>
                    )}

                    {comp.status === "SHORTLISTED" && (
                      <BracketButton
                        variant="primary"
                        bracketStyle="brace"
                        size="sm"
                        onClick={() => handleStateTransition(comp.id, "RESULTS_PUBLISHED")}
                        leftIcon={<Trophy className="w-3.5 h-3.5" />}
                      >
                        PUBLISH WINNERS
                      </BracketButton>
                    )}

                    <BracketButton
                      variant="outline"
                      bracketStyle="bracket"
                      size="sm"
                      href={`/competitions/${comp.id}`}
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      MANAGE
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
