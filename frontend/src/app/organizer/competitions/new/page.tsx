"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CategoryCode } from "@/types";
import { apiClient } from "@/lib/api/client";
import { DarkroomCard, BracketButton } from "@/components/hud";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export default function NewCompetitionWizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState<CategoryCode>("PORTRAIT");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("/images/samples/03_portrait_artisan.png");

  // Rubric weights state (in percentage 0 - 100)
  const [weights, setWeights] = useState<{
    composition: number;
    lighting: number;
    color: number;
    technical: number;
    story: number;
    originality: number;
    mood: number;
    style: number;
  }>({
    composition: 20,
    lighting: 20,
    color: 15,
    technical: 15,
    story: 15,
    originality: 5,
    mood: 5,
    style: 5,
  });

  // Settings
  const [maxEntries, setMaxEntries] = useState(2);
  const [prizePool, setPrizePool] = useState(5000);
  const [submissionEndDate, setSubmissionEndDate] = useState("2026-05-01");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const isWeightValid = totalWeight === 100;

  const handleWeightChange = (key: keyof typeof weights, val: number) => {
    setWeights((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const autoNormalizeWeights = () => {
    const sum = totalWeight || 1;
    const normalized: Record<string, number> = {};
    let runningTotal = 0;
    const keys = Object.keys(weights) as (keyof typeof weights)[];

    keys.forEach((k, idx) => {
      if (idx === keys.length - 1) {
        normalized[k] = 100 - runningTotal;
      } else {
        const val = Math.round((weights[k] / sum) * 100);
        normalized[k] = val;
        runningTotal += val;
      }
    });

    setWeights(normalized as typeof weights);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    );
  };

  const handlePublish = async () => {
    setIsSubmitting(true);
    try {
      const now = new Date();
      const end = new Date(submissionEndDate);
      // Ensure start date is in the past/now and results publish date is after end date
      const start = new Date(now.getTime() - 1000).toISOString();
      const resultsPublish = new Date(end.getTime() + 7 * 24 * 3600 * 1000).toISOString();

      await apiClient.createCompetition({
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: description || "Curated fine-art photography challenge judged by AI aesthetics.",
        bannerUrl: coverImageUrl,
        submissionStartDate: start,
        submissionEndDate: end.toISOString(),
        resultsPublishDate: resultsPublish,
        maxEntriesPerUser: maxEntries,
        requireExif: true,
        prizeSummary: `$${prizePool.toLocaleString()} Total Purses`,
        categories: [
          {
            code: category,
            name: `${category} Category`,
            description: `Fine art challenge for ${category} imagery.`,
            rubricWeights: {
              composition: (weights.composition || 20) / 100,
              lighting: (weights.lighting || 20) / 100,
              colorHarmony: (weights.color || 15) / 100,
              technicalExecution: (weights.technical || 15) / 100,
              subjectStory: (weights.story || 15) / 100,
              originality: (weights.originality || 5) / 100,
              emotionAtmosphere: (weights.mood || 5) / 100,
              overallGestalt: (weights.style || 5) / 100,
            },
          },
        ],
      });
      router.push("/organizer");
    } catch (err) {
      console.warn("Failed to create competition via API, redirecting to console", err);
      router.push("/organizer");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-10 py-10 md:py-14 space-y-10 font-mono">
      {/* Back Link */}
      <div className="text-xs">
        <Link
          href="/organizer"
          className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-primary-container transition-colors uppercase"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>RETURN TO ORGANIZER CONSOLE</span>
        </Link>
      </div>

      {/* Header */}
      <div className="space-y-2 border-b border-white/[0.08] pb-6">
        <div className="text-[10px] text-primary-container uppercase tracking-widest font-bold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{"//"} MULTI-STEP COMPETITION ENGINE WIZARD</span>
        </div>
        <h1 className="font-headline text-3xl font-extrabold text-white uppercase tracking-tight">
          CREATE NEW COMPETITION SALON
        </h1>
      </div>

      {/* Wizard Progress Steps Indicator */}
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        {[
          { num: 1, label: "CONTEST BRIEF" },
          { num: 2, label: "RUBRIC WEIGHTS" },
          { num: 3, label: "RULES & PRIZES" },
          { num: 4, label: "LAUNCH" },
        ].map((step) => {
          const isActive = currentStep === step.num;
          const isDone = currentStep > step.num;

          return (
            <div
              key={step.num}
              className={`p-2.5 rounded-sm border transition-all ${
                isActive
                  ? "border-primary-container bg-primary-container/10 text-primary-container font-bold"
                  : isDone
                  ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-400"
                  : "border-white/10 bg-surface-container/30 text-on-surface-variant"
              }`}
            >
              <div className="text-[10px] uppercase">STEP {step.num}</div>
              <div className="font-semibold truncate">{step.label}</div>
            </div>
          );
        })}
      </div>

      {/* STEP 1: CONTEST BRIEF */}
      {currentStep === 1 && (
        <DarkroomCard headerTitle="STEP 1 // BRIEF & CATEGORY SELECTION">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white uppercase block">
                COMPETITION TITLE *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Nordic Shadows: High Arctic Landscapes"
                className="w-full bg-surface-container border border-white/10 rounded-sm p-3 text-xs text-white focus:border-primary-container focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white uppercase block">
                  CATEGORY GENRE *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryCode)}
                  className="w-full bg-surface-container border border-white/10 rounded-sm p-3 text-xs text-white focus:border-primary-container focus:outline-none uppercase"
                >
                  <option value="PORTRAIT">PORTRAIT</option>
                  <option value="LANDSCAPE">LANDSCAPE</option>
                  <option value="ASTRO">ASTRO</option>
                  <option value="WILDLIFE">WILDLIFE</option>
                  <option value="MACRO">MACRO</option>
                  <option value="STREET">STREET</option>
                  <option value="MONOCHROME">MONOCHROME</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-white uppercase block">
                  CUSTOM SLUG
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="nordic-shadows-2026"
                  className="w-full bg-surface-container border border-white/10 rounded-sm p-3 text-xs text-white focus:border-primary-container focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white uppercase block">
                EDITORIAL BRIEF & CURATORIAL PROMPT
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe thematic requirements, compositional goals, and acceptable lighting conditions..."
                className="w-full bg-surface-container border border-white/10 rounded-sm p-3 text-xs text-white focus:border-primary-container focus:outline-none leading-relaxed"
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-white/[0.06]">
              <BracketButton
                variant="primary"
                bracketStyle="bracket"
                disabled={!title}
                onClick={() => setCurrentStep(2)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                PROCEED TO RUBRIC CONFIG
              </BracketButton>
            </div>
          </div>
        </DarkroomCard>
      )}

      {/* STEP 2: 8-DIMENSION RUBRIC WEIGHTS SLIDERS */}
      {currentStep === 2 && (
        <DarkroomCard
          headerTitle="STEP 2 // 8-DIMENSION ARTIMUSE RUBRIC WEIGHTING"
          telemetryTag="STRICT_100_PERCENT"
        >
          <div className="space-y-6">
            {/* Real-Time Total Math Indicator */}
            <div
              className={`p-3.5 rounded-sm border flex items-center justify-between text-xs font-bold transition-all ${
                isWeightValid
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-status-error/10 border-status-error/30 text-status-error"
              }`}
            >
              <div className="flex items-center gap-2">
                {isWeightValid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-status-error" />
                )}
                <span>
                  TOTAL WEIGHT: {totalWeight}% / 100% {isWeightValid ? "(VALID)" : "(MUST EQUAL STRICTLY 100%)"}
                </span>
              </div>

              {!isWeightValid && (
                <button
                  type="button"
                  onClick={autoNormalizeWeights}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-xs uppercase tracking-wider text-[10px] flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>AUTO-NORMALIZE</span>
                </button>
              )}
            </div>

            {/* Sliders Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              {(Object.keys(weights) as (keyof typeof weights)[]).map((key) => {
                const val = weights[key];

                return (
                  <div
                    key={key}
                    className="p-3 bg-surface-container rounded-sm border border-white/[0.04] space-y-2"
                  >
                    <div className="flex justify-between font-bold uppercase text-white">
                      <span>{key}</span>
                      <span className="text-primary-container">{val}%</span>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={50}
                      step={5}
                      value={val}
                      onChange={(e) => handleWeightChange(key, Number(e.target.value))}
                      className="w-full accent-[#aff755] cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>

            {/* Action Row */}
            <div className="flex justify-between pt-4 border-t border-white/[0.06]">
              <BracketButton
                variant="secondary"
                bracketStyle="bracket"
                onClick={() => setCurrentStep(1)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                BACK
              </BracketButton>

              <BracketButton
                variant="primary"
                bracketStyle="bracket"
                disabled={!isWeightValid}
                onClick={() => setCurrentStep(3)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                PROCEED TO RULES & DATES
              </BracketButton>
            </div>
          </div>
        </DarkroomCard>
      )}

      {/* STEP 3: RULES & DATES */}
      {currentStep === 3 && (
        <DarkroomCard headerTitle="STEP 3 // ENTRY CAPS & LIFECYCLE DATES">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white uppercase block">
                  MAX SUBMISSION CAP PER USER
                </label>
                <select
                  value={maxEntries}
                  onChange={(e) => setMaxEntries(Number(e.target.value))}
                  className="w-full bg-surface-container border border-white/10 rounded-sm p-3 text-xs text-white focus:border-primary-container focus:outline-none"
                >
                  <option value={1}>1 Photo (Single Masterwork)</option>
                  <option value={2}>2 Photos (Default Recommended)</option>
                  <option value={3}>3 Photos</option>
                  <option value={5}>5 Photos</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-white uppercase block">
                  PRIZE POOL (USD)
                </label>
                <input
                  type="number"
                  value={prizePool}
                  onChange={(e) => setPrizePool(Number(e.target.value))}
                  className="w-full bg-surface-container border border-white/10 rounded-sm p-3 text-xs text-white focus:border-primary-container focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white uppercase block">
                SUBMISSION DEADLINE DATE
              </label>
              <input
                type="date"
                value={submissionEndDate}
                onChange={(e) => setSubmissionEndDate(e.target.value)}
                className="w-full bg-surface-container border border-white/10 rounded-sm p-3 text-xs text-white focus:border-primary-container focus:outline-none"
              />
            </div>

            {/* Checkboxes */}
            <div className="p-4 bg-surface-container rounded-sm border border-white/[0.04] space-y-3 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary-container" />
                <span className="text-white">Optical EXIF Extraction Mandatory</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary-container" />
                <span className="text-white">Generative AI Synthetic Media Prohibited</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary-container" />
                <span className="text-white">48-Hour RAW File Appeals Allowed</span>
              </div>
            </div>

            {/* Action Row */}
            <div className="flex justify-between pt-4 border-t border-white/[0.06]">
              <BracketButton
                variant="secondary"
                bracketStyle="bracket"
                onClick={() => setCurrentStep(2)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                BACK
              </BracketButton>

              <BracketButton
                variant="primary"
                bracketStyle="bracket"
                onClick={() => setCurrentStep(4)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                REVIEW & PUBLISH
              </BracketButton>
            </div>
          </div>
        </DarkroomCard>
      )}

      {/* STEP 4: REVIEW & LAUNCH */}
      {currentStep === 4 && (
        <DarkroomCard
          headerTitle="STEP 4 // FINAL SALON AUDIT & PUBLICATION"
          telemetryTag="READY_TO_LAUNCH"
        >
          <div className="space-y-6">
            <div className="p-5 bg-surface-container rounded-sm border border-white/[0.08] space-y-4">
              <div>
                <span className="text-[10px] text-primary-container uppercase font-bold tracking-widest">
                  SALON BRIEF
                </span>
                <h2 className="font-headline text-2xl font-bold text-white uppercase mt-1">
                  {title}
                </h2>
                <div className="text-xs text-on-surface-variant mt-1">
                  Category: {category} • Slug: /{slug}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-3 border-t border-white/[0.06]">
                <div>
                  <div className="text-on-surface-variant text-[10px]">CAP:</div>
                  <div className="text-white font-bold">{maxEntries} Photos</div>
                </div>
                <div>
                  <div className="text-on-surface-variant text-[10px]">PRIZE:</div>
                  <div className="text-podium-gold font-bold">${prizePool.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-on-surface-variant text-[10px]">RUBRIC:</div>
                  <div className="text-primary-container font-bold">100% WEIGHTED</div>
                </div>
                <div>
                  <div className="text-on-surface-variant text-[10px]">STATUS:</div>
                  <div className="text-emerald-400 font-bold">OPEN</div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-white/[0.06]">
              <BracketButton
                variant="secondary"
                bracketStyle="bracket"
                onClick={() => setCurrentStep(3)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                BACK
              </BracketButton>

              <BracketButton
                variant="primary"
                bracketStyle="brace"
                size="lg"
                isLoading={isSubmitting}
                onClick={handlePublish}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                PUBLISH COMPETITION LIVE
              </BracketButton>
            </div>
          </div>
        </DarkroomCard>
      )}
    </div>
  );
}
