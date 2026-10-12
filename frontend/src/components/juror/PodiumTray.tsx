"use client";

import React from "react";
import { Submission } from "@/types";
import { Trophy, X, Send } from "lucide-react";
import { BracketButton } from "@/components/hud";

export interface PodiumAssignments {
  firstPlace: Submission | null;
  secondPlace: Submission | null;
  thirdPlace: Submission | null;
}

export interface PodiumTrayProps {
  assignments: PodiumAssignments;
  onClearSlot: (slot: "firstPlace" | "secondPlace" | "thirdPlace") => void;
  onAssignCurrent: (slot: "firstPlace" | "secondPlace" | "thirdPlace") => void;
  onSubmitVerdict: () => void;
  isSubmitting?: boolean;
  className?: string;
}

export function PodiumTray({
  assignments,
  onClearSlot,
  onAssignCurrent,
  onSubmitVerdict,
  isSubmitting = false,
  className = "",
}: PodiumTrayProps) {
  const slots: {
    key: "firstPlace" | "secondPlace" | "thirdPlace";
    label: string;
    keyShortcut: string;
    podiumColor: string;
    borderClass: string;
    sub: Submission | null;
  }[] = [
    {
      key: "firstPlace",
      label: "1ST PLACE (GRAND WINNER)",
      keyShortcut: "KEY [1]",
      podiumColor: "text-podium-gold",
      borderClass: "border-podium-gold/50 bg-podium-gold/5",
      sub: assignments.firstPlace,
    },
    {
      key: "secondPlace",
      label: "2ND PLACE RUNNER-UP",
      keyShortcut: "KEY [2]",
      podiumColor: "text-slate-300",
      borderClass: "border-slate-400/40 bg-slate-400/5",
      sub: assignments.secondPlace,
    },
    {
      key: "thirdPlace",
      label: "3RD PLACE PODIUM",
      keyShortcut: "KEY [3]",
      podiumColor: "text-amber-600",
      borderClass: "border-amber-600/40 bg-amber-600/5",
      sub: assignments.thirdPlace,
    },
  ];

  const allAssigned = Boolean(
    assignments.firstPlace && assignments.secondPlace && assignments.thirdPlace
  );

  return (
    <div
      className={`w-full bg-[#0d0e0d]/95 backdrop-blur-md border-t border-white/15 p-4 sm:p-5 font-mono select-none ${className}`}
    >
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Podium Slots */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto flex-1">
          {slots.map((slot) => {
            const hasSub = slot.sub !== null;

            return (
              <div
                key={slot.key}
                className={`relative flex items-center gap-3 p-2.5 rounded-sm border transition-all ${
                  hasSub ? slot.borderClass : "border-white/10 bg-surface-container/40"
                }`}
              >
                {/* Thumbnail Preview */}
                <div className="w-12 h-10 rounded-xs overflow-hidden bg-black border border-white/10 shrink-0 flex items-center justify-center">
                  {hasSub ? (
                    <img
                      src={slot.sub?.image?.thumbWebpUrl || slot.sub?.image?.originalUrl || ""}
                      alt={slot.sub?.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Trophy className={`w-4 h-4 opacity-40 ${slot.podiumColor}`} />
                  )}
                </div>

                {/* Slot Details */}
                <div className="flex-1 min-w-0">
                  <div className={`text-[10px] font-bold tracking-wider ${slot.podiumColor} flex items-center justify-between`}>
                    <span>{slot.label.split(" ")[0]} {slot.label.split(" ")[1]}</span>
                    {!hasSub && (
                      <span className="text-[9px] text-on-surface-variant/70 font-normal">
                        {slot.keyShortcut}
                      </span>
                    )}
                  </div>

                  {hasSub ? (
                    <div className="text-xs font-headline font-bold text-white truncate">
                      {slot.sub?.title}
                    </div>
                  ) : (
                    <button
                      onClick={() => onAssignCurrent(slot.key)}
                      className="text-[11px] text-primary-container hover:underline tracking-wider uppercase text-left"
                    >
                      + TAG SELECTED PHOTO
                    </button>
                  )}
                </div>

                {/* Remove button if assigned */}
                {hasSub && (
                  <button
                    onClick={() => onClearSlot(slot.key)}
                    className="p-1 hover:bg-white/10 rounded-xs text-on-surface-variant hover:text-white transition-colors"
                    title="Clear slot"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
          <BracketButton
            variant="primary"
            bracketStyle="brace"
            size="md"
            disabled={!allAssigned || isSubmitting}
            isLoading={isSubmitting}
            onClick={onSubmitVerdict}
            leftIcon={<Send className="w-4 h-4" />}
          >
            {allAssigned ? "CONFIRM & SUBMIT VERDICT" : "ASSIGN ALL 3 PODIUMS"}
          </BracketButton>
        </div>
      </div>
    </div>
  );
}
