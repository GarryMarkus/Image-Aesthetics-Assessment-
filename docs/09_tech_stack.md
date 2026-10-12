# 09: Technology Stack Recommendations

> **Document Version:** 1.0.0  
> **Status:** Approved Baseline  
> **Target Audience:** Full-Stack Engineers, AI Coding Agents, System Architects  
> **Primary Optimization Goal:** Rapid vibe-coding velocity, strict end-to-end type safety, near-zero operational overhead, and minimal hosting cost.  
> **Related Documents:**  
> - [01_project_overview.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/01_project_overview.md)  
> - [08_system_architecture.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/08_system_architecture.md)  
> - [10_database_schema.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/10_database_schema.md)  
> - [15_vibe_coding_playbook.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/15_vibe_coding_playbook.md)

---

## 1. Stack Evaluation Criteria

To enable effortless "vibe coding" with AI tools (Cursor, Claude Code, GitHub Copilot, Gemini CLI) while ensuring the application scales to thousands of concurrent users:
1. **Single Language Across the Stack (TypeScript):** Sharing models, schemas, and types between database, API, and frontend components prevents context switching and hallucinated type mismatches.
2. **AI-Coding Affinity:** Frameworks with massive public training data, standardized patterns, and copy-paste component libraries (e.g., shadcn/ui, Prisma, Next.js App Router).
3. **Low / Zero Cost at Idle:** Free-tier or low-cost serverless backends (Supabase, Neon, Cloudflare R2, Upstash Redis) that incur zero bills during development and prototyping.
4. **Fast Image Pipeline:** Node.js native libvips binding (`sharp`) provides sub-50ms image transformations without requiring heavy Python container runtimes in Phase 1.

---

## 2. Primary Recommended Stack (The Vibe-Coding Champion)

```
+──────────────────────────────────────────────────────────────────────────────+
|                           PRIMARY RECOMMENDED STACK                          |
+──────────────────────────────────────────────────────────────────────────────+
| Frontend Framework   │ Next.js 15 (App Router, React 19, Server Components)  |
| Styling & UI         │ Tailwind CSS v4 + shadcn/ui + Lucide Icons            |
| Language & Typing    │ TypeScript 5.5+ (Strict Mode)                         |
| Backend / API        │ Next.js Route Handlers + Server Actions               |
| Database & ORM       │ PostgreSQL via Neon Serverless OR Supabase + Prisma   |
| Object Storage       │ Cloudflare R2 (S3-compatible, Zero Egress Fees)       |
| In-Memory & Queue    │ Upstash Redis (Serverless) + BullMQ Worker Node       |
| Image Processing     │ sharp (resizing/derivatives) + exifr (EXIF parsing)   |
| AI SDK (Phase 1)     │ @google/genai (Official Google GenAI SDK for Gemini)  |
| Authentication       │ NextAuth.js (Auth.js v5) or Supabase Auth             |
| Hosting & Deploy     │ Vercel (Web/API) + Railway/Render (Worker Node)       |
+──────────────────────────────────────────────────────────────────────────────+
```

### Component Justifications & Rationale

#### Frontend: Next.js 15 + Tailwind CSS + shadcn/ui
- **Why Next.js 15:** Hybrid Server-Side Rendering (SSR) and Client Components give public galleries instant initial page loads (SEO-optimized for contests) while providing snappy, reactive client interactions for photo uploads and leaderboards.
- **Why shadcn/ui:** Copy-paste UI components built on Radix primitives. AI coding assistants write perfect shadcn dialogs, dropdowns, tabs, progress bars, and data tables with near-zero prompting errors.
- **Why Lucide React:** Clean, uniform iconography for camera metadata (aperture, shutter speed, ISO icons).

#### Database & ORM: PostgreSQL + Prisma ORM
- **Why PostgreSQL:** Robust relational integrity for competition states, user quotas, forensic audit logs, and complex ranking queries.
- **Why Prisma:** Schema-as-code (`schema.prisma`) generates fully typed TypeScript clients automatically. AI coding agents excel at writing type-safe Prisma queries with zero syntax drift.
- **Why Neon / Supabase:** Instant database branching for experimentation, serverless pooling, and generous free tiers.

#### Storage: Cloudflare R2
- **Why Cloudflare R2:** Unlike AWS S3, Cloudflare R2 charges **\$0.00 for data egress**. High-resolution photo competition galleries consume gigabytes of bandwidth; R2 ensures hosting bills do not balloon when galleries go viral. Fully S3-compatible API (`@aws-sdk/client-s3`).

#### Asynchronous Queue: BullMQ + Redis
- **Why BullMQ:** Production-grade Redis queue supporting job prioritization, exponential backoff retries, concurrency rate limiting, and progress telemetry. Essential for managing the Gemini API call quota without dropping submissions.

#### Image Pipeline: `sharp` + `exifr`
- **Why `sharp`:** High-speed C++ libvips wrapper in Node.js. Resizes images, converts to modern WebP format, and generates hashes in milliseconds with low memory overhead.
- **Why `exifr`:** Ultra-fast, comprehensive EXIF and TIFF parser supporting orientation, GPS, camera model, lens metadata, and editing software history.

#### AI Integration: `@google/genai`
- **Why Google GenAI SDK:** Direct support for `responseMimeType: "application/json"` and strict `responseSchema`. Eliminates fragile regex post-processing of markdown strings. Gemini 2.5 Flash delivers sub-second inference at fractions of a cent per image.

---

## 3. Alternative Stack: Python-Centric Microservices

For engineering teams that prioritize native Python computer vision libraries (OpenCV, PyTorch, SciPy) from day one:

```
+──────────────────────────────────────────────────────────────────────────────+
|                           ALTERNATIVE STACK (PYTHON-FIRST)                   |
+──────────────────────────────────────────────────────────────────────────────+
| Frontend Framework   │ React 19 + Vite + Tailwind CSS + shadcn/ui            |
| API Backend          │ FastAPI (Python 3.11+) + Pydantic v2                  |
| Database & ORM       │ PostgreSQL + SQLAlchemy 2.0 / Alembic                 |
| Background Queue     │ Celery + Redis (or RQ)                                |
| Image & Forensics    │ OpenCV-Python + Pillow + PyWavelets (FFT analysis)    |
| AI SDK (Phase 1)     │ google-generativeai / google-genai Python SDK        |
| Object Storage       │ AWS S3 / MinIO                                        |
| Authentication       │ FastAPI-Users / Supabase Auth                         |
| Hosting              │ Docker Compose / AWS ECS / Fly.io                     |
+──────────────────────────────────────────────────────────────────────────────+
```

### Why the Primary TypeScript Stack is Preferred for Phase 1 Vibe Coding
1. **Developer Velocity:** Maintaining a single TypeScript repository (Full-Stack Next.js) eliminates frontend-backend API synchronization friction, CORS headaches, and duplicate type models.
2. **AI Code Generation Accuracy:** Coding agents generate end-to-end features faster in Next.js + Prisma than across a decoupled React/FastAPI boundary.
3. **Deployment Simplicity:** Vercel deploys the entire application with one git push. In contrast, Celery + FastAPI requires multi-container Docker configuration, supervisor daemons, and manual SSL orchestration.
4. **Phase 2 Extensibility:** Because Phase 1 uses the `JudgeAdapter` interface, moving inference to Python in Phase 2 simply means deploying a Python FastAPI inference microservice while keeping the entire Next.js web portal intact!

---

## 4. Package Manifest (`package.json` Core Dependencies)

```json
{
  "name": "pixel-prize-portal",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "worker": "tsx src/workers/judging-worker.ts",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate"
  },
  "dependencies": {
    "@aws-sdk/client-s3": "^3.600.0",
    "@aws-sdk/s3-request-presigner": "^3.600.0",
    "@google/genai": "^0.1.2",
    "@prisma/client": "^5.16.0",
    "@radix-ui/react-dialog": "^1.1.1",
    "@radix-ui/react-dropdown-menu": "^2.1.1",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-progress": "^1.1.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "bullmq": "^5.8.0",
    "clsx": "^2.1.1",
    "exifr": "^7.1.3",
    "ioredis": "^5.4.1",
    "lucide-react": "^0.400.0",
    "next": "15.0.0",
    "next-auth": "5.0.0-beta.19",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "sharp": "^0.33.4",
    "tailwind-merge": "^2.3.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "postcss": "^8.4.38",
    "prisma": "^5.16.0",
    "tailwindcss": "^3.4.4",
    "tsx": "^4.16.0",
    "typescript": "^5.5.2"
  }
}
```

---

## 5. Environment Configuration Template (`.env.example`)

```bash
# Application Environment
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Database (PostgreSQL / Neon / Supabase)
DATABASE_URL="postgresql://user:password@ep-sample-pooler.us-east-1.neon.tech/pixelprize?sslmode=require"

# Cache & Queue (Redis / Upstash)
REDIS_URL="redis://default:token@flowing-redis-12345.upstash.io:6379"

# Object Storage (Cloudflare R2 / AWS S3)
R2_ACCOUNT_ID="your_cloudflare_account_id"
R2_ACCESS_KEY_ID="your_r2_access_key_id"
R2_SECRET_ACCESS_KEY="your_r2_secret_access_key"
R2_BUCKET_NAME="pixel-prize-media"
R2_PUBLIC_DOMAIN="https://media.pixelprize.org"

# Authentication (Auth.js / NextAuth)
AUTH_SECRET="your_generate_openssl_secret_32_bytes"
GOOGLE_CLIENT_ID="your_google_oauth_client_id"
GOOGLE_CLIENT_SECRET="your_google_oauth_client_secret"

# AI Judging Engine (Phase 1)
JUDGE_PROVIDER="gemini"
GEMINI_API_KEY="your_google_gemini_api_key"
GEMINI_MODEL_NAME="gemini-2.5-flash"

# AI Judging Engine (Phase 2 - Optional for MVP)
CUSTOM_MODEL_ENDPOINT="http://localhost:8000/v1/evaluate"
CUSTOM_MODEL_SECRET="internal_shared_bearer_secret"
```
