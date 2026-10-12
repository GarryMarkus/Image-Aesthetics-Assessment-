import { prisma } from '../db/prisma.js';
import { CompetitionStatus } from '../types/index.js';
import { BadRequestError, NotFoundError } from '../lib/errors.js';
import { ScoringMath } from '../lib/judge/scoring-math.js';

export interface CreateCompetitionInput {
  organizerId: string;
  title: string;
  slug: string;
  description: string;
  bannerUrl: string;
  submissionStartDate: Date;
  submissionEndDate: Date;
  resultsPublishDate: Date;
  maxEntriesPerUser?: number;
  requireExif?: boolean;
  prizeSummary: string;
  categories: Array<{
    code: string;
    name: string;
    description: string;
    rubricWeights: {
      composition: number;
      lighting: number;
      colorHarmony: number;
      technicalExecution: number;
      subjectStory: number;
      originality: number;
      emotionAtmosphere: number;
      overallGestalt: number;
    };
  }>;
  jurorIds?: string[];
}

export class CompetitionService {
  async createCompetition(input: CreateCompetitionInput) {
    // 1. Validate dates
    if (input.submissionEndDate <= input.submissionStartDate) {
      throw new BadRequestError('Submission end date must be after start date');
    }
    if (input.resultsPublishDate <= input.submissionEndDate) {
      throw new BadRequestError('Results publish date must be after submission deadline');
    }

    // 2. Validate category rubric weights
    for (const cat of input.categories) {
      if (!ScoringMath.validateWeights(cat.rubricWeights)) {
        throw new BadRequestError(
          `Rubric weights for category '${cat.name}' must sum to exactly 1.0 (100%)`
        );
      }
    }

    // 3. Create competition in DB
    return prisma.competition.create({
      data: {
        organizerId: input.organizerId,
        title: input.title,
        slug: input.slug,
        description: input.description,
        bannerUrl: input.bannerUrl,
        submissionStartDate: input.submissionStartDate,
        submissionEndDate: input.submissionEndDate,
        resultsPublishDate: input.resultsPublishDate,
        maxEntriesPerUser: input.maxEntriesPerUser ?? 2,
        requireExif: input.requireExif ?? true,
        prizeSummary: input.prizeSummary,
        status: CompetitionStatus.DRAFT,
        categories: {
          create: input.categories.map((c) => ({
            code: c.code,
            name: c.name,
            description: c.description,
            rubricWeights: c.rubricWeights as any,
          })),
        },
        jurorAssignments: {
          create: (input.jurorIds || []).map((jurorId) => ({ jurorId })),
        },
      },
      include: {
        categories: true,
        jurorAssignments: true,
      },
    });
  }

  async listCompetitions(params: {
    status?: CompetitionStatus;
    categoryCode?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 12));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) {
      where.status = params.status;
    }
    if (params.categoryCode) {
      where.categories = {
        some: { code: params.categoryCode },
      };
    }

    const [items, totalCount] = await Promise.all([
      prisma.competition.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submissionEndDate: 'asc' },
        include: {
          categories: { select: { id: true, code: true, name: true } },
          _count: { select: { submissions: true } },
        },
      }),
      prisma.competition.count({ where }),
    ]);

    return {
      data: items.map((c) => ({
        ...c,
        metrics: {
          totalSubmissions: c._count.submissions,
          daysRemaining: Math.max(
            0,
            Math.ceil((c.submissionEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          ),
        },
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  async getCompetitionById(id: string) {
    const competition = await prisma.competition.findUnique({
      where: { id },
      include: {
        categories: true,
        organizer: {
          select: { id: true, name: true, username: true, avatarUrl: true },
        },
        jurorAssignments: {
          include: {
            juror: { select: { id: true, name: true, username: true, avatarUrl: true, bio: true } },
          },
        },
        _count: { select: { submissions: true } },
      },
    });

    if (!competition) {
      throw new NotFoundError('Competition', id);
    }

    return competition;
  }

  static readonly VALID_TRANSITIONS: Record<CompetitionStatus, CompetitionStatus[]> = {
    [CompetitionStatus.DRAFT]: [CompetitionStatus.OPEN],
    [CompetitionStatus.OPEN]: [CompetitionStatus.JUDGING],
    [CompetitionStatus.JUDGING]: [CompetitionStatus.SHORTLISTED],
    [CompetitionStatus.SHORTLISTED]: [CompetitionStatus.RESULTS_PUBLISHED],
    [CompetitionStatus.RESULTS_PUBLISHED]: [CompetitionStatus.ARCHIVED],
    [CompetitionStatus.ARCHIVED]: [],
  };

  static isValidTransition(currentStatus: CompetitionStatus, targetStatus: CompetitionStatus): boolean {
    const allowed = CompetitionService.VALID_TRANSITIONS[currentStatus] || [];
    return allowed.includes(targetStatus);
  }

  async transitionState(competitionId: string, targetStatus: CompetitionStatus) {
    const competition = await this.getCompetitionById(competitionId);

    if (!CompetitionService.isValidTransition(competition.status, targetStatus)) {
      throw new BadRequestError(
        `Invalid lifecycle transition from ${competition.status} to ${targetStatus}`
      );
    }

    return prisma.competition.update({
      where: { id: competitionId },
      data: { status: targetStatus },
    });
  }
}

export const competitionService = new CompetitionService();
