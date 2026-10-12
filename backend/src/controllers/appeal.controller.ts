import { Request, Response } from 'express';
import { appealsService } from '../services/appeals.service.js';
import { BadRequestError } from '../lib/errors.js';

export class AppealController {
  async fileAppeal(req: Request, res: Response) {
    const userId = req.user!.id;
    const { submissionId, reason, rawProofUrl } = req.body;

    if (!submissionId || !reason) {
      throw new BadRequestError('submissionId and reason are required');
    }

    const ticket = await appealsService.fileAppeal(submissionId, userId, reason, rawProofUrl);
    res.status(201).json(ticket);
  }

  async resolveAppeal(req: Request, res: Response) {
    const reviewerId = req.user!.id;
    const { id } = req.params;
    const { decision, adminRemarks } = req.body;

    if (decision !== 'APPROVE' && decision !== 'REJECT') {
      throw new BadRequestError("decision must be either 'APPROVE' or 'REJECT'");
    }

    const result = await appealsService.resolveAppeal(
      id,
      reviewerId,
      decision,
      adminRemarks,
      req.user!.role
    );
    res.json(result);
  }
}

export const appealController = new AppealController();
