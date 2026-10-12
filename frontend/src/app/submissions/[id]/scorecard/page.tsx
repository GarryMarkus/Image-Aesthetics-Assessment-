"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Submission, AestheticScore } from "@/types";
import { apiClient } from "@/lib/api/client";
import { ScorecardBreakdown } from "@/components/scorecard/ScorecardBreakdown";
import { ArrowLeft, Eye, ShieldCheck } from "lucide-react";
import { BracketButton } from "@/components/hud";

export default function DiagnosticScorecardPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [score, setScore] = useState<AestheticScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadScorecard() {
      if (!id) return;
      try {
        const [sub, sc] = await Promise.all([
          apiClient.getSubmissionById(id),
          apiClient.getSubmissionScorecard(id),
        ]);
        setSubmission(sub);
        setScore(sc);
      } catch (err) {
        console.error("Failed to load scorecard", err);
      } finally {
        setLoading(false);
      }
    }
    loadScorecard();
  }, [id]);

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 md:px-10 py-16 text-center font-mono text-sm text-on-surface-variant">
        GENERATING 8-DIMENSION ARTIMUSE RADAR REPORT...
      </div>
    );
  }

  if (!submission || !score) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 md:px-10 py-16 text-center font-mono text-sm text-on-surface-variant">
        Aesthetic scorecard not found for this entry.
      </div>
    );
  }

  const imageSrc =
    submission.image?.previewWebpUrl ||
    submission.image?.originalUrl ||
    "/images/samples/03_portrait_artisan.png";

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-10 py-8 md:py-12 space-y-10 font-mono">
      {/* Top Navigation */}
      <div className="flex items-center justify-between text-xs pb-4 border-b border-white/[0.08]">
        <Link
          href={`/submissions/${submission.id}`}
          className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-primary-container transition-colors uppercase"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>RETURN TO ARTWORK VIEW</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-primary-container font-bold uppercase tracking-widest flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-primary-container" />
            <span>CONFIDENTIAL AUDIT</span>
          </span>
        </div>
      </div>

      {/* Scorecard Hero Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-surface-container-low p-6 rounded-sm border border-white/10 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-20 h-16 rounded-xs overflow-hidden bg-black border border-white/10 shrink-0">
            <img
              src={imageSrc}
              alt={submission.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-primary-container uppercase font-bold tracking-widest">
                DIAGNOSTIC REPORT // {submission.category?.name || "SALON"}
              </span>
            </div>
            <h1 className="font-headline text-2xl font-extrabold text-white uppercase">
              {submission.title}
            </h1>
            <span className="text-xs text-on-surface-variant">
              Photographer: {submission.author?.name || "Verified Entrant"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <BracketButton
            variant="secondary"
            size="sm"
            bracketStyle="bracket"
            href={`/submissions/${submission.id}`}
            leftIcon={<Eye className="w-3.5 h-3.5" />}
          >
            FULL ARTWORK
          </BracketButton>
        </div>
      </div>

      {/* Complete Scorecard Assembly */}
      <ScorecardBreakdown score={score} submission={submission} />
    </div>
  );
}
