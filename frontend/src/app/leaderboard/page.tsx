"use client";

import React, { useState, useEffect } from "react";
import { LeaderboardEntry } from "@/types";
import { apiClient } from "@/lib/api/client";
import { LeaderboardView } from "@/components/leaderboard/LeaderboardView";
import { DarkroomSkeleton } from "@/components/hud";

export default function GlobalLeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [track, setTrack] = useState<"ai" | "community">("ai");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await apiClient.getCompetitionLeaderboard(
          "comp_portrait_2026",
          track
        );
        setEntries(data);
      } catch (err) {
        console.error("Failed to load leaderboard", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [track]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-10 py-10 md:py-14 space-y-10">
      {loading ? (
        <div className="space-y-6">
          <DarkroomSkeleton height="80px" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DarkroomSkeleton height="320px" />
            <DarkroomSkeleton height="360px" />
            <DarkroomSkeleton height="320px" />
          </div>
        </div>
      ) : (
        <LeaderboardView
          entries={entries}
          currentTrack={track}
          onTrackChange={(t) => setTrack(t)}
          competitionTitle="GLOBAL SALON CHAMPIONSHIP"
        />
      )}
    </div>
  );
}
