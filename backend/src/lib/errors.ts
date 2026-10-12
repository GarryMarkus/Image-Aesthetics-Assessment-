/**
 * Standardized RFC 7807 Problem Details Error Classes
 */

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  code: string;
  errors?: Record<string, string[]>;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly errors?: Record<string, string[]>;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', errors?: Record<string, string[]>) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }

  toProblemDetails(instance?: string): ProblemDetails {
    return {
      type: `https://pixelprize.org/errors/${this.code.toLowerCase().replace(/_/g, '-')}`,
      title: this.name.replace(/Error$/, ''),
      status: this.statusCode,
      detail: this.message,
      instance,
      code: this.code,
      errors: this.errors,
    };
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Invalid request parameters', errors?: Record<string, string[]>) {
    super(message, 400, 'BAD_REQUEST', errors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource', id?: string) {
    const detail = id ? `${resource} with identifier '${id}' was not found` : `${resource} not found`;
    super(detail, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource state conflict') {
    super(message, 409, 'CONFLICT');
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors?: Record<string, string[]>) {
    super(message, 422, 'VALIDATION_FAILED', errors);
  }
}

export class QuotaExceededError extends AppError {
  constructor(message = 'Submission quota exceeded for this competition') {
    super(message, 403, 'QUOTA_EXCEEDED');
  }
}

export class ForensicViolationError extends AppError {
  constructor(message: string, code = 'FORENSIC_VIOLATION') {
    super(message, 422, code);
  }
}
