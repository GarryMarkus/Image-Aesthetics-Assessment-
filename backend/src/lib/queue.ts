import { Queue, Worker, QueueEvents, ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../config/env.js';
import { logger } from './logger.js';

export const MEDIA_QUEUE_NAME = 'media-ingestion-queue';
export const JUDGING_QUEUE_NAME = 'ai-judging-queue';

export function createRedisConnection(): IORedis {
  const redis = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    retryStrategy: (times) => {
      if (times > 5) {
        logger.warn('Redis reconnection failed after 5 attempts. Queue operations may pause.');
        return null;
      }
      return Math.min(times * 500, 3000);
    },
  });

  redis.on('error', (err) => {
    logger.warn('Redis connection event error: ' + err.message);
  });

  return redis;
}

const connectionOptions: ConnectionOptions = {
  host: new URL(env.REDIS_URL.startsWith('redis://') ? env.REDIS_URL : `redis://${env.REDIS_URL}`).hostname || 'localhost',
  port: Number(new URL(env.REDIS_URL.startsWith('redis://') ? env.REDIS_URL : `redis://${env.REDIS_URL}`).port) || 6379,
  maxRetriesPerRequest: null,
};

export const mediaQueue = new Queue(MEDIA_QUEUE_NAME, {
  connection: connectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

export const judgingQueue = new Queue(JUDGING_QUEUE_NAME, {
  connection: connectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

export { Worker, QueueEvents };
