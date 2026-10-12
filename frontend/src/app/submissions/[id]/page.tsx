"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Submission } from "@/types";
import { apiClient } from "@/lib/api/client";
import {
  ExifHudBadge,
  ScoreTicker,
  ForensicChip,
  BracketButton,
  DarkroomCard,
} from "@/components/hud";
import {
  ArrowLeft,
  Sparkles,
  Heart,
} from "lucide-react";

export default function SubmissionPublicPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [upvotes, setUpvotes] = useState(0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSub() {
      if (!id) return;
      try {
        const sub = await apiClient.getSubmissionById(id);
        if (sub) {
          setSubmission(sub);
          setUpvotes(sub.communityVotesCount || 0);
        }
      } catch (err) {
        console.error("Failed to load submission", err);
      } finally {
        setLoading(false);
      }
    }
    loadSub();
  }, [id]);

  const handleUpvote = async () => {
    if (!id) return;
    try {
      const res = await apiClient.voteSubmission(id);
      setHasUpvoted(res.hasVoted);
      setUpvotes(res.newVoteCount);
    } catch (err) {
      console.warn("Upvote request failed or requires sign-in", err);
      setUpvotes((v) => (hasUpvoted ? Math.max(0, v - 1) : v + 1));
      setHasUpvoted((prev) => !prev);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 md:px-10 py-16 text-center font-mono text-sm text-on-surface-variant">
        LOADING ARTWORK TELEMETRY...
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 md:px-10 py-16 text-center font-mono text-sm text-on-surface-variant">
        Submission record not found.
      </div>
    );
  }

  const imageSrc =
    submission.image?.originalUrl ||
    submission.image?.previewWebpUrl ||
    "/images/samples/03_portrait_artisan.png";

  const authorName =
    submission.author?.name || submission.author?.username || "Photographer";

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-10 py-8 md:py-12 space-y-10 font-mono">
      {/* Back Link */}
      <div className="text-xs">
        <Link
          href={submission.competitionId ? `/competitions/${submission.competitionId}` : "/competitions"}
          className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-primary-container transition-colors uppercase"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>BACK TO SALON</span>
        </Link>
      </div>

      {/* Main Photographic Stage */}
      <div className="relative w-full rounded-sm overflow-hidden bg-black border border-white/10 flex items-center justify-center p-3 sm:p-6 shadow-2xl">
        {/* Reticles */}
        <span className="absolute top-4 left-4 w-3 h-3 border-t-2 border-l-2 border-primary-container" />
        <span className="absolute top-4 right-4 w-3 h-3 border-t-2 border-r-2 border-primary-container" />
        <span className="absolute bottom-4 left-4 w-3 h-3 border-b-2 border-l-2 border-primary-container" />
        <span className="absolute bottom-4 right-4 w-3 h-3 border-b-2 border-r-2 border-primary-container" />

        <img
          src={imageSrc}
          alt={submission.title}
          className="max-h-[82vh] max-w-full object-contain rounded-xs shadow-2xl"
        />
      </div>

      {/* Metadata & Critique Teaser Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Title, Author, Story */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-3 pb-6 border-b border-white/[0.08]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 bg-primary-container/15 text-primary-container border border-primary-container/30 text-[10px] uppercase tracking-widest font-bold rounded-xs">
                {submission.category?.name || "CONTEST ENTRY"}
              </span>
              <ForensicChip status="OPTICAL_AUTHENTIC" size="sm" />
            </div>

            <h1 className="font-headline text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              {submission.title}
            </h1>

            {/* Author Attribution */}
            <div className="flex items-center gap-3 pt-2">
              <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-primary-container font-bold text-sm">
                {authorName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-white text-sm">
                  {authorName}
                </div>
                <div className="text-xs text-on-surface-variant">
                  {submission.author?.bio || "Verified Competitor"}
                </div>
              </div>
            </div>
          </div>

          {/* Artistic Statement */}
          {submission.story && (
            <DarkroomCard headerTitle="PHOTOGRAPHER'S STATEMENT">
              <p className="font-sans text-sm text-on-surface-variant leading-relaxed">
                {submission.story}
              </p>
            </DarkroomCard>
          )}

          {/* Camera Gear & Optics */}
          {submission.exif && (
            <DarkroomCard headerTitle="OPTICAL SENSOR TELEMETRY">
              <ExifHudBadge
                exif={{
                  cameraMake: submission.exif.cameraMake,
                  cameraModel: submission.exif.cameraModel,
                  lensModel: submission.exif.lensModel,
                  aperture: submission.exif.apertureFNumber,
                  shutterSpeed: submission.exif.shutterSpeedFraction,
                  iso: submission.exif.iso,
                  focalLength: submission.exif.focalLengthMm,
                }}
                layout="inline"
              />
            </DarkroomCard>
          )}
        </div>

        {/* Right Column: Score & Diagnostic CTA */}
        <div className="space-y-6">
          {/* Aesthetic Scorecard Box */}
          {submission.aestheticScore && (
            <DarkroomCard
              headerTitle="AI AESTHETIC EVALUATION"
              telemetryTag="ARTIMUSE_V1"
              className="space-y-4"
            >
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-on-surface-variant">
                  TOTAL APPRAISED SCORE:
                </span>
                <span className="text-[10px] text-primary-container font-bold">
                  TOP {100 - (submission.percentileRank || 95)}%
                </span>
              </div>

              <ScoreTicker
                score={submission.aestheticScore.totalScore}
                size="lg"
                animate={true}
              />

              <p className="text-xs font-sans text-on-surface-variant leading-relaxed italic border-t border-white/[0.06] pt-3">
                &ldquo;{submission.aestheticScore.critiqueStrengths}&rdquo;
              </p>

              <BracketButton
                variant="primary"
                bracketStyle="brace"
                size="md"
                href={`/submissions/${submission.id}/scorecard`}
                className="w-full mt-2"
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                VIEW FULL 8-AXIS RADAR REPORT
              </BracketButton>
            </DarkroomCard>
          )}

          {/* Community Vote CTA */}
          <DarkroomCard headerTitle="COMMUNITY POPULAR TRACK">
            <div className="flex items-center justify-between">
              <span className="text-xs text-on-surface-variant">
                CROWD VOTES:
              </span>
              <button
                onClick={handleUpvote}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-sm font-mono text-xs font-bold transition-all ${
                  hasUpvoted
                    ? "bg-rose-500 text-white shadow-md shadow-rose-500/30"
                    : "bg-surface-container-high text-white hover:bg-white hover:text-black"
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${hasUpvoted ? "fill-white" : ""}`}
                />
                <span>{upvotes.toLocaleString()} UPVOTES</span>
              </button>
            </div>
          </DarkroomCard>
        </div>
      </div>
    </div>
  );
}
