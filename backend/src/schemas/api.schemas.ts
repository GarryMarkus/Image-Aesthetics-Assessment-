import { z } from 'zod';
import { Role, CompetitionStatus, PodiumRank } from '../types/index.js';

// -----------------------------------------------------------------------------
// 1. Auth Schemas
// -----------------------------------------------------------------------------
export const registerSchema = z.object({
  email: z.string().email('Valid email address is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Full name is required'),
  role: z.nativeEnum(Role).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(1, 'Password is required'),
});

// -----------------------------------------------------------------------------
// 2. Competition Schemas
// -----------------------------------------------------------------------------
export const rubricWeightsSchema = z.object({
  composition: z.number().min(0).max(1),
  lighting: z.number().min(0).max(1),
  colorHarmony: z.number().min(0).max(1),
  technicalExecution: z.number().min(0).max(1),
  subjectStory: z.number().min(0).max(1),
  originality: z.number().min(0).max(1),
  emotionAtmosphere: z.number().min(0).max(1),
  overallGestalt: z.number().min(0).max(1),
});

export const categoryInputSchema = z.object({
  code: z.string().min(1, 'Category code is required'),
  name: z.string().min(1, 'Category name is required'),
  description: z.string(),
  rubricWeights: rubricWeightsSchema,
});

export const createCompetitionSchema = z.object({
  title: z.string().min(1, 'Competition title is required'),
  slug: z.string().min(1, 'URL slug is required'),
  description: z.string(),
  bannerUrl: z.string().min(1, 'Banner URL is required'),
  submissionStartDate: z.string().or(z.date()),
  submissionEndDate: z.string().or(z.date()),
  resultsPublishDate: z.string().or(z.date()),
  maxEntriesPerUser: z.number().int().min(1).max(5).optional().default(2),
  requireExif: z.boolean().optional().default(true),
  prizeSummary: z.string().min(1, 'Prize summary is required'),
  categories: z.array(categoryInputSchema).min(1, 'At least one category is required'),
  jurorIds: z.array(z.string()).optional(),
});

export const updateCompetitionStatusSchema = z.object({
  status: z.nativeEnum(CompetitionStatus, {
    errorMap: () => ({ message: 'Invalid target competition status' }),
  }),
});

// -----------------------------------------------------------------------------
// 3. Submission Schemas
// -----------------------------------------------------------------------------
export const presignedUrlRequestSchema = z.object({
  competitionId: z.string().min(1, 'competitionId is required'),
  filename: z.string().min(1, 'filename is required'),
  mimeType: z.string().min(1, 'mimeType is required'),
  fileSizeBytes: z.number().positive('fileSizeBytes must be a positive number'),
});

export const confirmSubmissionSchema = z.object({
  submissionId: z.string().min(1, 'submissionId is required'),
  competitionId: z.string().min(1, 'competitionId is required'),
  categoryId: z.string().min(1, 'categoryId is required'),
  title: z.string().min(1, 'title is required'),
  story: z.string().optional(),
  storageKey: z.string().min(1, 'storageKey is required'),
});

// -----------------------------------------------------------------------------
// 4. Juror Schemas
// -----------------------------------------------------------------------------
export const podiumAllocationSchema = z.object({
  submissionId: z.string().min(1, 'submissionId is required'),
  podiumRank: z.nativeEnum(PodiumRank, {
    errorMap: () => ({ message: 'Invalid podium rank' }),
  }),
  jurorRemarks: z.string().optional(),
});

export const submitVerdictSchema = z.object({
  podiums: z.array(podiumAllocationSchema).min(1, 'At least one podium allocation is required'),
});

// -----------------------------------------------------------------------------
// 5. Appeals Schemas
// -----------------------------------------------------------------------------
export const fileAppealSchema = z.object({
  submissionId: z.string().min(1, 'submissionId is required'),
  reason: z.string().min(5, 'Appeal reason must be at least 5 characters'),
  rawProofUrl: z.string().optional(),
});

export const resolveAppealSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT'], {
    errorMap: () => ({ message: "Decision must be 'APPROVE' or 'REJECT'" }),
  }),
  adminRemarks: z.string().optional(),
});
