import {
  Competition,
  Submission,
  AestheticScore,
  LeaderboardEntry,
  JurorVerdict,
  PresignedUrlResponse,
} from "@/types";
import {
  mockCompetitions,
  mockSubmissions,
} from "@/mocks/fixtures";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const IS_MOCK_MODE =
  process.env.NEXT_PUBLIC_USE_MOCK !== "false"; // Defaults to true during frontend development

// Simulated network latency for realistic feel in mock mode
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const apiClient = {
  /**
   * Fetch competitions list with optional status/category filter
   */
  async getCompetitions(filter?: {
    status?: string;
    category?: string;
  }): Promise<Competition[]> {
    if (IS_MOCK_MODE) {
      await delay(150);
      let list = [...mockCompetitions];
      if (filter?.status) {
        list = list.filter((c) => c.status === filter.status);
      }
      if (filter?.category) {
        list = list.filter((c) =>
          c.categories?.some((cat) => cat.code === filter.category)
        );
      }
      return list;
    }

    const params = new URLSearchParams();
    if (filter?.status) params.append("status", filter.status);
    if (filter?.category) params.append("category", filter.category);

    const res = await fetch(`${API_BASE_URL}/api/competitions?${params.toString()}`);
    if (!res.ok) throw new Error(`Failed to fetch competitions: ${res.statusText}`);
    return res.json();
  },

  /**
   * Fetch single competition details by ID or slug
   */
  async getCompetitionById(idOrSlug: string): Promise<Competition | null> {
    if (IS_MOCK_MODE) {
      await delay(100);
      const found = mockCompetitions.find(
        (c) => c.id === idOrSlug || c.slug === idOrSlug
      );
      return found || null;
    }

    const res = await fetch(`${API_BASE_URL}/api/competitions/${idOrSlug}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to fetch competition: ${res.statusText}`);
    return res.json();
  },

  /**
   * Fetch public gallery submissions for a competition
   */
  async getCompetitionGallery(
    competitionId: string,
    options?: { page?: number; limit?: number }
  ): Promise<{ submissions: Submission[]; total: number }> {
    if (IS_MOCK_MODE) {
      await delay(150);
      const subs = mockSubmissions.filter(
        (s) => s.competitionId === competitionId || !competitionId
      );
      return {
        submissions: subs.length > 0 ? subs : mockSubmissions,
        total: subs.length > 0 ? subs.length : mockSubmissions.length,
      };
    }

    const params = new URLSearchParams();
    if (options?.page) params.append("page", String(options.page));
    if (options?.limit) params.append("limit", String(options.limit));

    const res = await fetch(
      `${API_BASE_URL}/api/competitions/${competitionId}/gallery?${params.toString()}`
    );
    if (!res.ok) throw new Error(`Failed to fetch gallery: ${res.statusText}`);
    return res.json();
  },

  /**
   * Fetch dual-track leaderboard for a competition
   */
  async getCompetitionLeaderboard(
    competitionId: string,
    track: "ai" | "community" = "ai"
  ): Promise<LeaderboardEntry[]> {
    if (IS_MOCK_MODE) {
      await delay(120);
      const sorted = [...mockSubmissions].sort((a, b) => {
        if (track === "ai") {
          return (b.totalScore || 0) - (a.totalScore || 0);
        } else {
          return (b.communityVotesCount || 0) - (a.communityVotesCount || 0);
        }
      });

      return sorted.map((submission, index) => ({
        rank: index + 1,
        submission,
        score:
          track === "ai"
            ? submission.totalScore || 0
            : submission.communityVotesCount,
        track,
      }));
    }

    const res = await fetch(
      `${API_BASE_URL}/api/competitions/${competitionId}/leaderboard?track=${track}`
    );
    if (!res.ok) throw new Error(`Failed to fetch leaderboard: ${res.statusText}`);
    return res.json();
  },

  /**
   * Fetch individual submission with full image & EXIF metadata
   */
  async getSubmissionById(submissionId: string): Promise<Submission | null> {
    if (IS_MOCK_MODE) {
      await delay(100);
      const found = mockSubmissions.find((s) => s.id === submissionId);
      return found || mockSubmissions[0];
    }

    const res = await fetch(`${API_BASE_URL}/api/submissions/${submissionId}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to fetch submission: ${res.statusText}`);
    return res.json();
  },

  /**
   * Fetch private AI diagnostic scorecard with 8-attribute breakdown & critique
   */
  async getSubmissionScorecard(
    submissionId: string
  ): Promise<AestheticScore | null> {
    if (IS_MOCK_MODE) {
      await delay(150);
      const found = mockSubmissions.find((s) => s.id === submissionId);
      return found?.aestheticScore || mockSubmissions[0].aestheticScore || null;
    }

    const res = await fetch(
      `${API_BASE_URL}/api/submissions/${submissionId}/scorecard`
    );
    if (!res.ok) throw new Error(`Failed to fetch scorecard: ${res.statusText}`);
    return res.json();
  },

  /**
   * Fetch Juror Top 10 Shortlist for a competition
   */
  async getJurorShortlist(competitionId: string): Promise<Submission[]> {
    if (IS_MOCK_MODE) {
      await delay(150);
      return mockSubmissions.filter((s) => s.status === "SHORTLISTED" || s.totalScore && s.totalScore > 85);
    }

    const res = await fetch(
      `${API_BASE_URL}/api/juror/competitions/${competitionId}/shortlist`
    );
    if (!res.ok) throw new Error(`Failed to fetch juror shortlist: ${res.statusText}`);
    return res.json();
  },

  /**
   * Submit Juror final podium verdict
   */
  async submitJurorVerdict(verdict: {
    submissionId: string;
    podiumRank: "FIRST_PLACE" | "SECOND_PLACE" | "THIRD_PLACE" | "HONORABLE_MENTION";
    jurorRemarks: string;
  }): Promise<JurorVerdict> {
    if (IS_MOCK_MODE) {
      await delay(250);
      return {
        id: `verd_sim_${Date.now()}`,
        submissionId: verdict.submissionId,
        jurorId: "usr_juror_01",
        podiumRank: verdict.podiumRank,
        jurorRemarks: verdict.jurorRemarks,
        isConfirmedByOrganizer: false,
        createdAt: new Date().toISOString(),
      };
    }

    const res = await fetch(`${API_BASE_URL}/api/juror/verdicts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(verdict),
    });
    if (!res.ok) throw new Error(`Failed to submit juror verdict: ${res.statusText}`);
    return res.json();
  },

  /**
   * Request Cloudflare R2 presigned upload URL
   */
  async getPresignedUploadUrl(payload: {
    competitionId: string;
    filename: string;
    fileSizeBytes: number;
    mimeType: string;
  }): Promise<PresignedUrlResponse> {
    if (IS_MOCK_MODE) {
      await delay(200);
      return {
        uploadUrl: "https://mock-r2-upload.pixelprize.org/presigned",
        fileKey: `raw/${payload.competitionId}/${Date.now()}-${payload.filename}`,
        publicUrl: "/images/samples/03_portrait_artisan.png",
        expiresInSeconds: 900,
      };
    }

    const res = await fetch(`${API_BASE_URL}/api/submissions/presigned-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to get presigned URL: ${res.statusText}`);
    return res.json();
  },
};
