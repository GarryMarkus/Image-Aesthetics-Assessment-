import { IJudgeAdapter, JudgeRequest, JudgeResult } from './judge.interface.js';
import { ScoringMath } from './scoring-math.js';
import { AestheticEvaluationOutputZodSchema } from './schemas.js';
import { logger } from '../logger.js';

/**
 * Phase 2 In-House Model Adapter
 * Connects to the specialized deep aesthetic model serving cluster (InternVL2 / Qwen2-VL / Token-as-Score)
 * Defined in docs/07_model_abstraction_and_migration.md
 */
export class CustomModelJudgeAdapter implements IJudgeAdapter {
  private endpoint: string;
  private secret?: string;
  private maxRetries: number;
  private timeoutMs: number;

  constructor(endpoint: string, secret?: string, maxRetries = 3, timeoutMs = 30000) {
    this.endpoint = endpoint.replace(/\/$/, '');
    this.secret = secret;
    this.maxRetries = maxRetries;
    this.timeoutMs = timeoutMs;
  }

  getProviderName(): string {
    return 'custom_model';
  }

  async healthCheck(): Promise<{ isHealthy: boolean; details?: string }> {
    try {
      const healthUrl = this.endpoint.replace(/\/v1\/evaluate$/, '') + '/health';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(healthUrl, {
        method: 'GET',
        headers: this.secret ? { Authorization: `Bearer ${this.secret}` } : {},
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        return { isHealthy: true, details: `Custom model server operational at ${this.endpoint}` };
      }
      return { isHealthy: false, details: `HTTP ${res.status}: ${res.statusText}` };
    } catch (err: any) {
      return { isHealthy: false, details: `Inference server unreachable: ${err.message}` };
    }
  }

  async evaluate(request: JudgeRequest): Promise<JudgeResult> {
    const startTime = Date.now();
    const payload = {
      submissionId: request.submissionId,
      imageUrl: request.imageUrl,
      imageBase64: request.imageBuffer.toString('base64'),
      mimeType: request.mimeType,
      category: {
        code: request.category.code,
        name: request.category.name,
        description: request.category.description,
        weights: request.category.weights,
      },
      metadata: request.metadata,
      options: request.options,
    };

    let lastError: any;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        const res = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.secret ? { Authorization: `Bearer ${this.secret}` } : {}),
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          const errorText = await res.text();
          if ((res.status === 429 || res.status >= 500) && attempt < this.maxRetries) {
            const backoffMs = Math.min(10000, 1000 * Math.pow(2, attempt - 1) + Math.random() * 500);
            logger.warn(
              `[CustomModelJudgeAdapter] Retryable error (HTTP ${res.status}, attempt ${attempt}/${this.maxRetries}). Retrying in ${Math.round(backoffMs)}ms...`
            );
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
            continue;
          }
          throw new Error(`Inference server responded with ${res.status}: ${errorText}`);
        }

        const rawJson: any = await res.json();
        const parsed = AestheticEvaluationOutputZodSchema.parse(rawJson);
        const latencyMs = Date.now() - startTime;

        // Deterministic mathematical synthesis verification
        const computedOverall = ScoringMath.calculateTotalScore(
          parsed.attributeScores,
          request.category.weights,
          parsed.themeAdherenceScore ?? 100,
          parsed.defectDeductions?.totalPenalty ?? 0
        );

        return {
          provider: 'custom_model',
          modelVersion: rawJson.modelVersion || 'inhouse-internvl2-8b-v1',
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
            forensicNotes: 'Evaluated by in-house multimodal aesthetic model.',
          },
          rawOutput: parsed,
        };
      } catch (error: any) {
        lastError = error;
        if (attempt < this.maxRetries) {
          const backoffMs = Math.min(10000, 1000 * Math.pow(2, attempt - 1) + Math.random() * 500);
          logger.warn(
            `[CustomModelJudgeAdapter] Transient error (attempt ${attempt}/${this.maxRetries}): ${error.message}. Retrying in ${Math.round(backoffMs)}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          continue;
        }
        logger.error(`CustomModelJudgeAdapter evaluation failed at ${this.endpoint}`, error);
        throw error;
      }
    }
    throw lastError;
  }
}
