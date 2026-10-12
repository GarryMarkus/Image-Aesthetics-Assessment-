"use client";

import React from "react";

export interface DarkroomSkeletonProps {
  aspectRatio?: "3/2" | "4/3" | "16/9" | "1/1" | "auto";
  height?: string;
  width?: string;
  className?: string;
  scannerEffect?: boolean;
}

export function DarkroomSkeleton({
  aspectRatio = "3/2",
  height,
  width,
  className = "",
  scannerEffect = true,
}: DarkroomSkeletonProps) {
  const aspectClasses = {
    "3/2": "aspect-[3/2]",
    "4/3": "aspect-[4/3]",
    "16/9": "aspect-[16/9]",
    "1/1": "aspect-square",
    auto: "",
  }[aspectRatio];

  return (
    <div
      style={{
        height: height,
        width: width,
      }}
      className={`relative overflow-hidden bg-surface-container-low border border-white/[0.04] rounded-sm ${aspectClasses} ${className}`}
    >
      {/* Darkroom Exposure Shimmer */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-white/[0.05] to-transparent animate-pulse" />

      {/* Cybernetic Reticle Scanline */}
      {scannerEffect && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-[1px] bg-primary-container/20 shadow-[0_0_8px_rgba(175,247,85,0.4)] animate-[scan_3s_ease-in-out_infinite]" />
        </div>
      )}

      {/* Viewfinder Corner Ticks */}
      <span className="absolute top-2 left-2 w-2 h-2 border-t border-l border-white/20" />
      <span className="absolute top-2 right-2 w-2 h-2 border-t border-r border-white/20" />
      <span className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-white/20" />
      <span className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-white/20" />
    </div>
  );
}
