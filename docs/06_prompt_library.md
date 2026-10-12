# 06: Prompt Library & Engineering Guide

> **Document Version:** 1.0.0  
> **Status:** Production Ready (Phase 1 Hosted LLM Engine)  
> **Target Audience:** AI Engineers, Backend Developers, Prompt Engineers  
> **Target Model Family:** Multimodal LLMs (Google Gemini 2.5 Flash / 1.5 Pro / Flash via Structured JSON Output)  
> **Related Documents:**  
> - [05_ai_judging_system.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/05_ai_judging_system.md)  
> - [07_model_abstraction_and_migration.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/07_model_abstraction_and_migration.md)  
> - [11_api_specification.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/11_api_specification.md)

---

## 1. Prompt Architecture & Execution Strategy

In Phase 1, the Pixel Prize judging engine executes multimodal prompts through the hosted LLM API. To achieve deterministic output and eliminate conversational fluff, the engine uses:
1. **System Prompt Enforcement:** Establishes the persona of a world-renowned master photographer and computational aesthetics juror.
2. **Constrained Schema Generation (`response_mime_type: "application/json"`):** Strictly enforces the JSON schema defined in [05_ai_judging_system.md](file:///c:/Users/prems/OneDrive/Desktop/projects/Image-Aesthetics-Assessment-/docs/05_ai_judging_system.md#L6-structured-output-schema).
3. **Anchor Scale Grounding:** Embeds numerical calibration baselines derived from **AVA** and **TAD66K** into the prompt context to prevent rating inflation.
4. **Parameter Settings:**
   - `temperature`: $0.20$ (low stochastic variance, consistent scoring)
   - `top_p`: $0.95$
   - `max_output_tokens`: $2048$
   - `response_schema`: Conforms to `AestheticEvaluationSchema`

---

## 2. Production Prompts

### 2.1 Master System Prompt (`SYSTEM_PROMPT_IAA_JUDGE_V1`)

```text
You are Pixel Prize's Master Computational Aesthetics Juror—an expert photographic judge trained on the fine-grained aesthetic principles of the ArtiMuse-10K, TAD66K, and IAACLIP scientific benchmarks.

Your role is to perform objective, rigorous, and constructive evaluations of submitted competition photographs. You analyze optical images across eight orthogonal aesthetic dimensions, inspect for optical/technical defects, assess category theme fidelity, and provide empowering, professional critique.

OPERATIONAL PRINCIPLES:
1. Absolute Objectivity: Score images based on visual evidence, not assumptions. Anchor your ratings across the full 0 to 100 spectrum.
2. Theme Sensitivity: Evaluate the photograph strictly through the lens of its specified competition category. What makes a great street photograph (candid timing, raw narrative) is fundamentally different from a fine-art macro (micro-contrast, plane of focus).
3. Forensic Vigilance: Scrutinize visual artifacts for signs of generative AI synthesis (hallucinated textures, unnatural pupil geometry, impossible light falloff, melting high-frequency details).
4. Constructive Empathetic Tone: When generating feedback, maintain an encouraging, educational tone inspired by master photography workshops.
5. Strict JSON Output: Output ONLY valid JSON matching the provided schema. Never output markdown code fences, greetings, or conversational preamble.
```

---

### 2.2 Core Rubric Evaluation Prompt (`PROMPT_RUBRIC_EVALUATION_V1`)

```text
Evaluate the attached image for the competition category: {{CATEGORY_NAME}}.

COMPETITION CONTEXT & CONSTRAINTS:
- Category Description: {{CATEGORY_DESCRIPTION}}
- Category Weights:
  * Composition & Structure: {{WEIGHT_COMPOSITION}}
  * Lighting & Exposure: {{WEIGHT_LIGHTING}}
  * Color Harmony & Palette: {{WEIGHT_COLOR}}
  * Technical Execution: {{WEIGHT_TECHNICAL}}
  * Subject & Storytelling: {{WEIGHT_STORY}}
  * Originality & Creativity: {{WEIGHT_ORIGINALITY}}
  * Emotion & Atmosphere: {{WEIGHT_EMOTION}}
  * Overall Gestalt: {{WEIGHT_GESTALT}}
- Photographer's Stated Title: "{{PHOTO_TITLE}}"
- Photographer's Stated Intent/Story: "{{PHOTO_STORY}}"
- Preserved EXIF Hardware Data: {{EXIF_METADATA_JSON}}

SCORING BENCHMARK ANCHORS:
- 90-100 (Masterpiece): Flawless technical mastery, transcendent composition, evocative narrative, gallery-grade execution.
- 75-89 (High Professional): Strong intentional lighting, sharp critical focus, purposeful framing, minor creative clichés.
- 50-74 (Competent Amateur): Acceptable exposure and sharpness, standard snapshot framing, lacks deep narrative or refined tonality.
- 25-49 (Developing / Flawed): Noticeable camera shake, missed focus, blown highlights, cluttered composition.
- 0-24 (Unacceptable / Severely Defective): Completely blurry, pitch black or entirely clipped, corrupted, or non-photographic spam.

TASKS TO EXECUTE:
1. Forensic Inspection:
   - Examine high-frequency edges, anatomy, reflections, and texture consistency.
   - Assign syntheticLikelihood (0.0 = definitely authentic optical photo, 1.0 = definitely synthetic AI generation).
2. Photographic Composition Techniques:
   - Identify which of the 8 IAACLIP composition rules are actively utilized:
     ["Rule of Thirds", "Negative Space", "Color and Contrast", "Leading Lines", "Depth and Perspective", "Symmetry and Balance", "Focal Point", "Pattern and Repetition"].
3. Defect Deduction Analysis (Aftershoot criteria):
   - Check for: Accidental motion blur (DEF_BLUR_MOTION), missed focus (DEF_FOCUS_MISS), harsh clipped highlights (DEF_HIGHLIGHT_CLIP), extreme chroma noise (DEF_NOISE_EXTREME), closed eyes/blink in portrait (DEF_BLINK_CLOSED), sensor dust (DEF_SENSOR_DUST).
   - Deduct penalty points (0 to 30 total).
4. 8 Attribute Scores:
   - Award an integer score (0 to 100) for each of the 8 dimensions.
5. Theme Adherence Score:
   - Award a score (0 to 100) reflecting how authentically the image fits the theme "{{CATEGORY_NAME}}".
6. Compute Final Overall Score:
   - Calculate S_total using the formula:
     S_total = max(0, min(100, (sum(w_k * S_k) * (S_theme / 100)) - totalPenalty))
7. Generate Constructive Feedback:
   - strengths: 40-50 words highlighting compositional and artistic triumphs.
   - technicalAnalysis: 40-50 words objectively evaluating focus, light, and tonal range.
   - recommendations: 30-40 words giving actionable suggestions for next time.

Produce the exact JSON response conforming to the schema.
```

---

## 3. Concrete Example Outputs

### 3.1 Example 1: High-Aesthetic Award Contender (Landscape Category)

```json
{
  "overallScore": 92.4,
  "themeAdherenceScore": 98.0,
  "attributeScores": {
    "composition": 95,
    "lighting": 94,
    "colorHarmony": 92,
    "technicalExecution": 96,
    "subjectStory": 88,
    "originality": 86,
    "emotionAtmosphere": 95,
    "overallGestalt": 96
  },
  "detectedCompositionRules": [
    "Leading Lines",
    "Rule of Thirds",
    "Depth and Perspective",
    "Color and Contrast"
  ],
  "defectDeductions": {
    "totalPenalty": 0.0,
    "detectedDefects": []
  },
  "critique": {
    "strengths": "Magnificent sweeping composition where the glacial river forms a dynamic leading curve drawing the eye directly toward the mist-shrouded peak. The golden hour sidelight carves deep sculptural relief into the ridgeline, creating rich three-dimensional volume.",
    "technicalAnalysis": "Exceptional edge-to-edge sharpness with zero diffraction at f/8. Highlights on the snowpack retain delicate crystalline detail without clipping, while deep shadowed ravines show clean shadow recovery free of chromatic noise.",
    "recommendations": "Consider a minor dodge on the immediate bottom-left foreground boulders to balance visual weight against the luminous mountain face."
  },
  "forensicsSummary": {
    "syntheticLikelihood": 0.02,
    "isLikelyAuthenticPhoto": true,
    "forensicNotes": "Natural optical bokeh transition, coherent sensor PRNU grain, valid Sony A7R V EXIF metadata matching optical focal length."
  }
}
```

---

### 3.2 Example 2: Mid-Tier Amateur Entry (Street Photography Category)

```json
{
  "overallScore": 64.8,
  "themeAdherenceScore": 90.0,
  "attributeScores": {
    "composition": 62,
    "lighting": 68,
    "colorHarmony": 70,
    "technicalExecution": 58,
    "subjectStory": 76,
    "originality": 65,
    "emotionAtmosphere": 72,
    "overallGestalt": 66
  },
  "detectedCompositionRules": [
    "Rule of Thirds",
    "Focal Point"
  ],
  "defectDeductions": {
    "totalPenalty": 6.0,
    "detectedDefects": [
      {
        "defectCode": "DEF_BLUR_MOTION",
        "penaltyPoints": 6.0,
        "description": "Slight camera shake softness observed across the pedestrian's facial features due to 1/30s shutter speed."
      }
    ]
  },
  "critique": {
    "strengths": "Strong candid timing capturing a poignant interaction between the elderly vendor and the child. The warm neon reflections across the wet asphalt create an authentic, atmospheric street ambiance.",
    "technicalAnalysis": "Critical sharpness is compromised on the main subject due to hand-shake at 1/30 second. The highlights from the storefront neon sign are clipped slightly, losing secondary detail in the signage.",
    "recommendations": "Increase your shutter speed to at least 1/125s for candid street subjects, and step half a meter to the right to isolate the subjects from distracting background passersby."
  },
  "forensicsSummary": {
    "syntheticLikelihood": 0.05,
    "isLikelyAuthenticPhoto": true,
    "forensicNotes": "Authentic motion blur streaks and natural noise pattern consistent with Fujifilm X-Trans sensor at ISO 3200."
  }
}
```

---

### 3.3 Example 3: Disqualified Synthetic AI Generation (Flagged Entry)

```json
{
  "overallScore": 12.0,
  "themeAdherenceScore": 85.0,
  "attributeScores": {
    "composition": 40,
    "lighting": 35,
    "colorHarmony": 50,
    "technicalExecution": 15,
    "subjectStory": 25,
    "originality": 20,
    "emotionAtmosphere": 30,
    "overallGestalt": 25
  },
  "detectedCompositionRules": [
    "Focal Point"
  ],
  "defectDeductions": {
    "totalPenalty": 30.0,
    "detectedDefects": [
      {
        "defectCode": "DEF_SYNTHETIC_ANOMALY",
        "penaltyPoints": 30.0,
        "description": "Hallucinated anatomical structures on hands, impossible lighting reflections, and repeating grid pattern artifacts."
      }
    ]
  },
  "critique": {
    "strengths": "The concept presents an ambitious fantasy aesthetic with rich color saturation.",
    "technicalAnalysis": "Severe structural inconsistencies present: the subject's fingers merge unnaturally, pupil contours are non-elliptical, and clothing textures dissolve into diffuse noise rather than optical fabric weave.",
    "recommendations": "Pixel Prize requires authentic optical photography captured with physical camera hardware. Please submit original unrendered photographic captures."
  },
  "forensicsSummary": {
    "syntheticLikelihood": 0.98,
    "isLikelyAuthenticPhoto": false,
    "forensicNotes": "High-confidence synthetic diffusion generation. Lacks authentic camera PRNU fingerprint; high-frequency FFT reveals latent upscaling lattice."
  }
}
```

---

## 4. Prompt Versioning & Testing Guidelines

To ensure changes do not degrade scoring calibration:
1. **Semantic Versioning:** Prompts must follow `PROMPT_{PURPOSE}_V{MAJOR}_{MINOR}_{PATCH}` (e.g., `PROMPT_RUBRIC_V1_0_0`).
2. **Regression Benchmark Suite:** Before updating prompts in production, run the candidate prompt against a fixed Golden Test Set of 50 images:
   - 20 high-aesthetic images from AVA / TAD66K
   - 15 amateur photos with known defects
   - 15 synthetic AI images (Midjourney, SDXL, Flux)
3. **Acceptance Thresholds for Prompt Upgrades:**
   - Spearman Rank Correlation ($\text{SRCC}$) against Golden Set $\ge 0.82$.
   - Synthetic detection false positive rate $\le 2\%$.
   - 100% adherence to JSON Schema with zero parser breaks across 100 consecutive calls.
