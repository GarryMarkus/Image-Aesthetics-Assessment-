"use client";

import React, { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

export interface ScoreTickerProps {
  score: number; // 0.0 to 100.0
  maxScore?: number;
  percentileRank?: number; // e.g. 96 for Top 4%
  showTierBadge?: boolean;
  size?: "sm" | "md" | "lg" | "hero";
  animate?: boolean;
  className?: string;
}

export type ScoreTier = "EXCEPTIONAL" | "COMMENDED" | "COMPETENT" | "DEFECT_FLAGGED";

export function getScoreTier(score: number): {
  tier: ScoreTier;
  label: string;
  colorClass: string;
  borderClass: string;
  badgeBg: string;
} {
  if (score >= 90) {
    return {
      tier: "EXCEPTIONAL",
      label: "MASTERPIECE // TOP TIER",
      colorClass: "text-primary-container",
      borderClass: "border-primary-container/40 shadow-primary-container/20",
      badgeBg: "bg-primary-container text-on-primary-fixed",
    };
  }
  if (score >= 75) {
    return {
      tier: "COMMENDED",
      label: "HIGHLY COMMENDED",
      colorClass: "text-[#818cf8]",
      borderClass: "border-[#818cf8]/40 shadow-[#818cf8]/20",
      badgeBg: "bg-[#6366f1] text-white",
    };
  }
  if (score >= 60) {
    return {
      tier: "COMPETENT",
      label: "COMPETENT // ACCEPTED",
      colorClass: "text-podium-gold",
      borderClass: "border-podium-gold/40 shadow-podium-gold/20",
      badgeBg: "bg-podium-gold text-black",
    };
  }
  return {
    tier: "DEFECT_FLAGGED",
    label: "DEFECT PENALTY FLAGGED",
    colorClass: "text-status-error",
    borderClass: "border-status-error/40 shadow-status-error/20",
    badgeBg: "bg-status-error text-white",
  };
}

export function ScoreTicker({
  score,
  maxScore = 100,
  percentileRank,
  showTierBadge = true,
  size = "md",
  animate = true,
  className = "",
}: ScoreTickerProps) {
  const [displayedScore, setDisplayedScore] = useState(animate ? 0 : score);
  const tierInfo = getScoreTier(score);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!animate || prefersReducedMotion) {
      setDisplayedScore(score);
      return;
    }

    let frameId: number;
    let start = 0;
    const duration = 1200; // ms
    const startTime = performance.now();

    const updateScore = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = start + easeProgress * (score - start);

      setDisplayedScore(Number(current.toFixed(1)));

      if (progress < 1) {
        frameId = requestAnimationFrame(updateScore);
      } else {
        setDisplayedScore(score);
      }
    };

    frameId = requestAnimationFrame(updateScore);
    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [score, animate]);

  const sizeStyles = {
    sm: {
      number: "text-lg md:text-xl font-bold",
      denom: "text-[10px]",
      container: "p-2 gap-1.5",
    },
    md: {
      number: "text-2xl md:text-3xl font-bold",
      denom: "text-xs",
      container: "p-3 gap-2",
    },
    lg: {
      number: "text-4xl md:text-5xl font-extrabold tracking-tight",
      denom: "text-sm",
      container: "p-4 gap-3",
    },
    hero: {
      number: "text-6xl md:text-7xl font-black tracking-tight",
      denom: "text-base",
      container: "p-6 gap-4",
    },
  }[size];

  return (
    <div
      className={`inline-flex flex-col bg-surface-container-low border rounded-sm font-mono transition-all ${tierInfo.borderClass} ${sizeStyles.container} ${className}`}
    >
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-1">
          <span className={`font-headline ${sizeStyles.number} ${tierInfo.colorClass}`}>
            {displayedScore.toFixed(1)}
          </span>
          <span className={`text-on-surface-variant font-mono ${sizeStyles.denom}`}>
            /{maxScore}
          </span>
        </div>

        {percentileRank && (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm bg-white/10 text-white flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-primary-container" />
            <span>TOP {100 - percentileRank}%</span>
          </span>
        )}
      </div>

      {showTierBadge && (
        <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06] mt-1">
          <span
            className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-xs ${tierInfo.badgeBg}`}
          >
            {tierInfo.tier}
          </span>
          <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider truncate">
            {tierInfo.label}
          </span>
        </div>
      )}
    </div>
  );
}
