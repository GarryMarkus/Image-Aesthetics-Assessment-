import { prisma } from '../db/prisma.js';
import { CompetitionStatus, SubmissionStatus } from '../types/index.js';
import { NotFoundError } from '../lib/errors.js';

export interface LeaderboardQueryOptions {
  categoryCode?: string;
  limit?: number;
}

export class LeaderboardService {
  /**
   * Get dual-track leaderboard for a competition (AI Score Track vs Community Upvote Track)
   * Enforces blind evaluation during OPEN/JUDGING phases to prevent bandwagon bias
   */
  async getLeaderboard(competitionId: string, options: LeaderboardQueryOptions = {}) {
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: { categories: true },
    });

    if (!competition) {
      throw new NotFoundError('Competition', competitionId);
    }

    // Blind evaluation: While OPEN or JUDGING, conceal photographer identity to prevent social bias
    const isBlind =
      competition.status === CompetitionStatus.OPEN ||
      competition.status === CompetitionStatus.JUDGING;

    const whereAi: any = {
      competitionId,
      status: { in: [SubmissionStatus.SCORED, SubmissionStatus.SHORTLISTED] },
      totalScore: { not: null },
    };

    if (options.categoryCode) {
      whereAi.category = { code: options.categoryCode };
    }

    const limit = Math.min(100, Math.max(1, options.limit || 50));

    // 1. Official AI & Juror Aesthetic Track
    const aiEntries = await prisma.submission.findMany({
      where: whereAi,
      orderBy: [{ totalScore: 'desc' }, { createdAt: 'asc' }],
      take: limit,
      include: {
        category: true,
        imageResource: true,
        jurorVerdict: true,
        user: isBlind
          ? undefined
          : { select: { id: true, name: true, username: true, avatarUrl: true } },
      },
    });

    // 2. Community Upvote Track
    const whereCommunity: any = {
      competitionId,
      status: { not: SubmissionStatus.FLAGGED_DISQUALIFIED },
    };

    if (options.categoryCode) {
      whereCommunity.category = { code: options.categoryCode };
    }

    const communityEntries = await prisma.submission.findMany({
      where: whereCommunity,
      orderBy: [{ communityVotesCount: 'desc' }, { createdAt: 'asc' }],
      take: limit,
      include: {
        category: true,
        imageResource: true,
        user: isBlind
          ? undefined
          : { select: { id: true, name: true, username: true, avatarUrl: true } },
      },
    });

    const officialTrack = aiEntries.map((e, index) => ({
      rank: index + 1,
      submissionId: e.id,
      title: e.title,
      category: e.category.name,
      categoryCode: e.category.code,
      aiScore: isBlind ? null : e.totalScore,
      totalScore: isBlind ? null : e.totalScore,
      communityVotes: e.communityVotesCount,
      webUrl: e.imageResource?.webUrl,
      thumbUrl: e.imageResource?.thumbUrl,
      author: isBlind ? { name: 'Anonymous Entrant' } : e.user,
      photographer: isBlind ? { name: 'Anonymous Entrant' } : e.user,
      podium: e.jurorVerdict?.podiumRank || null,
      podiumVerdict:
        competition.status === CompetitionStatus.RESULTS_PUBLISHED && e.jurorVerdict
          ? {
              rank: e.jurorVerdict.podiumRank,
              remarks: e.jurorVerdict.jurorRemarks,
            }
          : undefined,
    }));

    const communityTrack = communityEntries.map((e, index) => ({
      rank: index + 1,
      submissionId: e.id,
      title: e.title,
      category: e.category.name,
      categoryCode: e.category.code,
      communityVotes: e.communityVotesCount,
      votes: e.communityVotesCount,
      aiScore:
        competition.status === CompetitionStatus.RESULTS_PUBLISHED
          ? e.totalScore
          : isBlind
          ? null
          : e.totalScore,
      webUrl: e.imageResource?.webUrl,
      thumbUrl: e.imageResource?.thumbUrl,
      author: isBlind ? { name: 'Anonymous Entrant' } : e.user,
      photographer: isBlind ? { name: 'Anonymous Entrant' } : e.user,
    }));

    return {
      competition: {
        id: competition.id,
        title: competition.title,
        status: competition.status,
        isBlindEvaluationActive: isBlind,
      },
      competitionId: competition.id,
      competitionTitle: competition.title,
      status: competition.status,
      isBlindEvaluationActive: isBlind,
      officialTrack,
      communityTrack,
      aiStandings: officialTrack,
      communityStandings: communityTrack,
    };
  }
}

export const leaderboardService = new LeaderboardService();
