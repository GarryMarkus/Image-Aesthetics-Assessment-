import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

interface ClientRecord {
  timestamps: number[];
}

/**
 * In-memory sliding-window rate limiter for sensitive endpoints
 */
export function rateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later.',
    keyGenerator = (req) => req.ip || req.socket.remoteAddress || 'unknown_ip',
  } = options;

  const hits = new Map<string, ClientRecord>();

  // Cleanup expired windows every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      record.timestamps = record.timestamps.filter((t) => now - t < windowMs);
      if (record.timestamps.length === 0) {
        hits.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = keyGenerator(req);
    const now = Date.now();

    const record = hits.get(key) || { timestamps: [] };
    record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

    if (record.timestamps.length >= max) {
      const earliest = record.timestamps[0];
      const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - earliest)) / 1000));

      res.setHeader('Retry-After', retryAfterSeconds);
      res.status(429).json({
        type: 'https://pixelprize.org/errors/rate-limit-exceeded',
        title: 'Rate Limit Exceeded',
        status: 429,
        detail: message,
        instance: req.originalUrl,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfterSeconds,
      });
      return;
    }

    record.timestamps.push(now);
    hits.set(key, record);
    next();
  };
}
