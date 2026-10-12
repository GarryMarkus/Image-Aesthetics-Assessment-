/**
 * Pixel Prize Strict TypeScript Contracts
 * Single source of truth derived from docs/10_database_schema.md and docs/11_api_specification.md
 */

export type UserRole = "PARTICIPANT" | "ORGANIZER" | "JUROR" | "ADMIN";

export interface User {
  id: string;
  email: string;
  username: string;
  name?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  role: UserRole;
  gearList?: {
    bodies?: string[];
    lenses?: string[];
  } | null;
  createdAt: string;
}

export type CompetitionStatus =
  | "DRAFT"
  | "OPEN"
  | "JUDGING"
  | "SHORTLISTED"
  | "RESULTS_PUBLISHED"
  | "ARCHIVED";

export type CategoryCode =
  | "LANDSCAPE"
  | "PORTRAIT"
  | "STREET"
  | "WILDLIFE"
  | "MACRO"
  | "MONOCHROME"
  | "ARCHITECTURE"
  | "ASTRO"
  | "CONCEPTUAL";

export interface RubricWeights {
  composition: number; // e.g. 0.20
  lighting: number; // e.g. 0.15
  color: number; // e.g. 0.10
  technical: number; // e.g. 0.15
  story: number; // e.g. 0.15
  originality: number; // e.g. 0.10
  mood: number; // e.g. 0.05
  style: number; // e.g. 0.10
}

export interface CompetitionCategory {
  id: string;
  competitionId: string;
  code: CategoryCode;
  name: string;
  description?: string;
  rubricWeights: RubricWeights;
  minResolutionWidth?: number;
  minResolutionHeight?: number;
}

export interface Competition {
  id: string;
  organizerId: string;
  organizer?: Partial<User>;
  title: string;
  slug: string;
  description: string;
  coverImageUrl: string;
  status: CompetitionStatus;
  submissionStartDate: string;
  submissionEndDate: string;
  judgingEndDate: string;
  resultsPublishDate: string;
  maxEntriesPerUser: number;
  entryFeeUsd: number;
  totalPrizePoolUsd: number;
  requireExif: boolean;
  allowRawAppeals: boolean;
  categories?: CompetitionCategory[];
  submissionsCount?: number;
  createdAt: string;
}

export type SubmissionStatus =
  | "IN_QUEUE"
  | "SCORED"
  | "SHORTLISTED"
  | "FLAGGED_DISQUALIFIED"
  | "WITHDRAWN";

export interface ImageResource {
  id: string;
  submissionId: string;
  originalUrl: string;
  previewWebpUrl: string; // 1600px optimized
  thumbWebpUrl: string; // 400px optimized
  width: number;
  height: number;
  fileSizeBytes: number;
  mimeType: string;
  aspectRatio: string; // e.g. "3:2", "16:9", "4:3"
}

export interface ExifMetadata {
  id: string;
  submissionId: string;
  cameraMake?: string | null;
  cameraModel?: string | null;
  lensModel?: string | null;
  focalLengthMm?: number | null;
  iso?: number | null;
  apertureFNumber?: number | null;
  shutterSpeedFraction?: string | null;
  exposureCompensation?: number | null;
  flashFired?: boolean | null;
  dateTaken?: string | null;
}

export interface AestheticScore {
  id: string;
  submissionId: string;
  scoreComposition: number; // 0-100
  scoreLighting: number; // 0-100
  scoreColor: number; // 0-100
  scoreTechnical: number; // 0-100
  scoreStory: number; // 0-100
  scoreOriginality: number; // 0-100
  scoreMood: number; // 0-100
  scoreStyle: number; // 0-100
  scoreThemeAdherence: number; // 0-100
  penaltyDefects: number; // 0-30
  totalScore: number; // 0-100 S_total
  critiqueStrengths: string;
  critiqueWeaknesses: string;
  critiqueActionable: string;
  evaluationRoundsCount: number;
  modelName: string;
  createdAt: string;
}

export type PodiumRank =
  | "FIRST_PLACE"
  | "SECOND_PLACE"
  | "THIRD_PLACE"
  | "HONORABLE_MENTION"
  | "FINALIST";

export interface JurorVerdict {
  id: string;
  submissionId: string;
  jurorId: string;
  juror?: Partial<User>;
  podiumRank: PodiumRank;
  jurorRemarks: string;
  isConfirmedByOrganizer: boolean;
  createdAt: string;
}

export interface Submission {
  id: string;
  competitionId: string;
  categoryId: string;
  userId: string;
  title: string;
  story: string;
  status: SubmissionStatus;
  totalScore?: number | null;
  percentileRank?: number | null;
  communityVotesCount: number;
  dHash?: string | null;
  isForensicDisqualified: boolean;
  disqualificationReason?: string | null;
  author?: Partial<User>;
  category?: CompetitionCategory;
  image?: ImageResource;
  exif?: ExifMetadata;
  aestheticScore?: AestheticScore;
  jurorVerdict?: JurorVerdict;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  submission: Submission;
  score: number;
  track: "ai" | "community";
}

export interface PresignedUrlResponse {
  submissionId?: string;
  uploadUrl: string;
  fileKey: string;
  publicUrl: string;
  expiresInSeconds: number;
}
