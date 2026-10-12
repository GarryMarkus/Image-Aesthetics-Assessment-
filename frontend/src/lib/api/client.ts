import {
  Competition,
  Submission,
  AestheticScore,
  LeaderboardEntry,
  JurorVerdict,
  PresignedUrlResponse,
  User,
  UserRole,
} from "@/types";
import {
  mockCompetitions,
  mockSubmissions,
} from "@/mocks/fixtures";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const IS_MOCK_MODE =
  process.env.NEXT_PUBLIC_USE_MOCK === "true"; // Default to real backend unless explicitly set to true

const TOKEN_STORAGE_KEY = "pixel_prize_auth_token";

// Safe local storage helpers for SSR compatibility
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

function getHeaders(contentType: string | null = "application/json"): HeadersInit {
  const headers: Record<string, string> = {};
  if (contentType) {
    headers["Content-Type"] = contentType;
  }
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// Simulated network latency for mock mode
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const apiClient = {
  // ---------------------------------------------------------------------------
  // Token & Authentication
  // ---------------------------------------------------------------------------
  getAuthToken,
  setAuthToken,
  clearAuthToken,

  async register(payload: {
    email: string;
    username: string;
    password: string;
    name: string;
    role?: UserRole;
  }): Promise<{ user: User; token: string }> {
    if (IS_MOCK_MODE) {
      await delay(200);
      const user: User = {
        id: `usr_${Date.now()}`,
        email: payload.email,
        username: payload.username,
        name: payload.name,
        role: payload.role || "PARTICIPANT",
        createdAt: new Date().toISOString(),
      };
      const token = `mock_jwt_${Date.now()}`;
      setAuthToken(token);
      return { user, token };
    }

    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || `Registration failed (${res.status})`);
    }

    const data = await res.json();
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  async login(payload: {
    email: string;
    password: string;
  }): Promise<{ user: User; token: string }> {
    if (IS_MOCK_MODE) {
      await delay(200);
      const user: User = {
        id: "usr_mock_01",
        email: payload.email,
        username: payload.email.split("@")[0] || "user",
        name: "Test User",
        role: payload.email.includes("organizer")
          ? "ORGANIZER"
          : payload.email.includes("juror")
          ? "JUROR"
          : payload.email.includes("admin")
          ? "ADMIN"
          : "PARTICIPANT",
        createdAt: new Date().toISOString(),
      };
      const token = `mock_jwt_${Date.now()}`;
      setAuthToken(token);
      return { user, token };
    }

    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || `Login failed (${res.status})`);
    }

    const data = await res.json();
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  async getMe(): Promise<User | null> {
    const token = getAuthToken();
    if (!token) return null;

    if (IS_MOCK_MODE) {
      await delay(100);
      return {
        id: "usr_mock_01",
        email: "photographer@pixelprize.org",
        username: "kenji_lens",
        name: "Kenji Sato",
        role: "PARTICIPANT",
        createdAt: new Date().toISOString(),
      };
    }

    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: getHeaders(),
    });

    if (res.status === 401) {
      clearAuthToken();
      return null;
    }

    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  },

  logout(): void {
    clearAuthToken();
  },

  // ---------------------------------------------------------------------------
  // Competitions
  // ---------------------------------------------------------------------------
  async getCompetitions(filter?: {
    status?: string;
    category?: string;
  }): Promise<Competition[]> {
    if (IS_MOCK_MODE) {
      await delay(150);
      let list = [...mockCompetitions];
      if (filter?.status && filter.status !== "ALL") {
        list = list.filter((c) => c.status === filter.status);
      }
      if (filter?.category && filter.category !== "ALL") {
        list = list.filter((c) =>
          c.categories?.some((cat) => cat.code === filter.category)
        );
      }
      return list;
    }

    const params = new URLSearchParams();
    if (filter?.status && filter.status !== "ALL") params.append("status", filter.status);
    if (filter?.category && filter.category !== "ALL") params.append("category", filter.category);

    const res = await fetch(`${API_BASE_URL}/api/competitions?${params.toString()}`);
    if (!res.ok) throw new Error(`Failed to fetch competitions: ${res.statusText}`);
    const json = await res.json();
    // Normalize backend paginated shape { data: [...] } or array
    const rawList = Array.isArray(json) ? json : json.data || [];
    return rawList.map((c: any) => ({
      ...c,
      coverImageUrl: c.bannerUrl || c.coverImageUrl || "/images/samples/07_pixel_prize_desktop.png",
      submissionsCount: c.metrics?.totalSubmissions ?? c._count?.submissions ?? c.submissionsCount ?? 0,
    }));
  },

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
    const c = await res.json();
    return {
      ...c,
      coverImageUrl: c.bannerUrl || c.coverImageUrl || "/images/samples/07_pixel_prize_desktop.png",
      submissionsCount: c.metrics?.totalSubmissions ?? c._count?.submissions ?? c.submissionsCount ?? 0,
    };
  },

  async createCompetition(payload: {
    title: string;
    slug: string;
    description: string;
    bannerUrl: string;
    submissionStartDate: string;
    submissionEndDate: string;
    resultsPublishDate: string;
    maxEntriesPerUser?: number;
    requireExif?: boolean;
    prizeSummary: string;
    categories: Array<{
      code: string;
      name: string;
      description: string;
      rubricWeights: Record<string, number>;
    }>;
    jurorIds?: string[];
  }): Promise<Competition> {
    if (IS_MOCK_MODE) {
      await delay(250);
      const newComp: Competition = {
        id: `comp_${Date.now()}`,
        organizerId: "usr_organizer_01",
        title: payload.title,
        slug: payload.slug,
        description: payload.description,
        coverImageUrl: payload.bannerUrl,
        status: "DRAFT",
        submissionStartDate: payload.submissionStartDate,
        submissionEndDate: payload.submissionEndDate,
        judgingEndDate: payload.resultsPublishDate,
        resultsPublishDate: payload.resultsPublishDate,
        maxEntriesPerUser: payload.maxEntriesPerUser ?? 2,
        entryFeeUsd: 0,
        totalPrizePoolUsd: 5000,
        requireExif: payload.requireExif ?? true,
        allowRawAppeals: true,
        createdAt: new Date().toISOString(),
      };
      return newComp;
    }

    const res = await fetch(`${API_BASE_URL}/api/competitions`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || `Failed to create competition (${res.status})`);
    }

    return res.json();
  },

  async updateCompetitionStatus(
    competitionId: string,
    status: string
  ): Promise<any> {
    if (IS_MOCK_MODE) {
      await delay(200);
      return { id: competitionId, status };
    }

    const res = await fetch(`${API_BASE_URL}/api/competitions/${competitionId}/status`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || `Failed to update status (${res.status})`);
    }

    return res.json();
  },

  async getCompetitionGallery(
    competitionId: string,
    options?: { page?: number; limit?: number; categoryCode?: string }
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
    if (options?.categoryCode) params.append("categoryCode", options.categoryCode);

    const res = await fetch(
      `${API_BASE_URL}/api/competitions/${competitionId}/gallery?${params.toString()}`
    );
    if (!res.ok) throw new Error(`Failed to fetch gallery: ${res.statusText}`);
    const json = await res.json();

    const items = json.data || json.submissions || [];
    const normalized: Submission[] = items.map((sub: any) => ({
      id: sub.id,
      competitionId,
      categoryId: sub.categoryId || "",
      userId: sub.userId || "",
      title: sub.title,
      story: sub.story || "",
      status: sub.status || "SCORED",
      totalScore: sub.totalScore || null,
      communityVotesCount: sub.votesCount ?? sub.communityVotesCount ?? 0,
      isForensicDisqualified: false,
      category: {
        id: sub.categoryCode || "",
        competitionId,
        code: sub.categoryCode || "STREET",
        name: sub.category || "General",
        rubricWeights: {
          composition: 0.2,
          lighting: 0.2,
          color: 0.15,
          technical: 0.15,
          story: 0.15,
          originality: 0.05,
          mood: 0.05,
          style: 0.05,
        },
      },
      image: {
        id: `img_${sub.id}`,
        submissionId: sub.id,
        originalUrl: sub.images?.webUrl || sub.images?.originalUrl || "/images/samples/03_portrait_artisan.png",
        previewWebpUrl: sub.images?.webUrl || "/images/samples/03_portrait_artisan.png",
        thumbWebpUrl: sub.images?.thumbUrl || "/images/samples/03_portrait_artisan.png",
        width: sub.images?.width || 1920,
        height: sub.images?.height || 1080,
        fileSizeBytes: 0,
        mimeType: "image/jpeg",
        aspectRatio: "16:9",
      },
      exif: sub.exif
        ? {
            id: `exif_${sub.id}`,
            submissionId: sub.id,
            cameraModel: sub.exif.camera,
            lensModel: sub.exif.lens,
            shutterSpeedFraction: sub.exif.exposure,
            apertureFNumber: sub.exif.aperture,
            iso: sub.exif.iso,
          }
        : undefined,
      createdAt: new Date().toISOString(),
    }));

    return {
      submissions: normalized,
      total: json.pagination?.totalCount ?? json.total ?? normalized.length,
    };
  },

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
      `${API_BASE_URL}/api/competitions/${competitionId}/leaderboard`
    );
    if (!res.ok) throw new Error(`Failed to fetch leaderboard: ${res.statusText}`);
    const json = await res.json();

    const trackEntries =
      track === "ai"
        ? json.officialTrack || json.aiStandings || []
        : json.communityTrack || json.communityStandings || [];

    return trackEntries.map((e: any, index: number) => {
      const sub: Submission = {
        id: e.submissionId || e.id,
        competitionId,
        categoryId: e.categoryCode || "",
        userId: e.author?.id || "",
        title: e.title,
        story: e.story || "",
        status: "SCORED",
        totalScore: e.aiScore ?? e.totalScore ?? null,
        communityVotesCount: e.communityVotes ?? e.votes ?? 0,
        isForensicDisqualified: false,
        author: e.author || e.photographer,
        category: {
          id: e.categoryCode || "",
          competitionId,
          code: e.categoryCode || "STREET",
          name: e.category || "General",
          rubricWeights: {
            composition: 0.2,
            lighting: 0.2,
            color: 0.15,
            technical: 0.15,
            story: 0.15,
            originality: 0.05,
            mood: 0.05,
            style: 0.05,
          },
        },
        image: {
          id: `img_${e.submissionId}`,
          submissionId: e.submissionId,
          originalUrl: e.webUrl || "/images/samples/03_portrait_artisan.png",
          previewWebpUrl: e.webUrl || "/images/samples/03_portrait_artisan.png",
          thumbWebpUrl: e.thumbUrl || "/images/samples/03_portrait_artisan.png",
          width: 1920,
          height: 1080,
          fileSizeBytes: 0,
          mimeType: "image/jpeg",
          aspectRatio: "16:9",
        },
        jurorVerdict: e.podium
          ? {
              id: `verd_${e.submissionId}`,
              submissionId: e.submissionId,
              jurorId: "usr_juror",
              podiumRank: e.podium,
              jurorRemarks: e.podiumVerdict?.remarks || "",
              isConfirmedByOrganizer: true,
              createdAt: new Date().toISOString(),
            }
          : undefined,
        createdAt: new Date().toISOString(),
      };

      return {
        rank: e.rank || index + 1,
        submission: sub,
        score: track === "ai" ? e.aiScore ?? e.totalScore ?? 0 : e.communityVotes ?? e.votes ?? 0,
        track,
      };
    });
  },

  // ---------------------------------------------------------------------------
  // Submissions & Storage Pipeline
  // ---------------------------------------------------------------------------
  async getSubmissionById(submissionId: string): Promise<Submission | null> {
    if (IS_MOCK_MODE) {
      await delay(100);
      const found = mockSubmissions.find((s) => s.id === submissionId);
      return found || mockSubmissions[0];
    }

    const res = await fetch(`${API_BASE_URL}/api/submissions/${submissionId}`, {
      headers: getHeaders(),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to fetch submission: ${res.statusText}`);
    const sub = await res.json();
    return {
      ...sub,
      image: sub.imageResource
        ? {
            id: sub.imageResource.id,
            submissionId: sub.imageResource.submissionId,
            originalUrl: sub.imageResource.originalUrl,
            previewWebpUrl: sub.imageResource.webUrl,
            thumbWebpUrl: sub.imageResource.thumbUrl,
            width: sub.imageResource.width,
            height: sub.imageResource.height,
            fileSizeBytes: sub.imageResource.fileSizeBytes,
            mimeType: sub.imageResource.mimeType,
            aspectRatio: `${sub.imageResource.width}:${sub.imageResource.height}`,
          }
        : sub.image,
      exif: sub.exifMetadata || sub.exif,
    };
  },

  async getSubmissionScorecard(
    submissionId: string
  ): Promise<AestheticScore | null> {
    if (IS_MOCK_MODE) {
      await delay(150);
      const found = mockSubmissions.find((s) => s.id === submissionId);
      return found?.aestheticScore || mockSubmissions[0].aestheticScore || null;
    }

    const res = await fetch(
      `${API_BASE_URL}/api/submissions/${submissionId}/scorecard`,
      { headers: getHeaders() }
    );
    if (!res.ok) throw new Error(`Failed to fetch scorecard: ${res.statusText}`);
    const json = await res.json();

    // Map backend response shape { overallScore, attributeScores: {...}, critique: {...} }
    // to match AestheticScore contract expected by UI components
    const mapped: AestheticScore = {
      id: json.id || `sc_${submissionId}`,
      submissionId,
      totalScore: json.overallScore ?? json.totalScore ?? 0,
      scoreComposition: json.attributeScores?.composition ?? json.scoreComposition ?? 0,
      scoreLighting: json.attributeScores?.lighting ?? json.scoreLighting ?? 0,
      scoreColor: json.attributeScores?.colorHarmony ?? json.scoreColor ?? 0,
      scoreTechnical: json.attributeScores?.technicalExecution ?? json.scoreTechnical ?? 0,
      scoreStory: json.attributeScores?.subjectStory ?? json.scoreStory ?? 0,
      scoreOriginality: json.attributeScores?.originality ?? json.scoreOriginality ?? 0,
      scoreMood: json.attributeScores?.emotionAtmosphere ?? json.scoreMood ?? 0,
      scoreStyle: json.attributeScores?.overallGestalt ?? json.scoreStyle ?? 0,
      scoreThemeAdherence: json.themeAdherenceScore ?? json.scoreThemeAdherence ?? 0,
      penaltyDefects: json.defectPenaltyPoints ?? json.penaltyDefects ?? 0,
      critiqueStrengths: json.critique?.strengths ?? json.critiqueStrengths ?? "",
      critiqueWeaknesses: json.critique?.technicalAnalysis ?? json.critiqueWeaknesses ?? "",
      critiqueActionable: json.critique?.recommendations ?? json.critiqueActionable ?? "",
      evaluationRoundsCount: json.numPasses ?? 1,
      modelName: json.modelProvider || "Gemini 2.5 Flash",
      createdAt: json.createdAt || new Date().toISOString(),
    };

    return mapped;
  },

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
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || `Failed to get presigned URL: ${res.statusText}`);
    }

    const data = await res.json();
    return {
      uploadUrl: data.uploadUrl,
      fileKey: data.storageKey || data.fileKey,
      publicUrl: data.publicUrl || "",
      expiresInSeconds: data.expiresInSeconds || 900,
      submissionId: data.submissionId,
    } as PresignedUrlResponse & { submissionId?: string };
  },

  /**
   * Directly upload raw photo binary to presigned storage endpoint
   */
  async uploadBinary(
    uploadUrl: string,
    file: File | Blob,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    if (IS_MOCK_MODE) {
      for (let p = 20; p <= 100; p += 20) {
        await delay(80);
        onProgress?.(p);
      }
      return;
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", file.type || "image/jpeg");

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            onProgress(pct);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Binary upload failed with HTTP status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during binary upload"));
      xhr.send(file);
    });
  },

  /**
   * Confirm photo upload and register submission in database
   */
  async confirmSubmission(payload: {
    submissionId: string;
    competitionId: string;
    categoryId: string;
    title: string;
    story?: string;
    storageKey: string;
  }): Promise<{ submissionId: string; status: string; queuePosition?: number }> {
    if (IS_MOCK_MODE) {
      await delay(250);
      return {
        submissionId: payload.submissionId,
        status: "IN_QUEUE",
        queuePosition: 3,
      };
    }

    const res = await fetch(`${API_BASE_URL}/api/submissions`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || `Failed to confirm submission: ${res.statusText}`);
    }

    return res.json();
  },

  async voteSubmission(submissionId: string): Promise<{
    submissionId: string;
    hasVoted: boolean;
    newVoteCount: number;
  }> {
    if (IS_MOCK_MODE) {
      await delay(100);
      return {
        submissionId,
        hasVoted: true,
        newVoteCount: 42,
      };
    }

    const res = await fetch(`${API_BASE_URL}/api/submissions/${submissionId}/vote`, {
      method: "POST",
      headers: getHeaders(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || `Vote request failed (${res.status})`);
    }

    return res.json();
  },

  async getMySubmissions(): Promise<Submission[]> {
    if (IS_MOCK_MODE) {
      await delay(150);
      return mockSubmissions;
    }

    const res = await fetch(`${API_BASE_URL}/api/submissions/my`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      if (res.status === 401) return [];
      throw new Error(`Failed to load creator submissions (${res.status})`);
    }

    return res.json();
  },

  // ---------------------------------------------------------------------------
  // Juror Operations
  // ---------------------------------------------------------------------------
  async getJurorShortlist(competitionId: string): Promise<Submission[]> {
    if (IS_MOCK_MODE) {
      await delay(150);
      return mockSubmissions.filter(
        (s) => s.status === "SHORTLISTED" || (Boolean(s.totalScore) && (s.totalScore ?? 0) > 85)
      );
    }

    const res = await fetch(
      `${API_BASE_URL}/api/juror/competitions/${competitionId}/shortlist`,
      { headers: getHeaders() }
    );
    if (!res.ok) throw new Error(`Failed to fetch juror shortlist: ${res.statusText}`);
    const json = await res.json();
    const rawList = json.entries || (Array.isArray(json) ? json : []);

    return rawList.map((entry: any) => ({
      id: entry.submissionId || entry.id,
      competitionId,
      categoryId: entry.category || "",
      userId: "",
      title: entry.title,
      story: entry.story || "",
      status: "SHORTLISTED",
      totalScore: entry.aiOverallScore || entry.totalScore,
      communityVotesCount: 0,
      isForensicDisqualified: false,
      category: {
        id: "cat_default",
        competitionId,
        code: "STREET",
        name: entry.category || "General",
        rubricWeights: {
          composition: 0.2,
          lighting: 0.2,
          color: 0.15,
          technical: 0.15,
          story: 0.15,
          originality: 0.05,
          mood: 0.05,
          style: 0.05,
        },
      },
      image: {
        id: `img_${entry.submissionId}`,
        submissionId: entry.submissionId,
        originalUrl: entry.images?.originalUrl || entry.images?.webUrl || "/images/samples/03_portrait_artisan.png",
        previewWebpUrl: entry.images?.webUrl || "/images/samples/03_portrait_artisan.png",
        thumbWebpUrl: entry.images?.webUrl || "/images/samples/03_portrait_artisan.png",
        width: 1920,
        height: 1080,
        fileSizeBytes: 0,
        mimeType: "image/jpeg",
        aspectRatio: "16:9",
      },
      exif: entry.exif
        ? {
            id: `exif_${entry.submissionId}`,
            submissionId: entry.submissionId,
            cameraModel: entry.exif.camera,
            lensModel: entry.exif.lens,
            shutterSpeedFraction: entry.exif.exposure,
          }
        : undefined,
      createdAt: new Date().toISOString(),
    }));
  },

  async submitJurorVerdict(
    competitionId: string,
    podiums: Array<{
      submissionId: string;
      podiumRank: "FIRST_PLACE" | "SECOND_PLACE" | "THIRD_PLACE" | "HONORABLE_MENTION";
      jurorRemarks?: string;
    }>
  ): Promise<any> {
    if (IS_MOCK_MODE) {
      await delay(250);
      return {
        status: "VERDICT_REGISTERED",
        competitionId,
        assignedPodiumsCount: podiums.length,
      };
    }

    const res = await fetch(`${API_BASE_URL}/api/juror/competitions/${competitionId}/verdict`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ podiums }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || `Failed to submit juror verdict: ${res.statusText}`);
    }

    return res.json();
  },

  // ---------------------------------------------------------------------------
  // Appeals
  // ---------------------------------------------------------------------------
  async fileAppeal(payload: {
    submissionId: string;
    reason: string;
    rawProofUrl?: string;
  }): Promise<any> {
    if (IS_MOCK_MODE) {
      await delay(200);
      return { id: `app_${Date.now()}`, ...payload, status: "PENDING" };
    }

    const res = await fetch(`${API_BASE_URL}/api/appeals`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || `Failed to file appeal: ${res.statusText}`);
    }

    return res.json();
  },

  async resolveAppeal(
    appealId: string,
    decision: "APPROVE" | "REJECT",
    adminRemarks?: string
  ): Promise<any> {
    if (IS_MOCK_MODE) {
      await delay(200);
      return { id: appealId, status: decision === "APPROVE" ? "APPROVED" : "REJECTED" };
    }

    const res = await fetch(`${API_BASE_URL}/api/appeals/${appealId}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ decision, adminRemarks }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || `Failed to resolve appeal: ${res.statusText}`);
    }

    return res.json();
  },
};
