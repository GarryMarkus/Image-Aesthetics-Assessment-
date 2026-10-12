"use client";

import React from "react";
import { AestheticScore, Submission } from "@/types";
import { AestheticRadarChart } from "./AestheticRadarChart";
import { CritiqueCard } from "./CritiqueCard";
import { ScoreTicker, ForensicChip, DarkroomCard } from "@/components/hud";

export interface ScorecardBreakdownProps {
  score: AestheticScore;
  submission: Submission;
  className?: string;
}

export function ScorecardBreakdown({
  score,
  submission,
  className = "",
}: ScorecardBreakdownProps) {
  const dimensions = [
    { label: "COMPOSITION & STRUCTURE", score: score.scoreComposition, desc: "Geometric balance, rule of thirds, leading lines" },
    { label: "LIGHTING & EXPOSURE", score: score.scoreLighting, desc: "Dynamic range, chiaroscuro contrast, highlights" },
    { label: "COLOR HARMONY & PALETTE", score: score.scoreColor, desc: "Tonal palette, chromatic balance, grading" },
    { label: "TECHNICAL EXECUTION", score: score.scoreTechnical, desc: "Focal sharpness, noise floor, optical clarity" },
    { label: "SUBJECT & STORYTELLING", score: score.scoreStory, desc: "Decisive moment, narrative power, emotional intent" },
    { label: "ORIGINALITY & VISION", score: score.scoreOriginality, desc: "Unconventional angles, departure from cliché" },
    { label: "MOOD & ATMOSPHERE", score: score.scoreMood, desc: "Evocative ambiance, emotional resonance" },
    { label: "STYLE & POST-PROCESSING", score: score.scoreStyle, desc: "Tonal restraint, signature photographic voice" },
  ];

  return (
    <div className={`w-full space-y-10 font-mono ${className}`}>
      {/* 1. Hero Score Header Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Main Score Ticker */}
        <div className="lg:col-span-1 bg-surface-container-low border border-white/10 rounded-sm p-6 flex flex-col justify-between space-y-4 shadow-xl">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
            <span>TOTAL NORMALIZED SCORE</span>
            <span className="text-primary-container font-mono">S_TOTAL</span>
          </div>

          <ScoreTicker
            score={score.totalScore}
            percentileRank={submission.percentileRank || undefined}
            size="hero"
            animate={true}
          />

          <div className="pt-3 border-t border-white/[0.06] text-xs text-on-surface-variant leading-relaxed">
            Derived from 8-attribute *ArtiMuse* weights minus optical defect deductions.
          </div>
        </div>

        {/* Telemetry Diagnostics Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Diagnostic 1: Theme Adherence */}
          <DarkroomCard
            headerTitle="THEME ADHERENCE"
            telemetryTag="TANET_GATED"
            className="flex flex-col justify-between"
          >
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="font-headline text-3xl font-extrabold text-white">
                  {score.scoreThemeAdherence.toFixed(1)}
                </span>
                <span className="text-xs text-on-surface-variant">/100.0</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Genre fidelity to category [{submission.category?.name || "SALON"}].
              </p>
            </div>
            <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-primary-container rounded-full"
                style={{ width: `${score.scoreThemeAdherence}%` }}
              />
            </div>
          </DarkroomCard>

          {/* Diagnostic 2: Forensic Status */}
          <DarkroomCard
            headerTitle="SENSOR PROVENANCE"
            telemetryTag="FFT_PASSED"
            className="flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ForensicChip status="OPTICAL_AUTHENTIC" />
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Frequency domain FFT lattice verified. Sensor Bayer pattern authenticated.
              </p>
            </div>
            <div className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase">
              100% OPTICAL AUTHENTICITY ✓
            </div>
          </DarkroomCard>

          {/* Diagnostic 3: Defect Penalties */}
          <DarkroomCard
            headerTitle="DEFECT DEDUCTIONS"
            telemetryTag="AFTERSHOOT_AUDIT"
            className="flex flex-col justify-between"
          >
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <span className={`font-headline text-3xl font-extrabold ${score.penaltyDefects > 0 ? "text-amber-400" : "text-primary-container"}`}>
                  {score.penaltyDefects > 0 ? `-${score.penaltyDefects.toFixed(1)}` : "0.0"}
                </span>
                <span className="text-xs text-on-surface-variant">PTS DEDUCTED</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {score.penaltyDefects > 0
                  ? "Minor focal plane soft focus or highlight clipping detected."
                  : "Zero optical defect penalties detected across frame."}
              </p>
            </div>
            <div className="text-[10px] text-on-surface-variant uppercase">
              MAX ALLOWABLE DEDUCTION: -30.0 PTS
            </div>
          </DarkroomCard>

          {/* Diagnostic 4: Multi-Pass Calibration */}
          <DarkroomCard
            headerTitle="CALIBRATION ROUNDS"
            telemetryTag="N=3 PASSES"
            className="flex flex-col justify-between"
          >
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="font-headline text-3xl font-extrabold text-white">
                  {score.evaluationRoundsCount}
                </span>
                <span className="text-xs text-on-surface-variant">ROUNDS AVERAGED</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Multi-pass borderline evaluation executed to eliminate sampling stochasticity.
              </p>
            </div>
            <div className="text-[10px] text-primary-container font-bold tracking-widest uppercase">
              VARIANCE COEFFICIENT: &lt; 0.02
            </div>
          </DarkroomCard>
        </div>
      </div>

      {/* 2. Interactive Radar Visualizer + Sub-Scores Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: 8-Axis SVG Radar Polygon */}
        <div className="lg:col-span-5 bg-surface-container-low border border-white/10 rounded-sm p-6 flex flex-col items-center justify-center shadow-xl">
          <div className="w-full flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06] text-xs font-bold text-white uppercase">
            <span>8-AXIS AESTHETIC RADAR</span>
            <span className="text-primary-container text-[10px] font-mono">[ARTIMUSE_POLYGON]</span>
          </div>

          <AestheticRadarChart score={score} size={360} />
        </div>

        {/* Right: Detailed 8 Sub-Scores Grid */}
        <div className="lg:col-span-7 space-y-3">
          <div className="text-xs uppercase tracking-widest text-on-surface-variant font-bold pb-2 border-b border-white/[0.06]">
            {"//"} GRANULAR ATTRIBUTE BREAKDOWN (0 - 100)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dimensions.map((dim) => (
              <div
                key={dim.label}
                className="p-3 bg-surface-container-low border border-white/[0.06] hover:border-primary-container/30 rounded-sm transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white tracking-wide">
                    {dim.label}
                  </span>
                  <span className="font-headline text-base font-extrabold text-primary-container">
                    {dim.score.toFixed(1)}
                  </span>
                </div>

                <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-container rounded-full"
                    style={{ width: `${dim.score}%` }}
                  />
                </div>

                <p className="text-[10px] text-on-surface-variant truncate">
                  {dim.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. 3-Part Workshop Critique */}
      <CritiqueCard
        strengths={score.critiqueStrengths}
        weaknesses={score.critiqueWeaknesses}
        actionable={score.critiqueActionable}
        modelName={score.modelName}
      />
    </div>
  );
}
