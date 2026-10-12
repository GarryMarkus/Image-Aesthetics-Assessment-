"use client";

import React, { useState, useEffect } from "react";
import { Competition } from "@/types";
import { apiClient } from "@/lib/api/client";
import { CompetitionCard } from "@/components/competition/CompetitionCard";
import { Compass } from "lucide-react";
import { DarkroomSkeleton } from "@/components/hud";

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await apiClient.getCompetitions(
          statusFilter !== "ALL" ? { status: statusFilter } : undefined
        );
        setCompetitions(data);
      } catch (err) {
        console.error("Failed to load competitions", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [statusFilter]);

  const filterTabs: { label: string; value: string }[] = [
    { label: "ALL SALONS", value: "ALL" },
    { label: "OPEN FOR SUBMISSIONS", value: "OPEN" },
    { label: "AI JUDGING ACTIVE", value: "JUDGING" },
    { label: "RESULTS PUBLISHED", value: "RESULTS_PUBLISHED" },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-10 py-10 md:py-14 space-y-10">
      {/* Directory Header */}
      <div className="space-y-3 border-b border-white/[0.08] pb-6">
        <div className="text-[10px] font-mono text-primary-container uppercase tracking-widest font-bold flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5" />
          <span>{"//"} COMPETITION DIRECTORY &amp; SALONS</span>
        </div>
        <h1 className="font-headline text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase">
          EXPLORE CONTESTS
        </h1>
        <p className="font-mono text-xs md:text-sm text-on-surface-variant max-w-2xl leading-relaxed">
          Juried photography challenges powered by computer vision. Submit authentic optical masterworks and receive granular 8-attribute diagnostic scorecards.
        </p>
      </div>

      {/* Filter Tabs Toolbar */}
      <div className="flex flex-wrap items-center gap-2 font-mono text-xs pb-2 border-b border-white/[0.04]">
        {filterTabs.map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3.5 py-1.5 rounded-sm uppercase tracking-wider text-[11px] font-semibold transition-all ${
                isActive
                  ? "bg-primary-container text-on-primary-fixed shadow-sm shadow-primary-container/20"
                  : "bg-surface-container text-on-surface-variant hover:text-white hover:bg-surface-container-high border border-white/[0.06]"
              }`}
            >
              [{tab.label}]
            </button>
          );
        })}
      </div>

      {/* Competitions Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DarkroomSkeleton height="380px" />
          <DarkroomSkeleton height="380px" />
          <DarkroomSkeleton height="380px" />
        </div>
      ) : competitions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {competitions.map((comp) => (
            <CompetitionCard key={comp.id} competition={comp} />
          ))}
        </div>
      ) : (
        <div className="w-full py-16 text-center font-mono text-sm text-on-surface-variant border border-dashed border-white/10 rounded-sm">
          No competitions found matching filter [{statusFilter}].
        </div>
      )}
    </div>
  );
}
