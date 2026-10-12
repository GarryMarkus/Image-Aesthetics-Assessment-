"use client";

import { Sparkles, AlertCircle, Compass } from "lucide-react";
import { DarkroomCard } from "@/components/hud";

export interface CritiqueCardProps {
  strengths: string;
  weaknesses: string;
  actionable: string;
  modelName?: string;
  className?: string;
}

export function CritiqueCard({
  strengths,
  weaknesses,
  actionable,
  modelName = "gemini-2.5-flash::ArtiMuse-10K",
  className = "",
}: CritiqueCardProps) {
  return (
    <DarkroomCard
      headerTitle="ARTIMUSE WORKSHOP CRITIQUE & SYNTHESIS"
      telemetryTag={modelName}
      className={`space-y-6 font-mono ${className}`}
    >
      {/* 1. Strengths */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-primary-container uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-primary-container" />
          <span>01 // MASTERFUL ELEMENTS & STRENGTHS</span>
        </div>
        <div className="p-3.5 bg-surface-container rounded-sm border border-primary-container/20 font-sans text-xs sm:text-sm text-white/95 leading-relaxed">
          {strengths}
        </div>
      </div>

      {/* 2. Weaknesses */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>02 // COMPOSITIONAL & TECHNICAL VULNERABILITIES</span>
        </div>
        <div className="p-3.5 bg-surface-container rounded-sm border border-amber-500/20 font-sans text-xs sm:text-sm text-on-surface leading-relaxed">
          {weaknesses || "No critical optical defects detected. High fidelity across sensor field."}
        </div>
      </div>

      {/* 3. Actionable Workshop Advice */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#818cf8] uppercase tracking-wider">
          <Compass className="w-3.5 h-3.5 text-[#818cf8]" />
          <span>03 // ACTIONABLE WORKSHOP RECOMMENDATION</span>
        </div>
        <div className="p-3.5 bg-surface-container rounded-sm border border-[#6366f1]/20 font-sans text-xs sm:text-sm text-on-surface leading-relaxed">
          {actionable}
        </div>
      </div>
    </DarkroomCard>
  );
}
