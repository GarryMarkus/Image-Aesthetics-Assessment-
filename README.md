# 🏆 PIXEL PRIZE // Image Aesthetics Assessment (IAA) Portal

> **"Devfolio, but for photography competitions—judged by multimodal computer vision and human jurors."**

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js&style=flat-square)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript&style=flat-square)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss&style=flat-square)](https://tailwindcss.com/)
[![Express.js](https://img.shields.io/badge/Express-4.21-lightgrey?logo=express&style=flat-square)](https://expressjs.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.4-2D3748?logo=prisma&style=flat-square)](https://www.prisma.io/)
[![Neon Database](https://img.shields.io/badge/Neon-PostgreSQL-00e599?logo=postgresql&style=flat-square)](https://neon.tech/)
[![Google Gemini](https://img.shields.io/badge/AI_Judge-Gemini_Multimodal-8E75B2?logo=google-gemini&style=flat-square)](https://ai.google.dev/)
[![BullMQ](https://img.shields.io/badge/Workers-BullMQ-orange?logo=redis&style=flat-square)](https://bullmq.io/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## 📸 Executive Overview

**Pixel Prize** is a digital photography competition platform that combines computational aesthetic assessment with verified human jury curation. 

Photographers submit authentic optical captures into themed salons (*Street, Landscape, Portrait, Astrophotography, Macro, Wildlife*). Submissions are processed through an asynchronous ingestion pipeline featuring anti-fraud sensor forensics, evaluated against the **8-attribute *ArtiMuse / TAD66K*** photographic rubric via an interchangeable AI judging interface (`IJudgeAdapter`), and shortlisted for human juror podium allocations.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph ClientLayer["Frontend Client (Next.js 15)"]
        UI["Darkroom Obsidian HUD (#090A0F)"]
        Lab["AI Lab Sandbox (/sandbox)"]
        JuryBox["Juror Lightbox (/juror)"]
        Radar["8-Axis SVG Radar Visualizer"]
    end

    subgraph EdgeStorage["Storage Layer"]
        Presigned["Direct-to-Cloud S3 / R2 / Local"]
        RawStore[("Raw 25MB Master Originals")]
        DerivStore[("Derivatives (1600px WebP / 400px WebP / 1024px AI)")]
    end

    subgraph BackendAPI["Backend Core (Express + TypeScript)"]
        Router["REST API Gateway (:3001)"]
        AuthSvc["JWT Auth & Role Guard (RBAC)"]
        JudgeCtrl["Sandbox & Ingestion Controller"]
        PrismaClient["Prisma ORM Client"]
    end

    subgraph DataStore["Persistence & Queuing"]
        NeonDB[("Neon Cloud PostgreSQL")]
        RedisQueue[("Redis + BullMQ Queue")]
    end

    subgraph WorkerLayer["Asynchronous Worker Pipeline"]
        Worker["BullMQ Background Ingestion Worker"]
        SharpProc["Sharp Optimization & EXIF Stripping"]
        Forensics["Multi-Tier Forensics & PRNU Lattice Screener"]
    end

    subgraph AIService["AI Judging Subsystem (IJudgeAdapter)"]
        Orchestrator["JudgeOrchestrator (TAD66K Synthesis)"]
        Adapter{"IJudgeAdapter Interface"}
        GeminiFlash["Gemini Multimodal Vision Model"]
        CustomML["Phase 2 Custom Deep Model (TAD66K / Logits)"]
        MockCalib["Calibrated Resilient Fallback"]
    end

    %% Interactions
    UI -->|1. Request Presigned URL| Router
    Router -->|2. Issue Upload Ticket| Presigned
    UI -->|3. Direct Binary PUT| Presigned
    Presigned --> RawStore
    UI -->|4. Confirm Submission Metadata| Router
    Router --> PrismaClient
    PrismaClient --> NeonDB
    Router -->|5. Enqueue Ingestion Job| RedisQueue
    RedisQueue --> Worker
    Worker --> SharpProc
    SharpProc --> DerivStore
    Worker --> Forensics
    Forensics --> Orchestrator
    Orchestrator --> Adapter
    Adapter -->|Primary| GeminiFlash
    Adapter -->|Phase 2 Cutover| CustomML
    Adapter -->|Failover Guard| MockCalib
    Orchestrator -->|6. Persist Aesthetic Scorecard| PrismaClient
    Lab -->|Direct Sandbox Batch Payload| JudgeCtrl
    JudgeCtrl --> Orchestrator
    JuryBox -->|Fetch Top 10 Shortlist| Router
```

---

## 🔄 End-to-End Submission & Judging Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Photographer as 📷 Photographer
    participant Browser as 💻 Next.js Client
    participant API as ⚡ Express Backend
    participant Storage as 🗄️ Cloud Storage (S3/R2)
    participant Worker as ⚙️ BullMQ Worker
    participant AI as 🧠 AI Judge (IJudgeAdapter)
    participant Juror as 🎖️ Human Juror

    Photographer->>Browser: Selects photo (Up to 25 MB)
    Browser->>API: POST /api/submissions/presigned-url
    API-->>Browser: Presigned upload URL + storageKey
    Browser->>Storage: Direct binary PUT (bypasses server memory)
    Browser->>API: POST /api/submissions (Confirm upload)
    API->>Worker: Enqueue background ingestion job
    API-->>Browser: HTTP 202 Accepted { status: "IN_QUEUE" }

    activate Worker
    Worker->>Storage: Download raw master asset
    Worker->>Worker: Generate 400px thumb, 1600px display, 1024px AI normalized
    Worker->>Worker: Extract camera EXIF & strip private GPS metadata
    Worker->>Worker: Multi-tier Forensics (FFT lattice, dHash, PRNU noise)
    Worker->>AI: Evaluate against 8-attribute rubric (blind photographer masking)
    AI-->>Worker: Structured Scorecard (Sub-scores, penalties, critique)
    Worker->>API: Persist AestheticScore record to PostgreSQL
    deactivate Worker

    Note over API,Juror: Competition shifts to SHORTLISTED status
    API->>Juror: Serves Top 10 automated category shortlist
    Juror->>Browser: Evaluates entries in full-screen zoom loupe
    Juror->>API: POST /api/juror/verdicts (1st, 2nd, 3rd podium allocation)
    API-->>Photographer: Results published to public leaderboard
```

---

## ⚖️ Competition State Machine & Hybrid Judging

Competitions advance through a strict, deterministic 6-phase state machine:

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Organizer creates contest
    DRAFT --> OPEN : Organizer launches salon
    
    state OPEN {
        [*] --> IngestionActive
        IngestionActive --> PresignedUploads
        PresignedUploads --> BlindScoring
    }

    OPEN --> JUDGING : Submission deadline reached
    
    state JUDGING {
        [*] --> PipelineLock
        PipelineLock --> DrainAIQueue
        DrainAIQueue --> CalibratePercentiles
    }

    JUDGING --> SHORTLISTED : Top 10 Shortlist generated per category
    
    state SHORTLISTED {
        [*] --> JurorLightboxReview
        JurorLightboxReview --> AssignPodiums : Verified Jurors allocate 1st, 2nd, 3rd
        AssignPodiums --> OrganizerConfirmation
    }

    SHORTLISTED --> RESULTS_PUBLISHED : Organizer approves verdicts
    RESULTS_PUBLISHED --> ARCHIVED : Competition archived
    ARCHIVED --> [*]
```

---

## 📐 The 8-Attribute *ArtiMuse* Aesthetic Rubric

Every photograph is analyzed across 8 distinct aesthetic dimensions derived from CVPR computer vision research (*ArtiMuse / TAD66K*):

```mermaid
graph LR
    subgraph Dimensions["8 Granular Dimensions (0 - 100)"]
        D1["Composition & Balance (w1)"]
        D2["Lighting & Exposure (w2)"]
        D3["Color Harmony & Palette (w3)"]
        D4["Technical Execution (w4)"]
        D5["Subject & Storytelling (w5)"]
        D6["Originality & Vision (w6)"]
        D7["Mood & Atmosphere (w7)"]
        D8["Style & Post-Processing (w8)"]
    end

    subgraph MathematicalSynthesis["Mathematical Synthesis"]
        Formula["S_base = Σ (w_i × Score_i)"]
        Theme["Theme Adherence Gate (TANet)"]
        Defects["Defect Deductions (-0 to -30 pts)"]
        FinalScore["Final Score S_total ∈ [0, 100]"]
    end

    D1 --> Formula
    D2 --> Formula
    D3 --> Formula
    D4 --> Formula
    D5 --> Formula
    D6 --> Formula
    D7 --> Formula
    D8 --> Formula

    Formula --> FinalScore
    Theme --> FinalScore
    Defects --> FinalScore
```

### Rubric Weight Distribution per Genre

| Category Code | Category Name | Primary Heavily Weighted Dimensions | Key Focal Area |
| :--- | :--- | :--- | :--- |
| **`STREET`** | Street & Candid | Storytelling (30%), Originality (20%), Mood (15%) | Decisive moments, human condition |
| **`LANDSCAPE`** | Landscape & Nature | Composition (25%), Lighting (20%), Color (20%) | Tonal range, visual balance |
| **`PORTRAIT`** | Portrait & People | Lighting (20%), Technical (20%), Story (20%) | Facial character, chiaroscuro |
| **`MACRO`** | Macro & Micro | Technical Execution (35%), Composition (15%) | Focal plane sharpness, micro-contrast |
| **`ARCHITECTURE`** | Architecture | Composition (30%), Technical (20%), Lighting (15%) | Converging lines, geometric symmetry |
| **`MONOCHROME`** | Fine-Art Monochrome | Lighting (30%), Composition (20%), Technical (15%) | Ansel Adams Zone System tonality |
| **`WILDLIFE`** | Wildlife & Fauna | Technical (25%), Story (20%), Composition (20%) | Animal behavior, environmental habitat |
| **`NIGHT`** | Night & Astrophotography | Technical (25%), Lighting (25%), Composition (20%) | Sensor noise floor, star point focus |
| **`GENERAL`** | Creative Open | Balanced 8-attribute weights | Holistic visual harmony |

---

## ⚡ The AI Lab Scoring Sandbox (`/sandbox`)

The **AI Lab** is an interactive testing playground where anyone can evaluate photographs against the platform's judging engine without entering an active competition:

- **Batch Shootout:** Upload 1 to 8 photos at once or click **`[LOAD 4 CURATED SAMPLE PHOTOS]`** with 1 click.
- **Genre Multi-Selector:** Assign individual competition categories per photograph to adjust rubric weights.
- **Comparative Podium:** Sorts entries automatically into **#1 Grand Winner**, **#2 Runner-Up**, **#3 Third Place**, and Finalists.
- **Deep-Dive Telemetry Inspector:** Displays interactive 8-axis SVG radar polygons, sensor forensics status, detected compositional rules (*Rule of Thirds, Golden Spiral, Leading Lines*), and a 3-part constructive critique (*Strengths, Technical Analysis, Recommendations*).

---

## 🗄️ Database Entity Relationship Model

```mermaid
erDiagram
    USER ||--o{ SUBMISSION : creates
    USER ||--o{ COMPETITION : organizes
    USER ||--o{ JUROR_VERDICT : adjudicates
    USER ||--o{ COMMUNITY_VOTE : casts
    USER ||--o{ APPEAL : files

    COMPETITION ||--|{ COMPETITION_CATEGORY : contains
    COMPETITION ||--o{ SUBMISSION : receives
    COMPETITION_CATEGORY ||--o{ SUBMISSION : categorizes

    SUBMISSION ||--|| IMAGE_RESOURCE : has_image
    SUBMISSION ||--o| EXIF_METADATA : has_exif
    SUBMISSION ||--o| AESTHETIC_SCORE : evaluated_by
    SUBMISSION ||--o{ JUROR_VERDICT : awarded
    SUBMISSION ||--o{ COMMUNITY_VOTE : voted_by
    SUBMISSION ||--o{ APPEAL : appealed_by

    USER {
        string id PK
        string email UK
        string username UK
        string role "PARTICIPANT | ORGANIZER | JUROR | ADMIN"
        string passwordHash
    }

    COMPETITION {
        string id PK
        string slug UK
        string title
        string status "DRAFT | OPEN | JUDGING | SHORTLISTED | RESULTS_PUBLISHED | ARCHIVED"
        datetime submissionEndDate
        datetime resultsPublishDate
        float totalPrizePoolUsd
    }

    SUBMISSION {
        string id PK
        string competitionId FK
        string categoryId FK
        string userId FK
        string status "IN_QUEUE | SCORED | SHORTLISTED | FLAGGED_DISQUALIFIED | WITHDRAWN"
        float totalScore
        int communityVotesCount
        string dHash
    }

    AESTHETIC_SCORE {
        string id PK
        string submissionId FK
        float totalScore
        float scoreComposition
        float scoreLighting
        float scoreColor
        float scoreTechnical
        float scoreStory
        float scoreOriginality
        float scoreMood
        float scoreStyle
        float scoreThemeAdherence
        float penaltyDefects
        string critiqueStrengths
        string critiqueWeaknesses
        string critiqueActionable
    }
```

---

## 💻 Tech Stack Summary

| Domain | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 15.5** (App Router) | React Server Components, client performance, dynamic routing |
| **Styling & HUD** | **Tailwind CSS 3.4** | Darkroom obsidian visual tokens (`#090A0F`), scanline shaders |
| **Typography** | Space Grotesk, JetBrains Mono, Pixelify Sans | Editorial headlines, technical telemetry data, brand wordmark |
| **Backend API** | **Express.js 4.21** + TypeScript 5.8 | Lightweight, RFC 7807 problem details, low latency |
| **Database & ORM** | **Neon PostgreSQL** + **Prisma 6.4** | Serverless connection pooling, type-safe query generation |
| **Media Processing** | **Sharp 0.33** + **exifr 7.1** | Fast native image resizing, WebP encoding, EXIF extraction |
| **Background Queues** | **BullMQ 5.4** + **Redis** | Asynchronous job scheduling, rate-limited judging worker pools |
| **AI Judging Models** | **Google Gemini Multimodal** | Production multimodal vision evaluation via `IJudgeAdapter` |
| **Anti-Fraud Forensics** | Discrete Laplacian FFT + $dHash$ | Generative AI lattice detection, duplicate burst prevention |

---

## 🚀 Quickstart Guide

### Prerequisites
- **Node.js** v20.x or higher
- **npm** v10.x or higher
- Free serverless PostgreSQL database ([Neon.tech](https://neon.tech))
- Google Gemini API key ([Google AI Studio](https://aistudio.google.com/))

### 1. Clone & Configure Environment

```bash
git clone https://github.com/your-username/pixel-prize.git
cd pixel-prize

# Configure backend environment
cp backend/.env.example backend/.env

# Configure frontend environment
cp frontend/.env.example frontend/.env.local
```

### 2. Configure Backend Secrets (`backend/.env`)

```ini
PORT=3001
NODE_ENV="development"
FRONTEND_ORIGIN="http://localhost:3000"

# Neon PostgreSQL connection string
DATABASE_URL="postgresql://user:password@ep-rapid-dawn.aws.neon.tech/neondb?sslmode=require"

# JWT Auth Secret
AUTH_SECRET="your_strong_random_secret_at_least_32_characters"

# Media Storage
STORAGE_PROVIDER="local"

# AI Judging
JUDGE_PROVIDER="gemini"
GEMINI_MODEL_NAME="gemini-3.5-flash"
GEMINI_API_KEY="your_gemini_api_key_here"
```

### 3. Install Dependencies & Generate Database Schema

```bash
# Terminal 1: Backend Setup
cd backend
npm install
npx prisma generate
npx prisma db push
npm run db:seed     # Seeds sample competition salons
npm run dev         # Runs API on http://localhost:3001
```

```bash
# Terminal 2: Frontend Setup
cd frontend
npm install
npm run dev         # Runs UI on http://localhost:3000
```

### 4. Verify Local Health & Tests

```bash
# Run backend test suite (209 automated checks)
cd backend
npm test

# Run fullstack integration contracts (9 end-to-end contracts)
npx tsx tests/verify-integration-contracts.ts

# Run frontend build & type check
cd ../frontend
npm run lint
npm run build
```

---

## 🔒 Security, Privacy & Copyright

- **100% Photographer Copyright Retention:** Entrants retain full intellectual property rights to submitted photographs.
- **Zero Raw Buffering in Memory:** Direct-to-storage presigned URLs stream 25 MB files directly to Cloudflare R2 / S3 without touching API process memory.
- **Privacy First (GPS Stripping):** Location coordinates are automatically stripped from client previews and public WebP derivatives.
- **Blind Evaluation:** Photographer identities and user metadata are isolated and masked from AI scoring prompts and human juror previews.
- **Strict Rate Limiting & Anti-Abuse:** Sliding window rate limiters protect public endpoints, while Hamming-distance duplicate detection blocks rapid identical submissions.

---

## 📚 Architectural Specification Docs

Complete master specifications are maintained in the [`docs/`](docs/) directory:

- [docs/01_project_overview.md](docs/01_project_overview.md) — Vision, Problem Statement & Scope
- [docs/02_product_requirements.md](docs/02_product_requirements.md) — Product Requirements & User Stories
- [docs/04_competition_system.md](docs/04_competition_system.md) — Competition Lifecycle State Machine
- [docs/05_ai_judging_system.md](docs/05_ai_judging_system.md) — Rubrics, Formulas & Defect Deductions
- [docs/07_model_abstraction_and_migration.md](docs/07_model_abstraction_and_migration.md) — `IJudgeAdapter` Pattern
- [docs/08_system_architecture.md](docs/08_system_architecture.md) — Ingestion Pipeline & Architecture
- [docs/10_database_schema.md](docs/10_database_schema.md) — Complete Schema & Data Dictionary
- [docs/11_api_specification.md](docs/11_api_specification.md) — REST API Endpoints & Request/Response Contracts

---

## 📄 License

This repository is distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.
