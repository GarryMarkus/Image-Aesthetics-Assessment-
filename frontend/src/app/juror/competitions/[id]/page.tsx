"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Competition, Submission } from "@/types";
import { apiClient } from "@/lib/api/client";
import { JurorLightbox } from "@/components/juror/JurorLightbox";
import { DarkroomSkeleton } from "@/components/hud";

export default function JurorReviewTheaterPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [shortlist, setShortlist] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadShortlistData() {
      if (!id) return;
      try {
        const [comp, sl] = await Promise.all([
          apiClient.getCompetitionById(id),
          apiClient.getJurorShortlist(id),
        ]);
        setCompetition(comp);
        setShortlist(sl);
      } catch (err) {
        console.error("Failed to load juror shortlist", err);
      } finally {
        setLoading(false);
      }
    }
    loadShortlistData();
  }, [id]);

  if (loading) {
    return (
      <div className="w-full h-[calc(100vh-64px)] bg-[#090A0F] flex items-center justify-center font-mono text-xs text-on-surface-variant">
        INITIALIZING FULLSCREEN JUROR LIGHTBOX MATRIX...
      </div>
    );
  }

  if (!competition || shortlist.length === 0) {
    return (
      <div className="w-full h-[calc(100vh-64px)] bg-[#090A0F] flex items-center justify-center font-mono text-xs text-on-surface-variant">
        No shortlisted finalists currently queued for this competition.
      </div>
    );
  }

  return <JurorLightbox competition={competition} shortlist={shortlist} />;
}
