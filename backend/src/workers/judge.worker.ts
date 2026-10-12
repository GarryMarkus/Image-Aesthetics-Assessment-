import { Worker, Job } from 'bullmq';
import { JUDGING_QUEUE_NAME } from '../lib/queue.js';
import { prisma } from '../db/prisma.js';
import { storage } from '../lib/storage.js';
import { judgeAdapter } from '../lib/judge/judge.factory.js';
import { JudgeOrchestrator } from '../lib/judge/judge.orchestrator.js';
import { JudgeRequest } from '../lib/judge/judge.interface.js';
import { SubmissionStatus, RubricWeights } from '../types/index.js';
import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';

export interface JudgeJobData {
  submissionId: string;
  aiNormalKey: string;
}

/**
 * Core AI judging execution for a preprocessed submission
 */
export async function processJudgingJob(data: JudgeJobData): Promise<{ status: string; overallScore: number }> {
  const { submissionId, aiNormalKey } = data;
  logger.info(`[JudgeWorker] Processing AI aesthetic evaluation for submission: ${submissionId}`);

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      category: true,
      exifMetadata: true,
      aestheticScore: true,
    },
  });

  if (!submission) {
    throw new Error(`Submission ${submissionId} not found`);
  }

  // Idempotency: avoid redundant API calls and re-scoring if already evaluated
  if (submission.status === SubmissionStatus.SCORED && submission.aestheticScore) {
    logger.info(
      `[JudgeWorker] Submission ${submissionId} has already been scored (${submission.aestheticScore.overallScore}). Idempotently skipping evaluation.`
    );
    return {
      status: 'SCORED',
      overallScore: submission.aestheticScore.overallScore,
    };
  }

  // 1. Fetch 1024px AI Normal variant
  const imageBuffer = await storage.downloadBuffer(aiNormalKey);

  // 2. Prepare JudgeRequest
  const rubricWeights = submission.category.rubricWeights as unknown as RubricWeights;

  const judgeRequest: JudgeRequest = {
    submissionId: submission.id,
    imageBuffer,
    mimeType: 'image/jpeg',
    imageUrl: storage.getPublicUrl(aiNormalKey),
    category: {
      code: submission.category.code,
      name: submission.category.name,
      description: submission.category.description,
      weights: rubricWeights,
    },
    metadata: {
      title: submission.title,
      story: submission.story || undefined,
      exif: submission.exifMetadata || undefined,
    },
  };

  // 3. Execute AI Evaluation through orchestrator (blind evaluation & multi-pass calibration)
  const orchestrator = new JudgeOrchestrator(judgeAdapter);
  const result = await orchestrator.evaluateSubmission(judgeRequest);

  // 4. Save AestheticScore record and update Submission status to SCORED
  await prisma.$transaction([
    prisma.aestheticScore.upsert({
      where: { submissionId },
      update: {
        overallScore: result.overallScore,
        themeAdherenceScore: result.themeAdherenceScore,
        compositionScore: result.attributeScores.composition,
        lightingScore: result.attributeScores.lighting,
        colorHarmonyScore: result.attributeScores.colorHarmony,
        technicalScore: result.attributeScores.technicalExecution,
        subjectStoryScore: result.attributeScores.subjectStory,
        originalityScore: result.attributeScores.originality,
        emotionScore: result.attributeScores.emotionAtmosphere,
        gestaltScore: result.attributeScores.overallGestalt,
        detectedCompositionRules: result.detectedCompositionRules as any,
        defectPenaltyPoints: result.defectDeductions.totalPenalty,
        defectDetails: result.defectDeductions.detectedDefects as any,
        critiqueStrengths: result.critique.strengths,
        critiqueTechnical: result.critique.technicalAnalysis,
        critiqueRecommendations: result.critique.recommendations,
        syntheticLikelihood: result.forensicsSummary.syntheticLikelihood,
        modelProvider: result.modelVersion,
        numPasses: result.numPasses,
      },
      create: {
        submissionId,
        overallScore: result.overallScore,
        themeAdherenceScore: result.themeAdherenceScore,
        compositionScore: result.attributeScores.composition,
        lightingScore: result.attributeScores.lighting,
        colorHarmonyScore: result.attributeScores.colorHarmony,
        technicalScore: result.attributeScores.technicalExecution,
        subjectStoryScore: result.attributeScores.subjectStory,
        originalityScore: result.attributeScores.originality,
        emotionScore: result.attributeScores.emotionAtmosphere,
        gestaltScore: result.attributeScores.overallGestalt,
        detectedCompositionRules: result.detectedCompositionRules as any,
        defectPenaltyPoints: result.defectDeductions.totalPenalty,
        defectDetails: result.defectDeductions.detectedDefects as any,
        critiqueStrengths: result.critique.strengths,
        critiqueTechnical: result.critique.technicalAnalysis,
        critiqueRecommendations: result.critique.recommendations,
        syntheticLikelihood: result.forensicsSummary.syntheticLikelihood,
        modelProvider: result.modelVersion,
        numPasses: result.numPasses,
      },
    }),
    prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: SubmissionStatus.SCORED,
        totalScore: result.overallScore,
      },
    }),
  ]);

  logger.info(
    `[JudgeWorker] Evaluation complete for ${submissionId}. S_total: ${result.overallScore}/100 via ${result.modelVersion}`
  );

  return {
    status: 'SCORED',
    overallScore: result.overallScore,
  };
}

export function createJudgeWorker(): Worker<JudgeJobData> {
  const connection = {
    host: new URL(env.REDIS_URL.startsWith('redis://') ? env.REDIS_URL : `redis://${env.REDIS_URL}`).hostname || 'localhost',
    port: Number(new URL(env.REDIS_URL.startsWith('redis://') ? env.REDIS_URL : `redis://${env.REDIS_URL}`).port) || 6379,
    maxRetriesPerRequest: null,
  };

  const worker = new Worker<JudgeJobData>(
    JUDGING_QUEUE_NAME,
    async (job: Job<JudgeJobData>) => {
      return processJudgingJob(job.data);
    },
    { connection, concurrency: 5 }
  );

  worker.on('failed', async (job, err) => {
    logger.error(`[JudgeWorker] Job ${job?.id} failed (attempt ${job?.attemptsMade}/${job?.opts.attempts || 3}):`, err);
    if (job && job.attemptsMade >= (job.opts.attempts || 3)) {
      logger.error(
        `[JudgeWorker] Job ${job.id} for submission ${job.data.submissionId} reached maximum retry limit. Preserving submission state for operator re-triage.`
      );
    }
  });

  return worker;
}
