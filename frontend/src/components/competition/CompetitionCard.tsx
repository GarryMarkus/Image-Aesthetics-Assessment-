"use client";

import React from "react";
import Link from "next/link";
import { Competition } from "@/types";
import { CountdownPill, BracketButton } from "@/components/hud";
import { Trophy, CheckCircle, Users, ArrowUpRight } from "lucide-react";

export interface CompetitionCardProps {
  competition: Competition;
  className?: string;
}

export function CompetitionCard({
  competition,
  className = "",
}: CompetitionCardProps) {
  const primaryCategory = competition.categories?.[0];
  const organizerName =
    competition.organizer?.name ||
    competition.organizer?.username ||
    "Tokyo Photographic Society";

  return (
    <div
      className={`group relative flex flex-col justify-between bg-surface-container-low border border-white/[0.08] hover:border-primary-container/40 rounded-sm overflow-hidden transition-all duration-300 shadow-lg shadow-black/40 hover:shadow-primary-container/5 ${className}`}
    >
      {/* Top Banner & Floating Badges */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-black">
        <img
          src={competition.coverImageUrl}
          alt={competition.title}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 opacity-90 group-hover:opacity-100"
        />

        {/* Dark Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#131413] via-transparent to-black/60 pointer-events-none" />

        {/* Viewfinder reticle corners on banner */}
        <span className="absolute top-2 left-2 w-2 h-2 border-t border-l border-white/30 group-hover:border-primary-container transition-colors" />
        <span className="absolute top-2 right-2 w-2 h-2 border-t border-r border-white/30 group-hover:border-primary-container transition-colors" />

        {/* Category & Status Pill Bar */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          {primaryCategory && (
            <span className="px-2 py-0.5 bg-black/80 backdrop-blur-md border border-white/10 rounded-xs font-mono text-[9px] uppercase tracking-widest text-primary-container font-bold">
              {primaryCategory.code}
            </span>
          )}

          <CountdownPill
            targetDate={competition.submissionEndDate}
            status={competition.status}
          />
        </div>

        {/* Prize Pool Floating Badge */}
        {competition.totalPrizePoolUsd > 0 && (
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 bg-black/85 backdrop-blur-md border border-podium-gold/40 rounded-xs font-mono text-[10px] text-podium-gold font-bold tracking-wider">
            <Trophy className="w-3 h-3 text-podium-gold" />
            <span>${competition.totalPrizePoolUsd.toLocaleString()} PRIZE POOL</span>
          </div>
        )}
      </div>

      {/* Card Content Body */}
      <div className="flex-1 p-5 flex flex-col justify-between font-mono space-y-4">
        <div>
          {/* Organizer Attribution */}
          <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant mb-2">
            <span>By {organizerName}</span>
            <CheckCircle className="w-3 h-3 text-primary-container" />
          </div>

          {/* Competition Title */}
          <Link href={`/competitions/${competition.id}`}>
            <h3 className="font-headline text-lg font-bold text-white group-hover:text-primary-container transition-colors leading-snug line-clamp-2">
              {competition.title}
            </h3>
          </Link>

          {/* Short Description */}
          <p className="font-mono text-xs text-on-surface-variant line-clamp-2 mt-2 leading-relaxed">
            {competition.description}
          </p>
        </div>

        {/* Footer Metrics & CTA Row */}
        <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant">
            <Users className="w-3.5 h-3.5 text-primary-container" />
            <span>{competition.submissionsCount || 0} Entries</span>
          </div>

          <div className="flex items-center gap-2">
            <BracketButton
              variant={competition.status === "OPEN" ? "primary" : "secondary"}
              bracketStyle="bracket"
              size="sm"
              href={`/competitions/${competition.id}`}
              rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
            >
              {competition.status === "OPEN" ? "ENTER" : "GALLERY"}
            </BracketButton>
          </div>
        </div>
      </div>
    </div>
  );
}
