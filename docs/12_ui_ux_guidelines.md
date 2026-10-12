# 12: UI/UX Design System & Guidelines

> **Document Version:** 1.0.0  
> **Status:** Approved Baseline  
> **Target Audience:** Frontend Engineers, UI/UX Designers, AI Coding Agents  
> **Aesthetic Philosophy:** "Gallery Darkroom meets Modern Developer Portal"  
> **Inspiration Directives:** Borrowed from GuruShots, Photocrowd, Aftershoot, and Devfolio  
> **Related Documents:**  
> - [03_user_flows_and_pages.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/03_user_flows_and_pages.md)  
> - [05_ai_judging_system.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/05_ai_judging_system.md)  
> - [09_tech_stack.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/09_tech_stack.md)

---

## 1. Core Design Principles

1. **The "Darkroom Canvas" Rule:** Photography platforms must never distract from the artwork. The interface uses deep obsidian and zinc neutral tones (`#090A0F`, `#12141D`), allowing high-dynamic-range photos to pop without color contamination from bright white backgrounds.
2. **Aspect Ratio Preservation:** Never crop photos arbitrarily into square avatars or fixed-height boxes in galleries. The public gallery utilizes a genuine CSS/JS dynamic masonry grid that honors original $3:2$, $4:3$, $16:9$, and $1:1$ compositions.
3. **Transparent Computational Feedback:** When presenting AI assessments, avoid opaque numbers. Pair every numerical metric with visual radar polygons, IAACLIP composition badges, and readable critique cards (*ArtiMuse* format).
4. **Keyboard-First Juror Experience:** The Juror Lightbox supports high-speed evaluation via keyboard navigation (`Left`/`Right` arrow for navigation, `1`/`2`/`3` keys for podium tagging, `Space` for 100% zoom toggle).

---

## 2. Color Palette & Design Tokens

```
  Surface Dark       Surface Card       Surface Border       AI Accent         Gold Podium
   #090A0F            #12141D             #232738             #6366F1            #F59E0B
  ┌──────────┐       ┌──────────┐        ┌──────────┐        ┌──────────┐       ┌──────────┐
  │ Background│      │ Card/Dialog│       │ Dividers │        │ AI Action│       │ 1st Place│
  └──────────┘       └──────────┘        └──────────┘        └──────────┘       └──────────┘
```

| Token Name | Hex Value | Semantic Role & Application |
| :--- | :--- | :--- |
| `color-bg-base` | `#090A0F` | Global body canvas background (deep obsidian). |
| `color-bg-card` | `#12141D` | Surface for contest cards, submission cards, and modals. |
| `color-bg-elevated` | `#1B1E2D` | Hover states, active dropdowns, and sticky navigation headers. |
| `color-border-subtle` | `#232738` | Card outlines and section dividers. |
| `color-text-primary` | `#F8FAFC` | Headings, hero copy, and score readouts (Zinc 50). |
| `color-text-muted` | `#94A3B8` | Body copy, EXIF tags, and secondary metadata (Slate 400). |
| `color-accent-ai` | `#6366F1` | Primary CTA, AI badge, and radar chart fill (Indigo 500). |
| `color-accent-gold` | `#F59E0B` | 1st place podium ribbon, prize pools, and trophy badges (Amber 500). |
| `color-status-pass` | `#10B981` | Verified EXIF, authentic forensic check pass (Emerald 500). |
| `color-status-warn` | `#F59E0B` | Defect penalties, missing EXIF warning (Amber 500). |
| `color-status-error`| `#F43F5E` | Disqualification badge, synthetic AI flag (Rose 500). |

---

## 3. Typography Hierarchy

| Role | Font Family | Weight & Size | Tracking / Leading |
| :--- | :--- | :--- | :--- |
| **Hero Display** | Plus Jakarta Sans / Inter | 800 Bold / $48\text{px}\text{--}64\text{px}$ | `-0.025em` / $1.1$ |
| **Section Titles (H2)**| Plus Jakarta Sans / Inter | 700 SemiBold / $28\text{px}\text{--}36\text{px}$ | `-0.02em` / $1.2$ |
| **Card Headers (H3)** | Plus Jakarta Sans / Inter | 600 SemiBold / $18\text{px}\text{--}22\text{px}$ | `-0.01em` / $1.3$ |
| **Body Text** | Inter | 400 Regular / $14\text{px}\text{--}16\text{px}$ | `0.0em` / $1.5$ |
| **EXIF & Metrics Data**| JetBrains Mono / Geist Mono| 500 Medium / $12\text{px}\text{--}14\text{px}$ | `+0.02em` / $1.4$ |

---

## 4. Inspiration Syntheses in Key UI Components

```
+─────────────────────────────────────────────────────────────────────────────+
| WHAT WE BORROWED FROM INSPIRATION PLATFORMS                                 |
+──────────────────┬──────────────────────────────────────────────────────────+
| Source           | Borrowed UI/UX Elements                                  |
+──────────────────┼──────────────────────────────────────────────────────────+
| GuruShots        | • Live countdown ticker pills on competition cards       |
|                  | • Real-time percentile progression bars ("Top 6%")       |
|                  | • Gamified photographer badges (Rookie -> Master)        |
+──────────────────┼──────────────────────────────────────────────────────────+
| Photocrowd       | • Dual-track tabbed navigation (AI Juror vs Community)   |
|                  | • Side-by-side juror critique cards with scorecards      |
|                  | • Blind gallery during active submission window          |
+──────────────────┼──────────────────────────────────────────────────────────+
| Aftershoot       | • EXIF inspection pill overlay (Lens, ISO, Shutter, f/)  |
|                  | • Defect penalty warning chips (Focus, Noise, Blur)      |
|                  | • Near-duplicate burst upload blocker modal              |
+──────────────────┼──────────────────────────────────────────────────────────+
| Devfolio         | • Clean organizer competition wizard with timeline       |
|                  | • Participant dashboard tracking all active contest runs |
|                  | • Transparent, verifiable winner certificate cards       |
+──────────────────┴──────────────────────────────────────────────────────────+
```

---

## 5. Key Screen Component Wireframes

### 5.1 Competition Card Component (Explore Grid)
```
+─────────────────────────────────────────────────────────+
| [ High-Res Cover Image Banner with Category Pill ]      |
| [ Active Countdown Pill: ⏳ 4d 18h remaining ]           |
+─────────────────────────────────────────────────────────+
| Urban Monochromes: Street Life in B&W                   |
| By Tokyo Photographic Society • Verified Organizer ✓   |
|                                                         |
| 🏆 Prize: $2,500 Cash Purse + Leica Feature             |
| 📷 Rules: Max 2 photos • EXIF Required                  |
+─────────────────────────────────────────────────────────+
| [ 482 Entries ]            [ Primary CTA: "Submit Entry" ]|
+─────────────────────────────────────────────────────────+
```

### 5.2 AI Diagnostic Scorecard Component (`/submissions/[id]/scorecard`)
```
+──────────────────────────────────────────────────────────────────────────────+
| [← Back to Dashboard]                 Reflections in Shibuya by @kenji_photo  |
+─────────────────────────────────────────┬────────────────────────────────────+
|                                         |  AESTHETIC ASSESSMENT REPORT       |
|                                         |  ┌──────────────────────────────┐  |
|                                         |  │ Overall Score: 88.5 / 100    │  |
|                                         |  │ Rank: Top 6% in Street       │  |
|                                         |  └──────────────────────────────┘  |
|                                         |                                    |
|         [ HIGH RESOLUTION               |  RADAR ATTRIBUTE BREAKDOWN:        |
|            PHOTOGRAPH VIEWPORT          |         Composition (92)           |
|            WITH ZOOM LOUPE ]            |                 ▲                  |
|                                         |      Gestalt ◄──┼──► Lighting (89) |
|                                         |                 ▼                  |
|                                         |          Color Harmony (91)        |
|                                         |                                    |
|                                         |  DETECTED TECHNIQUES:              |
|  [📷 Sony A7 IV • 35mm • f/1.8 • 1/160s]|  [Leading Lines] [Rule of Thirds]  |
|  [✓ Forensics: Authentic Optical Media] |                                    |
+─────────────────────────────────────────┴────────────────────────────────────+
| EXPERT AI CRITIQUE (ArtiMuse Formulation):                                   |
| • Strengths: Masterful reflective leading lines converging on subject...     |
| • Technical: Tack-sharp focus on umbrella fabric; controlled highlights...   |
| • Advice: Consider cropping 2% off top edge to eliminate halogen flare.      |
+──────────────────────────────────────────────────────────────────────────────+
```

---

## 6. Accessibility & Responsive Breakpoints

### 6.1 WCAG 2.1 AA Compliance
- **Contrast Ratios:** All primary body text on `#090A0F` surfaces maintains a minimum contrast ratio of $7.2:1$ (exceeds WCAG AAA requirements).
- **Focus Indicators:** Interactive components feature a high-contrast `$2px` indigo outline ring (`focus-visible:ring-2 focus-visible:ring-indigo-500`).
- **Screen Reader Support:** All photos in galleries require descriptive alt text generated from the photographer's title and category.

### 6.2 Responsive Breakpoint Specifications

| Breakpoint | Minimum Width | Gallery Layout | Lightbox Navigation |
| :--- | :--- | :--- | :--- |
| `sm` | $640\text{px}$ | 1 Column Masonry | Bottom drawer modal with stacked scorecards |
| `md` | $768\text{px}$ | 2 Column Masonry | Split viewport (photo on top, scorecard below) |
| `lg` | $1024\text{px}$ | 3 Column Masonry | Split viewport (photo left 60%, scorecard right 40%) |
| `xl` | $1280\text{px}$ | 4 Column Masonry | Full-screen darkroom with side-by-side companion |
| `2xl`| $1536\text{px}$ | 5 Column Masonry | Multi-monitor / 4K optimized workstation view |
