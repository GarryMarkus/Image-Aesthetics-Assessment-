# Pixel Prize Architectural Documentation Index

> **Project Name:** Pixel Prize (Image Aesthetics Assessment Portal)  
> **Tagline:** "Devfolio, but for photography competitions—judged by AI."  
> **Version:** 1.0.0 (Master Blueprint)  
> **Generated:** October 2026

Welcome to the definitive architectural specification for the **Pixel Prize Portal**. This documentation repository serves as the single source of truth for both human technical leadership and autonomous AI coding agents building the system.

---

## 1. Documentation Index

| File | Document Title | One-Line Summary |
| :--- | :--- | :--- |
| [00_source_inventory.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/00_source_inventory.md) | Source Inventory & Research Extraction | Exhaustive audit of all workspace research papers, presentation slides, datasets, and inspiration websites. |
| [01_project_overview.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/01_project_overview.md) | Project Overview & Vision | Vision, problem statement, value propositions, key differentiators, and Phase 1 vs. Phase 2 scoping boundaries. |
| [02_product_requirements.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/02_product_requirements.md) | Product Requirements Document (PRD) | User roles (RBAC), user stories with acceptance criteria, functional & non-functional requirements, and KPIs. |
| [03_user_flows_and_pages.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/03_user_flows_and_pages.md) | User Flows & Page Specifications | Complete URL route tree, interactive sequence diagrams, and wireframe layouts for all key viewports. |
| [04_competition_system.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/04_competition_system.md) | Competition System Specification | Deterministic lifecycle state machine, submission caps, category configurations, and disqualification rules. |
| [05_ai_judging_system.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/05_ai_judging_system.md) | AI Judging System Specification | Core 8-dimension rubric (*ArtiMuse*), mathematical formulas ($S_{total}$), defect deductions (*Aftershoot*), and JSON schemas. |
| [06_prompt_library.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/06_prompt_library.md) | Prompt Library & Engineering Guide | Production multimodal LLM prompts for Phase 1, calibration anchors, schema constraints, and example outputs. |
| [07_model_abstraction_and_migration.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/07_model_abstraction_and_migration.md) | Model Abstraction & Migration Guide | `IJudgeAdapter` abstraction, zero-downtime swap mechanism, Phase 2 ML training plan, and cutover checklist. |
| [08_system_architecture.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/08_system_architecture.md) | System Architecture & Infrastructure | Component architecture, BullMQ job queue, image derivative lifecycle, token budgets, and multi-level caching. |
| [09_tech_stack.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/09_tech_stack.md) | Technology Stack Recommendations | Recommended Next.js 15 / Prisma / Cloudflare R2 / BullMQ stack vs. Python alternatives, package manifests, and env files. |
| [10_database_schema.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/10_database_schema.md) | Database Schema & Data Dictionary | Mermaid ER diagram, table schemas (lineage from *Pan Zhang 2018*), composite indexes, and complete Prisma schema. |
| [11_api_specification.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/11_api_specification.md) | REST & Internal API Specifications | Endpoint request/response schemas, HTTP status codes, presigned URL workflows, and juror verdict contracts. |
| [12_ui_ux_guidelines.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/12_ui_ux_guidelines.md) | UI/UX Design System Guidelines | Darkroom design tokens (`#090A0F`), aspect ratio preservation, typography, inspiration synthesis, and wireframes. |
| [13_security_privacy_legal.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/13_security_privacy_legal.md) | Security, Privacy & Legal Framework | 100% photographer copyright retention, opt-in Phase 2 training consent (GDPR), GPS EXIF stripping, and abuse prevention. |
| [14_roadmap_and_milestones.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/14_roadmap_and_milestones.md) | Phased Roadmap & Milestones | Step-by-step milestones (0 through 9) with explicit deliverables and definitions of done for vibe coding. |
| [15_vibe_coding_playbook.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/15_vibe_coding_playbook.md) | Vibe-Coding Playbook & Agent Guide | Project system rules (`.cursorrules`), ready-to-copy milestone prompts for coding agents, and testing checklists. |
| [16_risks_assumptions_open_questions.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/16_risks_assumptions_open_questions.md) | Risks, Assumptions & Open Questions | Technical/product risk mitigations, complete inventory of all 10 system assumptions, and strategic open questions. |

---

## 2. Recommended Reading Paths

### Path A: For the Product Owner & Non-Technical Stakeholders
1. [01_project_overview.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/01_project_overview.md) (Vision & Value Proposition)
2. [02_product_requirements.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/02_product_requirements.md) (PRD & User Stories)
3. [04_competition_system.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/04_competition_system.md) (Contest Lifecycle & Hybrid Judging)
4. [12_ui_ux_guidelines.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/12_ui_ux_guidelines.md) (Design Language & Wireframes)
5. [16_risks_assumptions_open_questions.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/16_risks_assumptions_open_questions.md) (Assumptions & Open Questions)

### Path B: For the Full-Stack Developer & AI Coding Agent
1. [15_vibe_coding_playbook.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/15_vibe_coding_playbook.md) (Start Here: Agent Rules & Build Prompts)
2. [14_roadmap_and_milestones.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/14_roadmap_and_milestones.md) (Milestones 0 to 8)
3. [09_tech_stack.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/09_tech_stack.md) & [10_database_schema.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/10_database_schema.md) (Stack & Schema)
4. [08_system_architecture.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/08_system_architecture.md) & [11_api_specification.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/11_api_specification.md) (Architecture & Endpoints)
5. [05_ai_judging_system.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/05_ai_judging_system.md) & [06_prompt_library.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/06_prompt_library.md) (AI Rubrics & Prompts)

### Path C: For the AI & Computer Vision Specialist
1. [00_source_inventory.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/00_source_inventory.md) (Research Extraction)
2. [05_ai_judging_system.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/05_ai_judging_system.md) (Scoring Rubrics & Forensics)
3. [06_prompt_library.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/06_prompt_library.md) (Production Multimodal Prompts)
4. [07_model_abstraction_and_migration.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/07_model_abstraction_and_migration.md) (Adapter & Phase 2 Training Plan)
