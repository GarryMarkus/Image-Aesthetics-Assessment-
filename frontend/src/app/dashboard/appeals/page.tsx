"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DarkroomCard, BracketButton } from "@/components/hud";
import {
  ArrowLeft,
  ShieldAlert,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
} from "lucide-react";

export default function AppealsPortalPage() {
  const [submissionId, setSubmissionId] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionId || !reason) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-10 py-10 md:py-14 space-y-10 font-mono">
      {/* Back Link */}
      <div className="text-xs">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-primary-container transition-colors uppercase"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>RETURN TO DASHBOARD</span>
        </Link>
      </div>

      {/* Header */}
      <div className="space-y-2 border-b border-white/[0.08] pb-6">
        <div className="text-[10px] text-amber-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>{"//"} DISPUTE ARBITRATION &amp; RAW PROOF AUDIT</span>
        </div>
        <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-tight">
          DISQUALIFICATION APPEALS
        </h1>
        <p className="text-xs text-on-surface-variant max-w-xl leading-relaxed">
          If your optical photograph was falsely flagged as synthetic generative AI or stripped of EXIF, submit an unedited manufacturer camera RAW file (.CR3, .NEF, .ARW, .DNG) for human verification.
        </p>
      </div>

      {isSubmitted ? (
        <DarkroomCard
          headerTitle="APPEAL RECORDED // PENDING HUMAN REVIEW"
          telemetryTag="ARBITRATION_QUEUED"
          className="p-8 text-center space-y-6"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="font-headline text-2xl font-bold text-white uppercase">
              TICKET TRANSMITTED
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Your appeal docket for submission [{submissionId}] has been logged. An organizer will inspect your unedited RAW master file within 48 hours.
            </p>
          </div>

          <div className="pt-2">
            <BracketButton
              variant="primary"
              bracketStyle="bracket"
              href="/dashboard"
            >
              RETURN TO CREATOR DASHBOARD
            </BracketButton>
          </div>
        </DarkroomCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left: Appeal Submission Form */}
          <div className="md:col-span-2">
            <form onSubmit={handleSubmitAppeal} className="space-y-6">
              <DarkroomCard headerTitle="FILE DISPUTE TICKET">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white uppercase block">
                      SUBMISSION TRACKING ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={submissionId}
                      onChange={(e) => setSubmissionId(e.target.value)}
                      placeholder="e.g. sub_01 or SUB_KYOTO_772"
                      className="w-full bg-surface-container border border-white/10 rounded-sm p-3 text-xs text-white focus:border-primary-container focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white uppercase block">
                      STATEMENT OF AUTHENTICITY *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Explain capture context, camera hardware utilized, and why the automated frequency screening erred..."
                      className="w-full bg-surface-container border border-white/10 rounded-sm p-3 text-xs text-white focus:border-primary-container focus:outline-none leading-relaxed"
                    />
                  </div>

                  {/* RAW File Upload Dropzone */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white uppercase block">
                      ATTACH UNEDITED CAMERA RAW FILE
                    </label>
                    <div className="border border-dashed border-white/15 hover:border-primary-container/40 rounded-sm p-6 text-center bg-surface-container/30 cursor-pointer">
                      <Upload className="w-6 h-6 text-primary-container mx-auto mb-2" />
                      <div className="text-xs text-white uppercase font-bold">
                        UPLOAD .CR3, .NEF, .ARW, OR .DNG MASTER
                      </div>
                      <div className="text-[10px] text-on-surface-variant mt-1">
                        Up to 60 MB camera sensor master file
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-white/[0.06]">
                    <BracketButton
                      type="submit"
                      variant="primary"
                      bracketStyle="brace"
                      size="md"
                      isLoading={isSubmitting}
                      disabled={!submissionId || !reason}
                    >
                      SUBMIT APPEAL FOR HUMAN REVIEW
                    </BracketButton>
                  </div>
                </div>
              </DarkroomCard>
            </form>
          </div>

          {/* Right: Policy Guidelines */}
          <div className="space-y-6">
            <DarkroomCard headerTitle="48-HOUR DISPUTE POLICY">
              <div className="space-y-3 text-xs text-on-surface-variant leading-relaxed">
                <p>
                  Pixel Prize maintains a zero-tolerance policy for generative AI synthetic fakes to preserve the integrity of optical photography.
                </p>
                <div className="p-3 bg-surface-container rounded-sm border border-white/[0.04] space-y-2">
                  <div className="font-bold text-white text-[11px] uppercase">
                    ELIGIBLE FOR RE-JUDGE:
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-[11px]">
                    <li>Authentic photos falsely flagged by frequency lattice checks</li>
                    <li>Legacy manual lenses with stripped electronic EXIF</li>
                  </ul>
                </div>
              </div>
            </DarkroomCard>
          </div>
        </div>
      )}
    </div>
  );
}
