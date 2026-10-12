"use client";

import React, { useState, useMemo } from "react";
import { Submission, CategoryCode } from "@/types";
import { PhotoCard } from "./PhotoCard";
import { PhotoDetailModal } from "./PhotoDetailModal";
import { Filter, SlidersHorizontal, Sparkles } from "lucide-react";

export interface PhotoMasonryGalleryProps {
  submissions: Submission[];
  showCategoryFilters?: boolean;
  defaultCategory?: string;
  className?: string;
}

export function PhotoMasonryGallery({
  submissions,
  showCategoryFilters = true,
  defaultCategory = "ALL",
  className = "",
}: PhotoMasonryGalleryProps) {
  const [activeCategory, setActiveCategory] = useState<string>(defaultCategory);
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [sortBy, setSortBy] = useState<"score" | "votes">("score");

  const categories: { label: string; code: string }[] = [
    { label: "ALL WORKS", code: "ALL" },
    { label: "PORTRAIT", code: "PORTRAIT" },
    { label: "ASTRO", code: "ASTRO" },
    { label: "WILDLIFE", code: "WILDLIFE" },
    { label: "MACRO", code: "MACRO" },
  ];

  const filteredSubmissions = useMemo(() => {
    let result = [...submissions];
    if (activeCategory !== "ALL") {
      result = result.filter(
        (s) => s.category?.code === activeCategory
      );
    }

    result.sort((a, b) => {
      if (sortBy === "score") {
        return (b.totalScore || 0) - (a.totalScore || 0);
      } else {
        return (b.communityVotesCount || 0) - (a.communityVotesCount || 0);
      }
    });

    return result;
  }, [submissions, activeCategory, sortBy]);

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* Filtering & Sorting Toolbar */}
      {showCategoryFilters && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06] font-mono text-xs">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest mr-1.5 flex items-center gap-1">
              <Filter className="w-3 h-3 text-primary-container" />
              <span>CATEGORY:</span>
            </span>
            {categories.map((cat) => {
              const isActive = activeCategory === cat.code;
              return (
                <button
                  key={cat.code}
                  onClick={() => setActiveCategory(cat.code)}
                  className={`px-3 py-1.5 rounded-sm uppercase tracking-wider text-[11px] font-semibold transition-all ${
                    isActive
                      ? "bg-primary-container text-on-primary-fixed shadow-sm shadow-primary-container/20"
                      : "bg-surface-container text-on-surface-variant hover:text-white hover:bg-surface-container-high border border-white/[0.06]"
                  }`}
                >
                  [{cat.label}]
                </button>
              );
            })}
          </div>

          {/* Sort Switcher */}
          <div className="flex items-center gap-2 self-end sm:self-auto text-[11px]">
            <span className="text-on-surface-variant uppercase flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-primary-container" />
              <span>ORDER:</span>
            </span>
            <div className="inline-flex bg-surface-container p-0.5 rounded-sm border border-white/[0.08]">
              <button
                onClick={() => setSortBy("score")}
                className={`px-2.5 py-1 rounded-xs uppercase tracking-wider font-semibold transition-all ${
                  sortBy === "score"
                    ? "bg-primary-container text-on-primary-fixed"
                    : "text-on-surface-variant hover:text-white"
                }`}
              >
                AI SCORE
              </button>
              <button
                onClick={() => setSortBy("votes")}
                className={`px-2.5 py-1 rounded-xs uppercase tracking-wider font-semibold transition-all ${
                  sortBy === "votes"
                    ? "bg-primary-container text-on-primary-fixed"
                    : "text-on-surface-variant hover:text-white"
                }`}
              >
                UPVOTES
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Aspect-Ratio Preserving CSS Columns Masonry */}
      {filteredSubmissions.length > 0 ? (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {filteredSubmissions.map((sub) => (
            <PhotoCard
              key={sub.id}
              submission={sub}
              onSelect={(s) => setSelectedSubmission(s)}
            />
          ))}
        </div>
      ) : (
        <div className="w-full py-16 text-center font-mono text-sm text-on-surface-variant border border-dashed border-white/10 rounded-sm">
          No photographic entries registered under category [{activeCategory}].
        </div>
      )}

      {/* Detailed Modal on Image Click */}
      <PhotoDetailModal
        submission={selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
      />
    </div>
  );
}
