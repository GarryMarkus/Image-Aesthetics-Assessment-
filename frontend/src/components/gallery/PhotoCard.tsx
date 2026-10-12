"use client";

import React, { useState } from "react";
import { Heart, Sparkles, User } from "lucide-react";
import { Submission } from "@/types";
import { ExifHudBadge } from "@/components/hud";

export interface PhotoCardProps {
  submission: Submission;
  onSelect?: (submission: Submission) => void;
  showScore?: boolean;
}

export function PhotoCard({
  submission,
  onSelect,
  showScore = true,
}: PhotoCardProps) {
  const [upvotes, setUpvotes] = useState(submission.communityVotesCount || 0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasUpvoted) {
      setUpvotes((v) => v - 1);
      setHasUpvoted(false);
    } else {
      setUpvotes((v) => v + 1);
      setHasUpvoted(true);
    }
  };

  const imageSrc =
    submission.image?.previewWebpUrl ||
    submission.image?.originalUrl ||
    "/images/samples/03_portrait_artisan.png";

  const photographerName =
    submission.author?.name || submission.author?.username || "Photographer";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${submission.title} by ${photographerName}`}
      onClick={() => onSelect?.(submission)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(submission);
        }
      }}
      className="group relative mb-4 overflow-hidden rounded-sm bg-surface-container-low border border-white/[0.06] hover:border-primary-container/40 focus:border-primary-container focus:outline-none transition-all duration-300 cursor-pointer select-none"
    >
      {/* Aspect Ratio Preservation with Responsive Next/Image */}
      <div className="relative w-full overflow-hidden">
        {/* Subtle darkroom loading shimmer until image loads */}
        {!imageLoaded && (
          <div className="w-full aspect-[3/2] bg-surface-container animate-pulse" />
        )}

        <img
          src={imageSrc}
          alt={submission.title}
          loading="lazy"
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-auto object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Viewfinder reticle corner marks on hover */}
        <span className="absolute top-2 left-2 w-2 h-2 border-t-2 border-l-2 border-transparent group-hover:border-primary-container transition-colors z-20 pointer-events-none" />
        <span className="absolute top-2 right-2 w-2 h-2 border-t-2 border-r-2 border-transparent group-hover:border-primary-container transition-colors z-20 pointer-events-none" />
        <span className="absolute bottom-2 left-2 w-2 h-2 border-b-2 border-l-2 border-transparent group-hover:border-primary-container transition-colors z-20 pointer-events-none" />
        <span className="absolute bottom-2 right-2 w-2 h-2 border-b-2 border-r-2 border-transparent group-hover:border-primary-container transition-colors z-20 pointer-events-none" />

        {/* Top Badges (Category & Score) */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-20 pointer-events-none">
          {submission.category?.code && (
            <span className="px-2 py-0.5 bg-black/75 backdrop-blur-md border border-white/10 rounded-xs font-mono text-[9px] uppercase tracking-widest text-white/90">
              {submission.category.code}
            </span>
          )}

          {showScore && submission.totalScore && (
            <div className="pointer-events-auto">
              <span className="px-2 py-0.5 bg-black/85 backdrop-blur-md border border-primary-container/40 rounded-xs font-mono text-[10px] uppercase font-bold tracking-wider text-primary-container flex items-center gap-1 shadow-sm">
                <Sparkles className="w-2.5 h-2.5 text-primary-container" />
                <span>{submission.totalScore.toFixed(1)}</span>
              </span>
            </div>
          )}
        </div>

        {/* Cinematic Darkroom Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3.5 z-10">
          {/* Title & Author */}
          <div className="mb-2">
            <h4 className="font-headline text-sm font-bold text-white tracking-wide truncate">
              {submission.title}
            </h4>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-on-surface-variant truncate">
              <User className="w-3 h-3 text-primary-container" />
              <span>{photographerName}</span>
            </div>
          </div>

          {/* Bottom Telemetry HUD & Upvote CTA */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
            {/* EXIF Mini Badge */}
            {submission.exif && (
              <ExifHudBadge
                exif={{
                  aperture: submission.exif.apertureFNumber,
                  shutterSpeed: submission.exif.shutterSpeedFraction || undefined,
                  iso: submission.exif.iso || undefined,
                }}
                layout="compact"
              />
            )}

            {/* Upvote Button with Optimistic Animation */}
            <button
              onClick={handleUpvote}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-sm font-mono text-[10px] uppercase font-bold transition-all ${
                hasUpvoted
                  ? "bg-rose-500 text-white shadow-sm shadow-rose-500/30"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
              title="Community Upvote"
            >
              <Heart
                className={`w-3 h-3 ${hasUpvoted ? "fill-white" : ""}`}
              />
              <span>{upvotes.toLocaleString()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
