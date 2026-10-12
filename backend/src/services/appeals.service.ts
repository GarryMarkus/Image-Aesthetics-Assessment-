import { prisma } from '../db/prisma.js';
import { mediaQueue } from '../lib/queue.js';
import { AppealStatus, SubmissionStatus } from '../types/index.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../lib/errors.js';

export class AppealsService {
  async fileAppeal(submissionId: string, userId: string, reason: string, rawProofUrl?: string) {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      throw new NotFoundError('Submission', submissionId);
    }

    if (submission.userId !== userId) {
      throw new ForbiddenError('Only the photographer can file an appeal for their submission');
    }

    if (submission.status !== SubmissionStatus.FLAGGED_DISQUALIFIED) {
      throw new BadRequestError('Only disqualified submissions can be appealed');
    }

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
    _reviewerId: string,
    decision: 'APPROVE' | 'REJECT',
    adminRemarks?: string
  ) {
    const appeal = await prisma.appealTicket.findUnique({
      where: { id: appealId },
      include: { submission: { include: { imageResource: true } } },
    });

    if (!appeal) {
      throw new NotFoundError('AppealTicket', appealId);
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

    // Re-queue media ingestion
    if (appeal.submission.imageResource?.originalUrl) {
      const storageKey = appeal.submission.imageResource.originalUrl.split('/uploads/').pop() || '';
      await mediaQueue.add('INGEST_MEDIA', {
        submissionId: appeal.submissionId,
        storageKey,
      });
    }

    return { status: 'APPEAL_APPROVED_AND_RESCORED' };
  }
}

export const appealsService = new AppealsService();
