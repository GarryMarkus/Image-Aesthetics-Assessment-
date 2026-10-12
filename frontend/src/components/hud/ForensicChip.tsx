"use client";

import React from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Flame,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";

export type ForensicStatus =
  | "OPTICAL_AUTHENTIC"
  | "SYNTHETIC_DIFFUSION"
  | "DEFECT_BLUR"
  | "DEFECT_NOISE"
  | "DEFECT_HIGHLIGHTS"
  | "DUPLICATE_BURST"
  | "EXIF_MISSING";

export interface ForensicChipProps {
  status: ForensicStatus;
  penaltyDeduction?: number; // e.g. -2.5
  customMessage?: string;
  size?: "sm" | "md";
  className?: string;
}

export function ForensicChip({
  status,
  penaltyDeduction,
  customMessage,
  size = "md",
  className = "",
}: ForensicChipProps) {
  const getConfig = () => {
    switch (status) {
      case "OPTICAL_AUTHENTIC":
        return {
          icon: ShieldCheck,
          label: "AUTHENTIC SENSOR OPTICS",
          classes:
            "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          iconColor: "text-emerald-400",
        };
      case "SYNTHETIC_DIFFUSION":
        return {
          icon: Flame,
          label: "SYNTHETIC AI FLAGGED (DISQUALIFIED)",
          classes: "bg-rose-500/15 text-rose-400 border-rose-500/40 font-bold",
          iconColor: "text-rose-400",
        };
      case "DEFECT_BLUR":
        return {
          icon: AlertTriangle,
          label: "MISSED FOCUS / MOTION BLUR",
          classes: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          iconColor: "text-amber-400",
        };
      case "DEFECT_NOISE":
        return {
          icon: AlertTriangle,
          label: "HIGH SENSOR NOISE / GRAIN",
          classes: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          iconColor: "text-amber-400",
        };
      case "DEFECT_HIGHLIGHTS":
        return {
          icon: AlertTriangle,
          label: "CLIPPED SPECULAR HIGHLIGHTS",
          classes: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          iconColor: "text-amber-400",
        };
      case "DUPLICATE_BURST":
        return {
          icon: Layers,
          label: "NEAR-DUPLICATE BURST (dHash <= 4)",
          classes: "bg-orange-500/10 text-orange-400 border-orange-500/30",
          iconColor: "text-orange-400",
        };
      case "EXIF_MISSING":
        return {
          icon: Info,
          label: "OPTICAL EXIF STRIPPED",
          classes: "bg-white/10 text-on-surface-variant border-white/20",
          iconColor: "text-white/60",
        };
      default:
        return {
          icon: Info,
          label: "STATUS RECORDED",
          classes: "bg-white/10 text-white border-white/20",
          iconColor: "text-white",
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[9px] gap-1",
    md: "px-2.5 py-1 text-[10px] gap-1.5",
  }[size];

  return (
    <div
      className={`inline-flex items-center border rounded-sm font-mono uppercase tracking-wider select-none ${sizeClasses} ${config.classes} ${className}`}
    >
      <Icon className={`w-3 h-3 ${config.iconColor}`} />
      <span>{customMessage || config.label}</span>
      {penaltyDeduction !== undefined && (
        <span className="font-bold ml-1 px-1 py-0.2 bg-black/40 rounded-xs">
          {penaltyDeduction > 0 ? `-${penaltyDeduction}` : penaltyDeduction}
        </span>
      )}
    </div>
  );
}
