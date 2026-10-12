import { prisma } from '../db/prisma.js';
import { mediaQueue } from '../lib/queue.js';
import { AppealStatus, SubmissionStatus, Role } from '../types/index.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../lib/errors.js';

export class AppealsService {
  static validateAppealEligibility(
    submissionUserId: string,
    submissionStatus: SubmissionStatus,
    filingUserId: string
  ) {
    if (submissionUserId !== filingUserId) {
      throw new ForbiddenError('Only the photographer can file an appeal for their submission');
    }

    if (submissionStatus !== SubmissionStatus.FLAGGED_DISQUALIFIED) {
      throw new BadRequestError('Only disqualified submissions can be appealed');
    }
  }

  async fileAppeal(submissionId: string, userId: string, reason: string, rawProofUrl?: string) {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      throw new NotFoundError('Submission', submissionId);
    }

    AppealsService.validateAppealEligibility(submission.userId, submission.status, userId);

    return prisma.appealTicket.upsert({
      where: { submissionId },
      update: {
        reason,
        rawProofUrl,
        status: AppealStatus.PENDING,
      },
      create: {
        submissionId,
        userId,
        reason,
        rawProofUrl,
        status: AppealStatus.PENDING,
      },
    });
  }

  async resolveAppeal(
    appealId: string,
    reviewerId: string,
    decision: 'APPROVE' | 'REJECT',
    adminRemarks?: string,
    reviewerRole?: Role
  ) {
    const appeal = await prisma.appealTicket.findUnique({
      where: { id: appealId },
      include: {
        submission: {
          include: {
            imageResource: true,
            competition: true,
          },
        },
      },
    });

    if (!appeal) {
      throw new NotFoundError('AppealTicket', appealId);
    }

    // Enforce ownership: only the contest's organizer or an ADMIN can resolve appeals
    if (reviewerRole !== Role.ADMIN && appeal.submission.competition.organizerId !== reviewerId) {
      throw new ForbiddenError('Only the organizer of this competition or an administrator can resolve appeals');
    }

    if (decision === 'REJECT') {
      return prisma.appealTicket.update({
        where: { id: appealId },
        data: {
          status: AppealStatus.REJECTED,
          adminRemarks,
        },
      });
    }

    // If APPROVED, reset submission status to IN_QUEUE and re-enqueue for evaluation
    await prisma.$transaction([
      prisma.appealTicket.update({
        where: { id: appealId },
        data: {
          status: AppealStatus.APPROVED,
          adminRemarks,
        },
      }),
      prisma.submission.update({
        where: { id: appeal.submissionId },
        data: {
          status: SubmissionStatus.IN_QUEUE,
          disqualificationReason: null,
        },
      }),
    ]);

    // Re-queue media ingestion with robust storage key extraction
    if (appeal.submission.imageResource?.originalUrl) {
      const originalUrl = appeal.submission.imageResource.originalUrl;
      const match = originalUrl.match(/raw-uploads\/[^?#]+/);
      const storageKey = match ? match[0] : `raw-uploads/${appeal.submissionId}.jpg`;
      await mediaQueue.add('INGEST_MEDIA', {
        submissionId: appeal.submissionId,
        storageKey,
      });
    }

    return { status: 'APPEAL_APPROVED_AND_RESCORED' };
  }
}

export const appealsService = new AppealsService();
