"use client";

import React from "react";
import { Camera, Aperture, Timer, Sun, Disc } from "lucide-react";

export interface ExifData {
  cameraMake?: string | null;
  cameraModel?: string | null;
  lensModel?: string | null;
  focalLength?: string | number | null;
  aperture?: string | number | null;
  shutterSpeed?: string | null;
  iso?: number | null;
}

export interface ExifHudBadgeProps {
  exif: ExifData;
  layout?: "overlay" | "inline" | "compact";
  className?: string;
}

export function ExifHudBadge({
  exif,
  layout = "overlay",
  className = "",
}: ExifHudBadgeProps) {
  const formatAperture = (ap?: string | number | null) => {
    if (!ap) return null;
    const s = String(ap);
    return s.startsWith("ƒ/") || s.startsWith("f/") ? s : `ƒ/${s}`;
  };

  const formattedAperture = formatAperture(exif.aperture);
  const cameraDisplay =
    [exif.cameraMake, exif.cameraModel].filter(Boolean).join(" ") ||
    "Camera Sensor";

  if (layout === "compact") {
    return (
      <div
        className={`inline-flex items-center gap-2 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-sm border border-white/10 text-[10px] font-mono text-white/90 ${className}`}
      >
        {formattedAperture && (
          <span className="text-primary-container font-semibold">
            {formattedAperture}
          </span>
        )}
        {exif.shutterSpeed && (
          <span className="text-white/80">{exif.shutterSpeed}</span>
        )}
        {exif.iso && (
          <span className="text-on-surface-variant">ISO {exif.iso}</span>
        )}
      </div>
    );
  }

  if (layout === "inline") {
    return (
      <div
        className={`flex flex-wrap items-center gap-2 text-xs font-mono ${className}`}
      >
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container border border-white/[0.08] rounded-sm text-white">
          <Camera className="w-3 h-3 text-primary-container" />
          <span>{cameraDisplay}</span>
        </span>
        {exif.lensModel && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container border border-white/[0.08] rounded-sm text-on-surface-variant">
            <Disc className="w-3 h-3 text-on-surface-variant" />
            <span className="truncate max-w-[180px]">{exif.lensModel}</span>
          </span>
        )}
        {formattedAperture && (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-surface-container border border-white/[0.08] rounded-sm text-primary-container font-semibold">
            <Aperture className="w-3 h-3" />
            <span>{formattedAperture}</span>
          </span>
        )}
        {exif.shutterSpeed && (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-surface-container border border-white/[0.08] rounded-sm text-white">
            <Timer className="w-3 h-3 text-on-surface-variant" />
            <span>{exif.shutterSpeed}</span>
          </span>
        )}
        {exif.iso && (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-surface-container border border-white/[0.08] rounded-sm text-on-surface-variant">
            <Sun className="w-3 h-3 text-on-surface-variant" />
            <span>ISO {exif.iso}</span>
          </span>
        )}
      </div>
    );
  }

  // "overlay" - Cybernetic Photographic HUD Box
  return (
    <div
      className={`bg-black/85 backdrop-blur-md border border-white/15 p-3 rounded-sm font-mono text-[11px] text-white/90 shadow-xl shadow-black/60 max-w-sm ${className}`}
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Camera className="w-3.5 h-3.5 text-primary-container" />
          <span className="font-semibold text-white tracking-wide truncate">
            {cameraDisplay}
          </span>
        </div>
        <span className="text-[9px] text-primary-container uppercase tracking-widest font-bold">
          EXIF::VALID
        </span>
      </div>

      {exif.lensModel && (
        <div className="text-[10px] text-on-surface-variant truncate mb-2">
          {exif.lensModel}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-white/[0.06]">
        <div className="bg-white/[0.04] p-1 rounded-sm">
          <div className="text-[9px] text-on-surface-variant uppercase">APERTURE</div>
          <div className="font-bold text-primary-container">
            {formattedAperture || "—"}
          </div>
        </div>
        <div className="bg-white/[0.04] p-1 rounded-sm">
          <div className="text-[9px] text-on-surface-variant uppercase">SHUTTER</div>
          <div className="font-bold text-white">
            {exif.shutterSpeed || "—"}
          </div>
        </div>
        <div className="bg-white/[0.04] p-1 rounded-sm">
          <div className="text-[9px] text-on-surface-variant uppercase">ISO</div>
          <div className="font-bold text-on-surface-variant">
            {exif.iso ? `ISO ${exif.iso}` : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
