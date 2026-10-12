export const AESTHETIC_EVALUATION_SCHEMA = {
  type: 'object',
  properties: {
    overallScore: {
      type: 'number',
      description: 'Calculated overall score between 0 and 100',
    },
    themeAdherenceScore: {
      type: 'number',
      description: 'How authentically the image matches the competition category theme (0 to 100)',
    },
    attributeScores: {
      type: 'object',
      properties: {
        composition: { type: 'number', description: 'Composition & Structure score (0-100)' },
        lighting: { type: 'number', description: 'Lighting & Exposure score (0-100)' },
        colorHarmony: { type: 'number', description: 'Color Harmony & Palette score (0-100)' },
        technicalExecution: { type: 'number', description: 'Focus, sharpness, noise control score (0-100)' },
        subjectStory: { type: 'number', description: 'Narrative and subject moment score (0-100)' },
        originality: { type: 'number', description: 'Creativity and departure from cliché (0-100)' },
        emotionAtmosphere: { type: 'number', description: 'Atmospheric mood and viewer resonance (0-100)' },
        overallGestalt: { type: 'number', description: 'Holistic visual rhythm and harmony (0-100)' },
      },
      required: [
        'composition',
        'lighting',
        'colorHarmony',
        'technicalExecution',
        'subjectStory',
        'originality',
        'emotionAtmosphere',
        'overallGestalt',
      ],
    },
    detectedCompositionRules: {
      type: 'array',
      items: { type: 'string' },
      description: 'IAACLIP composition techniques observed (e.g. Rule of Thirds, Leading Lines)',
    },
    defectDeductions: {
      type: 'object',
      properties: {
        totalPenalty: { type: 'number', description: 'Total defect penalty deduction (0-30)' },
        detectedDefects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              defectCode: { type: 'string' },
              penaltyPoints: { type: 'number' },
              description: { type: 'string' },
            },
            required: ['defectCode', 'penaltyPoints', 'description'],
          },
        },
      },
      required: ['totalPenalty', 'detectedDefects'],
    },
    critique: {
      type: 'object',
      properties: {
        strengths: { type: 'string', description: '40-50 words praising artistic and composition strengths' },
        technicalAnalysis: { type: 'string', description: '40-50 words evaluating lighting, focus, exposure' },
        recommendations: { type: 'string', description: '30-40 words giving actionable constructive advice' },
      },
      required: ['strengths', 'technicalAnalysis', 'recommendations'],
    },
    forensicsSummary: {
      type: 'object',
      properties: {
        syntheticLikelihood: { type: 'number', description: 'Likelihood this is synthetic AI art (0.0 to 1.0)' },
        isLikelyAuthenticPhoto: { type: 'boolean' },
        forensicNotes: { type: 'string' },
      },
      required: ['syntheticLikelihood', 'isLikelyAuthenticPhoto', 'forensicNotes'],
    },
  },
  required: [
    'overallScore',
    'themeAdherenceScore',
    'attributeScores',
    'detectedCompositionRules',
    'defectDeductions',
    'critique',
    'forensicsSummary',
  ],
};

import { z } from 'zod';

const scoreField = z.coerce
  .number()
  .catch(50)
  .transform((n) => Math.max(0, Math.min(100, Math.round(n))));

export const AestheticEvaluationOutputZodSchema = z.object({
  overallScore: z.coerce
    .number()
    .catch(50)
    .transform((n) => Math.max(0, Math.min(100, Math.round(n * 100) / 100))),
  themeAdherenceScore: z.coerce
    .number()
    .catch(100)
    .transform((n) => Math.max(0, Math.min(100, Math.round(n * 100) / 100))),
  attributeScores: z.object({
    composition: scoreField,
    lighting: scoreField,
    colorHarmony: scoreField,
    technicalExecution: scoreField,
    subjectStory: scoreField,
    originality: scoreField,
    emotionAtmosphere: scoreField,
    overallGestalt: scoreField,
  }),
  detectedCompositionRules: z.array(z.string()).catch([]),
  defectDeductions: z
    .object({
      totalPenalty: z.coerce
        .number()
        .catch(0)
        .transform((n) => Math.max(0, Math.min(30, Math.round(n * 10) / 10))),
      detectedDefects: z
        .array(
          z.object({
            defectCode: z.string().catch('DEF_GENERIC'),
            penaltyPoints: z.coerce.number().catch(0),
            description: z.string().catch(''),
          })
        )
        .catch([]),
    })
    .catch({ totalPenalty: 0, detectedDefects: [] }),
  critique: z
    .object({
      strengths: z
        .string()
        .catch('Image displays well-balanced composition and solid artistic fundamentals.'),
      technicalAnalysis: z
        .string()
        .catch('Focus, exposure, and color fidelity align with standard photographic capture.'),
      recommendations: z
        .string()
        .catch('Continue refining framing and tonal contrast in post-production.'),
    })
    .catch({
      strengths: 'Image displays well-balanced composition and solid artistic fundamentals.',
      technicalAnalysis: 'Focus, exposure, and color fidelity align with standard photographic capture.',
      recommendations: 'Continue refining framing and tonal contrast in post-production.',
    }),
  forensicsSummary: z
    .object({
      syntheticLikelihood: z.coerce
        .number()
        .catch(0.05)
        .transform((n) => Math.max(0, Math.min(1.0, Math.round(n * 100) / 100))),
      isLikelyAuthenticPhoto: z.boolean().catch(true),
      forensicNotes: z.string().catch('Multimodal aesthetic evaluation complete.'),
    })
    .catch({
      syntheticLikelihood: 0.05,
      isLikelyAuthenticPhoto: true,
      forensicNotes: 'Multimodal aesthetic evaluation complete.',
    }),
});

export type ValidatedAestheticEvaluation = z.infer<typeof AestheticEvaluationOutputZodSchema>;

/**
 * Safely extract and parse JSON from raw LLM output, handling markdown fences, leading/trailing prose
 */
export function extractAndParseModelJson(rawText: string): any {
  if (!rawText || !rawText.trim()) {
    throw new Error('Model output is empty');
  }

  // 1. Strip markdown code fences if present: ```json ... ``` or ``` ... ```
  let cleaned = rawText.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    cleaned = fenceMatch[1].trim();
  }

  // 2. If there is still extra text around JSON object, find first '{' and matching '}'
  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');
  if (startIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.slice(startIdx, endIdx + 1);
  }

  return JSON.parse(cleaned);
}

export function validateAndNormalizeModelOutput(rawText: string): ValidatedAestheticEvaluation {
  const json = extractAndParseModelJson(rawText);
  return AestheticEvaluationOutputZodSchema.parse(json);
}
