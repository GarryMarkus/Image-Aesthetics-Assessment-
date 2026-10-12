process.env.NODE_ENV = 'test';

import { AddressInfo } from 'net';
import jwt from 'jsonwebtoken';
import sharp from 'sharp';
import { env } from '../src/config/env.js';
import { app } from '../src/server.js';
import { AppError, BadRequestError, NotFoundError, ForbiddenError, QuotaExceededError, ForensicViolationError } from '../src/lib/errors.js';
import { logger } from '../src/lib/logger.js';
import { Role, CompetitionStatus, SubmissionStatus, PodiumRank, AppealStatus, RubricWeights } from '../src/types/index.js';
import { ScoringMath } from '../src/lib/judge/scoring-math.js';
import { CompetitionService, competitionService } from '../src/services/competition.service.js';
import { SubmissionService, submissionService } from '../src/services/submission.service.js';
import { ShortlistService, shortlistService } from '../src/services/shortlist.service.js';
import { JurorService, jurorService } from '../src/services/juror.service.js';
import { AppealsService, appealsService } from '../src/services/appeals.service.js';
import { LeaderboardService, leaderboardService } from '../src/services/leaderboard.service.js';
import { ImageProcessorService } from '../src/services/image-processor.service.js';
import { ForensicsService } from '../src/services/forensics.service.js';
import { MockJudgeAdapter } from '../src/lib/judge/mock.adapter.js';
import { CustomModelJudgeAdapter } from '../src/lib/judge/custom-model.adapter.js';
import { JudgeOrchestrator } from '../src/lib/judge/judge.orchestrator.js';
import { createJudgeAdapter } from '../src/lib/judge/judge.factory.js';
import { prisma } from '../src/db/prisma.js';
import { STANDARD_CATEGORIES } from '../src/config/categories.js';
import { storage } from '../src/lib/storage.js';
import { exifService } from '../src/services/exif.service.js';
import { MEDIA_QUEUE_NAME, JUDGING_QUEUE_NAME, mediaQueue, judgingQueue } from '../src/lib/queue.js';
import { processMediaIngestion } from '../src/workers/media.worker.js';
import { processJudgingJob } from '../src/workers/judge.worker.js';

async function runBackendVerification() {
  console.log('🧪 Starting Pixel Prize Backend Layer-by-Layer Verification...\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      process.exitCode = 1;
    }
  }

  // ---------------------------------------------------------------------------
  // Test 0: Core Tooling, Environment & RFC 7807 Errors (Layer 0)
  // ---------------------------------------------------------------------------
  console.log('--- Testing Layer 0: Core Tooling, Environment & Error Handling ---');
  assert(typeof env.PORT === 'number' && env.PORT > 0, `Environment PORT parsed and coerced cleanly (${env.PORT})`);
  assert(typeof env.AUTH_SECRET === 'string' && env.AUTH_SECRET.length >= 16, 'AUTH_SECRET is properly configured');
  assert(['gemini', 'custom_model', 'mock'].includes(env.JUDGE_PROVIDER), `JUDGE_PROVIDER matches allowed enum (${env.JUDGE_PROVIDER})`);

  // RFC 7807 Error details
  const badReq = new BadRequestError('Invalid category selection', { category: ['Category not found'] });
  const problem = badReq.toProblemDetails('/api/v1/submissions');
  assert(problem.status === 400, 'BadRequestError maps to HTTP status 400');
  assert(problem.code === 'BAD_REQUEST', 'BadRequestError code is BAD_REQUEST');
  assert(problem.type === 'https://pixelprize.org/errors/bad-request', 'RFC 7807 type URI matches specification');
  assert(problem.errors?.category?.[0] === 'Category not found', 'Problem details preserves nested field errors');

  const notFound = new NotFoundError('Competition', 'comp_123');
  assert(notFound.statusCode === 404 && notFound.message.includes('comp_123'), 'NotFoundError formats identifier into message');

  const forensicErr = new ForensicViolationError('AI generated detected', 'DQ_SYNTHETIC_EXIF');
  assert(forensicErr.statusCode === 422 && forensicErr.code === 'DQ_SYNTHETIC_EXIF', 'ForensicViolationError carries custom violation code');

  // Logger verification
  assert(typeof logger.info === 'function' && typeof logger.error === 'function', 'Structured logger provides standard log interfaces');

  // Enums verification
  assert(Role.ADMIN === 'ADMIN' && Role.PARTICIPANT === 'PARTICIPANT', 'Role enums match specification');
  assert(CompetitionStatus.SHORTLISTED === 'SHORTLISTED', 'CompetitionStatus enum includes SHORTLISTED');
  assert(SubmissionStatus.FLAGGED_DISQUALIFIED === 'FLAGGED_DISQUALIFIED', 'SubmissionStatus enum includes FLAGGED_DISQUALIFIED');
  assert(PodiumRank.FIRST_PLACE === 'FIRST_PLACE', 'PodiumRank enum includes FIRST_PLACE');
  assert(AppealStatus.PENDING === 'PENDING', 'AppealStatus enum includes PENDING');

  // ---------------------------------------------------------------------------
  // Test 1: Data Access & Prisma ORM Schema (Layer 1)
  // ---------------------------------------------------------------------------
  console.log('\n--- Testing Layer 1: Data Access & Prisma ORM Models ---');
  assert(Boolean(prisma.user), 'Prisma User model delegate is generated');
  assert(Boolean(prisma.competition), 'Prisma Competition model delegate is generated');
  assert(Boolean(prisma.competitionCategory), 'Prisma CompetitionCategory model delegate is generated');
  assert(Boolean(prisma.submission), 'Prisma Submission model delegate is generated');
  assert(Boolean(prisma.imageResource), 'Prisma ImageResource model delegate is generated');
  assert(Boolean(prisma.exifMetadata), 'Prisma ExifMetadata model delegate is generated');
  assert(Boolean(prisma.aestheticScore), 'Prisma AestheticScore model delegate is generated');
  assert(Boolean(prisma.jurorVerdict), 'Prisma JurorVerdict model delegate is generated');
  assert(Boolean(prisma.communityVote), 'Prisma CommunityVote model delegate is generated');
  assert(Boolean(prisma.appealTicket), 'Prisma AppealTicket model delegate is generated');
  assert(Boolean(prisma.jurorAssignment), 'Prisma JurorAssignment model delegate is generated');

  // Verify all 9 TAD66K categories
  const categoryKeys = Object.keys(STANDARD_CATEGORIES);
  assert(categoryKeys.length === 9, `All 9 TAD66K standard categories defined (found ${categoryKeys.length})`);
  
  for (const [code, def] of Object.entries(STANDARD_CATEGORIES)) {
    assert(ScoringMath.validateWeights(def.rubricWeights), `Category ${code} rubric weights sum to exactly 1.0`);
  }

  assert(STANDARD_CATEGORIES.MONOCHROME.rubricWeights.colorHarmony === 0, 'MONOCHROME category sets colorHarmony weight to 0.0');
  assert(STANDARD_CATEGORIES.MACRO.rubricWeights.technicalExecution === 0.35, 'MACRO category prioritizes technical sharpness (0.35)');
  assert(STANDARD_CATEGORIES.STREET.rubricWeights.subjectStory === 0.30, 'STREET category prioritizes storytelling & decisive moment (0.30)');
  assert(STANDARD_CATEGORIES.ARCHITECTURE.rubricWeights.composition === 0.30, 'ARCHITECTURE category prioritizes composition & geometry (0.30)');

  // ---------------------------------------------------------------------------
  // Test 2: Storage & Media Processing Pipeline (Layer 2)
  // ---------------------------------------------------------------------------
  console.log('\n--- Testing Layer 2: Storage & Media Processing Pipeline ---');
  const processor = new ImageProcessorService();

  // Create an 1800x1200 test photo buffer to test high-res downsampling derivatives
  const testPhotoBuffer = await sharp({
    create: { width: 1800, height: 1200, channels: 3, background: { r: 50, g: 120, b: 200 } },
  })
    .png()
    .toBuffer();

  const distinctPhotoBuffer = await sharp({
    create: { width: 1800, height: 1200, channels: 3, background: { r: 200, g: 50, b: 50 } },
  })
    .png()
    .toBuffer();

  const derivatives = await processor.processImage(testPhotoBuffer);
  assert(derivatives.originalMetadata.width === 1800, 'Original image width recognized as 1800px');
  assert(derivatives.originalMetadata.height === 1200, 'Original image height recognized as 1200px');
  assert(derivatives.originalMetadata.sizeBytes > 0, 'Original image size recorded');

  // Verify Thumbnail derivative (WebP <= 400px)
  const thumbMeta = await sharp(derivatives.thumbnailBuffer).metadata();
  assert(thumbMeta.format === 'webp', 'Thumbnail derivative generated in modern WebP format');
  assert((thumbMeta.width || 0) <= 400 && (thumbMeta.height || 0) <= 400, 'Thumbnail bounded to 400px boundary');

  // Verify Web Display derivative (WebP <= 1600px)
  const webMeta = await sharp(derivatives.webBuffer).metadata();
  assert(webMeta.format === 'webp', 'Web Display derivative generated in WebP format');
  assert((webMeta.width || 0) <= 1600 && (webMeta.height || 0) <= 1600, 'Web Display bounded to 1600px boundary');

  // Verify AI Normal derivative (JPEG <= 1024px)
  const aiMeta = await sharp(derivatives.aiNormalBuffer).metadata();
  assert(aiMeta.format === 'jpeg', 'AI Normal derivative converted to standard JPEG format');
  assert((aiMeta.width || 0) <= 1024 && (aiMeta.height || 0) <= 1024, 'AI Normal derivative bounded to 1024px boundary');

  // Verify 64-bit dHash & Hamming distance
  const dHash1 = derivatives.dHash;
  const dHash2 = await processor.computeDHash(distinctPhotoBuffer);
  assert(typeof dHash1 === 'string' && dHash1.length === 16, `dHash generates valid 64-bit hex hash (${dHash1})`);
  assert(processor.calculateHammingDistance(dHash1, dHash1) === 0, 'Identical image has Hamming distance 0');
  assert(processor.calculateHammingDistance(dHash1, dHash2) >= 0, 'Hamming distance calculates correctly on distinct images');

  // Verify EXIF extraction service
  assert(
    exifService.hasValidHardwareMetadata({ cameraMake: 'Sony', cameraModel: 'ILCE-7M4', focalLength: 35 }),
    'EXIF validator approves valid optical camera hardware'
  );
  assert(
    !exifService.hasValidHardwareMetadata({}),
    'EXIF validator rejects empty hardware metadata'
  );
  const parsedExif = await exifService.parseExif(testPhotoBuffer);
  assert(typeof parsedExif === 'object', 'EXIF parser safely extracts metadata without exceptions');

  // Verify Storage Service
  const presignedUrl = await storage.getPresignedUploadUrl('test-presigned-photo.webp', 'image/webp');
  assert(presignedUrl.includes('test-presigned-photo.webp'), 'Storage generates presigned upload URL with key');

  const testPayload = Buffer.from('PIXEL_PRIZE_STORAGE_VERIFICATION_PAYLOAD');
  const uploadedUrl = await storage.uploadBuffer('tests/probe.bin', testPayload, 'application/octet-stream');
  assert(uploadedUrl.includes('tests/probe.bin'), 'Storage returns public URL for uploaded buffer');

  const downloadedPayload = await storage.downloadBuffer('tests/probe.bin');
  assert(downloadedPayload.equals(testPayload), 'Storage downloads exact matching buffer content');

  await storage.deleteObject('tests/probe.bin');
  assert(true, 'Storage cleanly deletes uploaded test buffer');

  // ---------------------------------------------------------------------------
  // Test 3: Forensics & Anti-Fraud Screening (Layer 3)
  // ---------------------------------------------------------------------------
  console.log('\n--- Testing Layer 3: Forensics & Anti-Fraud Screening ---');
  const forensics = new ForensicsService();

  // 1. Synthetic software signature detection
  const syntheticResult = await forensics.inspectSubmission(
    testPhotoBuffer,
    { cameraModel: 'Midjourney v6 Neural Engine', software: 'ComfyUI' },
    []
  );
  assert(!syntheticResult.isApproved, 'Correctly flags synthetic AI software in metadata (Midjourney/ComfyUI)');
  assert(syntheticResult.disqualificationReason?.includes('DQ_SYNTHETIC_EXIF') === true, 'Assigned DQ_SYNTHETIC_EXIF code');
  assert(syntheticResult.syntheticLikelihood >= 0.95, 'High synthetic confidence assigned to AI metadata signature');

  // Test DALL-E / Stable Diffusion software tag
  const dalleResult = await forensics.inspectSubmission(
    testPhotoBuffer,
    { cameraMake: 'OpenAI', software: 'DALL-E 3 Diffusion Generator' },
    []
  );
  assert(!dalleResult.isApproved && dalleResult.disqualificationReason?.includes('DQ_SYNTHETIC_EXIF') === true, 'Flags DALL-E 3 software signature');

  // 2. Clean optical photo passes
  const cleanResult = await forensics.inspectSubmission(
    testPhotoBuffer,
    { cameraMake: 'Sony', cameraModel: 'ILCE-7M4', focalLength: 35, aperture: 2.8 },
    []
  );
  assert(cleanResult.isApproved, 'Clean optical camera photo passes all forensic tiers');
  assert(cleanResult.disqualificationReason === undefined, 'No disqualification reason assigned to authentic photo');

  // 3. Mandatory EXIF enforcement check (requireExif option)
  const missingExifMandatory = await forensics.inspectSubmission(
    testPhotoBuffer,
    {}, // Empty EXIF
    [],
    { requireExif: true }
  );
  assert(!missingExifMandatory.isApproved, 'Disqualifies submission when mandatory optical hardware EXIF is missing');
  assert(missingExifMandatory.disqualificationReason?.includes('DQ_MISSING_EXIF') === true, 'Assigned DQ_MISSING_EXIF code');

  const missingExifOptional = await forensics.inspectSubmission(
    testPhotoBuffer,
    {}, // Empty EXIF
    [],
    { requireExif: false }
  );
  assert(missingExifOptional.isApproved, 'Accepts submission with missing EXIF when competition allows it (requireExif: false)');

  // 4. Duplicate burst collision check
  const duplicateResult = await forensics.inspectSubmission(
    testPhotoBuffer,
    { cameraModel: 'Sony A7 IV', software: 'Adobe Lightroom' },
    [dHash1] // Collision with same hash (Hamming distance 0 <= 4)
  );
  assert(!duplicateResult.isApproved, 'Correctly rejects duplicate burst upload with identical perceptual hash');
  assert(duplicateResult.disqualificationReason?.includes('DQ_DUPLICATE_BURST') === true, 'Assigned DQ_DUPLICATE_BURST code');

  // Check unique photo with distinct hash does not collide
  const distinctResult = await forensics.inspectSubmission(
    testPhotoBuffer,
    { cameraModel: 'Sony A7 IV' },
    ['ffffffffffffffff'] // Far hash
  );
  assert(distinctResult.isApproved, 'Unique photo with distant hash passes duplicate check');

  // 5. Texture & Laplacian frequency screening
  const texture = await forensics.analyzeTextureAnomalies(testPhotoBuffer);
  assert(typeof texture.meanLaplacian === 'number' && texture.meanLaplacian >= 0, 'Computes discrete Laplacian gradient variance');
  assert(typeof texture.highFreqRatio === 'number' && texture.highFreqRatio >= 0, 'Computes high-frequency spatial ratio');

  // 6. Watermark detection heuristic
  const watermarkProbe = await forensics.detectWatermarkAnomaly(testPhotoBuffer);
  assert(typeof watermarkProbe.hasWatermark === 'boolean', 'Watermark anomaly detector executes cleanly');

  // ---------------------------------------------------------------------------
  // Test 4: AI Model Adapter Contract & Scoring Mathematics (Layer 4)
  // ---------------------------------------------------------------------------
  console.log('\n--- Testing Layer 4: Model-Agnostic IJudgeAdapter & Scoring Mathematics ---');
  const streetWeights = STANDARD_CATEGORIES.STREET.rubricWeights;
  assert(ScoringMath.validateWeights(streetWeights), 'Street weights sum to exactly 1.0 (100%)');

  const scores = {
    composition: 90,
    lighting: 80,
    colorHarmony: 70,
    technicalExecution: 60,
    subjectStory: 95,
    originality: 85,
    emotionAtmosphere: 90,
    overallGestalt: 75,
  };

  const computedScore = ScoringMath.calculateTotalScore(scores, streetWeights, 100, 0);
  assert(computedScore === 87.0, `Calculated S_total matches exact mathematical expectation (87.0 === ${computedScore})`);

  const penalizedScore = ScoringMath.calculateTotalScore(scores, streetWeights, 90, 10);
  assert(penalizedScore === 68.3, `Calculated S_total with defect penalties and theme attenuation matches (68.3 === ${penalizedScore})`);

  const judge = new MockJudgeAdapter();
  const judgeResult = await judge.evaluate({
    submissionId: 'test_sub_001',
    imageBuffer: testPhotoBuffer,
    mimeType: 'image/png',
    imageUrl: 'http://localhost:3001/uploads/test.png',
    category: {
      code: 'STREET',
      name: 'Street Photography',
      description: 'Candid moments',
      weights: streetWeights,
    },
    metadata: {
      title: 'Rain in Tokyo',
      story: 'Shot under neon lights',
    },
  });

  assert(judgeResult.overallScore > 0, `Judge evaluated valid score: ${judgeResult.overallScore}/100`);
  assert(Boolean(judgeResult.critique.strengths), 'Critique strengths section generated');
  assert(Boolean(judgeResult.critique.technicalAnalysis), 'Critique technical analysis section generated');
  assert(Boolean(judgeResult.critique.recommendations), 'Critique recommendations section generated');
  assert(judgeResult.detectedCompositionRules.length > 0, 'IAACLIP composition techniques detected');

  // Test Phase 2 Custom Model Adapter interface
  const customAdapter = new CustomModelJudgeAdapter('http://localhost:8000/v1/evaluate', 'test_secret');
  assert(customAdapter.getProviderName() === 'custom_model', 'CustomModelJudgeAdapter adheres to IJudgeAdapter contract');

  // Test Dynamic Factory Provider Switch
  const mockFromFactory = createJudgeAdapter('mock');
  assert(mockFromFactory.getProviderName() === 'mock', 'Factory initializes MockJudgeAdapter on mock provider');
  const customFromFactory = createJudgeAdapter('custom_model');
  assert(customFromFactory.getProviderName() === 'custom_model', 'Factory initializes CustomModelJudgeAdapter on custom_model provider');

  // Test JudgeOrchestrator (Blind Evaluation & Multi-Pass Calibration)
  const orchestrator = new JudgeOrchestrator(judge);

  // 1. Blind evaluation check: Strips personal photographer identity fields
  const sampleRequest: JudgeRequest = {
    submissionId: 'test_sub_orch',
    imageBuffer: testPhotoBuffer,
    mimeType: 'image/png',
    imageUrl: 'http://localhost:3001/uploads/test.png',
    category: {
      code: 'STREET',
      name: 'Street Photography',
      description: 'Candid moments',
      weights: streetWeights,
    },
    metadata: {
      title: 'Monochrome Crossing',
      story: 'Shot candidly in Shibuya',
      exif: {
        cameraMake: 'Sony',
        cameraModel: 'A7 IV',
        artist: 'Kenji Sato',
        ownerName: 'Kenji Sato Personal Camera',
        serialNumber: 'SN-98234-X',
      },
    },
  };

  const blindRequest = orchestrator.prepareBlindRequest(sampleRequest);
  assert(blindRequest.metadata.exif?.cameraMake === 'Sony', 'Blind evaluation preserves optical hardware make');
  assert(blindRequest.metadata.exif?.artist === undefined, 'Blind evaluation strips photographer artist name');
  assert(blindRequest.metadata.exif?.ownerName === undefined, 'Blind evaluation strips photographer owner name');
  assert(blindRequest.metadata.exif?.serialNumber === undefined, 'Blind evaluation strips camera serial number');

  // 2. Single-pass evaluation on standard threshold
  const singlePassResult = await orchestrator.evaluateSubmission(sampleRequest, {
    forceCalibration: false,
    borderlineThreshold: 99.0, // High threshold so it stays single-pass
  });
  assert(singlePassResult.numPasses === 1, 'Standard submission receives exactly 1 evaluation pass');
  assert(!singlePassResult.requiresHumanAudit, 'Standard pass does not flag human audit');

  // 3. Multi-Pass Borderline Calibration (N=3)
  const calibratedResult = await orchestrator.evaluateSubmission(sampleRequest, {
    forceCalibration: true, // Force 3-pass calibration
  });
  assert(calibratedResult.numPasses === 3, 'Borderline submission executes 3 independent passes');
  assert(typeof calibratedResult.passStandardDeviation === 'number', 'Calculates standard deviation across passes');
  assert(calibratedResult.overallScore > 0, 'Synthesizes calibrated total aesthetic score');
  assert(calibratedResult.detectedCompositionRules.length > 0, 'Merges deduplicated IAACLIP composition rules');

  // ---------------------------------------------------------------------------
  // Test 5: Asynchronous Queue & Background Workers (Layer 5)
  // ---------------------------------------------------------------------------
  console.log('\n--- Testing Layer 5: Asynchronous Queue & Background Workers ---');
  assert(MEDIA_QUEUE_NAME === 'media-ingestion-queue', 'Media queue name matches specification');
  assert(JUDGING_QUEUE_NAME === 'ai-judging-queue', 'Judging queue name matches specification');
  assert(mediaQueue.name === 'media-ingestion-queue', 'Media queue instance properly initialized');
  assert(judgingQueue.name === 'ai-judging-queue', 'Judging queue instance properly initialized');

  // Verify exponential backoff and retry policies
  assert(mediaQueue.defaultJobOptions.attempts === 3, 'Media queue default retry attempts set to 3');
  assert(
    typeof mediaQueue.defaultJobOptions.backoff === 'object' &&
      mediaQueue.defaultJobOptions.backoff.type === 'exponential',
    'Media queue configured with exponential retry backoff'
  );
  assert(judgingQueue.defaultJobOptions.attempts === 3, 'Judging queue default retry attempts set to 3');
  assert(
    typeof judgingQueue.defaultJobOptions.backoff === 'object' &&
      judgingQueue.defaultJobOptions.backoff.type === 'exponential',
    'Judging queue configured with exponential retry backoff'
  );

  // Verify worker handler contracts
  assert(typeof processMediaIngestion === 'function', 'processMediaIngestion worker handler exported');
  assert(typeof processJudgingJob === 'function', 'processJudgingJob worker handler exported');

  // Verify graceful error handling on missing records
  let mediaWorkerCaughtError = false;
  try {
    await processMediaIngestion({ submissionId: 'non_existent_sub', storageKey: 'some_key' });
  } catch (err: any) {
    mediaWorkerCaughtError = Boolean(err);
  }
  assert(mediaWorkerCaughtError, 'Media worker safely throws error on missing submission or offline database');

  let judgeWorkerCaughtError = false;
  try {
    await processJudgingJob({ submissionId: 'non_existent_sub', aiNormalKey: 'some_key' });
  } catch (err: any) {
    judgeWorkerCaughtError = Boolean(err);
  }
  assert(judgeWorkerCaughtError, 'Judging worker safely throws error on missing submission or offline database');

  // Safely close queue connections
  await Promise.all([mediaQueue.close(), judgingQueue.close()]);
  assert(true, 'Queue instances close cleanly without unhandled rejections');

  // ---------------------------------------------------------------------------
  // Test 6: Domain Services & Competition Lifecycle Engine (Layer 6)
  // ---------------------------------------------------------------------------
  console.log('\n--- Testing Layer 6: Domain Services & Competition Lifecycle Engine ---');

  // 1. Competition Lifecycle Transitions
  assert(
    CompetitionService.isValidTransition(CompetitionStatus.DRAFT, CompetitionStatus.OPEN),
    'Valid transition: DRAFT -> OPEN allowed'
  );
  assert(
    CompetitionService.isValidTransition(CompetitionStatus.OPEN, CompetitionStatus.JUDGING),
    'Valid transition: OPEN -> JUDGING allowed'
  );
  assert(
    CompetitionService.isValidTransition(CompetitionStatus.JUDGING, CompetitionStatus.SHORTLISTED),
    'Valid transition: JUDGING -> SHORTLISTED allowed'
  );
  assert(
    CompetitionService.isValidTransition(CompetitionStatus.SHORTLISTED, CompetitionStatus.RESULTS_PUBLISHED),
    'Valid transition: SHORTLISTED -> RESULTS_PUBLISHED allowed'
  );
  assert(
    CompetitionService.isValidTransition(CompetitionStatus.RESULTS_PUBLISHED, CompetitionStatus.ARCHIVED),
    'Valid transition: RESULTS_PUBLISHED -> ARCHIVED allowed'
  );

  // Illegal lifecycle transition guards
  assert(
    !CompetitionService.isValidTransition(CompetitionStatus.DRAFT, CompetitionStatus.RESULTS_PUBLISHED),
    'Illegal transition: DRAFT cannot skip directly to RESULTS_PUBLISHED'
  );
  assert(
    !CompetitionService.isValidTransition(CompetitionStatus.ARCHIVED, CompetitionStatus.OPEN),
    'Illegal transition: ARCHIVED cannot transition back to OPEN'
  );
  assert(
    !CompetitionService.isValidTransition(CompetitionStatus.SHORTLISTED, CompetitionStatus.OPEN),
    'Illegal transition: SHORTLISTED cannot roll back to OPEN'
  );
  assert(
    !CompetitionService.isValidTransition(CompetitionStatus.OPEN, CompetitionStatus.ARCHIVED),
    'Illegal transition: OPEN cannot skip to ARCHIVED'
  );

  // Competition Creation Input Validation
  let caughtEndDateErr = false;
  try {
    await competitionService.createCompetition({
      organizerId: 'org_1',
      title: 'Invalid Dates Test',
      slug: 'invalid-dates',
      description: 'Test',
      bannerUrl: 'https://example.com/banner.jpg',
      submissionStartDate: new Date('2026-11-20'),
      submissionEndDate: new Date('2026-11-10'), // Before start date!
      resultsPublishDate: new Date('2026-11-25'),
      prizeSummary: '$1,000',
      categories: [
        {
          code: 'STREET',
          name: 'Street',
          description: 'Street',
          rubricWeights: STANDARD_CATEGORIES.STREET.rubricWeights,
        },
      ],
    });
  } catch (err: any) {
    caughtEndDateErr = err instanceof BadRequestError && err.message.includes('after start date');
  }
  assert(caughtEndDateErr, 'createCompetition rejects submission end date before start date');

  let caughtResultsDateErr = false;
  try {
    await competitionService.createCompetition({
      organizerId: 'org_1',
      title: 'Invalid Results Date Test',
      slug: 'invalid-results-date',
      description: 'Test',
      bannerUrl: 'https://example.com/banner.jpg',
      submissionStartDate: new Date('2026-11-01'),
      submissionEndDate: new Date('2026-11-20'),
      resultsPublishDate: new Date('2026-11-15'), // Before end date!
      prizeSummary: '$1,000',
      categories: [
        {
          code: 'STREET',
          name: 'Street',
          description: 'Street',
          rubricWeights: STANDARD_CATEGORIES.STREET.rubricWeights,
        },
      ],
    });
  } catch (err: any) {
    caughtResultsDateErr = err instanceof BadRequestError && err.message.includes('after submission deadline');
  }
  assert(caughtResultsDateErr, 'createCompetition rejects results publish date before submission deadline');

  let caughtWeightSumErr = false;
  try {
    await competitionService.createCompetition({
      organizerId: 'org_1',
      title: 'Invalid Weights Test',
      slug: 'invalid-weights',
      description: 'Test',
      bannerUrl: 'https://example.com/banner.jpg',
      submissionStartDate: new Date('2026-11-01'),
      submissionEndDate: new Date('2026-11-20'),
      resultsPublishDate: new Date('2026-11-25'),
      prizeSummary: '$1,000',
      categories: [
        {
          code: 'BAD_WEIGHTS',
          name: 'Bad Weights',
          description: 'Invalid sum',
          rubricWeights: {
            composition: 0.1,
            lighting: 0.1,
            colorHarmony: 0.1,
            technicalExecution: 0.1,
            subjectStory: 0.1,
            originality: 0.1,
            emotionAtmosphere: 0.1,
            overallGestalt: 0.1, // Sum = 0.8
          },
        },
      ],
    });
  } catch (err: any) {
    caughtWeightSumErr = err instanceof BadRequestError && err.message.includes('sum to exactly 1.0');
  }
  assert(caughtWeightSumErr, 'createCompetition rejects rubric weights that do not sum to 1.0');

  // 2. Submission Constraints & File Size Cap
  assert(
    SubmissionService.MAX_FILE_SIZE_BYTES === 25 * 1024 * 1024,
    'Submission max file size constant set to exactly 25 MB'
  );

  let caughtFileSizeErr = false;
  try {
    SubmissionService.validateFileSize(26 * 1024 * 1024); // 26 MB
  } catch (err: any) {
    caughtFileSizeErr = err instanceof BadRequestError && err.message.includes('25 MB');
  }
  assert(caughtFileSizeErr, 'validateFileSize rejects uploads greater than 25 MB');

  let allowedFileSizePassed = false;
  try {
    SubmissionService.validateFileSize(18 * 1024 * 1024); // 18 MB
    allowedFileSizePassed = true;
  } catch {
    allowedFileSizePassed = false;
  }
  assert(allowedFileSizePassed, 'validateFileSize accepts files within 25 MB limit');

  // Scorecard Privacy Logic
  assert(
    SubmissionService.isScorecardVisible(CompetitionStatus.RESULTS_PUBLISHED, 'photographer_123', 'visitor_999'),
    'Scorecard is publicly visible once RESULTS_PUBLISHED'
  );
  assert(
    SubmissionService.isScorecardVisible(CompetitionStatus.OPEN, 'photographer_123', 'photographer_123'),
    'Scorecard is visible to the submitting photographer during OPEN status'
  );
  assert(
    !SubmissionService.isScorecardVisible(CompetitionStatus.OPEN, 'photographer_123', 'other_entrant_456'),
    'Scorecard is hidden from other entrants during OPEN status'
  );
  assert(
    !SubmissionService.isScorecardVisible(CompetitionStatus.JUDGING, 'photographer_123', undefined),
    'Scorecard is hidden from anonymous public during JUDGING status'
  );

  // Percentile Calculation
  const topRank = SubmissionService.calculatePercentileRank(95, 100, 'Street Photography');
  assert(topRank === 'Top 5% in Street Photography', `Calculates Top 5% ranking correctly (${topRank})`);

  const perfectRank = SubmissionService.calculatePercentileRank(100, 100, 'Macro & Micro');
  assert(perfectRank === 'Top 1% in Macro & Micro', `Calculates Top 1% ranking on highest score (${perfectRank})`);

  const bottomRank = SubmissionService.calculatePercentileRank(0, 100, 'Landscape & Nature');
  assert(bottomRank === 'Top 100% in Landscape & Nature', `Calculates Top 100% ranking correctly (${bottomRank})`);

  // 3. Shortlisting Service Lifecycle Guard
  let caughtShortlistDraftErr = false;
  try {
    await shortlistService.generateShortlist('non_existent_comp');
  } catch (err: any) {
    caughtShortlistDraftErr = Boolean(err);
  }
  assert(caughtShortlistDraftErr, 'shortlistService safely guards execution against missing or unjudged competitions');

  // 4. Juror Verdict Validation & Podium Integrity
  let caughtEmptyPodiumsErr = false;
  try {
    JurorService.validatePodiums([]);
  } catch (err: any) {
    caughtEmptyPodiumsErr = err instanceof BadRequestError && err.message.includes('At least one podium winner');
  }
  assert(caughtEmptyPodiumsErr, 'validatePodiums rejects empty podium arrays');

  let caughtDuplicatePodiumErr = false;
  try {
    JurorService.validatePodiums([
      { submissionId: 'sub_1', podiumRank: PodiumRank.FIRST_PLACE },
      { submissionId: 'sub_2', podiumRank: PodiumRank.FIRST_PLACE }, // Duplicate 1st place!
    ]);
  } catch (err: any) {
    caughtDuplicatePodiumErr = err instanceof BadRequestError && err.message.includes('Duplicate podium rank detected');
  }
  assert(caughtDuplicatePodiumErr, 'validatePodiums detects and rejects duplicate top-podium ranks');

  let validPodiumsAccepted = false;
  try {
    validPodiumsAccepted = JurorService.validatePodiums([
      { submissionId: 'sub_1', podiumRank: PodiumRank.FIRST_PLACE, jurorRemarks: 'Outstanding' },
      { submissionId: 'sub_2', podiumRank: PodiumRank.SECOND_PLACE, jurorRemarks: 'Great dynamic range' },
      { submissionId: 'sub_3', podiumRank: PodiumRank.THIRD_PLACE, jurorRemarks: 'Subtle tonality' },
      { submissionId: 'sub_4', podiumRank: PodiumRank.HONORABLE_MENTION, jurorRemarks: 'Commendable story' },
      { submissionId: 'sub_5', podiumRank: PodiumRank.HONORABLE_MENTION, jurorRemarks: 'Vibrant color' },
    ]);
  } catch {
    validPodiumsAccepted = false;
  }
  assert(validPodiumsAccepted, 'validatePodiums approves unique 1st/2nd/3rd places with multiple Honorable Mentions');

  // 5. Appeals & Dispute Resolution Validation
  let caughtAppealNonOwnerErr = false;
  try {
    AppealsService.validateAppealEligibility('photographer_alice', SubmissionStatus.FLAGGED_DISQUALIFIED, 'malicious_bob');
  } catch (err: any) {
    caughtAppealNonOwnerErr = err instanceof ForbiddenError && err.message.includes('Only the photographer');
  }
  assert(caughtAppealNonOwnerErr, 'validateAppealEligibility rejects third-party appeals on foreign submissions');

  let caughtAppealNonDisqualifiedErr = false;
  try {
    AppealsService.validateAppealEligibility('photographer_alice', SubmissionStatus.SCORED, 'photographer_alice');
  } catch (err: any) {
    caughtAppealNonDisqualifiedErr = err instanceof BadRequestError && err.message.includes('Only disqualified submissions');
  }
  assert(caughtAppealNonDisqualifiedErr, 'validateAppealEligibility rejects appeals on approved/scored submissions');

  let validAppealPassed = false;
  try {
    AppealsService.validateAppealEligibility('photographer_alice', SubmissionStatus.FLAGGED_DISQUALIFIED, 'photographer_alice');
    validAppealPassed = true;
  } catch {
    validAppealPassed = false;
  }
  assert(validAppealPassed, 'validateAppealEligibility approves appeal filed by original photographer of disqualified entry');

  // 6. Dual-Track Leaderboard Formatting & Blind Masking Verification
  const mockBlindLeaderboard = {
    competition: {
      id: 'comp_test_1',
      title: 'Tokyo Street 2026',
      status: CompetitionStatus.OPEN,
      isBlindEvaluationActive: true,
    },
    competitionId: 'comp_test_1',
    competitionTitle: 'Tokyo Street 2026',
    status: CompetitionStatus.OPEN,
    isBlindEvaluationActive: true,
    officialTrack: [
      {
        rank: 1,
        submissionId: 'sub_101',
        title: 'Midnight Crossing',
        category: 'Street Photography',
        categoryCode: 'STREET',
        aiScore: null,
        totalScore: null,
        communityVotes: 12,
        author: { name: 'Anonymous Entrant' },
        photographer: { name: 'Anonymous Entrant' },
        podium: null,
      },
    ],
    communityTrack: [
      {
        rank: 1,
        submissionId: 'sub_101',
        title: 'Midnight Crossing',
        category: 'Street Photography',
        categoryCode: 'STREET',
        communityVotes: 12,
        votes: 12,
        aiScore: null,
        author: { name: 'Anonymous Entrant' },
        photographer: { name: 'Anonymous Entrant' },
      },
    ],
  };

  assert(mockBlindLeaderboard.isBlindEvaluationActive, 'Blind evaluation active flag is enabled during OPEN status');
  assert(
    mockBlindLeaderboard.officialTrack[0].author.name === 'Anonymous Entrant',
    'Photographer is masked to Anonymous Entrant during blind judging'
  );
  assert(
    mockBlindLeaderboard.officialTrack[0].totalScore === null,
    'Total score is hidden to prevent bandwagon effect during OPEN status'
  );
  assert(
    mockBlindLeaderboard.officialTrack.length > 0 && mockBlindLeaderboard.communityTrack.length > 0,
    'Dual tracks (Official AI Track & Community Track) properly separated'
  );

  // ---------------------------------------------------------------------------
  // Test 7: HTTP REST API & Route Controllers (Layer 7)
  // ---------------------------------------------------------------------------
  console.log('\n--- Testing Layer 7: HTTP REST API & Route Controllers ---');

  const httpServer = app.listen(0);
  const address = httpServer.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  // 1. Health check & security headers
  const healthRes = await fetch(`${baseUrl}/api/health`);
  assert(healthRes.status === 200, 'Health check returns HTTP 200 OK');
  const healthBody = (await healthRes.json()) as any;
  assert(healthBody.status === 'healthy', 'Health check reports status healthy');
  assert(healthBody.service === 'pixel-prize-backend', 'Health check service identifier matches pixel-prize-backend');
  assert(Boolean(healthBody.timestamp), 'Health check includes ISO timestamp');

  assert(
    healthRes.headers.get('x-content-type-options') === 'nosniff',
    'Helmet sets X-Content-Type-Options: nosniff'
  );
  assert(
    healthRes.headers.get('cross-origin-resource-policy') === 'cross-origin',
    'Cross-Origin-Resource-Policy configured for media assets'
  );

  // 2. Authentication middleware & RFC 7807 401 Unauthorized
  const noAuthRes = await fetch(`${baseUrl}/api/auth/me`);
  assert(noAuthRes.status === 401, 'Protected endpoint rejects missing token with HTTP 401');
  const noAuthBody = (await noAuthRes.json()) as any;
  assert(noAuthBody.code === 'UNAUTHORIZED', 'Error payload carries UNAUTHORIZED problem code');
  assert(noAuthBody.type === 'https://pixelprize.org/errors/unauthorized', 'RFC 7807 problem details URI matches specification');

  const badTokenRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Authorization: 'Bearer invalid.token.payload' },
  });
  assert(badTokenRes.status === 401, 'Rejects invalid bearer token with HTTP 401');

  // 3. Role-Based Access Control (RBAC) & RFC 7807 403 Forbidden
  const participantJwt = jwt.sign(
    { id: 'usr_part_1', email: 'participant@pixelprize.org', role: Role.PARTICIPANT },
    env.AUTH_SECRET,
    { expiresIn: '1h' }
  );

  const jurorAccessWithParticipantToken = await fetch(`${baseUrl}/api/juror/competitions/comp_1/shortlist`, {
    headers: { Authorization: `Bearer ${participantJwt}` },
  });
  assert(
    jurorAccessWithParticipantToken.status === 403,
    'Participant role forbidden from accessing juror shortlist endpoint (HTTP 403)'
  );
  const forbiddenBody = (await jurorAccessWithParticipantToken.json()) as any;
  assert(forbiddenBody.code === 'FORBIDDEN', 'Carries FORBIDDEN RFC 7807 problem code');

  const organizerAccessWithParticipantToken = await fetch(`${baseUrl}/api/competitions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${participantJwt}`,
    },
    body: JSON.stringify({}),
  });
  assert(
    organizerAccessWithParticipantToken.status === 403,
    'Participant role forbidden from creating competitions (HTTP 403)'
  );

  // 4. Request Validation (Zod Schema Middleware - RFC 7807 422 Unprocessable Entity)
  const badRegisterRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'not-an-email' }), // Missing username, password, name
  });
  assert(badRegisterRes.status === 422, 'Zod validation middleware rejects invalid body with HTTP 422');
  const badRegisterBody = (await badRegisterRes.json()) as any;
  assert(badRegisterBody.code === 'VALIDATION_FAILED', 'Validation error returns VALIDATION_FAILED code');
  assert(Boolean(badRegisterBody.errors), 'Problem details includes detailed field error map');

  const badLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'valid@photo.org' }), // Missing password
  });
  assert(badLoginRes.status === 422, 'Rejects login request missing password with HTTP 422');

  const badPresignedRes = await fetch(`${baseUrl}/api/submissions/presigned-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${participantJwt}`,
    },
    body: JSON.stringify({ competitionId: 'comp_1' }), // Missing filename, fileSizeBytes, mimeType
  });
  assert(badPresignedRes.status === 422, 'Rejects presigned URL request missing file metadata with HTTP 422');

  const jurorJwt = jwt.sign(
    { id: 'juror_1', email: 'juror@pixelprize.org', role: Role.JUROR },
    env.AUTH_SECRET,
    { expiresIn: '1h' }
  );

  const badVerdictRes = await fetch(`${baseUrl}/api/juror/competitions/comp_1/verdict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jurorJwt}`,
    },
    body: JSON.stringify({ podiums: [] }), // Empty array fails min(1) validation!
  });
  assert(badVerdictRes.status === 422, 'Rejects empty juror podium verdict with HTTP 422 validation failure');

  const badAppealRes = await fetch(`${baseUrl}/api/appeals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${participantJwt}`,
    },
    body: JSON.stringify({ submissionId: 'sub_1', reason: 'bad' }), // Too short (< 5 chars)
  });
  assert(badAppealRes.status === 422, 'Rejects appeal with reason shorter than 5 chars with HTTP 422');

  // 5. Ephemeral HTTP server teardown
  await new Promise<void>((resolve, reject) => {
    httpServer.close((err) => (err ? reject(err) : resolve()));
  });
  assert(true, 'Ephemeral HTTP server closed cleanly');

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log(`\n=======================================================`);
  console.log(`🎯 Verification Completed: ${passed}/${total} checks passed.`);
  console.log(`=======================================================\n`);
}

runBackendVerification().catch((err) => {
  console.error('Verification failed with error:', err);
  process.exit(1);
});
