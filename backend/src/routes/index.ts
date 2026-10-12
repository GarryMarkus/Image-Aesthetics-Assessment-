import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { competitionController } from '../controllers/competition.controller.js';
import { submissionController } from '../controllers/submission.controller.js';
import { jurorController } from '../controllers/juror.controller.js';
import { appealController } from '../controllers/appeal.controller.js';
import { authenticate, optionalAuthenticate, requireRole } from '../middleware/auth.middleware.js';
import { Role } from '../types/index.js';

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
authRouter.post('/register', (req, res, next) => authController.register(req, res).catch(next));
authRouter.post('/login', (req, res, next) => authController.login(req, res).catch(next));
authRouter.get('/me', authenticate, (req, res, next) => authController.getMe(req, res).catch(next));
apiRouter.use('/auth', authRouter);

// -----------------------------------------------------------------------------
// 2. Competition Endpoints
// -----------------------------------------------------------------------------
const compRouter = Router();
compRouter.get('/', (req, res, next) => competitionController.list(req, res).catch(next));
compRouter.post(
  '/',
  authenticate,
  requireRole(Role.ORGANIZER, Role.ADMIN),
  (req, res, next) => competitionController.create(req, res).catch(next)
);
compRouter.get('/:id', (req, res, next) => competitionController.getById(req, res).catch(next));
compRouter.patch(
  '/:id/status',
  authenticate,
  requireRole(Role.ORGANIZER, Role.ADMIN),
  (req, res, next) => competitionController.updateStatus(req, res).catch(next)
);
compRouter.get('/:id/leaderboard', (req, res, next) => competitionController.getLeaderboard(req, res).catch(next));
compRouter.get('/:id/gallery', (req, res, next) => competitionController.getGallery(req, res).catch(next));
apiRouter.use('/competitions', compRouter);

// -----------------------------------------------------------------------------
// 3. Submission & Scoring Endpoints
// -----------------------------------------------------------------------------
const subRouter = Router();
subRouter.post(
  '/presigned-url',
  authenticate,
  (req, res, next) => submissionController.requestPresignedUrl(req, res).catch(next)
);
subRouter.post(
  '/',
  authenticate,
  (req, res, next) => submissionController.confirm(req, res).catch(next)
);
subRouter.get('/:id', (req, res, next) => submissionController.getById(req, res).catch(next));
subRouter.get(
  '/:id/scorecard',
  optionalAuthenticate,
  (req, res, next) => submissionController.getScorecard(req, res).catch(next)
);
subRouter.post(
  '/:id/vote',
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
  (req, res, next) => appealController.fileAppeal(req, res).catch(next)
);
appealRouter.patch(
  '/:id',
  authenticate,
  requireRole(Role.ORGANIZER, Role.ADMIN),
  (req, res, next) => appealController.resolveAppeal(req, res).catch(next)
);
apiRouter.use('/appeals', appealRouter);
