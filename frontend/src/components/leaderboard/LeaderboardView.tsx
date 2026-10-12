"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LeaderboardEntry } from "@/types";
import { Trophy, Award, Sparkles, Heart, ArrowUpRight } from "lucide-react";
import { BracketButton } from "@/components/hud";

export interface LeaderboardViewProps {
  entries: LeaderboardEntry[];
  currentTrack?: "ai" | "community";
  onTrackChange?: (track: "ai" | "community") => void;
  competitionTitle?: string;
  className?: string;
}

export function LeaderboardView({
  entries,
  currentTrack = "ai",
  onTrackChange,
  competitionTitle,
  className = "",
}: LeaderboardViewProps) {
  const [track, setTrack] = useState<"ai" | "community">(currentTrack);

  const handleTrackChange = (newTrack: "ai" | "community") => {
    setTrack(newTrack);
    onTrackChange?.(newTrack);
  };

  const top3 = entries.slice(0, 3);
  const remaining = entries.slice(3);

  const getPodiumBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          title: "1ST PLACE GRAND WINNER",
          color: "text-podium-gold",
          border: "border-podium-gold/50 shadow-podium-gold/15",
          badgeBg: "bg-podium-gold text-black",
          icon: Trophy,
        };
      case 2:
        return {
          title: "2ND PLACE RUNNER-UP",
          color: "text-slate-300",
          border: "border-slate-400/40 shadow-slate-400/10",
          badgeBg: "bg-slate-300 text-black",
          icon: Award,
        };
      case 3:
        return {
          title: "3RD PLACE PODIUM",
          color: "text-amber-600",
          border: "border-amber-600/40 shadow-amber-600/10",
          badgeBg: "bg-amber-600 text-white",
          icon: Award,
        };
      default:
        return null;
    }
  };

  return (
    <div className={`w-full space-y-8 font-mono ${className}`}>
      {/* Top Track Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          {competitionTitle && (
            <span className="text-[10px] uppercase tracking-widest text-on-surface-variant block mb-1">
              COMPETITION LEADERBOARD
            </span>
          )}
          <h2 className="font-headline text-xl sm:text-2xl font-bold text-white uppercase flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary-container" />
            <span>STANDINGS & STANDARDS</span>
          </h2>
        </div>

        {/* Dual-Track Tabs (Photocrowd Inspired) */}
        <div className="inline-flex bg-surface-container p-1 rounded-sm border border-white/[0.08] self-start sm:self-auto">
          <button
            onClick={() => handleTrackChange("ai")}
            className={`px-4 py-2 rounded-xs uppercase tracking-wider text-xs font-bold transition-all flex items-center gap-2 ${
              track === "ai"
                ? "bg-primary-container text-on-primary-fixed shadow-sm"
                : "text-on-surface-variant hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>TRACK A: AI AESTHETIC JURY</span>
          </button>
          <button
            onClick={() => handleTrackChange("community")}
            className={`px-4 py-2 rounded-xs uppercase tracking-wider text-xs font-bold transition-all flex items-center gap-2 ${
              track === "community"
                ? "bg-primary-container text-on-primary-fixed shadow-sm"
                : "text-on-surface-variant hover:text-white"
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>TRACK B: COMMUNITY CHOICE</span>
          </button>
        </div>
      </div>

      {/* ZERO-STATE EMPTY LEADERBOARD */}
      {entries.length === 0 && (
        <div className="w-full py-16 text-center font-mono text-sm text-on-surface-variant border border-dashed border-white/10 rounded-sm space-y-2">
          <Trophy className="w-8 h-8 text-on-surface-variant/40 mx-auto mb-2" />
          <div className="font-bold text-white uppercase">NO SUBMISSIONS SCORED ON THIS TRACK YET</div>
          <div className="text-xs text-on-surface-variant">Scores will populate as the multimodal AI evaluates entries.</div>
        </div>
      )}

      {/* TOP 3 PODIUM THEATER */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          {top3.map((entry) => {
            const podium = getPodiumBadge(entry.rank);
            if (!podium) return null;
            const Icon = podium.icon;
            const sub = entry.submission;
            const author = sub.author?.name || sub.author?.username || "Photographer";

            return (
              <div
                key={sub.id}
                className={`relative flex flex-col bg-surface-container-low border rounded-sm overflow-hidden transition-all duration-300 shadow-xl ${podium.border} ${
                  entry.rank === 1 ? "md:-translate-y-4" : ""
                }`}
              >
                {/* Visual Rank Ribbon Header */}
                <div
                  className={`px-3 py-1.5 flex items-center justify-between text-[10px] font-bold tracking-widest ${podium.badgeBg}`}
                >
                  <span className="flex items-center gap-1.5 uppercase">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{podium.title}</span>
                  </span>
                  <span>RANK #{entry.rank}</span>
                </div>

                {/* Photo Viewport */}
                <div className="relative w-full aspect-[4/3] overflow-hidden bg-black group">
                  <img
                    src={sub.image?.previewWebpUrl || sub.image?.originalUrl || ""}
                    alt={sub.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                    <span className="text-[10px] text-white/80 uppercase">
                      By {author}
                    </span>
                  </div>
                </div>

                {/* Score & Telemetry Meta */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-headline text-base font-bold text-white truncate">
                      {sub.title}
                    </h3>
                    <span className="text-xs text-on-surface-variant truncate block">
                      {author}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-2 border-t border-white/[0.06]">
                    <span className="text-[10px] text-on-surface-variant uppercase">
                      {track === "ai" ? "TOTAL ARTIMUSE SCORE" : "CROWD UPVOTES"}
                    </span>
                    <span className={`font-headline text-2xl font-extrabold ${podium.color}`}>
                      {track === "ai"
                        ? (entry.score).toFixed(1)
                        : entry.score.toLocaleString()}
                    </span>
                  </div>

                  <BracketButton
                    variant="secondary"
                    size="sm"
                    bracketStyle="bracket"
                    href={`/submissions/${sub.id}`}
                    className="w-full"
                    rightIcon={<ArrowUpRight className="w-3 h-3" />}
                  >
                    INSPECT SCORECARD
                  </BracketButton>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RANKED DATA TABLE FOR 4TH+ PLACES */}
      {remaining.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">
            {"//"} SHORTLISTED FINALISTS (RANKS #4+)
          </div>

          <div className="w-full overflow-x-auto border border-white/[0.06] rounded-sm bg-surface-container-low">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-[10px] uppercase text-on-surface-variant tracking-wider bg-surface-container/50">
                  <th className="py-3 px-4">RANK</th>
                  <th className="py-3 px-4">PREVIEW</th>
                  <th className="py-3 px-4">TITLE & PHOTOGRAPHER</th>
                  <th className="py-3 px-4">CATEGORY</th>
                  <th className="py-3 px-4">CAMERA GEAR</th>
                  <th className="py-3 px-4 text-right">
                    {track === "ai" ? "AI SCORE" : "UPVOTES"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {remaining.map((entry) => {
                  const sub = entry.submission;
                  const author = sub.author?.name || sub.author?.username || "Photographer";

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 px-4 font-bold text-primary-container">
                        #{entry.rank}
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-12 h-9 rounded-xs overflow-hidden bg-black border border-white/10">
                          <img
                            src={sub.image?.previewWebpUrl || sub.image?.originalUrl || ""}
                            alt={sub.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/submissions/${sub.id}`}
                          className="font-headline font-bold text-white hover:text-primary-container transition-colors block"
                        >
                          {sub.title}
                        </Link>
                        <span className="text-[11px] text-on-surface-variant">
                          {author}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] uppercase text-on-surface-variant">
                        {sub.category?.code || "GENERAL"}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-on-surface-variant">
                        {sub.exif?.cameraModel || "Optical Sensor"}
                      </td>
                      <td className="py-3 px-4 text-right font-headline font-bold text-sm text-primary-container">
                        {track === "ai"
                          ? (entry.score).toFixed(1)
                          : entry.score.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
