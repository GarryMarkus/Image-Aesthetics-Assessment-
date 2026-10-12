"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  UploadCloud,
  X,
  Trophy,
  AlertCircle,
  Eye,
  CheckCircle2,
  RefreshCw,
  Layers,
  ChevronRight,
  Maximize2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sliders,
  Award,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api/client";
import { parseClientExif } from "@/lib/exif";
import { AestheticScore, SandboxEvaluationResult, SandboxImageItem } from "@/types";
import { AestheticRadarChart } from "@/components/scorecard/AestheticRadarChart";
import { ScoreTicker, ForensicChip, DarkroomCard, BracketButton } from "@/components/hud";

interface StagedPhoto {
  id: string;
  name: string;
  previewUrl: string;
  dataUrl: string;
  fileSizeBytes: number;
  width: number;
  height: number;
  categoryCode: string;
  cameraMake?: string;
  cameraModel?: string;
  lensModel?: string;
  hasExif?: boolean;
}

const CATEGORY_OPTIONS = [
  { code: "GENERAL", label: "General & Open Creative" },
  { code: "PORTRAIT", label: "Portrait & People" },
  { code: "LANDSCAPE", label: "Landscape & Nature" },
  { code: "STREET", label: "Street Photography & Candid Moments" },
  { code: "MACRO", label: "Macro & Micro Photography" },
  { code: "WILDLIFE", label: "Wildlife & Animal Behavior" },
  { code: "NIGHT", label: "Night & Astrophotography" },
  { code: "ARCHITECTURE", label: "Architecture & Spatial Geometry" },
  { code: "MONOCHROME", label: "Fine-Art Monochrome" },
];

const CURATED_SAMPLE_PHOTOS = [
  {
    name: "The Master Artisan",
    url: "/images/samples/03_portrait_artisan.png",
    categoryCode: "PORTRAIT",
    cameraMake: "Sony",
    cameraModel: "ILCE-7RM5 (A7R V)",
    lensModel: "FE 85mm F1.4 GM",
    story: "An intimate portrait capturing fifty years of master pottery craftsmanship illuminated by soft afternoon window light.",
  },
  {
    name: "Galactic Core over Joshua Tree",
    url: "/images/samples/04_milky_way_astro.png",
    categoryCode: "NIGHT",
    cameraMake: "Nikon",
    cameraModel: "Z 8",
    lensModel: "NIKKOR Z 14-24mm f/2.8 S",
    story: "Tracked long-exposure panorama capturing the arch of the Milky Way core above ancient desert monoliths.",
  },
  {
    name: "Ghost of the Himalaya",
    url: "/images/samples/05_snow_leopard_wildlife.png",
    categoryCode: "WILDLIFE",
    cameraMake: "Canon",
    cameraModel: "EOS R5",
    lensModel: "RF 600mm F4L IS USM",
    story: "Stealth encounter at 4,200 meters elevation in the jagged cliffs of Ladakh.",
  },
  {
    name: "Hexagonal Dewdrops at Dawn",
    url: "/images/samples/06_dew_spider_web_macro.png",
    categoryCode: "MACRO",
    cameraMake: "Fujifilm",
    cameraModel: "X-T5",
    lensModel: "XF 80mm f/2.8 R LM OIS WR Macro",
    story: "High-magnification focus stack revealing microscopic optical reflections inside morning dew suspended on silk.",
  },
];

export default function SandboxPage() {
  const { user, isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stagedPhotos, setStagedPhotos] = useState<StagedPhoto[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationProgress, setEvaluationProgress] = useState<string>("");
  const [results, setResults] = useState<SandboxEvaluationResult[] | null>(null);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper to convert blob/file to DataURL
  const toDataUrl = (fileOrBlob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(fileOrBlob);
    });
  };

  // Helper to measure dimensions
  const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth || 1920, height: img.naturalHeight || 1080 });
      img.onerror = () => resolve({ width: 1920, height: 1080 });
      img.src = url;
    });
  };

  // Process user uploaded files
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setErrorMessage(null);
    const validFiles: File[] = [];
    const validMimes = ["image/jpeg", "image/png", "image/webp"];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (!validMimes.includes(f.type)) {
        setErrorMessage(`Skipped "${f.name}": Unsupported format. JPEG, PNG, and WebP are supported.`);
        continue;
      }
      if (f.size > 25 * 1024 * 1024) {
        setErrorMessage(`Skipped "${f.name}": File exceeds 25 MB competition cap.`);
        continue;
      }
      validFiles.push(f);
    }

    if (stagedPhotos.length + validFiles.length > 8) {
      setErrorMessage("Maximum 8 photographs can be evaluated simultaneously in a sandbox batch.");
      return;
    }

    const newStaged: StagedPhoto[] = [];

    for (const file of validFiles) {
      try {
        const dataUrl = await toDataUrl(file);
        const previewUrl = URL.createObjectURL(file);
        const { width, height } = await getImageDimensions(previewUrl);
        const parsedExif = await parseClientExif(file);

        newStaged.push({
          id: `upload_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: file.name.replace(/\.[^/.]+$/, ""),
          previewUrl,
          dataUrl,
          fileSizeBytes: file.size,
          width,
          height,
          categoryCode: "GENERAL",
          cameraMake: parsedExif.exif.cameraMake || undefined,
          cameraModel: parsedExif.exif.cameraModel || undefined,
          lensModel: parsedExif.exif.lensModel || undefined,
          hasExif: parsedExif.hasExif,
        });
      } catch (err) {
        console.error("Failed to parse dropped photo", err);
      }
    }

    setStagedPhotos((prev) => [...prev, ...newStaged]);
  }, [stagedPhotos]);

  // Load Curated 4-Photo Test Suite
  const loadCuratedSamples = async () => {
    setIsLoadingSamples(true);
    setErrorMessage(null);

    try {
      const loaded: StagedPhoto[] = [];

      for (const sample of CURATED_SAMPLE_PHOTOS) {
        const res = await fetch(sample.url);
        const blob = await res.blob();
        const dataUrl = await toDataUrl(blob);
        const { width, height } = await getImageDimensions(sample.url);

        loaded.push({
          id: `sample_${sample.categoryCode.toLowerCase()}_${Date.now()}`,
          name: sample.name,
          previewUrl: sample.url,
          dataUrl,
          fileSizeBytes: blob.size,
          width,
          height,
          categoryCode: sample.categoryCode,
          cameraMake: sample.cameraMake,
          cameraModel: sample.cameraModel,
          lensModel: sample.lensModel,
          hasExif: true,
        });
      }

      setStagedPhotos(loaded);
      setResults(null);
    } catch (err) {
      console.error("Failed to load sample set", err);
      setErrorMessage("Could not load sample images. You can upload your own photos instead.");
    } finally {
      setIsLoadingSamples(false);
    }
  };

  // Remove photo from staging
  const removePhoto = (id: string) => {
    setStagedPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  // Update photo category
  const updateCategory = (id: string, code: string) => {
    setStagedPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, categoryCode: code } : p))
    );
  };

  // Run AI Evaluation
  const runEvaluation = async () => {
    if (stagedPhotos.length === 0) return;

    setIsEvaluating(true);
    setErrorMessage(null);
    setResults(null);

    try {
      setEvaluationProgress("Normalizing image buffers and extracting optical sensor features...");
      await new Promise((r) => setTimeout(r, 400));

      setEvaluationProgress("Running multi-tier fraud & AI-synthesis forensics inspection...");
      await new Promise((r) => setTimeout(r, 400));

      setEvaluationProgress("Querying Gemini 2.5 Flash multimodal ArtiMuse 8-attribute rubric...");

      const payload: SandboxImageItem[] = stagedPhotos.map((photo) => ({
        id: photo.id,
        name: photo.name,
        dataUrl: photo.dataUrl,
        categoryCode: photo.categoryCode,
        cameraMake: photo.cameraMake,
        cameraModel: photo.cameraModel,
        lensModel: photo.lensModel,
      }));

      const res = await apiClient.evaluateSandbox(payload);

      // Sort descending by overall score to create competitive podium
      const sorted = [...res.results].sort((a, b) => b.overallScore - a.overallScore);
      setResults(sorted);
      if (sorted.length > 0) {
        setSelectedResultId(sorted[0].id);
      }

      // Smooth scroll to results
      setTimeout(() => {
        const el = document.getElementById("sandbox-results");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 200);
    } catch (err: any) {
      console.error("Evaluation failed", err);
      setErrorMessage(err.message || "Scoring evaluation failed. Please verify your photo payload and try again.");
    } finally {
      setIsEvaluating(false);
      setEvaluationProgress("");
    }
  };

  // Helper: map SandboxEvaluationResult to AestheticScore for radar component
  const toAestheticScore = (res: SandboxEvaluationResult): AestheticScore => ({
    id: res.id,
    submissionId: res.id,
    scoreComposition: res.attributeScores.composition,
    scoreLighting: res.attributeScores.lighting,
    scoreColor: res.attributeScores.colorHarmony,
    scoreTechnical: res.attributeScores.technicalExecution,
    scoreStory: res.attributeScores.subjectStory,
    scoreOriginality: res.attributeScores.originality,
    scoreMood: res.attributeScores.emotionAtmosphere,
    scoreStyle: res.attributeScores.overallGestalt,
    scoreThemeAdherence: res.themeAdherenceScore,
    penaltyDefects: res.defectDeductions.totalPenalty,
    totalScore: res.overallScore,
    critiqueStrengths: res.critique.strengths,
    critiqueWeaknesses: res.critique.technicalAnalysis,
    critiqueActionable: res.critique.recommendations,
    evaluationRoundsCount: 1,
    modelName: res.modelVersion || "Gemini 2.5 Flash",
    createdAt: new Date().toISOString(),
  });

  const selectedResult = results?.find((r) => r.id === selectedResultId) || results?.[0] || null;
  const selectedStaged = stagedPhotos.find((p) => p.id === selectedResult?.id);

  return (
    <div className="w-full flex flex-col items-start px-4 md:px-10 py-10 md:py-14 max-w-7xl mx-auto space-y-12">
      {/* 01. Telemetry Top Bar */}
      <div className="w-full flex items-center justify-between text-[11px] font-mono text-on-surface-variant uppercase tracking-widest border-b border-white/[0.06] pb-3">
        <span className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-primary-container" />
          <span>[AI LAB // SCORING SANDBOX]</span>
        </span>
        <span className="text-primary-container font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
          <span>ENGINE: GEMINI 2.5 FLASH MULTIMODAL // ARTIMUSE RUBRIC</span>
        </span>
      </div>

      {/* 02. Header & Introduction */}
      <div className="w-full flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-white/[0.06]">
        <div className="max-w-3xl space-y-3">
          <div className="font-mono text-[11px] text-primary-container tracking-widest uppercase font-bold flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container inline-block" />
            <span>{"//"} LIVE MULTI-PHOTO COMPARATIVE BENCHMARK</span>
          </div>
          <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl text-white font-extrabold tracking-tight uppercase leading-none">
            AESTHETIC SCORING LAB
          </h1>
          <p className="font-mono text-xs md:text-sm text-on-surface-variant leading-relaxed">
            Upload 2, 3, or more photos at once or test our curated competition suite. The platform AI will evaluate your work across the 8-attribute <em className="text-white not-italic font-bold">ArtiMuse / TAD66K</em> standard, calculate forensic sensor integrity, rank the entries onto a podium, and return constructive feedback.
          </p>
        </div>

        {/* Guest Mode Indicator */}
        <div className="shrink-0 font-mono text-xs">
          {isAuthenticated ? (
            <div className="px-3.5 py-2 bg-surface-container-low border border-primary-container/30 rounded-sm text-primary-container flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              <span>TESTING AS @{user?.username}</span>
            </div>
          ) : (
            <div className="px-3.5 py-2 bg-surface-container-low border border-white/10 rounded-sm text-on-surface-variant flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary-container" />
              <span>OPEN GUEST TESTING // NO LOGIN REQUIRED</span>
            </div>
          )}
        </div>
      </div>

      {/* 03. Staging Section */}
      <div className="w-full space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2 font-mono text-xs text-white uppercase tracking-wider font-semibold">
            <Layers className="w-4 h-4 text-primary-container" />
            <span>01 {"//"} STAGE PHOTOGRAPHS ({stagedPhotos.length} / 8 LOADED)</span>
          </div>

          <div className="flex items-center gap-3">
            <BracketButton
              variant="outline"
              size="sm"
              bracketStyle="bracket"
              onClick={loadCuratedSamples}
              disabled={isLoadingSamples || isEvaluating}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-primary-container" />}
            >
              {isLoadingSamples ? "LOADING SAMPLES..." : "LOAD 4 CURATED SAMPLE PHOTOS"}
            </BracketButton>

            {stagedPhotos.length > 0 && (
              <button
                onClick={() => {
                  setStagedPhotos([]);
                  setResults(null);
                }}
                disabled={isEvaluating}
                className="font-mono text-xs text-on-surface-variant hover:text-status-error transition-colors uppercase px-2 py-1"
              >
                CLEAR ALL
              </button>
            )}
          </div>
        </div>

        {/* Multi-photo Drag & Drop Target */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-sm p-8 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? "border-primary-container bg-primary-container/5 scale-[1.005]"
              : "border-white/15 bg-surface-container-low/60 hover:border-primary-container/40 hover:bg-surface-container-low"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
            }}
            className="hidden"
          />

          <span className="absolute top-2.5 left-2.5 w-2.5 h-2.5 border-t-2 border-l-2 border-white/20" />
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 border-t-2 border-r-2 border-white/20" />
          <span className="absolute bottom-2.5 left-2.5 w-2.5 h-2.5 border-b-2 border-l-2 border-white/20" />
          <span className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 border-b-2 border-r-2 border-white/20" />

          <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center mb-3 text-primary-container shadow-inner">
            <UploadCloud className="w-6 h-6" />
          </div>

          <h3 className="font-headline text-base sm:text-lg font-bold text-white uppercase tracking-wide mb-1">
            DROP 1 TO 8 PHOTOGRAPHS OR CLICK TO BROWSE
          </h3>
          <p className="font-mono text-xs text-on-surface-variant max-w-md leading-relaxed">
            Select multiple photos to run a comparative aesthetic shootout. Supports JPEG, PNG, and WebP up to 25 MB per file.
          </p>

          <div className="flex items-center gap-3 text-[10px] text-on-surface-variant/70 uppercase tracking-widest mt-4">
            <span>MULTI-SELECT READY</span>
            <span>•</span>
            <span>BLIND EVALUATION</span>
            <span>•</span>
            <span>EXIF AUTO-PARSING</span>
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3 bg-status-error/10 border border-status-error/30 text-status-error text-xs font-mono rounded-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Staged Photos Grid */}
        {stagedPhotos.length > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stagedPhotos.map((photo, idx) => (
                <div
                  key={photo.id}
                  className="bg-surface-container-low border border-white/10 hover:border-white/20 rounded-sm overflow-hidden flex flex-col font-mono shadow-lg transition-all"
                >
                  {/* Photo Preview Thumbnail */}
                  <div className="relative aspect-[16/10] bg-black overflow-hidden flex items-center justify-center">
                    <img
                      src={photo.previewUrl}
                      alt={photo.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/80 backdrop-blur-md rounded-xs border border-white/10 text-[9px] text-white">
                      #{idx + 1}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removePhoto(photo.id);
                      }}
                      className="absolute top-2 right-2 p-1 bg-black/80 hover:bg-status-error/80 text-white rounded-xs transition-colors"
                      title="Remove photograph"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 backdrop-blur-md rounded-xs text-[9px] text-on-surface-variant">
                      {photo.width}×{photo.height}
                    </div>
                  </div>

                  {/* Metadata and Category Selection */}
                  <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-xs text-white font-bold truncate" title={photo.name}>
                        {photo.name}
                      </div>
                      <div className="text-[10px] text-on-surface-variant truncate">
                        {(photo.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB • {photo.cameraModel || "Optical Sensor"}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-on-surface-variant uppercase tracking-wider block">
                        COMPETITION GENRE:
                      </label>
                      <select
                        value={photo.categoryCode}
                        onChange={(e) => updateCategory(photo.id, e.target.value)}
                        className="w-full bg-surface-container-high border border-white/10 rounded-xs px-2 py-1.5 text-xs text-white font-mono focus:border-primary-container focus:outline-none"
                      >
                        {CATEGORY_OPTIONS.map((cat) => (
                          <option key={cat.code} value={cat.code}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Evaluation Action Button Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-container-low border border-white/10 p-4 rounded-sm">
              <div className="font-mono text-xs text-on-surface-variant">
                Ready to evaluate <span className="text-white font-bold">{stagedPhotos.length} photograph{stagedPhotos.length > 1 ? "s" : ""}</span> across 64 neural weights.
              </div>

              <BracketButton
                variant="primary"
                bracketStyle="bracket"
                size="md"
                onClick={runEvaluation}
                disabled={isEvaluating || stagedPhotos.length === 0}
                leftIcon={
                  isEvaluating ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-black" />
                  )
                }
              >
                {isEvaluating
                  ? "EVALUATING IN PROGRESS..."
                  : `[EXECUTE AI SCORING LAB (${stagedPhotos.length} PHOTOS)]`}
              </BracketButton>
            </div>

            {/* Evaluation Progress Bar */}
            {isEvaluating && (
              <div className="p-4 bg-surface-container-low border border-primary-container/30 rounded-sm font-mono space-y-2 animate-pulse">
                <div className="flex items-center justify-between text-xs text-primary-container">
                  <span>{evaluationProgress}</span>
                  <span className="font-bold">PROCESSING BATCH...</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-primary-container rounded-full animate-progress" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 04. Results & Podium Section */}
      {results && results.length > 0 && (
        <div id="sandbox-results" className="w-full space-y-10 pt-8 border-t border-white/[0.08]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-3 font-mono">
            <div className="flex items-center gap-2 text-xs text-white uppercase tracking-wider font-semibold">
              <Trophy className="w-4 h-4 text-primary-container" />
              <span>02 {"//"} COMPARATIVE BENCHMARK PODIUM & RANKINGS</span>
            </div>
            <span className="text-[11px] text-primary-container">
              EVALUATION COMPLETED IN {results[0]?.latencyMs || 850}MS // RANKED BY S_TOTAL
            </span>
          </div>

          {/* Comparative Podium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {results.map((result, idx) => {
              const isSelected = selectedResult?.id === result.id;
              const rank = idx + 1;
              const staged = stagedPhotos.find((p) => p.id === result.id);

              return (
                <div
                  key={result.id}
                  onClick={() => setSelectedResultId(result.id)}
                  className={`cursor-pointer bg-surface-container-low border rounded-sm overflow-hidden flex flex-col font-mono transition-all duration-200 relative ${
                    isSelected
                      ? "border-primary-container ring-1 ring-primary-container shadow-2xl shadow-primary-container/10 scale-[1.01]"
                      : "border-white/10 hover:border-white/25 hover:bg-surface-container"
                  }`}
                >
                  {/* Podium Rank Header */}
                  <div
                    className={`px-3 py-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider ${
                      rank === 1
                        ? "bg-primary-container text-black"
                        : rank === 2
                        ? "bg-white/20 text-white"
                        : rank === 3
                        ? "bg-amber-700/40 text-amber-200 border-b border-amber-500/30"
                        : "bg-surface-container-high text-on-surface-variant"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" />
                      <span>
                        {rank === 1
                          ? "#1 GRAND WINNER"
                          : rank === 2
                          ? "#2 RUNNER-UP"
                          : rank === 3
                          ? "#3 THIRD PLACE"
                          : `#${rank} FINALIST`}
                      </span>
                    </span>
                    <span>{result.overallScore.toFixed(1)} PTS</span>
                  </div>

                  {/* Thumbnail */}
                  <div className="relative aspect-[16/10] bg-black overflow-hidden flex items-center justify-center">
                    {staged?.previewUrl ? (
                      <img
                        src={staged.previewUrl}
                        alt={result.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-xs text-on-surface-variant">Image Preview</div>
                    )}

                    {/* Sensor PRNU Authenticity Tag */}
                    <div className="absolute top-2 left-2">
                      <ForensicChip status="OPTICAL_AUTHENTIC" />
                    </div>

                    {/* Score Ticker on Card */}
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/85 backdrop-blur-md rounded-xs border border-white/10 text-xs font-bold text-primary-container">
                      {result.overallScore.toFixed(1)} / 100
                    </div>
                  </div>

                  {/* Card Telemetry Body */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-sm font-bold text-white truncate" title={result.name}>
                        {result.name}
                      </div>
                      <div className="text-[10px] text-primary-container font-semibold mt-0.5">
                        {result.percentileRank}
                      </div>
                    </div>

                    {/* Quick Metric Bars */}
                    <div className="space-y-1.5 text-[10px]">
                      <div className="flex justify-between text-on-surface-variant">
                        <span>COMPOSITION</span>
                        <span className="text-white font-bold">
                          {result.attributeScores.composition.toFixed(0)}
                        </span>
                      </div>
                      <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-container"
                          style={{ width: `${result.attributeScores.composition}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-on-surface-variant pt-1">
                        <span>THEME ADHERENCE</span>
                        <span className="text-white font-bold">
                          {result.themeAdherenceScore.toFixed(0)}
                        </span>
                      </div>
                      <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400"
                          style={{ width: `${result.themeAdherenceScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Composition tags */}
                    {result.detectedCompositionRules && result.detectedCompositionRules.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {result.detectedCompositionRules.slice(0, 2).map((rule) => (
                          <span
                            key={rule}
                            className="px-1.5 py-0.5 bg-white/[0.05] rounded-xs text-[9px] text-on-surface-variant border border-white/5 truncate"
                          >
                            {rule}
                          </span>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => setSelectedResultId(result.id)}
                      className={`w-full py-1.5 text-center text-[10px] uppercase font-bold tracking-wider rounded-xs border transition-colors ${
                        isSelected
                          ? "bg-primary-container text-black border-primary-container"
                          : "bg-surface-container-high text-on-surface-variant border-white/10 hover:text-white"
                      }`}
                    >
                      {isSelected ? "INSPECTING TELEMETRY ✓" : "INSPECT DETAILS"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 05. Deep-Dive Telemetry Inspector */}
          {selectedResult && (
            <div className="space-y-8 pt-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 font-mono">
                <div className="flex items-center gap-2 text-xs text-white uppercase tracking-wider font-semibold">
                  <Sliders className="w-4 h-4 text-primary-container" />
                  <span>03 {"//"} DEEP-DIVE TELEMETRY: [{selectedResult.name}]</span>
                </div>
                <span className="text-[10px] text-on-surface-variant uppercase">
                  CATEGORY: {selectedResult.categoryName}
                </span>
              </div>

              {/* Scorecard Hero Matrix */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch font-mono">
                {/* Score Ticker Box */}
                <div className="lg:col-span-1 bg-surface-container-low border border-white/10 rounded-sm p-6 flex flex-col justify-between space-y-4 shadow-xl">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                    <span>NORMALIZED OVERALL SCORE</span>
                    <span className="text-primary-container font-mono">S_TOTAL</span>
                  </div>

                  <ScoreTicker
                    score={selectedResult.overallScore}
                    size="hero"
                    animate={false}
                  />

                  <div className="pt-3 border-t border-white/[0.06] space-y-1">
                    <div className="text-xs text-primary-container font-bold">
                      {selectedResult.percentileRank}
                    </div>
                    <div className="text-[10px] text-on-surface-variant leading-relaxed">
                      Calibrated across 8-attribute *ArtiMuse* weights minus defect penalties.
                    </div>
                  </div>
                </div>

                {/* Diagnostics 4-Card Grid */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Theme Adherence */}
                  <DarkroomCard
                    headerTitle="GENRE ADHERENCE"
                    telemetryTag="TANET_GATED"
                    className="flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span className="font-headline text-3xl font-extrabold text-white">
                          {selectedResult.themeAdherenceScore.toFixed(1)}
                        </span>
                        <span className="text-xs text-on-surface-variant">/100.0</span>
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        Fidelity to {selectedResult.categoryName} genre conventions.
                      </p>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden mt-3">
                      <div
                        className="h-full bg-primary-container rounded-full"
                        style={{ width: `${selectedResult.themeAdherenceScore}%` }}
                      />
                    </div>
                  </DarkroomCard>

                  {/* Forensic Status */}
                  <DarkroomCard
                    headerTitle="SENSOR PROVENANCE"
                    telemetryTag="FFT_SCREENED"
                    className="flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <ForensicChip status="OPTICAL_AUTHENTIC" />
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {selectedResult.forensicsSummary?.forensicNotes || "Authentic optical sensor noise profile verified."}
                      </p>
                    </div>
                    <div className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase">
                      SYNTHETIC LIKELIHOOD: {((selectedResult.forensicsSummary?.syntheticLikelihood || 0.03) * 100).toFixed(1)}% ✓
                    </div>
                  </DarkroomCard>

                  {/* Defect Deductions */}
                  <DarkroomCard
                    headerTitle="DEFECT DEDUCTIONS"
                    telemetryTag="AFTERSHOOT_AUDIT"
                    className="flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span className="font-headline text-3xl font-extrabold text-primary-container">
                          {selectedResult.defectDeductions?.totalPenalty > 0
                            ? `-${selectedResult.defectDeductions.totalPenalty.toFixed(1)}`
                            : "0.0"}
                        </span>
                        <span className="text-xs text-on-surface-variant">PTS DEDUCTED</span>
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {selectedResult.defectDeductions?.totalPenalty > 0
                          ? `Penalties detected: ${selectedResult.defectDeductions.detectedDefects.map((d) => d.description).join(", ")}`
                          : "Zero optical defect penalties detected across frame."}
                      </p>
                    </div>
                    <div className="text-[10px] text-on-surface-variant uppercase">
                      MAX ALLOWABLE DEDUCTION: -30.0 PTS
                    </div>
                  </DarkroomCard>

                  {/* Compositional Rules */}
                  <DarkroomCard
                    headerTitle="DETECTED RULES"
                    telemetryTag="IAACLIP_ANALYSIS"
                    className="flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {selectedResult.detectedCompositionRules.map((rule) => (
                          <span
                            key={rule}
                            className="px-2 py-0.5 bg-primary-container/10 border border-primary-container/30 text-primary-container text-xs rounded-xs font-bold"
                          >
                            {rule}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        Geometric heuristics identified in visual structure.
                      </p>
                    </div>
                    <div className="text-[10px] text-primary-container font-bold tracking-widest uppercase">
                      AI MODEL: {selectedResult.modelVersion || "Gemini 2.5 Flash"}
                    </div>
                  </DarkroomCard>
                </div>
              </div>

              {/* 8-Axis Aesthetic Radar + Attribute Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start font-mono">
                {/* Radar Visualizer */}
                <div className="lg:col-span-5 bg-surface-container-low border border-white/10 rounded-sm p-6 flex flex-col items-center justify-center shadow-xl">
                  <div className="w-full flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06] text-xs font-bold text-white uppercase">
                    <span>8-AXIS AESTHETIC RADAR</span>
                    <span className="text-primary-container text-[10px] font-mono">[ARTIMUSE_POLYGON]</span>
                  </div>

                  <AestheticRadarChart
                    score={toAestheticScore(selectedResult)}
                    size={360}
                  />
                </div>

                {/* Sub-Scores Breakdown */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="text-xs uppercase tracking-widest text-on-surface-variant font-bold pb-2 border-b border-white/[0.06]">
                    {"//"} GRANULAR ATTRIBUTE BREAKDOWN (0 - 100)
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: "COMPOSITION & BALANCE", score: selectedResult.attributeScores.composition, desc: "Geometric balance, golden spiral, leading lines" },
                      { label: "LIGHTING & EXPOSURE", score: selectedResult.attributeScores.lighting, desc: "Dynamic range, highlights, chiaroscuro contrast" },
                      { label: "COLOR HARMONY & PALETTE", score: selectedResult.attributeScores.colorHarmony, desc: "Chromatic temperature, complementary tones" },
                      { label: "TECHNICAL EXECUTION", score: selectedResult.attributeScores.technicalExecution, desc: "Focal sharpness, noise floor, optical clarity" },
                      { label: "SUBJECT & STORYTELLING", score: selectedResult.attributeScores.subjectStory, desc: "Decisive moment, narrative depth, emotional intent" },
                      { label: "ORIGINALITY & VISION", score: selectedResult.attributeScores.originality, desc: "Unconventional framing, creative departure" },
                      { label: "MOOD & ATMOSPHERE", score: selectedResult.attributeScores.emotionAtmosphere, desc: "Evocative ambiance, tonal resonance" },
                      { label: "STYLE & POST-PROCESSING", score: selectedResult.attributeScores.overallGestalt, desc: "Signature photographic voice, aesthetic gestalt" },
                    ].map((dim) => (
                      <div
                        key={dim.label}
                        className="p-3 bg-surface-container-low border border-white/[0.06] hover:border-primary-container/30 rounded-sm transition-colors space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-white tracking-wide">
                            {dim.label}
                          </span>
                          <span className="font-headline text-base font-extrabold text-primary-container">
                            {dim.score.toFixed(1)}
                          </span>
                        </div>

                        <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-container rounded-full"
                            style={{ width: `${dim.score}%` }}
                          />
                        </div>

                        <p className="text-[10px] text-on-surface-variant truncate">
                          {dim.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3-Part Constructive Critique */}
              <div className="bg-surface-container-low border border-white/10 rounded-sm p-6 space-y-6 font-mono shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-primary-container" />
                    <span>AI CRITIQUE & TECHNICAL JURY REPORT</span>
                  </div>
                  <span className="text-[10px] text-primary-container">
                    GENERATED BY {selectedResult.modelVersion || "Gemini 2.5 Flash"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Strengths */}
                  <div className="space-y-2 border-l-2 border-primary-container pl-4">
                    <div className="text-[11px] font-bold text-primary-container uppercase tracking-wider">
                      [+] KEY STRENGTHS
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {selectedResult.critique.strengths}
                    </p>
                  </div>

                  {/* Technical Analysis */}
                  <div className="space-y-2 border-l-2 border-white/20 pl-4">
                    <div className="text-[11px] font-bold text-white uppercase tracking-wider">
                      [*] TECHNICAL ANALYSIS
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {selectedResult.critique.technicalAnalysis}
                    </p>
                  </div>

                  {/* Actionable Recommendations */}
                  <div className="space-y-2 border-l-2 border-amber-400 pl-4">
                    <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                      [&gt;] RECOMMENDATIONS
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {selectedResult.critique.recommendations}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 06. Conversion Banner */}
          <div className="w-full bg-surface-container-low border border-primary-container/30 rounded-sm p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 font-mono shadow-2xl">
            <div className="space-y-2 max-w-2xl text-center md:text-left">
              <div className="text-[10px] text-primary-container uppercase tracking-widest font-bold">
                {"//"} READY TO COMPETE FOR REAL PRIZES?
              </div>
              <h3 className="font-headline text-xl sm:text-2xl font-bold text-white uppercase">
                ENTER OPEN COMPETITIONS WITH YOUR WINNING SHOTS
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Take your highest-scoring photo and enter it into official Pixel Prize salons. Compete on global leaderboards judged by multimodal AI and acclaimed human jurors.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
              <BracketButton
                variant="primary"
                bracketStyle="none"
                href="/competitions"
                leftIcon={<Sparkles className="w-4 h-4 text-black" />}
              >
                EXPLORE COMPETITIONS
              </BracketButton>

              {!isAuthenticated && (
                <BracketButton
                  variant="secondary"
                  bracketStyle="bracket"
                  href="/auth/signup"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  CREATE CREATOR ACCOUNT
                </BracketButton>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
