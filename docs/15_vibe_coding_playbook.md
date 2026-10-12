# 15: Vibe-Coding Playbook & Agent Execution Guide

> **Document Version:** 1.0.0  
> **Status:** Approved Baseline  
> **Target Audience:** Developers using AI Coding Assistants (Cursor, Claude Code, GitHub Copilot, Gemini CLI)  
> **Purpose:** Single source of truth for instructing AI coding agents to implement Pixel Prize milestone by milestone without manual architectural guidance.  
> **Related Documents:**  
> - [09_tech_stack.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/09_tech_stack.md)  
> - [10_database_schema.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/10_database_schema.md)  
> - [14_roadmap_and_milestones.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/14_roadmap_and_milestones.md)

---

## 1. Project System Rules (`.cursorrules` / `AGENT_RULES.md`)

Save the following markdown block directly into the project root as `.cursorrules` or `AGENT_RULES.md` to govern all AI coding interactions:

```markdown
# PIXEL PRIZE AI CODING AGENT RULES

You are an expert full-stack engineer and computer vision architect building the Pixel Prize photography competition portal.

## STRICT ARCHITECTURAL CONSTRAINTS
1. Single Source of Truth: All features, database schemas, rubrics, and flows MUST strictly conform to the specifications in `/docs`. Never invent new database fields or deviate from `/docs/10_database_schema.md`.
2. Model-Agnostic Judging: All AI aesthetic evaluation must go through `src/lib/judge/judge.interface.ts`. Never call the Gemini SDK directly inside API routes or UI components. Always use the `JudgeAdapter` interface (`/docs/07_model_abstraction_and_migration.md`).
3. Strict TypeScript: Never use `any`. Always use explicit interfaces and Zod validation schemas.
4. UI Component Library: Use Tailwind CSS v4, shadcn/ui primitives, and Lucide React icons. Adhere to the Darkroom design tokens defined in `/docs/12_ui_ux_guidelines.md` (Background: `#090A0F`, Cards: `#12141D`).
5. Asynchronous Processing: All image resizing, EXIF parsing, and AI scoring MUST run inside BullMQ background workers (`src/workers/`), never inside request/response API route loops.

## PROJECT DIRECTORY STRUCTURE
- `src/app/` : Next.js 15 App Router pages and API routes
- `src/components/` : Reusable UI components (shadcn primitives in `ui/`, domain components in `competition/`, `scorecard/`, `gallery/`)
- `src/lib/` : Utility modules
  - `lib/prisma.ts` : Prisma database client
  - `lib/redis.ts` : Upstash / Redis client
  - `lib/storage.ts` : Cloudflare R2 / S3 client
  - `lib/judge/` : `IJudgeAdapter`, `GeminiJudgeAdapter`, and factory
- `src/workers/` : BullMQ background queue workers (`media-worker.ts`, `judging-worker.ts`)
- `prisma/` : `schema.prisma`
- `docs/` : Architecture documentation (read-only reference)
```

---

## 2. Milestone Prompt Templates for AI Coding Agents

Copy and paste these exact prompts into your AI coding tool to build each milestone sequentially:

### Prompt 1: Milestone 0 & 1 (Foundation, Prisma & Auth)
```text
Act as a senior full-stack engineer. We are building Milestone 0 and Milestone 1 of the Pixel Prize platform as specified in /docs/14_roadmap_and_milestones.md.

TASKS:
1. Initialize the Prisma database connection using the exact schema provided in /docs/10_database_schema.md. Generate the Prisma client.
2. Set up NextAuth (Auth.js v5) supporting Credentials and Google OAuth with role-based session tokens (PARTICIPANT, ORGANIZER, JUROR, ADMIN).
3. Implement user profile management and RBAC route middleware protecting /organizer/* and /juror/* routes.
4. Implement standard darkroom theme tokens in tailwind.config.ts following /docs/12_ui_ux_guidelines.md.

Ensure zero TypeScript errors and full type safety.
```

---

### Prompt 2: Milestone 2 (Competition Management Engine)
```text
Act as a senior full-stack engineer. Implement Milestone 2 (Competition Management Engine) based on /docs/04_competition_system.md and /docs/11_api_specification.md.

TASKS:
1. Build the Organizer Competition Creation Wizard (/organizer/competitions/new) allowing multi-step input of title, description, categories, deadlines, and prize purse.
2. Build the category rubric configuration UI with interactive sliders for the 8 ArtiMuse aesthetic dimensions, enforcing that the weights sum to exactly 1.0 (100%).
3. Implement the competition lifecycle state machine (DRAFT -> OPEN -> JUDGING -> SHORTLISTED -> RESULTS_PUBLISHED) in src/lib/competition-lifecycle.ts.
4. Create the public competition explore page (/competitions) and detail page (/competitions/[id]) with live countdown timers and rule cards as designed in /docs/12_ui_ux_guidelines.md.
```

---

### Prompt 3: Milestone 3 & 4 (Storage, Ingestion & Forensics Pipeline)
```text
Act as a senior backend engineer. Implement Milestone 3 and Milestone 4 (Storage, Ingestion & Forensics Pipeline) based on /docs/08_system_architecture.md, /docs/04_competition_system.md, and /docs/11_api_specification.md.

TASKS:
1. Implement the presigned URL upload endpoint (POST /api/submissions/presigned-url) with user quota validation against maxEntriesPerUser.
2. Implement the client-side submission dropzone (/competitions/[id]/submit) with local EXIF extraction via exifr and confirmation POST /api/submissions.
3. Build the BullMQ media ingestion worker (src/workers/media-worker.ts) using sharp:
   - Extract and persist complete EXIF metadata.
   - Compute 64-bit dHash and reject duplicates (Hamming distance <= 4).
   - Generate image derivatives: WEB_DISPLAY (1600px), THUMBNAIL (400px), and AI_NORMAL (1024px) WebP/JPEG files and upload to Cloudflare R2.
4. Implement basic synthetic AI detection heuristics: flag software tags from generative tools (Midjourney, ComfyUI) and update status to FLAGGED_DISQUALIFIED if violated.
```

---

### Prompt 4: Milestone 5 (AI Judging Engine & Gemini Adapter)
```text
Act as a senior AI systems engineer. Implement Milestone 5 (AI Judging Engine) based on /docs/05_ai_judging_system.md, /docs/06_prompt_library.md, and /docs/07_model_abstraction_and_migration.md.

TASKS:
1. Create the model-agnostic judging interface in src/lib/judge/judge.interface.ts.
2. Implement GeminiJudgeAdapter in src/lib/judge/gemini.adapter.ts using @google/genai, structured JSON output schemas, and the production prompts from /docs/06_prompt_library.md.
3. Build the BullMQ judging worker (src/workers/judging-worker.ts):
   - Dequeue submissions in IN_QUEUE state.
   - Fetch the 1024px AI_NORMAL image derivative.
   - Call JudgeAdapter.evaluate().
   - Compute Total Normalized Aesthetic Score S_total using the formula in /docs/05_ai_judging_system.md.
   - Save the AestheticScore record and update submission status to SCORED.
   - Invalidate the Redis leaderboard cache.
```

---

### Prompt 5: Milestone 6 & 7 (Leaderboards, Galleries & Juror Lightbox)
```text
Act as a senior frontend engineer. Implement Milestone 6 and Milestone 7 based on /docs/03_user_flows_and_pages.md and /docs/12_ui_ux_guidelines.md.

TASKS:
1. Build the dynamic public masonry gallery (/competitions/[id]/gallery) with progressive WebP loading, aspect ratio preservation, and hover EXIF pills.
2. Build the Dual-Track Leaderboard (/competitions/[id]/leaderboard) with tabs for "AI Aesthetic Standings" and "Community People's Choice". Respect the blind gallery rule (hide scores while status is OPEN).
3. Build the full-screen Juror Lightbox (/juror/competitions/[id]):
   - Display the Top 10 shortlisted finalists.
   - Provide 1:1 zoom loupe, EXIF inspector, and side-by-side AI score breakdowns.
   - Implement drag-and-drop podium selection (1st, 2nd, 3rd Place) with juror qualitative remarks.
   - Implement POST /api/juror/competitions/[id]/verdict.
```

---

### Prompt 6: Milestone 8 (Scorecard & Appeals Portal)
```text
Act as a senior full-stack engineer. Implement Milestone 8 based on /docs/03_user_flows_and_pages.md, /docs/05_ai_judging_system.md, and /docs/12_ui_ux_guidelines.md.

TASKS:
1. Build the AI Diagnostic Scorecard page (/submissions/[id]/scorecard):
   - Render an interactive 8-axis radar chart mapping the ArtiMuse attributes.
   - Display overall score ring and percentile rank badge.
   - Render the 3-part constructive critique card (Strengths, Technical, Recommendations).
2. Build the Disqualification Appeals workflow (/dashboard/appeals):
   - Allow disqualified participants to view forensic reason and submit RAW proof.
   - Provide organizer review modal to approve/deny appeals and trigger re-scoring.
```

---

## 3. Testing & Verification Checklist

Before considering any milestone complete, execute these verification commands in the terminal:

```bash
# 1. Typecheck & Linter (Must pass with 0 errors)
npm run lint
npx tsc --noEmit

# 2. Database Sync & Generation
npx prisma generate
npx prisma db push

# 3. Build Verification (Verifies Next.js SSG/SSR compilation)
npm run build

# 4. Background Worker Health Check
# In terminal 1:
npm run dev
# In terminal 2:
npm run worker
```
