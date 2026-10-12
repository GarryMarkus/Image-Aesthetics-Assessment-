import { prisma } from '../db/prisma.js';
import { SubmissionStatus, CompetitionStatus } from '../types/index.js';
import { NotFoundError, BadRequestError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export class ShortlistService {
  /**
   * Automatically generate verified Top 10 shortlists for all categories in a competition
   */
  async generateShortlist(competitionId: string) {
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: { categories: true },
    });

    if (!competition) {
      throw new NotFoundError('Competition', competitionId);
    }

    if (
      competition.status !== CompetitionStatus.JUDGING &&
      competition.status !== CompetitionStatus.SHORTLISTED
    ) {
      throw new BadRequestError(
        `Cannot generate shortlist for competition in '${competition.status}' status. Competition must be in JUDGING status.`
      );
    }

    const shortlistedSummary: Record<string, number> = {};

    for (const cat of competition.categories) {
      // Fetch top 10 scored non-disqualified submissions
      const topEntries = await prisma.submission.findMany({
        where: {
          competitionId,
          categoryId: cat.id,
          status: SubmissionStatus.SCORED,
          totalScore: { not: null },
        },
        orderBy: { totalScore: 'desc' },
        take: 10,
      });

      // Update their status to SHORTLISTED and assign preliminary categoryRank
      for (let i = 0; i < topEntries.length; i++) {
        await prisma.submission.update({
          where: { id: topEntries[i].id },
          data: {
            status: SubmissionStatus.SHORTLISTED,
            categoryRank: i + 1,
          },
        });
      }

      shortlistedSummary[cat.code] = topEntries.length;
    }

    // Update competition status to SHORTLISTED
    await prisma.competition.update({
      where: { id: competitionId },
      data: { status: CompetitionStatus.SHORTLISTED },
    });

    logger.info(`[ShortlistService] Generated shortlists for competition ${competitionId}`, shortlistedSummary);
    return shortlistedSummary;
  }
}

export const shortlistService = new ShortlistService();
