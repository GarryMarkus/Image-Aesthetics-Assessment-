import { Request, Response } from 'express';
import { submissionService } from '../services/submission.service.js';
import { BadRequestError } from '../lib/errors.js';

export class SubmissionController {
  async requestPresignedUrl(req: Request, res: Response) {
    const userId = req.user!.id;
    const { competitionId, filename, mimeType, fileSizeBytes } = req.body;

    if (!competitionId || !filename || !mimeType || !fileSizeBytes) {
      throw new BadRequestError('competitionId, filename, mimeType, and fileSizeBytes are required');
    }

    const result = await submissionService.requestPresignedUploadUrl({
      userId,
      competitionId,
      filename,
      mimeType,
      fileSizeBytes: Number(fileSizeBytes),
    });

    res.json(result);
  }

  async confirm(req: Request, res: Response) {
    const userId = req.user!.id;
    const { submissionId, competitionId, categoryId, title, story, storageKey } = req.body;

    if (!submissionId || !competitionId || !categoryId || !title || !storageKey) {
      throw new BadRequestError('submissionId, competitionId, categoryId, title, and storageKey are required');
    }

    const result = await submissionService.confirmSubmission(
      {
        submissionId,
        userId,
        competitionId,
        categoryId,
        title,
        story,
      },
      storageKey
    );

    res.status(202).json(result);
  }

  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const submission = await submissionService.getSubmissionById(id);
    res.json(submission);
  }

  async getScorecard(req: Request, res: Response) {
    const { id } = req.params;
    const requestingUserId = req.user?.id;
    const scorecard = await submissionService.getScorecard(id, requestingUserId);
    res.json(scorecard);
  }

  async vote(req: Request, res: Response) {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await submissionService.castCommunityVote(id, userId);
    res.json(result);
  }
}

export const submissionController = new SubmissionController();
