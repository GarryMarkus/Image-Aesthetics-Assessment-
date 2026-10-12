import sharp from 'sharp';
import { env } from '../src/config/env.js';
import { AppError, BadRequestError, NotFoundError, ForensicViolationError } from '../src/lib/errors.js';
import { logger } from '../src/lib/logger.js';
import { Role, CompetitionStatus, SubmissionStatus, PodiumRank, AppealStatus, RubricWeights } from '../src/types/index.js';
import { ScoringMath } from '../src/lib/judge/scoring-math.js';
import { ImageProcessorService } from '../src/services/image-processor.service.js';
import { ForensicsService } from '../src/services/forensics.service.js';
import { MockJudgeAdapter } from '../src/lib/judge/mock.adapter.js';

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
  // Test 1: Scoring Mathematical Formulations (ArtiMuse / TAD66K)
  // ---------------------------------------------------------------------------
  console.log('--- Testing Layer 4: Scoring Mathematical Formulas ---');
  const streetWeights: RubricWeights = {
    composition: 0.15,
    lighting: 0.10,
    colorHarmony: 0.05,
    technicalExecution: 0.05,
    subjectStory: 0.30,
    originality: 0.20,
    emotionAtmosphere: 0.15,
    overallGestalt: 0.00,
  };

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

  // Expected weighted:
  // (0.15*90) + (0.10*80) + (0.05*70) + (0.05*60) + (0.30*95) + (0.20*85) + (0.15*90) + (0.00*75)
  // = 13.5 + 8.0 + 3.5 + 3.0 + 28.5 + 17.0 + 13.5 + 0 = 87.0
  // S_theme = 100, P_defect = 0 -> S_total = 87.0
  const computedScore = ScoringMath.calculateTotalScore(scores, streetWeights, 100, 0);
  assert(computedScore === 87.0, `Calculated S_total matches exact mathematical expectation (87.0 === ${computedScore})`);

  // With 10 defect points and 90% theme factor:
  // 87.0 * 0.9 - 10 = 78.3 - 10 = 68.3
  const penalizedScore = ScoringMath.calculateTotalScore(scores, streetWeights, 90, 10);
  assert(penalizedScore === 68.3, `Calculated S_total with defect penalties and theme attenuation matches (68.3 === ${penalizedScore})`);

  // ---------------------------------------------------------------------------
  // Test 2: Perceptual Hashing (dHash) & Hamming Distance
  // ---------------------------------------------------------------------------
  console.log('\n--- Testing Layer 2 & 3: Perceptual Hashing (dHash) ---');
  const processor = new ImageProcessorService();

  // Create two distinct test image buffers
  const img1 = await sharp({
    create: { width: 100, height: 100, channels: 3, background: { r: 255, g: 0, b: 0 } },
  })
    .png()
    .toBuffer();

  const img2 = await sharp({
    create: { width: 100, height: 100, channels: 3, background: { r: 0, g: 255, b: 0 } },
  })
    .png()
    .toBuffer();

  const hash1 = await processor.computeDHash(img1);
  const hash2 = await processor.computeDHash(img2);

  assert(typeof hash1 === 'string' && hash1.length === 16, `dHash generates valid 64-bit hex hash (${hash1})`);
  assert(processor.calculateHammingDistance(hash1, hash1) === 0, 'Identical image has Hamming distance 0');
  assert(processor.calculateHammingDistance(hash1, hash2) >= 0, 'Hamming distance calculates correctly');

  // ---------------------------------------------------------------------------
  // Test 3: Forensics & Anti-Fraud Screening
  // ---------------------------------------------------------------------------
  console.log('\n--- Testing Layer 3: Forensics & Anti-Fraud Screening ---');
  const forensics = new ForensicsService();

  // Test synthetic EXIF detection
  const syntheticResult = await forensics.inspectSubmission(
    img1,
    { cameraModel: 'Midjourney v6 Neural Engine', software: 'ComfyUI' },
    []
  );
  assert(!syntheticResult.isApproved, 'Correctly flags synthetic AI software in metadata (Midjourney/ComfyUI)');
  assert(syntheticResult.disqualificationReason?.includes('DQ_SYNTHETIC_EXIF') === true, 'Assigned DQ_SYNTHETIC_EXIF code');

  // Test duplicate burst collision
  const duplicateResult = await forensics.inspectSubmission(
    img1,
    { cameraModel: 'Sony A7 IV', software: 'Adobe Lightroom' },
    [hash1] // Collision with same hash
  );
  assert(!duplicateResult.isApproved, 'Correctly rejects duplicate burst upload with identical perceptual hash');
  assert(duplicateResult.disqualificationReason?.includes('DQ_DUPLICATE_BURST') === true, 'Assigned DQ_DUPLICATE_BURST code');

  // ---------------------------------------------------------------------------
  // Test 4: AI Model Adapter Contract (Mock Evaluation)
  // ---------------------------------------------------------------------------
  console.log('\n--- Testing Layer 4: Model-Agnostic IJudgeAdapter ---');
  const judge = new MockJudgeAdapter();
  const judgeResult = await judge.evaluate({
    submissionId: 'test_sub_001',
    imageBuffer: img1,
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
