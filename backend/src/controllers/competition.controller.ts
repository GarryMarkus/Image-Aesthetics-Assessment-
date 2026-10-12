import { Request, Response } from 'express';
import { competitionService } from '../services/competition.service.js';
import { shortlistService } from '../services/shortlist.service.js';
import { prisma } from '../db/prisma.js';
import { CompetitionStatus, SubmissionStatus } from '../types/index.js';
import { BadRequestError, NotFoundError } from '../lib/errors.js';

export class CompetitionController {
  async list(req: Request, res: Response) {
    const { status, category, page, limit } = req.query;

    const result = await competitionService.listCompetitions({
      status: status as CompetitionStatus | undefined,
      categoryCode: category as string | undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    res.json(result);
  }

  async create(req: Request, res: Response) {
    const organizerId = req.user!.id;
    const body = req.body;

    const competition = await competitionService.createCompetition({
      ...body,
      organizerId,
      submissionStartDate: new Date(body.submissionStartDate),
      submissionEndDate: new Date(body.submissionEndDate),
      resultsPublishDate: new Date(body.resultsPublishDate),
    });

    res.status(201).json(competition);
  }

  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const competition = await competitionService.getCompetitionById(id);
    res.json(competition);
  }

  async updateStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      throw new BadRequestError('Target status is required');
    }

    const updated = await competitionService.transitionState(id, status as CompetitionStatus);

    // If moving to SHORTLISTED, automatically generate shortlist
    if (status === CompetitionStatus.SHORTLISTED) {
      await shortlistService.generateShortlist(id);
    }

    res.json(updated);
  }

  async getLeaderboard(req: Request, res: Response) {
    const { id } = req.params;
    const { categoryCode } = req.query;

    const competition = await competitionService.getCompetitionById(id);

    // Blind judging rule: While OPEN, AI scores are hidden to prevent bandwagon effect
    const isBlind = competition.status === CompetitionStatus.OPEN || competition.status === CompetitionStatus.JUDGING;

    const where: any = {
      competitionId: id,
      status: { in: [SubmissionStatus.SCORED, SubmissionStatus.SHORTLISTED] },
    };

    if (categoryCode) {
      where.category = { code: categoryCode };
    }

    // 1. Official AI & Juror Track
    const aiLeaderboard = await prisma.submission.findMany({
      where,
      orderBy: { totalScore: 'desc' },
      take: 100,
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
    const communityLeaderboard = await prisma.submission.findMany({
      where: {
        competitionId: id,
        status: { not: SubmissionStatus.FLAGGED_DISQUALIFIED },
      },
      orderBy: { communityVotesCount: 'desc' },
      take: 50,
      include: {
        category: true,
        imageResource: true,
        user: isBlind
          ? undefined
          : { select: { id: true, name: true, username: true, avatarUrl: true } },
      },
    });

    res.json({
      competition: {
        id: competition.id,
        title: competition.title,
        status: competition.status,
        isBlindEvaluationActive: isBlind,
      },
      aiStandings: aiLeaderboard.map((sub, idx) => ({
        rank: idx + 1,
        submissionId: sub.id,
        title: sub.title,
        category: sub.category.name,
        totalScore: isBlind ? null : sub.totalScore,
        thumbUrl: sub.imageResource?.thumbUrl,
        webUrl: sub.imageResource?.webUrl,
        author: isBlind ? { name: 'Anonymous Entrant' } : sub.user,
        podium: sub.jurorVerdict?.podiumRank || null,
      })),
      communityStandings: communityLeaderboard.map((sub, idx) => ({
        rank: idx + 1,
        submissionId: sub.id,
        title: sub.title,
        category: sub.category.name,
        votes: sub.communityVotesCount,
        thumbUrl: sub.imageResource?.thumbUrl,
        author: isBlind ? { name: 'Anonymous Entrant' } : sub.user,
      })),
    });
  }

  async getGallery(req: Request, res: Response) {
    const { id } = req.params;
    const { categoryCode, page = '1', limit = '24' } = req.query;

    const competition = await prisma.competition.findUnique({ where: { id } });
    if (!competition) {
      throw new NotFoundError('Competition', id);
    }

    const where: any = {
      competitionId: id,
      status: { not: SubmissionStatus.FLAGGED_DISQUALIFIED },
    };

    if (categoryCode && categoryCode !== 'ALL') {
      where.category = { code: categoryCode };
    }

    const p = Math.max(1, Number(page));
    const l = Math.min(60, Number(limit));

    const [items, totalCount] = await Promise.all([
      prisma.submission.findMany({
        where,
        skip: (p - 1) * l,
        take: l,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          imageResource: true,
          exifMetadata: true,
          _count: { select: { votes: true } },
        },
      }),
      prisma.submission.count({ where }),
    ]);

    res.json({
      data: items.map((sub) => ({
        id: sub.id,
        title: sub.title,
        category: sub.category.name,
        categoryCode: sub.category.code,
        images: {
          webUrl: sub.imageResource?.webUrl,
          thumbUrl: sub.imageResource?.thumbUrl,
          width: sub.imageResource?.width,
          height: sub.imageResource?.height,
        },
        exif: sub.exifMetadata
          ? {
              camera: sub.exifMetadata.cameraModel,
              lens: sub.exifMetadata.lensModel,
              exposure: sub.exifMetadata.shutterSpeed,
              aperture: sub.exifMetadata.aperture,
              iso: sub.exifMetadata.iso,
            }
          : null,
        votesCount: sub._count.votes,
      })),
      pagination: {
        page: p,
        limit: l,
        totalCount,
        totalPages: Math.ceil(totalCount / l),
      },
    });
  }
}

export const competitionController = new CompetitionController();
