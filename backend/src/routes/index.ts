import express, { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { competitionController } from '../controllers/competition.controller.js';
import { submissionController } from '../controllers/submission.controller.js';
import { jurorController } from '../controllers/juror.controller.js';
import { appealController } from '../controllers/appeal.controller.js';
import { judgeController } from '../controllers/judge.controller.js';
import { authenticate, optionalAuthenticate, requireRole } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import {
  registerSchema,
  loginSchema,
  createCompetitionSchema,
  updateCompetitionStatusSchema,
  presignedUrlRequestSchema,
  confirmSubmissionSchema,
  submitVerdictSchema,
  fileAppealSchema,
  resolveAppealSchema,
} from '../schemas/api.schemas.js';
import { Role } from '../types/index.js';
import { rateLimit } from '../middleware/rate-limit.middleware.js';

// Rate Limiting Instances
const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15,
  message: 'Too many authentication attempts. Please try again in 1 minute.',
});

const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: 'Upload ticket quota reached. Please wait before requesting additional upload tickets.',
});

const voteRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: 'Voting rate limit exceeded. Please slow down.',
});

export const apiRouter = Router();

// -----------------------------------------------------------------------------
// Health Check
// -----------------------------------------------------------------------------
apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'pixel-prize-backend',
  });
});

// -----------------------------------------------------------------------------
// 1. Auth Endpoints
// -----------------------------------------------------------------------------
const authRouter = Router();
authRouter.post('/register', authRateLimiter, validateBody(registerSchema), (req, res, next) =>
  authController.register(req, res).catch(next)
);
authRouter.post('/login', authRateLimiter, validateBody(loginSchema), (req, res, next) =>
  authController.login(req, res).catch(next)
);
authRouter.get('/me', authenticate, (req, res, next) =>
  authController.getMe(req, res).catch(next)
);
apiRouter.use('/auth', authRouter);

// -----------------------------------------------------------------------------
// 2. Competition Endpoints
// -----------------------------------------------------------------------------
const compRouter = Router();
compRouter.get('/', (req, res, next) =>
  competitionController.list(req, res).catch(next)
);
compRouter.post(
  '/',
  authenticate,
  requireRole(Role.ORGANIZER, Role.ADMIN),
  validateBody(createCompetitionSchema),
  (req, res, next) => competitionController.create(req, res).catch(next)
);
compRouter.get('/:id', (req, res, next) =>
  competitionController.getById(req, res).catch(next)
);
compRouter.patch(
  '/:id/status',
  authenticate,
  requireRole(Role.ORGANIZER, Role.ADMIN),
  validateBody(updateCompetitionStatusSchema),
  (req, res, next) => competitionController.updateStatus(req, res).catch(next)
);
compRouter.get('/:id/leaderboard', (req, res, next) =>
  competitionController.getLeaderboard(req, res).catch(next)
);
compRouter.get('/:id/gallery', (req, res, next) =>
  competitionController.getGallery(req, res).catch(next)
);
apiRouter.use('/competitions', compRouter);

// -----------------------------------------------------------------------------
// 3. Submission & Scoring Endpoints
// -----------------------------------------------------------------------------
const subRouter = Router();
subRouter.post(
  '/presigned-url',
  uploadRateLimiter,
  authenticate,
  validateBody(presignedUrlRequestSchema),
  (req, res, next) => submissionController.requestPresignedUrl(req, res).catch(next)
);
subRouter.put(
  '/upload',
  express.raw({ type: '*/*', limit: '25mb' }),
  (req, res, next) => submissionController.handleLocalUpload(req, res).catch(next)
);
subRouter.post(
  '/',
  authenticate,
  validateBody(confirmSubmissionSchema),
  (req, res, next) => submissionController.confirm(req, res).catch(next)
);
subRouter.get('/my', authenticate, (req, res, next) =>
  submissionController.getMySubmissions(req, res).catch(next)
);
subRouter.get('/:id', (req, res, next) =>
  submissionController.getById(req, res).catch(next)
);
subRouter.get(
  '/:id/scorecard',
  optionalAuthenticate,
  (req, res, next) => submissionController.getScorecard(req, res).catch(next)
);
subRouter.post(
  '/:id/vote',
  voteRateLimiter,
  authenticate,
  (req, res, next) => submissionController.vote(req, res).catch(next)
);
apiRouter.use('/submissions', subRouter);

// -----------------------------------------------------------------------------
// 4. Juror Endpoints
// -----------------------------------------------------------------------------
const jurorRouter = Router();
jurorRouter.get(
  '/competitions/:id/shortlist',
  authenticate,
  requireRole(Role.JUROR, Role.ORGANIZER, Role.ADMIN),
  (req, res, next) => jurorController.getShortlist(req, res).catch(next)
);
jurorRouter.post(
  '/competitions/:id/verdict',
  authenticate,
  requireRole(Role.JUROR, Role.ADMIN),
  validateBody(submitVerdictSchema),
  (req, res, next) => jurorController.submitVerdict(req, res).catch(next)
);
jurorRouter.post(
  '/competitions/:id/publish-results',
  authenticate,
  requireRole(Role.ORGANIZER, Role.ADMIN),
  (req, res, next) => jurorController.publishOfficialResults(req, res).catch(next)
);
apiRouter.use('/juror', jurorRouter);

// -----------------------------------------------------------------------------
// 5. Appeals Endpoints
// -----------------------------------------------------------------------------
const appealRouter = Router();
appealRouter.post(
  '/',
  authenticate,
  validateBody(fileAppealSchema),
  (req, res, next) => appealController.fileAppeal(req, res).catch(next)
);
appealRouter.patch(
  '/:id',
  authenticate,
  requireRole(Role.ORGANIZER, Role.ADMIN),
  validateBody(resolveAppealSchema),
  (req, res, next) => appealController.resolveAppeal(req, res).catch(next)
);
apiRouter.use('/appeals', appealRouter);

// -----------------------------------------------------------------------------
// 6. AI Judging Sandbox & Testing Studio Endpoints
// -----------------------------------------------------------------------------
const judgeRouter = Router();
judgeRouter.post('/sandbox', optionalAuthenticate, (req, res, next) =>
  judgeController.evaluateSandbox(req, res).catch(next)
);
apiRouter.use('/judge', judgeRouter);

