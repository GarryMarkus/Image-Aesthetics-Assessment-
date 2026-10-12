import { Request, Response } from 'express';
import { competitionService } from '../services/competition.service.js';
import { shortlistService } from '../services/shortlist.service.js';
import { leaderboardService } from '../services/leaderboard.service.js';
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

    const previous = await competitionService.getCompetitionById(id);
    const updated = await competitionService.transitionState(id, status as CompetitionStatus);

    // If moving to SHORTLISTED, automatically generate shortlist
    if (status === CompetitionStatus.SHORTLISTED) {
      await shortlistService.generateShortlist(id);
    }

    res.json({
      id: updated.id,
      previousStatus: previous.status,
      newStatus: updated.status,
      updatedAt: updated.updatedAt,
      competition: updated,
    });
  }

  async getLeaderboard(req: Request, res: Response) {
    const { id } = req.params;
    const { categoryCode, limit } = req.query;

    const result = await leaderboardService.getLeaderboard(id, {
      categoryCode: categoryCode as string | undefined,
      limit: limit ? Number(limit) : undefined,
    });

    res.json(result);
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
