import { createMediaWorker } from './media.worker.js';
import { createJudgeWorker } from './judge.worker.js';
import { connectDatabase, disconnectDatabase } from '../db/prisma.js';
import { logger } from '../lib/logger.js';

async function bootstrapWorkers() {
  logger.info('🚀 Starting Pixel Prize Background Workers...');

  await connectDatabase();

  const mediaWorker = createMediaWorker();
  const judgeWorker = createJudgeWorker();

  logger.info('⚡ Media Ingestion Worker and AI Judging Worker active.');

  const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down workers gracefully...`);
    await Promise.all([mediaWorker.close(), judgeWorker.close()]);
    await disconnectDatabase();
    logger.info('Workers safely terminated.');
    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

bootstrapWorkers().catch((err) => {
  logger.error('Worker process failed to start:', err);
  process.exit(1);
});
