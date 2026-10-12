"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Competition } from "@/types";
import { apiClient } from "@/lib/api/client";
import { DarkroomCard, BracketButton, CountdownPill, DarkroomSkeleton } from "@/components/hud";
import { ArrowRight, UserCheck } from "lucide-react";

export default function JurorDashboardPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJuryContests() {
      try {
        const comps = await apiClient.getCompetitions();
        // Contests in judging or shortlisted state
        setCompetitions(comps);
      } catch (err) {
        console.error("Failed to load jury competitions", err);
      } finally {
        setLoading(false);
      }
    }
    loadJuryContests();
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-10 py-10 md:py-14 space-y-10 font-mono">
      {/* Juror Header */}
      <div className="space-y-3 border-b border-white/[0.08] pb-6">
        <div className="text-[10px] text-primary-container uppercase tracking-widest font-bold flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5" />
          <span>{"//"} JUROR CONSOLE &amp; VERDICT PORTAL</span>
        </div>
        <h1 className="font-headline text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase">
          HUMAN JURY LIGHTBOX
        </h1>
        <p className="text-xs md:text-sm text-on-surface-variant max-w-2xl leading-relaxed">
          Pixel Prize multimodal AI evaluates thousands of submissions down to a verified Top 10 Shortlist. Master human jurors evaluate the finalists in the fullscreen lightbox to allocate podiums.
        </p>
      </div>

      {/* Assigned Competitions Grid */}
      <div className="space-y-6">
        <div className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">
          {"//"} ASSIGNED COMPETITIONS REQUIRING HUMAN VERDICT
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DarkroomSkeleton height="260px" />
            <DarkroomSkeleton height="260px" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {competitions.map((comp) => {
              const category = comp.categories?.[0];

              return (
                <DarkroomCard
                  key={comp.id}
                  headerTitle={category?.name || "SALON"}
                  telemetryTag={comp.status}
                  className="flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-primary-container">
                        CATEGORY: {category?.code || "GENERAL"}
                      </span>
                      <span>•</span>
                      <span className="text-[10px] text-on-surface-variant">
                        {comp.submissionsCount || 480} Bulk Submissions Processed
                      </span>
                    </div>

                    <h3 className="font-headline text-xl font-bold text-white uppercase">
                      {comp.title}
                    </h3>

                    <p className="font-sans text-xs text-on-surface-variant line-clamp-2">
                      {comp.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                    <CountdownPill
                      targetDate={comp.submissionEndDate}
                      status={comp.status}
                    />

                    <BracketButton
                      variant="primary"
                      bracketStyle="bracket"
                      size="sm"
                      href={`/juror/competitions/${comp.id}`}
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      ENTER JUROR LIGHTBOX
                    </BracketButton>
                  </div>
                </DarkroomCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
