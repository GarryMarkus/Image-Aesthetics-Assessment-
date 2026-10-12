# 02: Product Requirements Document (PRD)

> **Document Version:** 1.0.0  
> **Status:** Approved Baseline  
> **Target Audience:** Engineering Leads, Product Managers, AI Engineers, Frontend/Backend Developers  
> **Related Documents:**  
> - [01_project_overview.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/01_project_overview.md)  
> - [03_user_flows_and_pages.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/03_user_flows_and_pages.md)  
> - [04_competition_system.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/04_competition_system.md)  
> - [05_ai_judging_system.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/05_ai_judging_system.md)  
> - [10_database_schema.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/10_database_schema.md)

---

## 1. User Roles & Permissions Matrix

Based on the Role-Based Access Control (RBAC) models in *Pan Zhang (2018)* (Paper 1, Section 3.4.1) and *Presentation1.pptx*, the platform recognizes five distinct user personas:

| Role | Description | Key Capabilities |
| :--- | :--- | :--- |
| **Participant** | Any registered photographer submitting photos to competitions. | Register/login, browse active contests, upload photos, provide titles/stories, view personal submission status, view private AI diagnostic scorecard, view public leaderboards, appeal disqualifications. |
| **Organizer** | A verified entity (university, photography club, brand, individual) that hosts and manages contests. | Create/draft competitions, define categories, submission caps, deadlines, prizes, and custom rubrics; invite external human jurors; monitor live ingestion; lock submissions; review AI shortlist; publish results. |
| **Human Juror** | A domain expert appointed by the Organizer to make final winner selections. | Access protected Juror Dashboard, review the AI-screened Top 10 shortlist, inspect high-res photos and AI score breakdowns, cast final podium votes (1st, 2nd, 3rd, Honorable Mention), submit juror remarks. |
| **Viewer / Guest** | Any unregistered or non-participating visitor. | Browse public galleries, view active and past competitions, explore winner showcases, read educational articles and AI critiques, upvote photos in community track (if logged in). |
| **Platform Admin** | Superuser overseeing system health, billing, and integrity. | Global moderation of content, override disqualifications, monitor AI API costs and rate limits, manage user locks/bans, audit system logs. |

---

## 2. User Stories & Acceptance Criteria

### 2.1 Participant Stories
- **US-P1: Contest Discovery & Entry**  
  *As a participant*, I want to filter and browse active photography competitions by category, prize pool, and submission deadline, so that I can choose contests matching my photography genre.  
  - *Acceptance Criteria:* Filters for category (Landscape, Portrait, Street, etc.), status (Open, Judging, Closed), and entry fee (Free/Paid). Direct "Join Competition" CTA.
- **US-P2: Submission with Provenance & Story**  
  *As a participant*, I want to upload a high-resolution JPEG/PNG/WebP photo, have its EXIF automatically extracted, and provide a title, category, and artistic story, so that my entry is officially registered.  
  - *Acceptance Criteria:* Client-side file validation (size $\le 25\text{ MB}$, resolution $\ge 1920\times1080$), automatic parsing of camera make, lens, shutter speed, aperture, and ISO. Warning displayed if EXIF data is missing.
- **US-P3: Actionable AI Feedback Scorecard**  
  *As a participant*, I want to receive an AI Diagnostic Scorecard with breakdown scores across 8 aesthetic attributes and constructive commentary, so that I understand my strengths and weaknesses even if I do not win.  
  - *Acceptance Criteria:* Scorecard visible in participant dashboard post-judging. Displays 0–100 overall score, 8 sub-scores, radar chart, and 100–150 words of constructive text critique (`ArtiMuse` format).
- **US-P4: Transparency & Dispute Submission**  
  *As a participant*, I want to see why my photo was disqualified (e.g., synthetic AI flag, missing EXIF, inappropriate content) and have an option to appeal with a RAW file or secondary proof.  
  - *Acceptance Criteria:* Clear rejection status badge with specific forensic reason; "Request Review" modal allowing upload of unedited RAW file or proof of capture.

### 2.2 Organizer Stories
- **US-O1: Competition Wizard**  
  *As an organizer*, I want a step-by-step wizard to create a competition, set start/end/judging dates, configure categories, submission limits per user, prize details, and select rubric weighting, so that I can launch a contest in minutes.  
  - *Acceptance Criteria:* Wizard validates date sequencing ($T_{start} < T_{end} < T_{judging} < T_{results}$). Allows selection of preset rubrics (General, Landscape, Portrait, Street) or custom weighting totaling 100%.
- **US-O2: Ingestion & Forensics Monitoring**  
  *As an organizer*, I want a real-time dashboard showing incoming submission counts, processing status, and flagged suspicious entries (AI-generated or duplicate bursts), so that I maintain contest integrity.  
  - *Acceptance Criteria:* Real-time metric cards (Total Entries, Scored, In Queue, Flagged/Disqualified). Ability to manually inspect flagged items and override AI flags if warranted.
- **US-O3: AI-Driven Shortlist to Juror Handoff**  
  *As an organizer*, I want the system to automatically rank entries and generate a verified Top 10 Shortlist when the submission window closes, so that my human jurors only review the best photos.  
  - *Acceptance Criteria:* One-click transition from "Open" to "Judging". Background queue executes AI judging. Top 10 entries per category automatically populated in the Juror Review portal.
- **US-O4: Winner Publishing & Archival**  
  *As an organizer*, I want to confirm final juror picks and publish results to a public Winner Showcase page with one click, so that contestants and viewers can celebrate the winners.  
  - *Acceptance Criteria:* Status transitions to "Results Published". Public leaderboard unlocks; email notifications dispatched to winners and entrants.

### 2.3 Human Juror Stories
- **US-J1: Shortlist Evaluation View**  
  *As a human juror*, I want a distraction-free, full-screen lightbox interface to review the Top 10 shortlisted photos with side-by-side AI scores and photographer stories, so that I can make informed decisions.  
  - *Acceptance Criteria:* High-resolution zoom/pan capability, toggleable AI breakdown overlay, drag-and-drop ranking interface for 1st, 2nd, and 3rd place podium.

---

## 3. Functional Requirements (FR)

### 3.1 Module 1: Authentication & User Profiles
- **FR-1.1:** Support email/password registration with email verification and OAuth (Google, GitHub).
- **FR-1.2:** User profiles must support avatar, bio, portfolio links, social handles, and gear list (camera, lenses).
- **FR-1.3:** Participant stats tracking: total competitions entered, wins, honorable mentions, average aesthetic score across lifetime submissions (`GuruShots` leveling model).
- **FR-1.4:** Role assignment: Default is `Participant`. Users can apply for `Organizer` status via admin verification.

### 3.2 Module 2: Competition Management
- **FR-2.1:** Organizers can create competitions with state machine lifecycle: `Draft` $\rightarrow$ `Published / Open` $\rightarrow$ `Submission Closed / In Judging` $\rightarrow$ `Shortlisted` $\rightarrow$ `Results Published` $\rightarrow$ `Archived`.
- **FR-2.2:** Each competition must belong to one or more predefined categories (Landscape, Portrait, Street, Wildlife, Macro, Monochrome, Architecture, Conceptual) or custom tags (`TAD66K` theme alignment).
- **FR-2.3:** Organizers can configure submission constraints: max submissions per participant (e.g., 1–5), aspect ratio constraints, minimum resolution ($1920\text{px}$ on long edge), and allowed formats (JPEG, PNG, WebP).
- **FR-2.4:** Organizers can customize rubric weightings across the 8 aesthetic attributes, constrained to sum to $1.0$ ($100\%$). Default presets must be provided.

### 3.3 Module 3: Media Upload, Ingestion & Forensics
- **FR-3.1:** Direct-to-cloud secure upload using presigned URLs (S3/Cloudflare R2) with MIME-type verification and virus scanning.
- **FR-3.2:** Automatic extraction and storage of EXIF metadata: Camera Make, Model, Lens, Focal Length, Aperture ($f$-stop), Exposure Time, ISO, Capture Timestamp, and Software/Editing Tool tags.
- **FR-3.3:** Synthetic Media & Forensics Screening (`Presentation1.pptx`):
  - *EXIF Check:* Flag entries with missing camera hardware signatures or software tags indicating generative tools (e.g., Midjourney, ComfyUI, DALL-E).
  - *FFT Frequency Analysis:* Compute radial power spectrum and detect high-frequency grid artifacts typical of synthetic diffusion models.
  - *Perceptual Hashing:* Compute 64-bit difference hash (`dHash`) and block perceptual duplicates from the same user within the same contest.
- **FR-3.4:** Automatic generation of optimized responsive derivatives: Thumbnail ($400\times300$), Web Display ($1600\times1200$), and AI Inspection Variant ($1024\times1024$ normalized).

### 3.4 Module 4: AI Aesthetic Assessment Engine
- **FR-4.1:** Model-agnostic judging orchestration implementing the `JudgeAdapter` interface (`07_model_abstraction_and_migration.md`).
- **FR-4.2 (Phase 1):** Hosted Multimodal LLM (Gemini 2.5 / 1.5 Flash/Pro) prompt execution returning structured JSON conforming to `AestheticEvaluationSchema` (`05_ai_judging_system.md`).
- **FR-4.3:** Multi-pass temperature calibration: For high-ranking borderlines, execute 3 evaluation passes at temperature $T=0.2$ and average the sub-scores to minimize stochastic variance.
- **FR-4.4:** Evaluation dimensions: 8 quantitative attribute scores ($0\text{--}100$) plus theme adherence score ($0\text{--}100$) and technical defect penalties ($0\text{--}30$).
- **FR-4.5:** Generation of structured textual critique (100–150 words) highlighting composition strengths, lighting execution, and actionable advice for improvement.

### 3.5 Module 5: Leaderboards, Galleries & Public Engagement
- **FR-5.1:** Dynamic leaderboard sorting submissions by Total Normalized Score ($0\text{--}100$).
- **FR-5.2:** Dual-Track Showcase (`Photocrowd` pattern): Side-by-side display of **AI Aesthetic Rank** and **Community Popularity Vote** (likes).
- **FR-5.3:** Public gallery with masonry grid layout, responsive progressive loading, lazy loading, and EXIF overlay badge on hover.
- **FR-5.4:** Participant Diagnostic View: Private page showing the photographer their detailed score radar chart and critique card.

---

## 4. Non-Functional Requirements (NFR)

### 4.1 Performance & Latency
- **NFR-1.1:** Web pages (Gallery, Contest Details, Leaderboard) must achieve First Contentful Paint (FCP) $\le 1.2\text{s}$ and Largest Contentful Paint (LCP) $\le 2.5\text{s}$ on standard 4G/broadband connections.
- **NFR-1.2:** Asynchronous photo processing pipeline: Photo ingestion, thumbnailing, and forensics must complete in $\le 5\text{s}$ post-upload.
- **NFR-1.3:** AI Judging throughput: Phase 1 queue must process at least $120\text{ images/minute}$ across distributed worker tasks while respecting API provider rate limits.
- **NFR-1.4:** Individual AI evaluation turnaround: A single photo submitted in an active contest must receive its evaluation result in $\le 30\text{ seconds}$ under normal queue load.

### 4.2 Scalability & Reliability
- **NFR-2.1:** Architecture must support at least 50 concurrent active competitions and up to $100,000$ active submissions per month without architectural rework.
- **NFR-2.2:** System availability target of $99.9\%$ uptime for public galleries and submission portals.
- **NFR-2.3:** Resilient job queue (Redis/BullMQ or Cloud Tasks): Failed AI calls must support exponential backoff retry (up to 3 attempts) with dead-letter queue (DLQ) logging.

### 4.3 Security, Privacy & Integrity
- **NFR-3.1:** All data in transit encrypted via TLS 1.3; all images and database records encrypted at rest (AES-256).
- **NFR-3.2:** Submissions during active judging must remain **blind**: entrant usernames and identities are stripped from judge viewports to prevent favoritism or prestige bias.
- **NFR-3.3:** Anti-scraping & rate limiting: Public API endpoints protected with Redis token bucket rate limiting ($60\text{ req/min}$ per IP).

---

## 5. Scope Matrix: MVP (Phase 1) vs. Later Releases (Phase 2 & Future)

| Feature Area | Phase 1: MVP (Build Now) | Phase 2: Custom Model (Next) | Future Scope |
| :--- | :--- | :--- | :--- |
| **Judging Engine** | Hosted Multimodal LLM (Gemini) via structured JSON prompts | In-house fine-tuned model (ArtiMuse LoRA / TANet / EAMB-Net) | Edge/Local inference; multi-model ensemble consensus |
| **Forensics** | EXIF rule verification, pHash duplicate blocking, basic FFT heuristics | Deep frequency CNN artifact detector, PRNU sensor noise matching | C2PA Content Authenticity standard integration |
| **Image Formats** | JPEG, PNG, WebP (Max 25 MB) | JPEG, PNG, WebP + TIFF | Cloud-based RAW format conversion (CR3, NEF, ARW, DNG) |
| **Platforms** | Responsive Web App (Desktop & Mobile Browser) | Responsive Web App + Progressive Web App (PWA) | Native iOS & Android applications (`Presentation1.pptx` Slide 4) |
| **Community Voting** | Simple like/upvote track (Photocrowd model) | Elo-style pairwise blind voting matchup (`GuruShots` model) | Community discussion forums & critique exchange |
| **Monetization** | Free competitions, platform sponsored prizes | Paid entry fees via Stripe, platform fee per ticket | NFT / Web3 verifiable photo awards, print on demand |

---

## 6. Out-of-Scope (Explicit System Boundaries)

To ensure rapid delivery and prevent scope creep, the following capabilities are explicitly **Out-of-Scope for Phase 1**:
1. **Native Mobile Apps (iOS/Android):** System is web-first; responsive mobile web only (`Presentation1.pptx`, Slide 4).
2. **Cloud-Based RAW File Development:** Users cannot directly upload $80\text{ MB}$ raw camera files; they must upload exported JPEGs/PNGs (`Presentation1.pptx`, Slide 8).
3. **Automated Cash Payouts:** Organizers manage physical/cash prizes manually; platform only automates digital certificates and standings.
4. **Real-Time Video Aesthetics:** Video contest evaluation is excluded; purely static photographic media is supported.
5. **Full Autonomous Prize Allocation:** AI is explicitly prevented from declaring 1st place without human organizer/juror sign-off on the shortlisted finalists (`Presentation1.pptx`, Slide 2).

---

## 7. Key Performance Indicators (KPIs) & Success Metrics

1. **AI Scoring Reliability & Agreement:** Human-AI score correlation achieving Spearman's Rank Correlation Coefficient $\text{SRCC} \ge 0.70$ on benchmark validation sets (matching academic standards from `ArtiMuse` and `TANet`).
2. **Turnaround Efficiency:** $95\%$ of submitted photos fully scored and feedback generated within $60\text{ seconds}$ of queue pickup.
3. **Forensic Efficacy:** Detection and quarantine of $\ge 90\%$ of synthetic AI submissions without human intervention.
4. **Organizer Operations Savings:** Reduction of organizer pre-screening time from $>40\text{ hours}$ per contest to $<30\text{ minutes}$ (juror only reviews verified Top 10).
5. **Participant Satisfaction:** Disqualification dispute rate $<3\%$; participant feedback rating $\ge 4.2 / 5.0$ stars on AI critique utility.
