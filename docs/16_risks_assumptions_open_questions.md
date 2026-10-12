# 16: Risks, Assumptions & Open Questions

> **Document Version:** 1.0.0  
> **Status:** Approved Baseline  
> **Target Audience:** Project Sponsor, Technical Lead, System Architect  
> **Related Documents:**  
> - [01_project_overview.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/01_project_overview.md)  
> - [05_ai_judging_system.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/05_ai_judging_system.md)  
> - [07_model_abstraction_and_migration.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/07_model_abstraction_and_migration.md)  
> - [14_roadmap_and_milestones.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/14_roadmap_and_milestones.md)

---

## 1. Risk Analysis & Mitigation Matrix

### 1.1 Technical Risks

| Risk Identifier | Severity / Likelihood | Potential Impact | Technical Mitigation Strategy |
| :--- | :---: | :--- | :--- |
| **TR-01: Generative AI Forensic Evasion** | **High / Med** | Advanced diffusion models (Flux.1, Midjourney v6) with simulated noise and injected EXIF bypass basic heuristics. | Defense-in-depth: Rule-based EXIF validation + FFT high-frequency lattice checks + MLLM semantic anomaly analysis. Disputed photos require original camera RAW verification. |
| **TR-02: LLM API Rate Limits & Surges** | **Med / High** | 5,000 photographers submit entries in the final 3 hours before a deadline, triggering HTTP 429 quota exhaustion. | Asynchronous queueing (BullMQ): uploads succeed immediately into R2 with `IN_QUEUE` status. Worker concurrency is strictly throttled to match Gemini API rate limits. |
| **TR-03: Stochastic Score Drift & Inconsistency** | **Med / Med** | Two visually identical photos receiving disparate scores due to LLM sampling temperature. | Set $T=0.20$ with constrained JSON schemas. Enforce **Multi-Pass Borderline Calibration ($N=3$)** on all Top 15% entries, averaging scores to eliminate variance. |
| **TR-04: Storage Bandwidth & Egress Costs** | **Low / High** | Public galleries going viral, consuming terabytes of image bandwidth. | Use **Cloudflare R2** with $\$0.00$ egress fees. Serve all gallery views through CDN-cached responsive WebP derivatives ($1600\text{px}$ and $400\text{px}$) rather than raw master files. |

### 1.2 Product & Community Risks

| Risk Identifier | Severity / Likelihood | Potential Impact | Product Mitigation Strategy |
| :--- | :---: | :--- | :--- |
| **PR-01: Community Skepticism of "AI Art Judges"** | **High / Med** | Photographers push back against purely algorithmic evaluation, fearing algorithmic coldness or bias. | Transparent Hybrid Architecture: Frame AI as an objective preliminary screening assistant that creates a **Top 10 Shortlist**. Final podium places are confirmed by trusted human master jurors (`Presentation1.pptx`). |
| **PR-02: Over-Penalization of Intentional Flaws** | **Med / Med** | AI penalizes intentional artistic grain or creative motion blur as technical defects. | Category-conditioned rubrics: Street and Conceptual categories drastically reduce technical weights ($5\%$) and elevate storytelling/emotion ($30\%$). |

---

## 2. Complete Inventory of System Assumptions

Where the provided research materials (`docs and research paper/`) were silent, sensible architectural choices were established. Below is the complete log of all assumptions:

* **[ASSUMPTION-01] Official Platform Branding:** The project is codified as **"Pixel Prize"**, adopting the title specified on Slide 1 of `Presentation1.pptx` ("PIXEL PRIZE - Major Project / 7th Sem").
* **[ASSUMPTION-02] Primary Technology Stack:** Selected **Next.js 15 (TypeScript)**, **Prisma ORM**, **PostgreSQL (Neon/Supabase)**, **BullMQ/Redis**, and **Cloudflare R2** as the primary stack. Rationale: single-language fullstack eliminates synchronization friction during AI vibe-coding, while R2 eliminates egress bandwidth expenses.
* **[ASSUMPTION-03] Hosted LLM Engine for Phase 1:** Selected **Google Gemini 2.5 Flash / 1.5 Flash** via `@google/genai` as the Phase 1 provider. Rationale: lowest inference latency, cost efficiency ($\sim \$0.0003$ per scored image), and native support for strict JSON schemas.
* **[ASSUMPTION-04] Default Submission Cap:** Set to a default of **$2$ submissions per participant** per competition (configurable by organizers between $1$ and $5$). Rationale: prevents submission spam while encouraging creators to submit their top work.
* **[ASSUMPTION-05] Shortlist Threshold:** Fixed at **Top 10 submissions per category** handed off to human jurors, directly adhering to `Presentation1.pptx` Slide 2 ("reduces thousands of entries down to a verified top 10 shortlist").
* **[ASSUMPTION-06] RAW File Policy in MVP:** Native cloud RAW processing (e.g., `.CR3`, `.NEF`, `.ARW`) is deferred to Future Scope (`Presentation1.pptx` Slide 8). Users must upload exported JPEGs/PNGs for normal judging, but original RAW files can be uploaded during the 48-hour dispute appeal window.
* **[ASSUMPTION-07] Perceptual Duplicate Hash Threshold:** Set the 64-bit `dHash` Hamming distance threshold to $H \le 4$ for blocking near-duplicate burst uploads by the same user within the same contest.
* **[ASSUMPTION-08] Blind Evaluation Policy:** All photographer usernames, avatars, and profile IDs are stripped during judging. Public galleries hide scores during the active `OPEN` submission window to eliminate bandwagon voting bias.
* **[ASSUMPTION-09] Multi-Pass Calibration Trigger:** Multi-pass evaluation ($N=3$) is restricted to submissions scoring in the **Top 15%** or within $\pm 3.0$ points of the Top 10 cutoff, minimizing API token consumption while maximizing podium accuracy.
* **[ASSUMPTION-10] Ethical Model Training Governance:** Opt-in consent for Phase 2 model training is strictly voluntary, explicit, and GDPR-compliant. Users can opt out with zero impact on competition standing.

---

## 3. Open Questions for Product Owner Alignment

Please review and confirm these strategic decisions before initiating codebase generation:

1. **Monetization & Entry Fees:** Should the MVP launch with exclusively free-to-enter competitions, or do you want Stripe integration enabled in Phase 1 for paid entry ticketing (e.g., \$10 per entry)?
2. **Object Storage Preference:** Are you comfortable standardizing on **Cloudflare R2** (for zero egress fees), or do you have existing AWS credits/infrastructure that make AWS S3 mandatory?
3. **API Access & Key Availability:** Do you have an active Google AI Studio / Gemini API key ready for Phase 1 development?
4. **Juror Multiplicity:** Should competitions support multiple human jurors casting consensus votes, or is a single appointed juror per category sufficient for the MVP?
5. **Phase 2 Infrastructure:** For Phase 2 model training, do you plan to use local GPU hardware (e.g., RTX 4090) or cloud GPU instances (RunPod, Lambda Labs, AWS g5)?
