import { Worker, Job } from 'bullmq';
import { MEDIA_QUEUE_NAME, judgingQueue } from '../lib/queue.js';
import { prisma } from '../db/prisma.js';
import { storage } from '../lib/storage.js';
import { exifService } from '../services/exif.service.js';
import { imageProcessor } from '../services/image-processor.service.js';
import { forensicsService } from '../services/forensics.service.js';
import { SubmissionStatus } from '../types/index.js';
import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';

export interface IngestJobData {
  submissionId: string;
  storageKey: string;
}

export function createMediaWorker(): Worker<IngestJobData> {
  const connection = {
    host: new URL(env.REDIS_URL.startsWith('redis://') ? env.REDIS_URL : `redis://${env.REDIS_URL}`).hostname || 'localhost',
    port: Number(new URL(env.REDIS_URL.startsWith('redis://') ? env.REDIS_URL : `redis://${env.REDIS_URL}`).port) || 6379,
    maxRetriesPerRequest: null,
  };

  const worker = new Worker<IngestJobData>(
    MEDIA_QUEUE_NAME,
    async (job: Job<IngestJobData>) => {
      const { submissionId, storageKey } = job.data;
      logger.info(`[MediaWorker] Processing media ingestion for submission: ${submissionId}`);

      const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: {
          competition: true,
          user: {
            include: {
              submissions: {
                where: { competitionId: { not: undefined } },
                select: { dHash: true },
              },
            },
          },
        },
      });

      if (!submission) {
        throw new Error(`Submission ${submissionId} not found in database`);
      }

      // 1. Download raw image from storage
      const rawBuffer = await storage.downloadBuffer(storageKey);

      // 2. Extract EXIF metadata
      const exifData = await exifService.parseExif(rawBuffer);

      // 3. Collect existing perceptual hashes for duplicate burst checking
      const userHashes = submission.user.submissions
        .map((s: { dHash: string }) => s.dHash)
        .filter((h: string) => Boolean(h) && h !== '0000000000000000');

      // 4. Run Forensic & Integrity Screening
      const forensics = await forensicsService.inspectSubmission(rawBuffer, exifData, userHashes, {
        requireExif: submission.competition.requireExif,
      });

      if (!forensics.isApproved) {
        logger.warn(`[MediaWorker] Submission ${submissionId} disqualified: ${forensics.disqualificationReason}`);
        await prisma.submission.update({
          where: { id: submissionId },
          data: {
            status: SubmissionStatus.FLAGGED_DISQUALIFIED,
            disqualificationReason: forensics.disqualificationReason,
          },
        });
        return { status: 'DISQUALIFIED', reason: forensics.disqualificationReason };
      }

      // 5. Generate image derivatives (Thumbnail, Web Display, AI Normal)
      const processed = await imageProcessor.processImage(rawBuffer);

      // 6. Upload derivatives to storage
      const thumbKey = `competitions/${submission.competitionId}/thumb/${submissionId}.webp`;
      const webKey = `competitions/${submission.competitionId}/web/${submissionId}.webp`;
      const aiNormalKey = `competitions/${submission.competitionId}/ai_input/${submissionId}.jpg`;

      const [thumbUrl, webUrl, aiNormalUrl] = await Promise.all([
        storage.uploadBuffer(thumbKey, processed.thumbnailBuffer, 'image/webp'),
        storage.uploadBuffer(webKey, processed.webBuffer, 'image/webp'),
        storage.uploadBuffer(aiNormalKey, processed.aiNormalBuffer, 'image/jpeg'),
      ]);

      // 7. Persist derivatives and EXIF records in database
      await prisma.$transaction([
        prisma.imageResource.upsert({
          where: { submissionId },
          update: {
            originalUrl: storage.getPublicUrl(storageKey),
            webUrl,
            thumbUrl,
            aiNormalUrl,
            width: processed.originalMetadata.width,
            height: processed.originalMetadata.height,
            fileSizeBytes: processed.originalMetadata.sizeBytes,
            mimeType: `image/${processed.originalMetadata.format}`,
          },
          create: {
            submissionId,
            originalUrl: storage.getPublicUrl(storageKey),
            webUrl,
            thumbUrl,
            aiNormalUrl,
            width: processed.originalMetadata.width,
            height: processed.originalMetadata.height,
            fileSizeBytes: processed.originalMetadata.sizeBytes,
            mimeType: `image/${processed.originalMetadata.format}`,
          },
        }),
        prisma.exifMetadata.upsert({
          where: { submissionId },
          update: {
            cameraMake: exifData.cameraMake,
            cameraModel: exifData.cameraModel,
            lensModel: exifData.lensModel,
            focalLength: exifData.focalLength,
            aperture: exifData.aperture,
            shutterSpeed: exifData.shutterSpeed,
            iso: exifData.iso,
            captureTime: exifData.captureTime,
            software: exifData.software,
          },
          create: {
            submissionId,
            cameraMake: exifData.cameraMake,
            cameraModel: exifData.cameraModel,
            lensModel: exifData.lensModel,
            focalLength: exifData.focalLength,
            aperture: exifData.aperture,
            shutterSpeed: exifData.shutterSpeed,
            iso: exifData.iso,
            captureTime: exifData.captureTime,
            software: exifData.software,
          },
        }),
        prisma.submission.update({
          where: { id: submissionId },
          data: {
            dHash: processed.dHash,
          },
        }),
      ]);

      // 8. Enqueue AI Judging job
      await judgingQueue.add('JUDGE_SUBMISSION', {
        submissionId,
        aiNormalKey,
      });

      logger.info(`[MediaWorker] Ingestion complete for ${submissionId}. Enqueued for AI judging.`);
      return { status: 'PROCESSED_AND_ENQUEUED' };
    },
    { connection, concurrency: 5 }
  );

  worker.on('failed', (job, err) => {
    logger.error(`[MediaWorker] Job ${job?.id} failed:`, err);
  });

  return worker;
}
