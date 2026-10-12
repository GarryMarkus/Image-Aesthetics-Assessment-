"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Competition, Submission, LeaderboardEntry } from "@/types";
import { apiClient } from "@/lib/api/client";
import { CountdownPill, BracketButton, DarkroomCard } from "@/components/hud";
import { PhotoMasonryGallery } from "@/components/gallery/PhotoMasonryGallery";
import { LeaderboardView } from "@/components/leaderboard/LeaderboardView";
import {
  Trophy,
  CheckCircle,
  Layers,
  Sparkles,
  ArrowLeft,
  Sliders,
} from "lucide-react";

export default function CompetitionDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "gallery" | "leaderboard">("gallery");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      try {
        const [comp, galData, leadData] = await Promise.all([
          apiClient.getCompetitionById(id),
          apiClient.getCompetitionGallery(id),
          apiClient.getCompetitionLeaderboard(id, "ai"),
        ]);
        setCompetition(comp);
        setSubmissions(galData.submissions);
        setLeaderboard(leadData);
      } catch (err) {
        console.error("Failed to load competition data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 md:px-10 py-16 text-center font-mono text-sm text-on-surface-variant">
        LOADING SALON TELEMETRY...
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 md:px-10 py-16 text-center font-mono text-sm text-on-surface-variant">
        Competition not found.
      </div>
    );
  }

  const category = competition.categories?.[0];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-10 py-8 md:py-12 space-y-10">
      {/* Top Back Link */}
      <div className="font-mono text-xs">
        <Link
          href="/competitions"
          className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-primary-container transition-colors uppercase"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>BACK TO EXPLORE</span>
        </Link>
      </div>

      {/* Hero Header Banner */}
      <div className="relative w-full rounded-sm overflow-hidden border border-white/10 bg-surface-container-low">
        {/* Cover Image Background */}
        <div className="relative w-full h-[280px] sm:h-[360px] overflow-hidden bg-black">
          <img
            src={competition.coverImageUrl}
            alt={competition.title}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#131413] via-[#131413]/70 to-transparent" />

          {/* Floating Badges */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 font-mono">
            {category && (
              <span className="px-3 py-1 bg-black/80 backdrop-blur-md border border-white/10 rounded-xs text-[10px] uppercase font-bold tracking-widest text-primary-container">
                {category.name}
              </span>
            )}
            <CountdownPill
              targetDate={competition.submissionEndDate}
              status={competition.status}
            />
          </div>

          {/* Banner Meta Content */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-6 z-10">
            <div className="space-y-2 max-w-2xl font-mono">
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span>By {competition.organizer?.name || "Verified Organizer"}</span>
                <CheckCircle className="w-3.5 h-3.5 text-primary-container" />
              </div>
              <h1 className="font-headline text-2xl sm:text-4xl font-extrabold text-white uppercase leading-tight">
                {competition.title}
              </h1>
            </div>

            {/* CTA */}
            {competition.status === "OPEN" && (
              <div className="shrink-0">
                <BracketButton
                  variant="primary"
                  bracketStyle="brace"
                  size="lg"
                  href={`/competitions/${competition.id}/submit`}
                  leftIcon={<Sparkles className="w-4 h-4" />}
                >
                  SUBMIT ENTRY
                </BracketButton>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] font-mono text-xs">
        <button
          onClick={() => setActiveTab("gallery")}
          className={`px-4 py-3 border-b-2 uppercase font-bold tracking-wider transition-all flex items-center gap-2 ${
            activeTab === "gallery"
              ? "border-primary-container text-primary-container"
              : "border-transparent text-on-surface-variant hover:text-white"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>[PUBLIC GALLERY ({submissions.length})]</span>
        </button>

        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`px-4 py-3 border-b-2 uppercase font-bold tracking-wider transition-all flex items-center gap-2 ${
            activeTab === "leaderboard"
              ? "border-primary-container text-primary-container"
              : "border-transparent text-on-surface-variant hover:text-white"
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>[DUAL-TRACK LEADERBOARD]</span>
        </button>

        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-3 border-b-2 uppercase font-bold tracking-wider transition-all flex items-center gap-2 ${
            activeTab === "overview"
              ? "border-primary-container text-primary-container"
              : "border-transparent text-on-surface-variant hover:text-white"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>[RUBRIC & RULES]</span>
        </button>
      </div>

      {/* Tab 1: Public Gallery */}
      {activeTab === "gallery" && (
        <PhotoMasonryGallery
          submissions={submissions}
          showCategoryFilters={false}
        />
      )}

      {/* Tab 2: Dual-Track Leaderboard */}
      {activeTab === "leaderboard" && (
        <LeaderboardView
          entries={leaderboard}
          competitionTitle={competition.title}
        />
      )}

      {/* Tab 3: Overview & Rubric Breakdown */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 font-mono">
          <div className="lg:col-span-2 space-y-6">
            <DarkroomCard headerTitle="SALON SYNOPSIS & BRIEF">
              <p className="font-sans text-sm text-on-surface-variant leading-relaxed">
                {competition.description}
              </p>
            </DarkroomCard>

            {/* Rubric Weights */}
            {category?.rubricWeights && (
              <DarkroomCard headerTitle="8-DIMENSION ARTIMUSE RUBRIC WEIGHTS">
                <div className="space-y-3">
                  <p className="text-xs text-on-surface-variant mb-4">
                    Multimodal LLM evaluates incoming optical imagery across 8 orthogonal dimensions calibrated to this genre:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {Object.entries(category.rubricWeights).map(([attr, weight]) => {
                      const pct = Math.round((weight as number) * 100);
                      return (
                        <div key={attr} className="space-y-1">
                          <div className="flex justify-between uppercase text-white font-semibold">
                            <span>{attr}</span>
                            <span className="text-primary-container">{pct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-container rounded-full"
                              style={{ width: `${pct * 2.5}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </DarkroomCard>
            )}
          </div>

          {/* Sidebar Specs */}
          <div className="space-y-6">
            <DarkroomCard headerTitle="CONTEST RULES & LIMITS">
              <div className="space-y-4 text-xs">
                <div className="flex justify-between py-2 border-b border-white/[0.04]">
                  <span className="text-on-surface-variant">SUBMISSION CAP:</span>
                  <span className="text-white font-bold">{competition.maxEntriesPerUser} Photos / Entrant</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/[0.04]">
                  <span className="text-on-surface-variant">PRIZE POOL:</span>
                  <span className="text-podium-gold font-bold">${competition.totalPrizePoolUsd.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/[0.04]">
                  <span className="text-on-surface-variant">OPTICAL EXIF:</span>
                  <span className="text-primary-container font-bold">MANDATORY</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/[0.04]">
                  <span className="text-on-surface-variant">SYNTHETIC AI:</span>
                  <span className="text-status-error font-bold">STRICTLY PROHIBITED</span>
                </div>
              </div>
            </DarkroomCard>
          </div>
        </div>
      )}
    </div>
  );
}
