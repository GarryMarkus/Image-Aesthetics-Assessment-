# Pixel Prize Architecture & Development Rules

> **Single Source of Truth:** Specifications in [`docs/`](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/README.md)  
> **Documentation Index:** See [`docs/README.md`](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/README.md)

---

## 1. Directory Scoping Rules (Mandatory)

1. **Frontend Code:** All frontend code (UI components, pages, client hooks, styling, state management, layouts) MUST reside exclusively inside [`frontend/`](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/frontend).
2. **Backend Code:** All backend code (API routes, services, database models, queues, background workers, AI judging adapters, forensics) MUST reside exclusively inside [`backend/`](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/backend).
3. **Documentation:** Architecture, database schemas, rubrics, and prompts are located in [`docs/`](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs). Never invent unapproved database fields or API schemas that contradict the docs.

---

## 2. Model Context Protocol (MCP) Tools

The **Stitch MCP Server** is configured and verified:
- **Server:** `stitch` (`https://stitch.googleapis.com/mcp`)
- **Key Capabilities:**
  - `create_project`: Initialize Stitch UI projects.
  - `generate_screen_from_text`: Generate UI screens directly from text prompts.
  - `edit_screens`: Modify and refine generated screens.
  - `create_design_system`: Define typography, colors, and components.
  - `generate_variants`: Generate alternative UI layouts and treatments.
  - `list_screens` / `get_screen`: Inspect generated screens and code.

Use Stitch MCP tools when generating UI mockups, screen prototypes, and design systems for the Pixel Prize frontend.
