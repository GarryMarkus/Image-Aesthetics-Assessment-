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
