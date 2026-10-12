import { prisma } from '../db/prisma.js';
import { storage } from '../lib/storage.js';
import { mediaQueue } from '../lib/queue.js';
import { SubmissionStatus, CompetitionStatus } from '../types/index.js';
import { BadRequestError, NotFoundError, QuotaExceededError } from '../lib/errors.js';

export interface PresignedUrlRequest {
  userId: string;
  competitionId: string;
  filename: string;
  mimeType: string;
  fileSizeBytes: number;
}

export interface ConfirmSubmissionInput {
  submissionId: string;
  userId: string;
  competitionId: string;
  categoryId: string;
  title: string;
  story?: string;
}

export class SubmissionService {
  static readonly MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

  static validateFileSize(fileSizeBytes: number) {
    if (fileSizeBytes > SubmissionService.MAX_FILE_SIZE_BYTES) {
      throw new BadRequestError('File size exceeds the 25 MB maximum limit');
    }
  }

  static isScorecardVisible(
    competitionStatus: CompetitionStatus,
    submissionUserId: string,
    requestingUserId?: string
  ): boolean {
    if (competitionStatus === CompetitionStatus.RESULTS_PUBLISHED) {
      return true;
    }
    return Boolean(requestingUserId && submissionUserId === requestingUserId);
  }

  static calculatePercentileRank(
    lowerScoredCount: number,
    totalInCategory: number,
    categoryName: string
  ): string {
    const percentile =
      totalInCategory > 0
        ? Math.round((lowerScoredCount / totalInCategory) * 100)
        : 100;
    return `Top ${Math.max(1, 100 - percentile)}% in ${categoryName}`;
  }

  /**
   * Request direct-to-cloud presigned upload ticket after quota validation
   */
  async requestPresignedUploadUrl(input: PresignedUrlRequest) {
    const competition = await prisma.competition.findUnique({
      where: { id: input.competitionId },
      include: {
        _count: {
          select: {
            submissions: {
              where: {
                userId: input.userId,
                status: { not: SubmissionStatus.WITHDRAWN },
              },
            },
          },
        },
      },
    });

    if (!competition) {
      throw new NotFoundError('Competition', input.competitionId);
    }

    if (competition.status !== CompetitionStatus.OPEN) {
      throw new BadRequestError(`Competition is currently in '${competition.status}' status and not accepting submissions`);
    }

    // Verify quota
    const currentSubmissionsCount = competition._count.submissions;
    if (currentSubmissionsCount >= competition.maxEntriesPerUser) {
      throw new QuotaExceededError(
        `User has already submitted ${currentSubmissionsCount} of ${competition.maxEntriesPerUser} allowed entries`
      );
    }

    // File validation
    SubmissionService.validateFileSize(input.fileSizeBytes);

    const ext = input.filename.split('.').pop() || 'jpg';
    const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const storageKey = `raw-uploads/${submissionId}.${ext}`;

    const uploadUrl = await storage.getPresignedUploadUrl(storageKey, input.mimeType, 900);

    return {
      submissionId,
      uploadUrl,
      storageKey,
      expiresInSeconds: 900,
    };
  }

  /**
   * Confirm photo upload and enqueue background media ingestion
   */
  async confirmSubmission(input: ConfirmSubmissionInput, storageKey: string) {
    // 1. Create DB Submission Record
    const submission = await prisma.submission.create({
      data: {
        id: input.submissionId,
        competitionId: input.competitionId,
        categoryId: input.categoryId,
        userId: input.userId,
        title: input.title,
        story: input.story,
        status: SubmissionStatus.IN_QUEUE,
        dHash: '0000000000000000', // Populated by media worker
      },
    });

    // 2. Dispatch to Media Ingestion Queue
    await mediaQueue.add('INGEST_MEDIA', {
      submissionId: input.submissionId,
      storageKey,
    });

    return {
      submissionId: submission.id,
      status: submission.status,
      message: 'Submission confirmed. Media processing and AI evaluation in progress.',
    };
  }

  /**
   * Get submission details
   */
  async getSubmissionById(id: string) {
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        category: true,
        imageResource: true,
        exifMetadata: true,
        aestheticScore: true,
        jurorVerdict: true,
        user: { select: { id: true, name: true, username: true, avatarUrl: true } },
      },
    });

    if (!submission) {
      throw new NotFoundError('Submission', id);
    }

    return submission;
  }

  /**
   * Get AI Diagnostic Scorecard with percentile ranking
   */
  async getScorecard(submissionId: string, requestingUserId?: string) {
    const submission = await this.getSubmissionById(submissionId);

    if (!submission.aestheticScore) {
      throw new BadRequestError('Aesthetic evaluation has not completed yet for this submission');
    }

    // Check privacy: If competition is not yet RESULTS_PUBLISHED, only author can view scorecard
    const comp = await prisma.competition.findUnique({ where: { id: submission.competitionId } });
    if (
      comp &&
      !SubmissionService.isScorecardVisible(comp.status, submission.userId, requestingUserId)
    ) {
      throw new BadRequestError('Scorecard is private until competition results are officially published');
    }

    // Calculate percentile in category
    const totalInCategory = await prisma.submission.count({
      where: {
        categoryId: submission.categoryId,
        status: SubmissionStatus.SCORED,
      },
    });

    const lowerScoredCount = await prisma.submission.count({
      where: {
        categoryId: submission.categoryId,
        status: SubmissionStatus.SCORED,
        totalScore: { lt: submission.totalScore ?? 0 },
      },
    });

    const percentileRank = SubmissionService.calculatePercentileRank(
      lowerScoredCount,
      totalInCategory,
      submission.category.name
    );

    return {
      submissionId: submission.id,
      title: submission.title,
      categoryName: submission.category.name,
      overallScore: submission.aestheticScore.overallScore,
      themeAdherenceScore: submission.aestheticScore.themeAdherenceScore,
      attributeScores: {
        composition: submission.aestheticScore.compositionScore,
        lighting: submission.aestheticScore.lightingScore,
        colorHarmony: submission.aestheticScore.colorHarmonyScore,
        technicalExecution: submission.aestheticScore.technicalScore,
        subjectStory: submission.aestheticScore.subjectStoryScore,
        originality: submission.aestheticScore.originalityScore,
        emotionAtmosphere: submission.aestheticScore.emotionScore,
        overallGestalt: submission.aestheticScore.gestaltScore,
      },
      detectedCompositionRules: submission.aestheticScore.detectedCompositionRules,
      defectPenaltyPoints: submission.aestheticScore.defectPenaltyPoints,
      defectDetails: submission.aestheticScore.defectDetails,
      critique: {
        strengths: submission.aestheticScore.critiqueStrengths,
        technicalAnalysis: submission.aestheticScore.critiqueTechnical,
        recommendations: submission.aestheticScore.critiqueRecommendations,
      },
      forensicsSummary: {
        syntheticLikelihood: submission.aestheticScore.syntheticLikelihood,
        isLikelyAuthenticPhoto: submission.aestheticScore.syntheticLikelihood < 0.5,
        forensicNotes: 'Forensics scan verified.',
      },
      percentileRank,
    };
  }

  /**
   * Cast community upvote
   */
  async castCommunityVote(submissionId: string, userId: string) {
    const existing = await prisma.communityVote.findUnique({
      where: {
        submissionId_userId: { submissionId, userId },
      },
    });

    if (existing) {
      // Toggle / remove vote
      const [, updated] = await prisma.$transaction([
        prisma.communityVote.delete({
          where: { id: existing.id },
        }),
        prisma.submission.update({
          where: { id: submissionId },
          data: { communityVotesCount: { decrement: 1 } },
        }),
      ]);
      return { submissionId, hasVoted: false, newVoteCount: updated.communityVotesCount };
    }

    const [, updated] = await prisma.$transaction([
      prisma.communityVote.create({
        data: { submissionId, userId },
      }),
      prisma.submission.update({
        where: { id: submissionId },
        data: { communityVotesCount: { increment: 1 } },
      }),
    ]);

    return { submissionId, hasVoted: true, newVoteCount: updated.communityVotesCount };
  }
}

export const submissionService = new SubmissionService();
