import { GoogleGenAI } from '@google/genai';
import { IJudgeAdapter, JudgeRequest, JudgeResult } from './judge.interface.js';
import { AESTHETIC_EVALUATION_SCHEMA } from './schemas.js';
import { SYSTEM_PROMPT_IAA_JUDGE_V1, buildRubricPrompt } from './prompts.js';
import { ScoringMath } from './scoring-math.js';
import { logger } from '../logger.js';

export class GeminiJudgeAdapter implements IJudgeAdapter {
  private ai: GoogleGenAI;
  private modelName: string;

  constructor(apiKey: string, modelName = 'gemini-2.5-flash') {
    this.ai = new GoogleGenAI({ apiKey });
    this.modelName = modelName;
  }

  getProviderName(): string {
    return 'gemini';
  }

  async healthCheck(): Promise<{ isHealthy: boolean; details?: string }> {
    try {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: 'PING',
      });
      return { isHealthy: Boolean(response.text) };
    } catch (err: any) {
      return { isHealthy: false, details: err.message };
    }
  }

  async evaluate(request: JudgeRequest): Promise<JudgeResult> {
    const startTime = Date.now();
    const promptText = buildRubricPrompt(request);

    try {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        config: {
          systemInstruction: SYSTEM_PROMPT_IAA_JUDGE_V1,
          temperature: request.options?.temperature ?? 0.2,
          topP: 0.95,
          responseMimeType: 'application/json',
          responseSchema: AESTHETIC_EVALUATION_SCHEMA,
        },
        contents: [
          {
            inlineData: {
              mimeType: request.mimeType,
              data: request.imageBuffer.toString('base64'),
            },
          },
          { text: promptText },
        ],
      });

      const rawText = response.text || '{}';
      const parsed = JSON.parse(rawText);
      const latencyMs = Date.now() - startTime;

      // Recalculate deterministic overall score using ScoringMath formula
      const computedOverall = ScoringMath.calculateTotalScore(
        parsed.attributeScores,
        request.category.weights,
        parsed.themeAdherenceScore ?? 100,
        parsed.defectDeductions?.totalPenalty ?? 0
      );

      return {
        provider: 'gemini',
        modelVersion: this.modelName,
        latencyMs,
        overallScore: computedOverall,
        themeAdherenceScore: parsed.themeAdherenceScore ?? 100,
        attributeScores: parsed.attributeScores,
        detectedCompositionRules: parsed.detectedCompositionRules ?? [],
        defectDeductions: parsed.defectDeductions ?? { totalPenalty: 0, detectedDefects: [] },
        critique: parsed.critique,
        forensicsSummary: parsed.forensicsSummary ?? {
          syntheticLikelihood: 0.05,
          isLikelyAuthenticPhoto: true,
          forensicNotes: 'Evaluated by multimodal vision model.',
        },
        rawOutput: parsed,
      };
    } catch (error: any) {
      logger.error('GeminiJudgeAdapter evaluation failed', error);
      throw error;
    }
  }
}
