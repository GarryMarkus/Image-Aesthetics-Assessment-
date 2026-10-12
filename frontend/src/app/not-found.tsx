import Link from "next/link";
import { BracketButton, DarkroomCard } from "@/components/hud";
import { Compass, AlertCircle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="w-full min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-16 font-mono">
      <DarkroomCard
        headerTitle="404 // OPTICAL ASSET NOT LOCATED"
        telemetryTag="FRAME_DROPPED"
        className="max-w-md w-full p-8 text-center space-y-6"
      >
        <div className="w-16 h-16 rounded-full bg-status-error/15 border border-status-error/40 flex items-center justify-center mx-auto text-status-error">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="font-headline text-3xl font-extrabold text-white uppercase tracking-tight">
            FRAME NOT FOUND
          </h1>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            The requested exhibition salon, photographic entry, or diagnostic scorecard does not exist in the archival database.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <BracketButton
            variant="primary"
            bracketStyle="bracket"
            href="/"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            RETURN TO THE HALL
          </BracketButton>
          <BracketButton
            variant="secondary"
            bracketStyle="none"
            href="/competitions"
            leftIcon={<Compass className="w-4 h-4" />}
          >
            EXPLORE SALONS
          </BracketButton>
        </div>
      </DarkroomCard>
    </div>
  );
}
