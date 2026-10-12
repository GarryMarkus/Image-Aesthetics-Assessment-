import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { connectDatabase } from './db/prisma.js';
import { logger } from './lib/logger.js';

const app = express();

// Security & Cross-Origin
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: [env.FRONTEND_ORIGIN, 'http://localhost:3000'],
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static local uploads folder for testing/dev
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Mount main API
app.use('/api', apiRouter);

// RFC 7807 Global Error Handler
app.use(errorHandler);

export async function startServer() {
  await connectDatabase();

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 Pixel Prize Backend API listening on http://localhost:${env.PORT}`);
    logger.info(`📡 Health check available at: http://localhost:${env.PORT}/api/health`);
  });

  return server;
}

// Start server when executed directly
if (process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    logger.error('Failed to start server:', err);
    process.exit(1);
  });
}

export default app;
