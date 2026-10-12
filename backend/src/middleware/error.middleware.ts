import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const instance = req.originalUrl;

  if (err instanceof AppError) {
    res.status(err.statusCode).json(err.toProblemDetails(instance));
    return;
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    res.status(422).json({
      type: 'https://pixelprize.org/errors/validation-failed',
      title: 'Validation Failed',
      status: 422,
      detail: 'The provided request body failed schema validation',
      instance,
      code: 'VALIDATION_FAILED',
      errors: (err as any).format(),
    });
    return;
  }

  logger.error(`Unhandled internal server error on ${req.method} ${instance}:`, err);

  res.status(500).json({
    type: 'https://pixelprize.org/errors/internal-server-error',
    title: 'Internal Server Error',
    status: 500,
    detail: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
    instance,
    code: 'INTERNAL_ERROR',
  });
}
