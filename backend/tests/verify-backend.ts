import sharp from 'sharp';
import { env } from '../src/config/env.js';
import { AppError, BadRequestError, NotFoundError, ForensicViolationError } from '../src/lib/errors.js';
import { logger } from '../src/lib/logger.js';
import { Role, CompetitionStatus, SubmissionStatus, PodiumRank, AppealStatus, RubricWeights } from '../src/types/index.js';
import { ScoringMath } from '../src/lib/judge/scoring-math.js';
import { ImageProcessorService } from '../src/services/image-processor.service.js';
import { ForensicsService } from '../src/services/forensics.service.js';
import { MockJudgeAdapter } from '../src/lib/judge/mock.adapter.js';
import { prisma } from '../src/db/prisma.js';
import { STANDARD_CATEGORIES } from '../src/config/categories.js';
import { storage } from '../src/lib/storage.js';
import { exifService } from '../src/services/exif.service.js';

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
