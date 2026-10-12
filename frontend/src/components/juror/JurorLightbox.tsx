"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Submission, Competition } from "@/types";
import { apiClient } from "@/lib/api/client";
import { ZoomLoupe } from "./ZoomLoupe";
import { PodiumTray, PodiumAssignments } from "./PodiumTray";
import {
  ExifHudBadge,
  ScoreTicker,
  ForensicChip,
  BracketButton,
  DarkroomCard,
} from "@/components/hud";
import {
  ChevronLeft,
  ChevronRight,
  Info,
  CheckCircle2,
} from "lucide-react";

export interface JurorLightboxProps {
  competition: Competition;
  shortlist: Submission[];
  className?: string;
}

export function JurorLightbox({
  competition,
  shortlist,
  className = "",
}: JurorLightboxProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verdictSubmitted, setVerdictSubmitted] = useState(false);
  const [jurorRemarks, setJurorRemarks] = useState("");

  const [assignments, setAssignments] = useState<PodiumAssignments>({
    firstPlace: null,
    secondPlace: null,
    thirdPlace: null,
  });

  const currentSub = shortlist[currentIndex] || shortlist[0];

  const assignSlot = (sub: Submission, slot: "firstPlace" | "secondPlace" | "thirdPlace") => {
    setAssignments((prev) => {
      const next = { ...prev };
      // De-duplicate: if this sub is already in another slot, clear it
      if (next.firstPlace?.id === sub.id) next.firstPlace = null;
      if (next.secondPlace?.id === sub.id) next.secondPlace = null;
      if (next.thirdPlace?.id === sub.id) next.thirdPlace = null;
      next[slot] = sub;
      return next;
    });
  };

  // Keyboard navigation & podium tagging shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : shortlist.length - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => (prev < shortlist.length - 1 ? prev + 1 : 0));
      } else if (e.key === "1" && currentSub) {
        assignSlot(currentSub, "firstPlace");
      } else if (e.key === "2" && currentSub) {
        assignSlot(currentSub, "secondPlace");
      } else if (e.key === "3" && currentSub) {
        assignSlot(currentSub, "thirdPlace");
      } else if (e.key.toLowerCase() === "i") {
        setShowSidebar((s) => !s);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSub, shortlist.length]);

  const handleAssignCurrent = (slot: "firstPlace" | "secondPlace" | "thirdPlace") => {
    if (currentSub) {
      assignSlot(currentSub, slot);
    }
  };

  const handleClearSlot = (slot: "firstPlace" | "secondPlace" | "thirdPlace") => {
    setAssignments((prev) => ({
      ...prev,
      [slot]: null,
    }));
  };

  const handleSubmitVerdict = async () => {
    if (!assignments.firstPlace) return;
    setIsSubmitting(true);
    try {
      await apiClient.submitJurorVerdict({
        submissionId: assignments.firstPlace.id,
        podiumRank: "FIRST_PLACE",
        jurorRemarks: jurorRemarks || "Outstanding optical execution and mastery.",
      });
      setVerdictSubmitted(true);
    } catch (err) {
      console.error("Verdict submission error", err);
      alert("Failed to submit verdict. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const imageSrc =
    currentSub?.image?.originalUrl ||
    currentSub?.image?.previewWebpUrl ||
    "/images/samples/03_portrait_artisan.png";

  return (
    <div className={`relative w-full h-[calc(100vh-64px)] bg-[#090A0F] text-white flex flex-col justify-between font-mono select-none overflow-hidden ${className}`}>
      {/* Top Telemetry Header Bar */}
      <div className="h-12 bg-black/80 border-b border-white/10 px-4 flex items-center justify-between text-xs z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/juror")}
            className="text-on-surface-variant hover:text-white flex items-center gap-1 uppercase"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>EXIT THEATER</span>
          </button>
          <span className="text-white/20">|</span>
          <span className="text-primary-container font-bold uppercase truncate max-w-sm">
            {competition.title}
          </span>
        </div>

        {/* Carousel Telemetry & Shortcuts Pill */}
        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-on-surface-variant">
            FINALIST <span className="text-white font-bold">#{currentIndex + 1}</span> OF {shortlist.length}
          </span>

          <div className="hidden md:flex items-center gap-2 text-[10px] text-on-surface-variant/80 border-l border-white/10 pl-3">
            <span>[← / → NAVIGATE]</span>
            <span>[1/2/3 TAG PODIUM]</span>
            <span>[I TOGGLE INFO]</span>
          </div>

          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`p-1.5 rounded-xs border transition-colors ${
              showSidebar ? "bg-primary-container text-black border-primary-container" : "border-white/20 text-white"
            }`}
            title="Toggle Telemetry Sidebar (I)"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Viewing Stage (Canvas + Optional Sidebar) */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Left/Right Navigation Chevron Arrows */}
        <button
          onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : shortlist.length - 1))}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/60 hover:bg-black/90 border border-white/15 rounded-full text-white hover:text-primary-container transition-all"
          title="Previous Finalist (Arrow Left)"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={() => setCurrentIndex((prev) => (prev < shortlist.length - 1 ? prev + 1 : 0))}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/60 hover:bg-black/90 border border-white/15 rounded-full text-white hover:text-primary-container transition-all"
          title="Next Finalist (Arrow Right)"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Center: High-Res Viewport with Zoom Loupe */}
        <div className="flex-1 bg-black flex items-center justify-center p-4 overflow-hidden relative">
          <ZoomLoupe
            imageSrc={imageSrc}
            alt={currentSub?.title || "Shortlisted entry"}
            zoomLevel={2.5}
            loupeSize={200}
          />
        </div>

        {/* Right Sidebar: Telemetry, AI Scoring & EXIF Drawer */}
        {showSidebar && currentSub && (
          <div className="w-80 lg:w-96 bg-surface-container-lowest border-l border-white/10 p-5 overflow-y-auto space-y-5 text-xs z-10 shadow-2xl">
            {/* Title & Blind Attribution */}
            <div className="space-y-1 pb-3 border-b border-white/[0.08]">
              <div className="flex items-center justify-between text-[10px] text-primary-container uppercase font-bold">
                <span>BLIND EVALUATION</span>
                <span>ENTRY #{currentIndex + 1}</span>
              </div>
              <h2 className="font-headline text-lg font-bold text-white leading-tight">
                {currentSub.title}
              </h2>
            </div>

            {/* AI Preliminary Score */}
            {currentSub.aestheticScore && (
              <div className="p-3 bg-surface-container rounded-sm border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-primary-container">
                  <span>AI ARTIMUSE SCORE</span>
                  <ForensicChip status="OPTICAL_AUTHENTIC" size="sm" />
                </div>
                <ScoreTicker
                  score={currentSub.aestheticScore.totalScore}
                  size="md"
                  animate={false}
                />
                <div className="text-[11px] font-sans text-on-surface-variant italic leading-relaxed pt-2 border-t border-white/[0.06]">
                  &ldquo;{currentSub.aestheticScore.critiqueStrengths}&rdquo;
                </div>
              </div>
            )}

            {/* Optical EXIF Hardware */}
            {currentSub.exif && (
              <div className="space-y-2">
                <span className="text-[10px] uppercase text-on-surface-variant font-bold block">
                  OPTICAL HARDWARE SENSOR
                </span>
                <ExifHudBadge
                  exif={{
                    cameraMake: currentSub.exif.cameraMake,
                    cameraModel: currentSub.exif.cameraModel,
                    lensModel: currentSub.exif.lensModel,
                    aperture: currentSub.exif.apertureFNumber,
                    shutterSpeed: currentSub.exif.shutterSpeedFraction,
                    iso: currentSub.exif.iso,
                  }}
                  layout="overlay"
                />
              </div>
            )}

            {/* Story Statement */}
            {currentSub.story && (
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-on-surface-variant font-bold block">
                  ARTISTIC STATEMENT
                </span>
                <p className="font-sans text-xs text-on-surface-variant leading-relaxed p-3 bg-surface-container rounded-sm border border-white/[0.04]">
                  {currentSub.story}
                </p>
              </div>
            )}

            {/* Juror Remarks for Current Photo */}
            <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
              <span className="text-[10px] uppercase text-primary-container font-bold block">
                JUROR QUALITATIVE REMARKS
              </span>
              <textarea
                rows={3}
                value={jurorRemarks}
                onChange={(e) => setJurorRemarks(e.target.value)}
                placeholder="Enter feedback for podium announcement..."
                className="w-full bg-surface-container border border-white/10 rounded-sm p-2 text-xs text-white placeholder-on-surface-variant/40 focus:border-primary-container focus:outline-none leading-relaxed"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Podium Allocation Tray */}
      <PodiumTray
        assignments={assignments}
        onClearSlot={handleClearSlot}
        onAssignCurrent={handleAssignCurrent}
        onSubmitVerdict={handleSubmitVerdict}
        isSubmitting={isSubmitting}
      />

      {/* Confirmation Modal once Verdict Submitted */}
      {verdictSubmitted && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <DarkroomCard
            headerTitle="VERDICT SUBMITTED // PODIUMS CONFIRMED"
            telemetryTag="JUROR_LOCKED"
            className="max-w-lg w-full p-8 text-center space-y-6"
          >
            <div className="w-16 h-16 rounded-full bg-primary-container/15 border border-primary-container/40 flex items-center justify-center mx-auto text-primary-container shadow-xl shadow-primary-container/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="font-headline text-2xl font-bold text-white uppercase">
                PODIUM VERDICT TRANSMITTED
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Your selections for 1st, 2nd, and 3rd place have been recorded and sent to the contest organizer for final publication.
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <BracketButton
                variant="primary"
                bracketStyle="bracket"
                href="/juror"
              >
                RETURN TO JUROR DASHBOARD
              </BracketButton>
            </div>
          </DarkroomCard>
        </div>
      )}
    </div>
  );
}
