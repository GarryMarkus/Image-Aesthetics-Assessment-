# Pixel Prize Backend Security & Codebase Audit Report

> **Target Repository:** Pixel Prize — Image Aesthetics Assessment (IAA) Platform  
> **Audited Directory:** `backend/`  
> **Auditor Role:** Senior Backend Engineer & Security Reviewer  
> **Git Audit Branch:** `audit/backend-review`  
> **Date:** October 13, 2026  
> **Status:** All Critical, High, and Medium vulnerabilities resolved & verified via automated regression tests.

---

## 1. Backend Architecture Map

The **Pixel Prize** backend is a decoupled, model-agnostic, micro-service architecture built with Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, Redis BullMQ, and multimodal vision AI integrations:

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                  EDGE & CLIENT INTERFACE                                    |
|   Next.js 15 App Router Frontend (http://localhost:3000)                                     |
+─────────────────────────────────────────────────────────────────────────────────────────────+
                                            │
                                            ▼ HTTP REST JSON (Bearer JWT, RFC 7807)
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                               API & ROUTE CONTROLLER TIER                                   |
|   Server Entry: `src/server.ts` (Helmet, CORS, Rate Limiters, Graceful Shutdown)             |
|   Router: `src/routes/index.ts`                                                             |
|   Controllers:                                                                              |
|   - `src/controllers/auth.controller.ts` (Registration, Login, Me)                          |
|   - `src/controllers/competition.controller.ts` (Create, List, Details, State Machine)      |
|   - `src/controllers/submission.controller.ts` (Presigned URL, Confirm, Scorecards, Votes)  |
|   - `src/controllers/juror.controller.ts` (Top 10 Shortlist, Podiums, Publish Results)      |
|   - `src/controllers/appeal.controller.ts` (GDPR Art 22 Human Appeal Filing & Resolution)   |
|   Middleware:                                                                               |
|   - `src/middleware/auth.middleware.ts` (JWT verification, role gating)                     |
|   - `src/middleware/rate-limit.middleware.ts` (Sliding-window IP throttle)                  |
|   - `src/middleware/validate.middleware.ts` (Zod body, query, param validation)             |
|   - `src/middleware/error.middleware.ts` (RFC 7807 Problem Details handler)                 |
+─────────────────────────────────────────────────────────────────────────────────────────────+
                                            │
                                            ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                DOMAIN SERVICES TIER                                         |
|   - `competition.service.ts`: Lifecycle transitions (DRAFT -> OPEN -> JUDGING -> etc.)      |
|   - `submission.service.ts`: Quotas, presigned upload tickets, confirmation, percentiles    |
|   - `shortlist.service.ts`: Category Top 10 automated shortlist engine                      |
|   - `leaderboard.service.ts`: Dual-track standings (AI Aesthetic vs Community Upvotes)      |
|   - `juror.service.ts`: Lightbox deliberation, podium validation, lifetime wins             |
|   - `appeals.service.ts`: Contestant disqualification appeals and re-evaluation triage      |
|   - `image-processor.service.ts`: Sharp derivative generation (400px, 1600px, 1024px, dHash)|
|   - `forensics.service.ts`: PRNU noise, synthetic EXIF, dHash duplicate cap, Laplacian FFT  |
|   - `exif.service.ts`: Hardware tag extraction (Make, Model, Lens, FocalLength, Aperture)   |
+─────────────────────────────────────────────────────────────────────────────────────────────+
                     │                                                   │
                     ▼                                                   ▼
+───────────────────────────────────────────────+   +─────────────────────────────────────────+
|         ASYNCHRONOUS BACKGROUND QUEUES        |   |       DATA & MEDIA STORAGE TIER         |
|   Queue Definitions: `src/lib/queue.ts`       |   |   PostgreSQL Database:                  |
|   - `mediaQueue` -> `src/workers/media.worker`|   |   - Managed by Prisma (`prisma/schema`)     |
|   - `judgingQueue` -> `src/workers/judge.worker`| |   Storage Service:                          |
|   Worker Concurrency: 5 jobs/worker           |   |   - `src/lib/storage.ts`                    |
+───────────────────────────────────────────────+   |   - Cloudflare R2 / AWS S3 S3Client     |
                     │                              |   - Local filesystem `uploads/`         |
                     ▼                              +─────────────────────────────────────────+
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                 AI JUDGING ENGINE TIER                                      |
|   Orchestrator: `src/lib/judge/judge.orchestrator.ts`                                       |
|   - Blind masking (strips usernames, copyright, camera serials before LLM call)             |
|   - Borderline multi-pass calibration ($N=3$, stochastic variance check $\sigma > 6.0$)    |
|   Model Adapters (`IJudgeAdapter` Interface):                                               |
|   - `GeminiJudgeAdapter` (Google Gemini 2.5 Flash via `@google/genai` Structured JSON)       |
|   - `CustomModelJudgeAdapter` (Phase 2 In-House Triton Inference Endpoint)                  |
|   - `MockJudgeAdapter` (Deterministic offline mock engine for unit & CI testing)            |
|   Validation & Defenses:                                                                    |
|   - `src/lib/judge/schemas.ts`: Strict Zod validation, markdown fence stripper, score clamp|
|   - `src/lib/judge/prompts.ts`: Prompt injection defense, `<user_provided_metadata>` tags   |
|   - `src/lib/judge/scoring-math.ts`: Deterministic TAD66K / ArtiMuse weighted synthesis     |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

### Complete Photo Lifecycle (Upload to Leaderboard)
1. **Presigned Ticket Issuance:** Participant calls `POST /api/submissions/presigned-url`. The system verifies the competition is `OPEN`, dates are active, participant has not exceeded quota, and MIME type is `image/jpeg`, `image/png`, or `image/webp`. A direct upload ticket is granted.
2. **Direct Storage Upload:** Participant uploads raw file ($\le 25\text{ MB}$) directly to Cloudflare R2 / S3 storage (bypassing Node.js server buffers).
3. **Confirmation & Enqueue:** Participant calls `POST /api/submissions`. The backend validates the category, quota, and storage path, creates an `IN_QUEUE` submission record, and enqueues an `INGEST_MEDIA` background job in BullMQ.
4. **Media & Forensics Processing:** `media.worker.ts` downloads the master file, parses hardware EXIF, screens for synthetic AI software signatures, computes 64-bit $dHash$ and checks duplicate distance ($\le 4$), runs Laplacian discrete gradients for diffusion lattice artifacts, generates WebP 400px thumb and 1600px web derivatives (stripping GPS), renders 1024px JPEG normalized asset, and enqueues `JUDGE_SUBMISSION`.
5. **AI Evaluation:** `judge.worker.ts` executes blind evaluation through `IJudgeAdapter`. The model outputs raw JSON which is parsed, validated against Zod schemas, clamped to $[0, 100]$, and scored via TAD66K rubric weights. Borderline scores ($\ge 75$) trigger 3-pass calibration ($T=0.20, 0.30, 0.35$). The score is saved, and status becomes `SCORED`.
6. **Shortlisting:** Organizer moves contest from `JUDGING` to `SHORTLISTED`. `shortlist.service.ts` deterministically ranks the Top 10 entries per category.
7. **Juror Lightbox Deliberation:** Appointed jurors inspect the anonymized Top 10 shortlist in their lightbox and allocate podiums (`FIRST_PLACE`, `SECOND_PLACE`, `THIRD_PLACE`, `HONORABLE_MENTION`).
8. **Results Publishing:** Organizer calls `POST /api/juror/competitions/:id/publish-results`. Status moves to `RESULTS_PUBLISHED`, public leaderboards are unmasked, winner `lifetimeWins` counters increment, and contestant percentiles are unlocked.

---

## 2. Findings Table

| ID | Severity | Category | File and Line | Description | Fix Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FINDING-01** | **CRITICAL** | Security | `backend/src/lib/storage.ts#L113-L125` | `LocalStorageService` used unvalidated path joins, enabling directory traversal via `../` to access/modify arbitrary filesystem paths. | **Fixed** |
| **FINDING-02** | **CRITICAL** | Security (IDOR) | `backend/src/controllers/competition.controller.ts#L52` | `PATCH /api/competitions/:id/status` lacked ownership validation; any organizer could update the status of another organizer's competition. | **Fixed** |
| **FINDING-03** | **CRITICAL** | Security (IDOR) | `backend/src/controllers/appeal.controller.ts#L27` & `appeals.service.ts#L55` | `PATCH /api/appeals/:id` allowed any organizer to resolve appeals belonging to other organizers' competitions. | **Fixed** |
| **FINDING-04** | **HIGH** | AI Judging Pipeline | `backend/src/lib/judge/gemini.adapter.ts#L58-L68` & `schemas.ts` | Direct `JSON.parse` crashed on markdown code fences or conversational prose. Missing Zod schema validation allowed out-of-range or malformed scores. | **Fixed** |
| **FINDING-05** | **HIGH** | AI Judging Pipeline | `backend/src/lib/judge/gemini.adapter.ts` & `custom-model.adapter.ts` | Missing exponential backoff retries and timeouts on HTTP 429 rate limits, 503 errors, and stalled connections. | **Fixed** |
| **FINDING-06** | **HIGH** | Reliability / Correctness | `backend/src/workers/media.worker.ts#L178` & `judge.worker.ts#L150` | Transient BullMQ worker or network crashes falsely marked user submissions as `FLAGGED_DISQUALIFIED` due to system errors. | **Fixed** |
| **FINDING-07** | **HIGH** | AI Pipeline Security | `backend/src/lib/judge/prompts.ts#L31-L33` | Raw user title and story were interpolated without isolation tags or anti-injection instructions, enabling prompt injection attacks. | **Fixed** |
| **FINDING-08** | **HIGH** | Business Logic | `backend/src/services/submission.service.ts#L112-L138` | `confirmSubmission` bypassed competition status, active date windows, user submission quotas, category ownership, and storage path checks. | **Fixed** |
| **FINDING-09** | **HIGH** | Business Logic | `backend/src/services/submission.service.ts#L183-L196` | Percentile rank query filtered solely on `status: SCORED`, completely excluding the Top 10 `SHORTLISTED` entries from rankings. | **Fixed** |
| **FINDING-10** | **HIGH** | Security / Uploads | `backend/src/schemas/api.schemas.ts#L68` & `submission.service.ts` | Presigned URL request allowed arbitrary MIME types (e.g. scripts, executables, SVGs) rather than restricting to JPEG, PNG, WebP. | **Fixed** |
| **FINDING-11** | **MEDIUM** | Security / DoS | `backend/src/services/image-processor.service.ts#L21` | Sharp lacked pixel bounds (`limitInputPixels: 50_000_000`), leaving the ingestion worker vulnerable to image decompression bombs. | **Fixed** |
| **FINDING-12** | **MEDIUM** | Business Logic | `backend/src/services/juror.service.ts#L157-L174` | `publishOfficialResults` transitioned competitions to `RESULTS_PUBLISHED` without incrementing `lifetimeWins` on podium winners. | **Fixed** |
| **FINDING-13** | **MEDIUM** | Reliability | `backend/src/services/appeals.service.ts#L94` | Approved appeal re-ingestion split URLs on `/uploads/`, failing on cloud S3/R2 storage domains. | **Fixed** |
| **FINDING-14** | **MEDIUM** | Security | `backend/src/routes/index.ts` & `rate-limit.middleware.ts` | Missing rate limiting middleware on auth, upload ticket, and voting routes. | **Fixed** |
| **FINDING-15** | **MEDIUM** | Security / Config | `backend/src/config/env.ts#L28` | Permitted hardcoded default `AUTH_SECRET` in production mode without validation. | **Fixed** |
| **FINDING-16** | **MEDIUM** | Reliability | `backend/src/server.ts` | Missing graceful shutdown handlers for `SIGTERM` / `SIGINT` to cleanly close HTTP server and Prisma connections. | **Fixed** |
| **FINDING-17** | **LOW** | API Specification | `backend/src/services/submission.service.ts#L101` | Returned `expiresInSeconds` without required `expiresAt` ISO timestamp from API specification. | **Fixed** |
| **FINDING-18** | **LOW** | Data Correctness | `backend/src/services/shortlist.service.ts` & `leaderboard.service.ts` | Missing secondary tie-breaker (`createdAt: 'asc'`) for deterministic ranking when scores tie. | **Fixed** |

---

## 3. Detailed File Modifications

### 1. `backend/src/lib/storage.ts`
- **Change:** Implemented `resolveSafePath(key)` in `LocalStorageService`.
- **Rationale:** Strictly sanitizes input keys, strips leading slashes, rejects keys containing `..`, and asserts that `path.resolve(this.uploadDir, cleanKey)` begins with `this.uploadDir`. Prevents path traversal vulnerabilities across upload, download, and delete operations.

### 2. `backend/src/controllers/competition.controller.ts`
- **Change:** Added ownership authorization guard in `updateStatus`.
- **Rationale:** Ensures `previous.organizerId === req.user?.id || req.user?.role === Role.ADMIN`. Throws `ForbiddenError` if another organizer attempts to mutate the lifecycle of a foreign contest.

### 3. `backend/src/controllers/appeal.controller.ts` & `backend/src/services/appeals.service.ts`
- **Change:** Gated `resolveAppeal` by verifying `reviewerRole === Role.ADMIN || appeal.submission.competition.organizerId === reviewerId`. Fixed storage key extraction by matching `/raw-uploads\/[^?#]+/`.
- **Rationale:** Prevents foreign organizers from resolving appeals on contests they do not own; guarantees reliable storage key parsing regardless of whether local disk or Cloudflare R2 is configured.

### 4. `backend/src/lib/judge/schemas.ts`
- **Change:** Created `AestheticEvaluationOutputZodSchema`, `extractAndParseModelJson(rawText)`, and `validateAndNormalizeModelOutput(rawText)`.
- **Rationale:** Strips markdown code fences (````json ... ````) and surrounding commentary. Clamps attribute scores and theme adherence to $[0, 100]$, bounds penalties to $[0, 30]$, bounds synthetic likelihood to $[0.0, 1.0]$, and provides robust fallbacks for critique fields.

### 5. `backend/src/lib/judge/prompts.ts`
- **Change:** Added `sanitizeUserPromptText(text)`, enclosed user inputs within `<user_provided_metadata>` tags, and added `SECURITY & PROMPT INJECTION GUARD` system directives. Exported `PROMPT_VERSION = 'PROMPT_RUBRIC_V1_0_0'`.
- **Rationale:** Neutralizes prompt injection attempts by disallowing user-supplied titles or stories from impersonating scoring directives or system instructions.

### 6. `backend/src/lib/judge/gemini.adapter.ts` & `custom-model.adapter.ts`
- **Change:** Implemented `executeWithRetryAndTimeout`, retry loop with exponential backoff on HTTP 429/503/timeouts, 30s timeout via `AbortController`, and `validateAndNormalizeModelOutput`.
- **Rationale:** Protects against transient API outages and rate limits without failing judging runs; guarantees validated and clamped output structure before scores reach the database.

### 7. `backend/src/workers/media.worker.ts` & `judge.worker.ts`
- **Change:** Removed code that set `SubmissionStatus.FLAGGED_DISQUALIFIED` upon background job retry exhaustion. Added idempotency guard in `judge.worker.ts` checking if submission was already scored.
- **Rationale:** Disqualification must only be used for authentic rule violations (AI synthesis, duplicate bursts, missing hardware EXIF). Transient queue or server infrastructure failures preserve submission state for operator re-triage. Idempotency prevents double-billing and redundant model calls.

### 8. `backend/src/services/submission.service.ts`
- **Change:** 
  1. In `requestPresignedUploadUrl`: restricted MIME types to `image/jpeg`, `image/png`, `image/webp`; validated active contest date window; added `expiresAt` ISO string.
  2. In `confirmSubmission`: validated storage key prefix and path; validated competition status and date window; validated that `categoryId` belongs to `competitionId`; enforced user submission quota; returned `queuePosition`.
  3. In `getScorecard`: updated category percentile queries to filter `status: { in: [SubmissionStatus.SCORED, SubmissionStatus.SHORTLISTED] }`.
- **Rationale:** Prevents unauthorized submission creation, prevents uploading unapproved file types, aligns responses with `docs/11_api_specification.md`, and accurately reflects rankings by including shortlisted entries.

### 9. `backend/src/schemas/api.schemas.ts`
- **Change:** Restricted `presignedUrlRequestSchema` to `z.enum(['image/jpeg', 'image/png', 'image/webp'])` and capped `fileSizeBytes` at $25\text{ MB}$.
- **Rationale:** Blocks malicious payloads at the HTTP validation boundary before reaching domain services.

### 10. `backend/src/services/image-processor.service.ts`
- **Change:** Passed `{ failOn: 'none', limitInputPixels: 50_000_000 }` to all `sharp(...)` constructor invocations.
- **Rationale:** Prevents memory exhaustion attacks from malicious high-compression image bombs.

### 11. `backend/src/services/juror.service.ts`
- **Change:** Updated `publishOfficialResults` to increment `lifetimeWins` on 1st, 2nd, and 3rd place winners in a transaction.
- **Rationale:** Fulfills gamification and winner profile requirements in `docs/04_competition_system.md`.

### 12. `backend/src/services/shortlist.service.ts` & `leaderboard.service.ts`
- **Change:** Added secondary ordering `{ createdAt: 'asc' }` alongside `{ totalScore: 'desc' }`.
- **Rationale:** Enforces deterministic tie-breaking: earlier uploads take precedence when scores tie.

### 13. `backend/src/middleware/rate-limit.middleware.ts` & `src/routes/index.ts`
- **Change:** Created sliding-window `rateLimit` middleware returning RFC 7807 problem details with `Retry-After` headers. Applied to auth (15 req/min), presigned URL generation (30 req/15min), and community voting (60 req/min).
- **Rationale:** Protects against credential brute-forcing, storage ticket spamming, and vote brigading.

### 14. `backend/src/config/env.ts`
- **Change:** Added Zod refinement enforcing that `AUTH_SECRET` cannot be the default development secret and must have $\ge 32$ characters when `NODE_ENV === 'production'`.
- **Rationale:** Guarantees production environments cannot accidentally boot with weak or public default JWT secrets.

### 15. `backend/src/server.ts`
- **Change:** Added `disconnectDatabase()` import and `SIGTERM`/`SIGINT` listeners executing clean server closing and database disconnection.
- **Rationale:** Prevents dangling connections and abrupt container termination.

### 16. `backend/package.json`
- **Change:** Updated `"test"` script to `"tsx tests/verify-backend.ts && tsx tests/verify-audit-fixes.ts"`. Added `"test:audit"` command.
- **Rationale:** Integrates audit regression verification into the primary CI test command.

---

## 4. Tests Added and Verification Results

### Automated Regression Test Suites

#### 1. Full Backend Integration Suite (`tests/verify-backend.ts`)
- **Coverage:** 9 architectural layers (Layers 0 through 8).
- **Checks:** 191 / 191 passed (100%).

#### 2. Audit & Security Regression Suite (`tests/verify-audit-fixes.ts`)
- **Coverage:**
  - `Path Traversal Guard`: Verified rejection of `../../etc/passwd` and nested traversal uploads.
  - `Access Control & IDOR Guard`: Verified rejection of foreign organizers altering competition status or resolving foreign appeals; verified owner and admin permissions.
  - `Markdown Fence & Prose JSON Extraction`: Verified parsing of ````json```` wrapped responses and conversational prefixes/suffixes.
  - `Score Clamping & Fallbacks`: Verified scores $>100$ clamped to 100, $<0$ clamped to 0, penalties $>30$ clamped to 30, and missing critiques populated with fallbacks.
  - `Prompt Injection Defenses`: Verified angle bracket stripping, boundary tag isolation, and prompt versioning.
  - `MIME Type Whitelist`: Verified acceptance of JPEG/PNG/WebP and rejection of shell scripts, SVGs, and $>25\text{ MB}$ files.
  - `Percentile Rank Inclusivity`: Verified `SHORTLISTED` entries included in scorecard rank queries.
  - `Rate Limiter Middleware`: Verified burst request rejection with HTTP 429 and `Retry-After`.
  - `Deterministic Tie-Breaking`: Verified earlier `createdAt` breaks score ties.
- **Checks:** 18 / 18 passed (100%).

### Verification Summary
- **Unified Test Command (`npm test`):** **209 / 209 checks passed (100% green)**.
- **Type Checker (`npm run typecheck` / `tsc --noEmit`):** **0 errors**.
- **Working Tree:** Clean on `audit/backend-review`.

---

## 5. Remaining Risks and Recommendations Before Production

### 1. Phase 2 Model Swap Recommendations
- **Model Adapter Parity:** The `IJudgeAdapter` abstraction (`gemini.adapter.ts` and `custom-model.adapter.ts`) is fully verified. When swapping to the in-house Triton/vLLM cluster (InternVL2 / Qwen2-VL / Token-as-Score), set `JUDGE_PROVIDER="custom_model"` in `.env`.
- **Payload Compatibility:** Ensure the inference microservice accepts `{ imageBase64, mimeType, category, metadata }` and outputs the same normalized JSON schema.
- **Logits Expectation:** If using Token-as-Score expectation over score logits rather than JSON critique output, ensure the inference server synthesizes the 8 ArtiMuse dimensions before returning to `CustomModelJudgeAdapter`.

### 2. Upstream Dependency Audit Findings (`npm audit`)
- **`sharp` libvips advisory (CVE-2026-33327, CVE-2026-35590):** Inherited through `sharp@0.33.5`. A breaking upgrade to `sharp@0.35.5` is available via `npm audit fix --force`. Prior to production deployment, test `sharp@0.35.5` in a staging environment with sample photography assets to confirm WebP and EXIF compatibility.
- **`deepmerge-ts` advisory (GHSA-ggr8-5vv4-36mx):** Dependency of `@prisma/config` / `prisma`. Fixed in Prisma 6.14+. Recommend running `npm update prisma @prisma/client` when ready.

### 3. Production Infrastructure Recommendations
- **Redis High Availability:** For production workloads, deploy Redis in Sentinel or Cluster mode with persistent volume storage (AOF/RDB) to ensure queued judging jobs survive server restarts.
- **Distributed Rate Limiting:** The in-memory sliding-window rate limiter is optimal for single-instance deployments. If scaling horizontally across multiple Node.js instances behind a load balancer, migrate the rate limiter store to Redis (`rate-limiter-flexible` or Redis sliding-log).
- **CORS Allowed Origins:** In production, specify exact domain names in `FRONTEND_ORIGIN` (e.g. `https://pixelprize.org`) rather than development localhost URLs.

---

## 6. Questions & Decisions for the User

1. **Sharp Upgrade:** Would you like to proceed with upgrading `sharp` from `0.33.5` to `0.35.5` to resolve the inherited libvips advisory, or would you prefer keeping `0.33.5` until frontend testing is complete?
2. **Git Merge:** All audit fixes and tests are committed cleanly on branch `audit/backend-review`. Whenever you are ready, you can review the diff and merge it back into `main`:
   ```bash
   git checkout main
   git merge audit/backend-review
   ```
3. **Frontend Handoff:** With the backend fully audited, secured, and verified, are you ready to transition to frontend development?
