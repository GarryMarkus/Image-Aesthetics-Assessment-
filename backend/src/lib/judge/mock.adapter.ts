import { IJudgeAdapter, JudgeRequest, JudgeResult } from './judge.interface.js';
import { ScoringMath } from './scoring-math.js';

export class MockJudgeAdapter implements IJudgeAdapter {
  getProviderName(): string {
    return 'mock';
  }

  async healthCheck(): Promise<{ isHealthy: boolean; details?: string }> {
    return { isHealthy: true, details: 'Mock judge adapter is operational' };
  }

  async evaluate(request: JudgeRequest): Promise<JudgeResult> {
    const startTime = Date.now();

    // Generate deterministic, realistic scores based on category weights
    const attributeScores = {
      composition: 88,
      lighting: 86,
      colorHarmony: 84,
      technicalExecution: 85,
      subjectStory: 82,
      originality: 78,
      emotionAtmosphere: 83,
      overallGestalt: 84,
    };

    const themeAdherenceScore = 95.0;
    const defectPenaltyPoints = 0.0;

    const weights = request.category.weights || (request.category as any).rubricWeights;
    const computedOverall = ScoringMath.calculateTotalScore(
      attributeScores,
      weights,
      themeAdherenceScore,
      defectPenaltyPoints
    );

    const latencyMs = Date.now() - startTime + 120;

    return {
      provider: 'mock',
      modelVersion: 'mock-judge-v1',
      latencyMs,
      overallScore: computedOverall,
      themeAdherenceScore,
      attributeScores,
      detectedCompositionRules: ['Leading Lines', 'Rule of Thirds', 'Color and Contrast'],
      defectDeductions: {
        totalPenalty: 0,
        detectedDefects: [],
      },
      critique: {
        strengths: `Exceptional control of spatial depth and balance in ${request.category.name}. The focal framing guides the eye naturally through the visual frame.`,
        technicalAnalysis: 'Crisp micro-contrast on the primary subject plane. Dynamic range is preserved with delicate highlight roll-off and clean shadow tonality.',
        recommendations: 'Experiment with slightly tighter framing to eliminate minor peripheral background distraction.',
      },
      forensicsSummary: {
        syntheticLikelihood: 0.02,
        isLikelyAuthenticPhoto: true,
        forensicNotes: 'Mock adapter evaluated. Authentic optical sensor profile simulated.',
      },
    };
  }
}
