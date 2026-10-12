# Pixel Prize: Universal AI Agent Memory & Collaboration Guide

> **Target Audience:** Any AI coding assistant (Cursor, Claude Code, GitHub Copilot, Gemini CLI, Antigravity, Windsurf) working on this repository on any collaborator's machine.  
> **Repository Context:** Pixel Prize — Image Aesthetics Assessment (IAA) Portal ("Devfolio for photography competitions, judged by AI").  
> **Branching & Collaboration:** Two developers vibe-coding concurrently across GitHub.

---

## 1. Golden Rules of Collaborative Vibe-Coding

When working in this repository, you **MUST** follow these rules to avoid breaking your teammate's code:

```
+─────────────────────────────────────────────────────────────────────────────+
|                         STRICT WORKSPACE BOUNDARIES                         |
+─────────────────────────────────────────────────────────────────────────────+
|   FRONTEND TEAM / AI               |   BACKEND TEAM / AI                    |
|   Directory: `frontend/`           |   Directory: `backend/`                |
|   Scope: UI, Components, Pages,    |   Scope: APIs, Services, Database,     |
|          Tailwind CSS, Client Hooks|          Queues, AI Judging Workers    |
+────────────────────────────────────┴────────────────────────────────────────+
|   SHARED SINGLE SOURCE OF TRUTH (READ-ONLY CONTRACTS): `docs/`              |
|   - Database Schema: `docs/10_database_schema.md`                           |
|   - API Specifications: `docs/11_api_specification.md`                      |
|   - AI Judging Rubrics: `docs/05_ai_judging_system.md`                      |
|   - Vibe-Coding Playbook: `docs/15_vibe_coding_playbook.md`                 |
+─────────────────────────────────────────────────────────────────────────────+
```

1. **Never Violate Directory Boundaries:**
   - If your prompt is about frontend, touch **ONLY** files inside [`frontend/`](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/frontend).
   - If your prompt is about backend, touch **ONLY** files inside [`backend/`](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/backend).
   - Never write backend files inside `frontend/` or vice versa.
2. **Never Drift From Approved Contracts:**
   - Database models must match [`docs/10_database_schema.md`](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/10_database_schema.md) exactly. Do not invent unapproved column names.
   - API endpoints must match [`docs/11_api_specification.md`](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/11_api_specification.md) exactly.
3. **Environment Secrets:**
   - `.env` files are git-ignored. When cloning or pulling, copy `.env.example` to `.env` in the root, `frontend/`, and `backend/`.

---

## 2. Quick Project Architecture Cheat Sheet

### What is Pixel Prize?
A platform where digital photography contests are hosted and judged using computer vision and multimodal AI:
- **Phase 1 (Active Now):** Preliminary judging runs via hosted multimodal LLM (Google Gemini 2.5 Flash) returning structured JSON scorecards conforming to an 8-attribute rubric (*ArtiMuse / TAD66K*).
- **Phase 2 (Future Swap):** Swapped with an in-house trained deep aesthetic model (*Token-as-Score* expectation over logits).
- **The Adapter Pattern:** All AI scoring is mediated by the `IJudgeAdapter` interface ([`docs/07_model_abstraction_and_migration.md`](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/07_model_abstraction_and_migration.md)). Never call Gemini directly from UI components or API route handlers!
- **Hybrid Juror Workflow:** AI evaluates bulk submissions and generates an automated **Top 10 Shortlist** per category. Verified human jurors select the final podium places (1st, 2nd, 3rd) in a full-screen lightbox.

---

## 3. UI/UX Design System & Stitch Prototypes

All design decisions and visual tokens are established:
- **Design Mockups & Code:** Located in [`frontend/stitch_screens/`](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/frontend/stitch_screens).
  - Inspect [`07_pixel_prize_desktop.html`](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/frontend/stitch_screens/07_pixel_prize_desktop.html) for complete desktop layout, Tailwind classes, and typography.
  - Inspect [`08_pixel_prize_mobile.html`](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/frontend/stitch_screens/08_pixel_prize_mobile.html) for mobile drawer layout.
  - Photographic test assets: `03_portrait_artisan.png`, `04_milky_way_astro.png`, `05_snow_leopard_wildlife.png`, `06_dew_spider_web_macro.png`.
- **Design Tokens:**
  - Background: `#090A0F` / `#131413` (Darkroom obsidian)
  - Cards: `#12141D` / `#1F201F`
  - High-visibility Accent: `#aff755` (Electric lime telemetry ticker) / `#6366F1` (AI Indigo)
  - Typography: `Space Grotesk` (headlines), `JetBrains Mono` (body/EXIF), `Pixelify Sans` (branding wordmark).

---

## 4. Key Workflows & Engineering Conventions

### Ingestion & Asynchronous Judging
- **Direct-to-Cloud Uploads:** Photos are uploaded directly from the browser to Cloudflare R2 / S3 via presigned URLs (`/api/submissions/presigned-url`). The server never buffers raw $25\text{ MB}$ files in memory.
- **Asynchronous Workers:** All image resizing (`sharp`), EXIF extraction (`exifr`), duplicate detection ($dHash$), and AI judging execute inside background BullMQ workers, not inside API response handlers.
- **Privacy & Safety:** Strips GPS coordinates from public WebP derivatives. Strips photographer usernames from judging prompts (blind evaluation).

---

## 5. Development Setup for Collaborator's Machine

When pulling this repo onto a new computer:

```bash
# 1. Root & Environment Configuration
cp .env.example .env

# 2. Frontend Setup (Terminal 1)
cd frontend
cp .env.example .env.local
npm install
npm run dev # Runs on http://localhost:3000

# 3. Backend Setup (Terminal 2)
cd backend
cp .env.example .env
npm install
npx prisma generate
npm run dev # Runs API on http://localhost:3001
# Worker runs via:
npm run worker
```

---

## 6. Milestone Execution Roadmap
Consult [`docs/14_roadmap_and_milestones.md`](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/14_roadmap_and_milestones.md) and [`docs/15_vibe_coding_playbook.md`](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/15_vibe_coding_playbook.md) for milestone prompts and definitions of done.
