# 14: Phased Roadmap & Implementation Milestones

> **Document Version:** 1.0.0  
> **Status:** Approved Baseline  
> **Target Audience:** Engineering Leads, Full-Stack Developers, AI Coding Agents  
> **Methodology:** Incremental, testable milestones designed for sequential "vibe coding"  
> **Related Documents:**  
> - [01_project_overview.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/01_project_overview.md)  
> - [08_system_architecture.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/08_system_architecture.md)  
> - [09_tech_stack.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/09_tech_stack.md)  
> - [15_vibe_coding_playbook.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/15_vibe_coding_playbook.md)

---

## 1. Overview of Roadmap Phases

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: CORE MVP PLATFORM (WEEKS 1 - 4)                                     │
│ Hosted Multimodal LLM (Gemini 2.5 Flash), Next.js 15, Prisma, BullMQ, R2    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1.5: COMMUNITY ENGAGEMENT & POLISH (WEEKS 5 - 6)                      │
│ Dual-Track Leaderboards, Juror Lightbox, Appeals, High-Volume Stress Test   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: IN-HOUSE MODEL MIGRATION (WEEKS 7 - 10)                            │
│ ArtiMuse/TAD66K Fine-Tuning, Triton GPU Inference, Token-as-Score Adapter   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Granular Milestones & "Definition of Done"

### Milestone 0: Environment & Scaffold Foundation
* **Goal:** Initialize repository, build pipeline, Prisma database connection, and design tokens.
* **Deliverables:**
  - Next.js 15 project initialized with TypeScript strict mode and Tailwind CSS.
  - shadcn/ui components installed (`Button`, `Card`, `Dialog`, `Progress`, `Tabs`, `Table`).
  - PostgreSQL database provisioned (Neon/Supabase) and `schema.prisma` deployed via `prisma db push`.
  - Redis instance linked (Upstash / local Docker).
* **Definition of Done:**
  - [ ] `npm run dev` starts with clean console and zero TypeScript linter warnings.
  - [ ] Prisma studio (`npx prisma studio`) successfully connects and displays all models.

---

### Milestone 1: Authentication & User Profiles
* **Goal:** Implement secure user onboarding with RBAC roles (`PARTICIPANT`, `ORGANIZER`, `JUROR`, `ADMIN`).
* **Deliverables:**
  - NextAuth (Auth.js v5) configured with Google OAuth and Email Magic Link / Credentials.
  - User profile page (`/settings`) displaying avatar, bio, gear list, and competition history.
* **Definition of Done:**
  - [ ] User can register, log in, and persist session across reloads.
  - [ ] Role-based route guards block unauthenticated or non-organizer users from `/organizer/*`.

---

### Milestone 2: Competition Management Engine
* **Goal:** Enable organizers to create, configure, and publish competitions with strict lifecycles.
* **Deliverables:**
  - Multi-step Competition Wizard (`/organizer/competitions/new`).
  - Category selector with customizable 8-attribute rubric weights summing to $1.0$.
  - Public competition explore page (`/competitions`) and detail page (`/competitions/[id]`).
* **Definition of Done:**
  - [ ] Organizer can create a contest in `DRAFT` state and publish to `OPEN`.
  - [ ] Client validation prevents publishing if rubric weights do not equal $100\%$.

---

### Milestone 3: Storage, Ingestion & EXIF Extraction Pipeline
* **Goal:** Direct-to-cloud secure image upload and asynchronous metadata extraction.
* **Deliverables:**
  - S3/Cloudflare R2 presigned URL generator endpoint (`/api/submissions/presigned-url`).
  - Drag-and-drop submission modal (`/competitions/[id]/submit`) with client-side EXIF preview.
  - Background worker processing upload: extracts EXIF via `exifr`, generates WebP derivatives via `sharp`, computes 64-bit `dHash`.
* **Definition of Done:**
  - [ ] $15\text{ MB}$ JPEG uploads directly to R2 in $<3\text{ seconds}$.
  - [ ] Database record populated with parsed camera make, model, lens, aperture, shutter speed, and ISO.
  - [ ] Duplicate upload from same user rejected if $dHash$ distance $\le 4$.

---

### Milestone 4: Forensic Screening & Synthetic AI Detection
* **Goal:** Automated screening to identify generative synthetic fakes and policy violations.
* **Deliverables:**
  - Fast Fourier Transform (FFT) frequency-domain lattice checker in worker.
  - EXIF software tag blacklist detector (flagging Midjourney, ComfyUI, etc.).
  - Automated status transition to `FLAGGED_DISQUALIFIED` upon forensic violation.
* **Definition of Done:**
  - [ ] Known AI-generated image (Midjourney) correctly flagged and quarantined.
  - [ ] Clean optical camera file passes without false-positive flags.

---

### Milestone 5: Phase 1 AI Judging Engine (`GeminiJudgeAdapter`)
* **Goal:** Fully functional multimodal AI aesthetic evaluation returning structured JSON scorecards.
* **Deliverables:**
  - `IJudgeAdapter` abstraction and concrete `GeminiJudgeAdapter` implementation.
  - BullMQ judging worker dispatching jobs to Gemini 2.5 Flash with structured schema.
  - `AestheticScore` database entity persistence and score formula calculation ($S_{total}$).
* **Definition of Done:**
  - [ ] Submitted photo automatically picked up by queue and scored in $<25\text{ seconds}$.
  - [ ] Complete 8-attribute breakdown, theme score, defect deductions, and 3-part critique saved to database.

---

### Milestone 6: Public Galleries & Dynamic Leaderboards
* **Goal:** High-performance public photo browsing and dual-track standings.
* **Deliverables:**
  - Infinite-scroll responsive masonry gallery (`/competitions/[id]/gallery`).
  - Dual-track leaderboard (`/competitions/[id]/leaderboard`): AI Juror Track vs. Community Upvotes.
  - Blind gallery state enforcement (scores hidden during `OPEN` phase).
* **Definition of Done:**
  - [ ] Gallery loads smoothly with WebP derivatives and EXIF overlay badges on hover.
  - [ ] Results unlock seamlessly upon competition status transitioning to `RESULTS_PUBLISHED`.

---

### Milestone 7: Juror Review Lightbox & Podium Selection
* **Goal:** Dedicated interface for human jurors to review the AI Top 10 shortlist and assign podiums.
* **Deliverables:**
  - Shortlist generator querying top 10 non-disqualified submissions per category.
  - Full-screen Juror Lightbox (`/juror/competitions/[id]`) with zoom loupe and side-by-side AI notes.
  - Podium allocation interface (1st, 2nd, 3rd Place) with juror qualitative remarks.
* **Definition of Done:**
  - [ ] Juror can inspect Top 10 photos, drag-and-drop into podium slots, and submit verdict.
  - [ ] Organizer confirms verdict and triggers one-click winner publication.

---

### Milestone 8: Participant Scorecard & Dispute/Appeals Workflow
* **Goal:** Empower participants with constructive diagnostic feedback and fair dispute avenues.
* **Deliverables:**
  - Diagnostic Scorecard page (`/submissions/[id]/scorecard`) featuring radar chart and critique card.
  - Disqualification appeal form (`/dashboard/appeals`) with RAW file upload.
* **Definition of Done:**
  - [ ] Participant views interactive 8-axis radar chart and percentile ranking.
  - [ ] Disqualified entrant can submit RAW proof; organizer can approve and trigger re-score.

---

### Milestone 9: Phase 2 In-House Model Migration
* **Goal:** Train and deploy private aesthetic vision model, replacing Gemini with zero downtime.
* **Deliverables:**
  - Model training on AVA, TAD66K, and ArtiMuse-10K using Token-as-Score formulation.
  - FastAPI inference container deployed with Triton / vLLM.
  - `CustomModelJudgeAdapter` configured and tested via shadow canary mode.
* **Definition of Done:**
  - [ ] Custom model achieves validation $\text{SRCC} \ge 0.76$.
  - [ ] Setting `JUDGE_PROVIDER="custom_model"` switches production inference with zero code alterations.
