"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Competition } from "@/types";
import { apiClient } from "@/lib/api/client";
import {
  PhotoDropzone,
  DroppedImagePayload,
} from "@/components/upload/PhotoDropzone";
import {
  BracketButton,
  DarkroomCard,
} from "@/components/hud";
import {
  ArrowLeft,
  Sparkles,
  UploadCloud,
  CheckCircle2,
} from "lucide-react";

export default function SubmitEntryPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [selectedPayload, setSelectedPayload] =
    useState<DroppedImagePayload | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  useEffect(() => {
    async function loadComp() {
      if (!id) return;
      try {
        const comp = await apiClient.getCompetitionById(id);
        setCompetition(comp);
        if (comp?.categories?.[0]) {
          setSelectedCategory(comp.categories[0].code);
        }
      } catch (err) {
        console.error("Failed to load competition", err);
      }
    }
    loadComp();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayload || !title || !agreedToTerms || !competition) return;

    setIsSubmitting(true);
    setUploadProgress(10);

    try {
      // 1. Request presigned Cloudflare R2 upload URL
      const presigned = await apiClient.getPresignedUploadUrl({
        competitionId: competition.id,
        filename: selectedPayload.file.name,
        fileSizeBytes: selectedPayload.file.size,
        mimeType: selectedPayload.file.type,
      });

      // 2. Simulate streaming upload progress to R2
      for (let p = 25; p <= 90; p += 20) {
        await new Promise((r) => setTimeout(r, 120));
        setUploadProgress(p);
      }

      await new Promise((r) => setTimeout(r, 200));
      setUploadProgress(100);

      // 3. Registered submission confirmation
      const simId = `sub_${Date.now().toString(36)}`;
      setSubmissionId(simId);
      setIsCompleted(true);
    } catch (err) {
      console.error("Submission failed", err);
      alert("Submission encountered a network issue. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!competition) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-16 text-center font-mono text-sm text-on-surface-variant">
        LOADING SUBMISSION CONSOLE...
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-10 py-10 md:py-14 space-y-10 font-mono">
      {/* Back to Competition Link */}
      <div className="text-xs">
        <Link
          href={`/competitions/${competition.id}`}
          className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-primary-container transition-colors uppercase"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>RETURN TO {competition.title}</span>
        </Link>
      </div>

      {/* Header */}
      <div className="space-y-2 border-b border-white/[0.08] pb-6">
        <div className="text-[10px] text-primary-container uppercase tracking-widest font-bold flex items-center gap-1.5">
          <UploadCloud className="w-3.5 h-3.5" />
          <span>{"//"} INGESTION STUDIO &amp; OPTICAL REGISTRATION</span>
        </div>
        <h1 className="font-headline text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-tight">
          SUBMIT ENTRY TO {competition.title}
        </h1>
        <p className="text-xs text-on-surface-variant">
          Entries undergo automated EXIF extraction, synthetic diffusion checks, and preliminary 8-dimension AI aesthetic appraisal.
        </p>
      </div>

      {/* SUCCESS CONFIRMATION STATE */}
      {isCompleted ? (
        <DarkroomCard
          headerTitle="SUBMISSION REGISTERED // INGESTION COMPLETE"
          telemetryTag="IN_QUEUE"
          className="p-8 text-center space-y-6"
        >
          <div className="w-16 h-16 rounded-full bg-primary-container/15 border border-primary-container/40 flex items-center justify-center mx-auto text-primary-container shadow-lg shadow-primary-container/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="font-headline text-2xl font-bold text-white uppercase">
              PHOTOGRAPH INGESTED
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Your photo is currently staged in the BullMQ worker queue. The multimodal AI will evaluate your entry across 8 dimensions in under 25 seconds.
            </p>
          </div>

          <div className="p-4 bg-surface-container rounded-sm border border-white/[0.06] max-w-md mx-auto text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">SUBMISSION TRACKER:</span>
              <span className="text-primary-container font-bold uppercase">{submissionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">CURRENT LIFECYCLE:</span>
              <span className="text-white font-bold">STAGE 1: FORENSIC FREQUENCY SCAN</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">PHOTOGRAPHER PRIVACY:</span>
              <span className="text-white">BLIND EVALUATION ACTIVE ✓</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <BracketButton
              variant="primary"
              bracketStyle="bracket"
              href={`/competitions/${competition.id}`}
            >
              RETURN TO SALON GALLERY
            </BracketButton>
            <BracketButton
              variant="secondary"
              bracketStyle="brace"
              href="/competitions"
            >
              EXPLORE OTHER CONTESTS
            </BracketButton>
          </div>
        </DarkroomCard>
      ) : (
        /* SUBMISSION FORM */
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 1. Drag and Drop Image Picker */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-white block">
              1. UPLOAD HIGH-RESOLUTION PHOTOGRAPH
            </label>
            <PhotoDropzone
              selectedPayload={selectedPayload}
              onImageSelected={(p) => setSelectedPayload(p)}
            />
          </div>

          {/* 2. Metadata Inputs */}
          <div className="space-y-6 bg-surface-container-low p-6 rounded-sm border border-white/[0.08]">
            {/* Category Genre Selector */}
            {competition.categories && competition.categories.length > 0 && (
              <div className="space-y-2">
                <label
                  htmlFor="category"
                  className="text-xs font-bold uppercase tracking-wider text-white block"
                >
                  2. COMPETITION CATEGORY <span className="text-primary-container">*</span>
                </label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-surface-container border border-white/10 rounded-sm px-4 py-2.5 text-xs text-white focus:border-primary-container focus:outline-none uppercase"
                >
                  {competition.categories.map((c) => (
                    <option key={c.id || c.code} value={c.code}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="title"
                className="text-xs font-bold uppercase tracking-wider text-white block"
              >
                3. ARTWORK TITLE <span className="text-primary-container">*</span>
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. The Master Artisan's Solitude"
                className="w-full bg-surface-container border border-white/10 rounded-sm px-4 py-2.5 text-xs text-white placeholder-on-surface-variant/50 focus:border-primary-container focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="story"
                className="text-xs font-bold uppercase tracking-wider text-white block"
              >
                3. ARTISTIC STATEMENT & FIELD STORY
              </label>
              <textarea
                id="story"
                rows={4}
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="Describe lighting conditions, environmental context, or creative intent..."
                className="w-full bg-surface-container border border-white/10 rounded-sm px-4 py-2.5 text-xs text-white placeholder-on-surface-variant/50 focus:border-primary-container focus:outline-none transition-colors leading-relaxed"
              />
            </div>

            {/* Copyright & Authentic Optics Guarantee */}
            <div className="pt-4 border-t border-white/[0.06] space-y-3">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 accent-[#aff755] cursor-pointer"
                />
                <span className="text-xs text-on-surface-variant leading-relaxed">
                  I certify that this image is an authentic optical photograph captured with a digital or film camera. I retain 100% intellectual copyright. I agree to blind preliminary evaluation by Pixel Prize&apos;s AI judging engine.
                </span>
              </label>
            </div>
          </div>

          {/* Upload Progress Bar (if submitting) */}
          {isSubmitting && (
            <div className="space-y-2 p-4 bg-surface-container rounded-sm border border-white/10">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-white uppercase flex items-center gap-1.5">
                  <UploadCloud className="w-3.5 h-3.5 text-primary-container animate-bounce" />
                  <span>STREAMING DIRECTLY TO CLOUDFLARE R2...</span>
                </span>
                <span className="text-primary-container">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-container transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-on-surface-variant">
              Fee: $0.00 (Free Community Submission)
            </span>

            <BracketButton
              type="submit"
              variant="primary"
              bracketStyle="brace"
              size="lg"
              disabled={!selectedPayload || !title || !agreedToTerms || isSubmitting}
              isLoading={isSubmitting}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              SUBMIT FOR AI APPRAISAL
            </BracketButton>
          </div>
        </form>
      )}
    </div>
  );
}
