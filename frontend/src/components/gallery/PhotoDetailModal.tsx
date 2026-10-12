"use client";

import React, { useEffect } from "react";
import { X, Camera, MessageSquare, Heart } from "lucide-react";
import { Submission } from "@/types";
import { ExifHudBadge, ScoreTicker, ForensicChip, BracketButton } from "@/components/hud";

export interface PhotoDetailModalProps {
  submission: Submission | null;
  onClose: () => void;
}

export function PhotoDetailModal({ submission, onClose }: PhotoDetailModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Lock body scroll while modal is active
  useEffect(() => {
    if (submission) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [submission]);

  if (!submission) return null;

  const imageSrc =
    submission.image?.originalUrl ||
    submission.image?.previewWebpUrl ||
    "/images/samples/03_portrait_artisan.png";

  const authorName =
    submission.author?.name || submission.author?.username || "Photographer";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-detail-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-lg select-none"
    >
      {/* Container Card */}
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col lg:flex-row bg-surface-container-lowest border border-white/15 rounded-sm overflow-hidden shadow-2xl shadow-black">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-30 p-2 bg-black/80 hover:bg-white text-white hover:text-black rounded-xs border border-white/20 transition-all font-mono"
          title="Close Modal (Esc)"
          aria-label="Close Modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Side: High-Resolution Photographic Canvas */}
        <div className="relative flex-1 bg-black/95 flex items-center justify-center overflow-hidden min-h-[350px] lg:min-h-[550px] p-2">
          {/* Viewfinder corner accents */}
          <span className="absolute top-4 left-4 w-3 h-3 border-t-2 border-l-2 border-primary-container z-10" />
          <span className="absolute top-4 right-4 w-3 h-3 border-t-2 border-r-2 border-primary-container z-10" />
          <span className="absolute bottom-4 left-4 w-3 h-3 border-b-2 border-l-2 border-primary-container z-10" />
          <span className="absolute bottom-4 right-4 w-3 h-3 border-b-2 border-r-2 border-primary-container z-10" />

          <img
            src={imageSrc}
            alt={submission.title}
            className="max-h-[85vh] max-w-full object-contain rounded-xs shadow-2xl"
          />
        </div>

        {/* Right Side: Darkroom Telemetry & Critique Sidebar */}
        <div className="w-full lg:w-[420px] flex flex-col justify-between bg-surface-container-low border-t lg:border-t-0 lg:border-l border-white/10 p-5 overflow-y-auto max-h-[92vh] font-mono">
          <div className="space-y-5">
            {/* Header: Title & Category Pill */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 bg-primary-container/15 text-primary-container border border-primary-container/30 text-[9px] uppercase tracking-widest font-bold rounded-xs">
                  {submission.category?.name || "CONTEST ENTRY"}
                </span>
                <span className="text-on-surface-variant text-[10px] uppercase">
                  ID::{submission.id}
                </span>
              </div>
              <h2 id="photo-detail-modal-title" className="font-headline text-xl font-bold text-white leading-tight">
                {submission.title}
              </h2>
            </div>

            {/* Author Attribution */}
            <div className="flex items-center gap-3 p-3 bg-surface-container rounded-sm border border-white/[0.06]">
              <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-primary-container font-bold text-xs">
                {authorName.slice(0, 2).toUpperCase()}
              </div>
              <div className="truncate">
                <div className="font-semibold text-white text-xs truncate">
                  {authorName}
                </div>
                <div className="text-[10px] text-on-surface-variant truncate">
                  {submission.author?.bio || "Verified Entrant"}
                </div>
              </div>
            </div>

            {/* Aesthetic Score Card */}
            {submission.aestheticScore && (
              <div className="p-3.5 bg-surface-container rounded-sm border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-primary-container font-bold">
                    {"//"} ARTIMUSE SCORECARD
                  </span>
                  <ForensicChip status="OPTICAL_AUTHENTIC" size="sm" />
                </div>
                <ScoreTicker
                  score={submission.aestheticScore.totalScore}
                  percentileRank={submission.percentileRank || undefined}
                  size="md"
                  animate={false}
                />

                {/* Critique Teaser */}
                <div className="pt-2 border-t border-white/[0.06] text-xs space-y-1.5">
                  <div className="text-on-surface font-sans text-xs leading-relaxed italic">
                    &ldquo;{submission.aestheticScore.critiqueStrengths}&rdquo;
                  </div>
                </div>
              </div>
            )}

            {/* Complete Optical EXIF Parameters */}
            {submission.exif && (
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold flex items-center gap-1.5">
                  <Camera className="w-3 h-3 text-primary-container" />
                  <span>OPTICAL HARDWARE EXIF</span>
                </div>
                <ExifHudBadge
                  exif={{
                    cameraMake: submission.exif.cameraMake || undefined,
                    cameraModel: submission.exif.cameraModel || undefined,
                    lensModel: submission.exif.lensModel || undefined,
                    aperture: submission.exif.apertureFNumber || undefined,
                    shutterSpeed: submission.exif.shutterSpeedFraction || undefined,
                    iso: submission.exif.iso || undefined,
                    focalLength: submission.exif.focalLengthMm || undefined,
                  }}
                  layout="overlay"
                />
              </div>
            )}

            {/* Story / Intent */}
            {submission.story && (
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3 text-primary-container" />
                  <span>ARTISTIC STATEMENT</span>
                </div>
                <p className="font-sans text-xs text-on-surface-variant leading-relaxed p-3 bg-surface-container/60 rounded-sm border border-white/[0.04]">
                  {submission.story}
                </p>
              </div>
            )}
          </div>

          {/* Bottom Action Footer */}
          <div className="pt-4 mt-6 border-t border-white/10 flex items-center justify-between gap-3">
            <span className="text-[11px] text-on-surface-variant flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
              <span>{submission.communityVotesCount.toLocaleString()} community upvotes</span>
            </span>

            <BracketButton
              variant="outline"
              size="sm"
              bracketStyle="bracket"
              href={`/submissions/${submission.id}`}
            >
              FULL REPORT
            </BracketButton>
          </div>
        </div>
      </div>
    </div>
  );
}
