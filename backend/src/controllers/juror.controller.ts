import { Request, Response } from 'express';
import { jurorService } from '../services/juror.service.js';
import { BadRequestError } from '../lib/errors.js';

export class JurorController {
  async getShortlist(req: Request, res: Response) {
    const jurorId = req.user!.id;
    const { id } = req.params;
    const shortlist = await jurorService.getShortlistForJuror(id, jurorId);
    res.json(shortlist);
  }

  async submitVerdict(req: Request, res: Response) {
    const jurorId = req.user!.id;
    const { id } = req.params;
    const { podiums } = req.body;

    if (!Array.isArray(podiums)) {
      throw new BadRequestError('podiums must be an array of podium allocations');
    }

    const result = await jurorService.submitVerdict(id, jurorId, podiums);
    res.json(result);
  }

  async publishOfficialResults(req: Request, res: Response) {
    const organizerId = req.user!.id;
    const { id } = req.params;
    const result = await jurorService.publishOfficialResults(id, organizerId);
    res.json(result);
  }
}

export const jurorController = new JurorController();
