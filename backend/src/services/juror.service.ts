import { prisma } from '../db/prisma.js';
import { PodiumRank, SubmissionStatus, CompetitionStatus } from '../types/index.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export interface PodiumAllocation {
  submissionId: string;
  podiumRank: PodiumRank;
  jurorRemarks?: string;
}

export class JurorService {
  /**
   * Get the Top 10 shortlisted entries for a juror
   */
  async getShortlistForJuror(competitionId: string, jurorId: string) {
    // 1. Verify juror is assigned to this competition
    const assignment = await prisma.jurorAssignment.findUnique({
      where: {
        competitionId_jurorId: { competitionId, jurorId },
      },
    });

    const isOrganizer = await prisma.competition.findFirst({
      where: { id: competitionId, organizerId: jurorId },
    });

    if (!assignment && !isOrganizer) {
      throw new ForbiddenError('User is not an appointed juror or organizer for this competition');
    }

    // 2. Fetch all shortlisted entries with assets and scores
    const entries = await prisma.submission.findMany({
      where: {
        competitionId,
        status: { in: [SubmissionStatus.SHORTLISTED, SubmissionStatus.SCORED] },
      },
      orderBy: { totalScore: 'desc' },
      include: {
        category: true,
        imageResource: true,
        exifMetadata: true,
        aestheticScore: true,
        jurorVerdict: true,
      },
    });

    return {
      competitionId,
      shortlistedCount: entries.length,
      entries: entries.map((e) => ({
        submissionId: e.id,
        category: e.category.name,
        categoryCode: e.category.code,
        title: e.title,
        story: e.story,
        aiOverallScore: e.totalScore,
        categoryRank: e.categoryRank,
        images: {
          originalUrl: e.imageResource?.originalUrl,
          webUrl: e.imageResource?.webUrl,
          thumbUrl: e.imageResource?.thumbUrl,
        },
        exif: e.exifMetadata
          ? {
              camera: `${e.exifMetadata.cameraMake || ''} ${e.exifMetadata.cameraModel || ''}`.trim() || undefined,
              lens: e.exifMetadata.lensModel,
              exposure: `${e.exifMetadata.shutterSpeed || ''}, f/${e.exifMetadata.aperture || ''}, ISO ${e.exifMetadata.iso || ''}`,
            }
          : undefined,
        aiScorecard: e.aestheticScore
          ? {
              overallScore: e.aestheticScore.overallScore,
              critiqueStrengths: e.aestheticScore.critiqueStrengths,
              critiqueTechnical: e.aestheticScore.critiqueTechnical,
            }
          : undefined,
        currentVerdict: e.jurorVerdict
          ? {
              podiumRank: e.jurorVerdict.podiumRank,
              jurorRemarks: e.jurorVerdict.jurorRemarks,
            }
          : undefined,
      })),
    };
  }

  /**
   * Submit juror podium verdicts (1st, 2nd, 3rd, Honorable Mention)
   */
  async submitVerdict(competitionId: string, jurorId: string, podiums: PodiumAllocation[]) {
    if (podiums.length === 0) {
      throw new BadRequestError('At least one podium winner must be selected');
    }

    const comp = await prisma.competition.findUnique({ where: { id: competitionId } });
    if (!comp) {
      throw new NotFoundError('Competition', competitionId);
    }

    // Insert or update verdicts
    const results = await prisma.$transaction(
      podiums.map((p) =>
        prisma.jurorVerdict.upsert({
          where: { submissionId: p.submissionId },
          update: {
            podiumRank: p.podiumRank,
            jurorRemarks: p.jurorRemarks,
            jurorId,
          },
          create: {
            competitionId,
            submissionId: p.submissionId,
            jurorId,
            podiumRank: p.podiumRank,
            jurorRemarks: p.jurorRemarks,
          },
        })
      )
    );

    logger.info(
      `[JurorService] Juror ${jurorId} registered verdicts for ${results.length} submissions in competition ${competitionId}`
    );

    return {
      status: 'VERDICT_REGISTERED',
      competitionId,
      assignedPodiumsCount: results.length,
    };
  }

  /**
   * Publish final results and unlock public leaderboard
   */
  async publishOfficialResults(competitionId: string, organizerId: string) {
    const comp = await prisma.competition.findFirst({
      where: { id: competitionId, organizerId },
    });

    if (!comp) {
      throw new ForbiddenError('Only the competition organizer can publish official results');
    }

    // Update status to RESULTS_PUBLISHED
    const updated = await prisma.competition.update({
      where: { id: competitionId },
      data: { status: CompetitionStatus.RESULTS_PUBLISHED },
    });

    logger.info(`[JurorService] Competition ${competitionId} results officially published to the public.`);
    return updated;
  }
}

export const jurorService = new JurorService();
