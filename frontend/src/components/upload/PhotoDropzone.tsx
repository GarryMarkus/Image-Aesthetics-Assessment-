"use client";

import React, { useState, useRef, useEffect } from "react";
import { UploadCloud, AlertCircle, X } from "lucide-react";
import { ExifMetadata } from "@/types";
import { parseClientExif } from "@/lib/exif";
import { ExifHudBadge, ForensicChip, BracketButton } from "@/components/hud";

export interface DroppedImagePayload {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  exif: ExifMetadata;
  hasExif: boolean;
}

export interface PhotoDropzoneProps {
  onImageSelected: (payload: DroppedImagePayload | null) => void;
  selectedPayload: DroppedImagePayload | null;
  className?: string;
}

export function PhotoDropzone({
  onImageSelected,
  selectedPayload,
  className = "",
}: PhotoDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke object URL on unmount to prevent memory leaks with large 25MB files
  useEffect(() => {
    return () => {
      if (selectedPayload?.previewUrl) {
        URL.revokeObjectURL(selectedPayload.previewUrl);
      }
    };
  }, [selectedPayload?.previewUrl]);

  const processFile = async (file: File) => {
    setErrorMessage(null);
    setIsProcessing(true);

    // Validate mime type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setErrorMessage("Unsupported format. Please upload JPEG, PNG, or WebP.");
      setIsProcessing(false);
      return;
    }

    // Validate size (max 25MB)
    const maxBytes = 25 * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrorMessage("File exceeds 25 MB competition cap.");
      setIsProcessing(false);
      return;
    }

    // Revoke previous URL if any
    if (selectedPayload?.previewUrl) {
      URL.revokeObjectURL(selectedPayload.previewUrl);
    }

    let previewUrl: string | null = null;
    try {
      previewUrl = URL.createObjectURL(file);

      // Measure dimensions safely with onerror rejection
      const img = new window.Image();
      img.src = previewUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Corrupted or unreadable image file"));
      });

      // Parse EXIF client-side
      const parsed = await parseClientExif(file);

      onImageSelected({
        file,
        previewUrl,
        width: img.naturalWidth || 1920,
        height: img.naturalHeight || 1080,
        exif: parsed.exif,
        hasExif: parsed.hasExif,
      });
    } catch (err) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      console.error("Failed to parse file", err);
      setErrorMessage("Failed to decode image or read metadata. Please try another optical file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleClear = () => {
    if (selectedPayload) {
      URL.revokeObjectURL(selectedPayload.previewUrl);
    }
    onImageSelected(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`w-full font-mono ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* State A: File Selected & Previewing */}
      {selectedPayload ? (
        <div className="relative bg-surface-container-low border border-white/15 rounded-sm p-4 space-y-4 shadow-xl">
          {/* Top Bar with Clear Button */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-primary-container inline-block" />
              <span className="font-semibold text-white truncate max-w-xs">
                {selectedPayload.file.name}
              </span>
              <span className="text-on-surface-variant text-[11px]">
                ({(selectedPayload.file.size / (1024 * 1024)).toFixed(2)} MB)
              </span>
            </div>

            <button
              onClick={handleClear}
              className="p-1.5 hover:bg-white/10 rounded-xs text-on-surface-variant hover:text-white transition-colors"
              title="Remove and select another photo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Photographic Preview Canvas */}
          <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] bg-black rounded-xs overflow-hidden flex items-center justify-center">
            <img
              src={selectedPayload.previewUrl}
              alt="Selected Preview"
              className="max-h-full max-w-full object-contain"
            />

            {/* Viewfinder corner reticles */}
            <span className="absolute top-2 left-2 w-2 h-2 border-t border-l border-primary-container" />
            <span className="absolute top-2 right-2 w-2 h-2 border-t border-r border-primary-container" />
            <span className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-primary-container" />
            <span className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-primary-container" />

            {/* Floating Resolution Pill */}
            <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 backdrop-blur-md rounded-xs border border-white/10 text-[10px] text-white">
              {selectedPayload.width} × {selectedPayload.height} PX
            </div>
          </div>

          {/* Forensic & EXIF Status Strip */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {selectedPayload.hasExif ? (
                  <ForensicChip status="OPTICAL_AUTHENTIC" />
                ) : (
                  <ForensicChip
                    status="EXIF_MISSING"
                    customMessage="METADATA STRIPPED (EXIF RECOMMENDED)"
                  />
                )}
              </div>

              {selectedPayload.width < 1920 && (
                <span className="text-[10px] text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>Sub-1080p resolution may impact technical sharpness scoring</span>
                </span>
              )}
            </div>

            {/* Inline Extracted EXIF Pill Strip */}
            {selectedPayload.hasExif && (
              <ExifHudBadge
                exif={{
                  cameraMake: selectedPayload.exif.cameraMake,
                  cameraModel: selectedPayload.exif.cameraModel,
                  lensModel: selectedPayload.exif.lensModel,
                  aperture: selectedPayload.exif.apertureFNumber,
                  shutterSpeed: selectedPayload.exif.shutterSpeedFraction,
                  iso: selectedPayload.exif.iso,
                }}
                layout="inline"
              />
            )}
          </div>
        </div>
      ) : (
        /* State B: Empty Darkroom Dropzone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-sm p-8 sm:p-14 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? "border-primary-container bg-primary-container/5 scale-[1.01]"
              : "border-white/15 bg-surface-container-low/60 hover:border-primary-container/40 hover:bg-surface-container-low"
          }`}
        >
          {/* Subtle Viewfinder Crosshairs */}
          <span className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-white/20" />
          <span className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-white/20" />
          <span className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-white/20" />
          <span className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-white/20" />

          {/* Center Upload Glyph */}
          <div className="w-14 h-14 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center mb-4 text-primary-container shadow-inner">
            <UploadCloud className="w-7 h-7" />
          </div>

          <h3 className="font-headline text-lg sm:text-xl font-bold text-white uppercase tracking-wide mb-1">
            DROP OPTICAL PHOTOGRAPH HERE
          </h3>
          <p className="font-mono text-xs text-on-surface-variant max-w-md mb-4 leading-relaxed">
            Drag and drop uncompressed JPEG, PNG, or WebP. Camera EXIF parameters will be parsed instantly in your browser.
          </p>

          <BracketButton
            variant="outline"
            bracketStyle="bracket"
            size="sm"
            type="button"
          >
            SELECT FROM FILE SYSTEM
          </BracketButton>

          <div className="flex items-center gap-4 text-[10px] text-on-surface-variant/80 uppercase tracking-widest mt-6">
            <span>MAX 25 MB</span>
            <span>•</span>
            <span>RGB / sRGB</span>
            <span>•</span>
            <span>PRESERVES MASTER RATIO</span>
          </div>

          {errorMessage && (
            <div className="mt-4 p-2 bg-status-error/10 border border-status-error/30 text-status-error text-xs rounded-xs flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
