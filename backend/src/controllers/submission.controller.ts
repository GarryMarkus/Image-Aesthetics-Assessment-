import { Request, Response } from 'express';
import { submissionService } from '../services/submission.service.js';
import { storage } from '../lib/storage.js';
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

  async getMySubmissions(req: Request, res: Response) {
    const userId = req.user!.id;
    const submissions = await submissionService.getUserSubmissions(userId);
    res.json(submissions);
  }

  async handleLocalUpload(req: Request, res: Response) {
    const key = req.query.key as string;
    if (!key) {
      throw new BadRequestError('Storage key parameter is required');
    }
    const contentType = (req.headers['content-type'] as string) || 'image/jpeg';
    const buffer = req.body;
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      throw new BadRequestError('Upload payload must be a non-empty binary buffer');
    }
    const publicUrl = await storage.uploadBuffer(key, buffer, contentType);
    res.json({ success: true, key, publicUrl });
  }
}

export const submissionController = new SubmissionController();
