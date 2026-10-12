"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Compass,
  Layers,
  Sparkles,
  Terminal,
  Trophy,
} from "lucide-react";
import {
  BracketButton,
  ScoreTicker,
  DarkroomSkeleton,
} from "@/components/hud";
import { Competition, Submission } from "@/types";
import { apiClient } from "@/lib/api/client";
import { CompetitionCard } from "@/components/competition/CompetitionCard";
import { PhotoMasonryGallery } from "@/components/gallery/PhotoMasonryGallery";

export default function HomePage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [comps, gal] = await Promise.all([
          apiClient.getCompetitions(),
          apiClient.getCompetitionGallery("comp_portrait_2026"),
        ]);
        setCompetitions(comps.slice(0, 3));
        setSubmissions(gal.submissions);
      } catch (err) {
        console.error("Failed to load salon showcase", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="w-full flex flex-col items-start px-4 md:px-10 py-10 md:py-14 max-w-7xl mx-auto space-y-16">
      {/* 01. Archival Core Telemetry Sub-Header */}
      <div className="w-full flex items-center justify-between text-[11px] font-mono text-on-surface-variant uppercase tracking-widest border-b border-white/[0.06] pb-3">
        <span className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-primary-container" />
          <span>[ARCHIVAL CORE // EXHIBIT SALON 01]</span>
        </span>
        <span className="text-primary-container font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
          {`{STANDALONE JURY MATRIX: ONLINE}`}
        </span>
      </div>

      {/* 02. Massive Deliberately Cropped Wordmark */}
      <div className="w-full overflow-hidden my-2">
        <h1 className="font-pixel text-[56px] sm:text-[90px] md:text-[130px] lg:text-[160px] leading-[0.88] tracking-tight uppercase text-white whitespace-nowrap opacity-95 hover:opacity-100 transition-opacity">
          PIXEL&nbsp;PRIZE
        </h1>
      </div>

      {/* 03. Mission & Action Row */}
      <div className="w-full flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-10 border-b border-white/[0.06]">
        <div className="max-w-2xl space-y-3">
          <div className="font-mono text-[11px] text-primary-container tracking-widest uppercase font-bold flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container inline-block" />
            {"//"} CALIBRATED SENSOR AUDITING SUITE
          </div>
          <p className="font-headline text-2xl md:text-3xl text-white font-bold tracking-tight uppercase leading-snug">
            PHOTOS IN. SCORES OUT. THE BEST SHOTS OF THE WORLD, JUDGED BY AI.
          </p>
          <p className="font-mono text-xs md:text-sm text-on-surface-variant leading-relaxed">
            Raw spectral variance, golden ratio fidelity, spatial depth coherence, and storytelling cadence appraised across 64 neural weights.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <BracketButton
            variant="primary"
            bracketStyle="none"
            href="/competitions"
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            EXPLORE COMPETITIONS
          </BracketButton>
          <BracketButton
            variant="secondary"
            bracketStyle="bracket"
            href="/leaderboard"
            rightIcon={<ArrowUpRight className="w-4 h-4" />}
          >
            VIEW LEADERBOARD
          </BracketButton>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 04. FEATURED COMPETITIONS MARQUEE                              */}
      {/* ============================================================== */}
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2 font-mono text-xs text-white uppercase tracking-wider font-semibold">
            <Compass className="w-4 h-4 text-primary-container" />
            <span>01 {"//"} ACTIVE COMPETITION SALONS</span>
          </div>
          <Link
            href="/competitions"
            className="font-mono text-[11px] text-primary-container hover:underline uppercase flex items-center gap-1"
          >
            <span>VIEW ALL</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DarkroomSkeleton height="360px" />
            <DarkroomSkeleton height="360px" />
            <DarkroomSkeleton height="360px" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {competitions.map((comp) => (
              <CompetitionCard key={comp.id} competition={comp} />
            ))}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 05. THE CURATED HALL (ASPECT-RATIO PRESERVING MASONRY)         */}
      {/* ============================================================== */}
      <div className="w-full space-y-6 pt-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2 font-mono text-xs text-white uppercase tracking-wider font-semibold">
            <Layers className="w-4 h-4 text-primary-container" />
            <span>02 {"//"} THE CURATED HALL (PUBLIC SUBMISSION GALLERY)</span>
          </div>
          <span className="font-mono text-[10px] text-on-surface-variant uppercase">
            NATURAL RATIOS {"//"} HOVER FOR SENSOR HUD
          </span>
        </div>

        {loading ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            <DarkroomSkeleton aspectRatio="3/2" />
            <DarkroomSkeleton aspectRatio="16/9" />
            <DarkroomSkeleton aspectRatio="1/1" />
          </div>
        ) : (
          <PhotoMasonryGallery
            submissions={submissions}
            showCategoryFilters={true}
          />
        )}
      </div>
    </div>
  );
}
