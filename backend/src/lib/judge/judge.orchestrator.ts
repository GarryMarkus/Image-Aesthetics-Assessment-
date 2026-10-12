import { IJudgeAdapter, JudgeRequest, JudgeResult } from './judge.interface.js';
import { ScoringMath } from './scoring-math.js';
import { AttributeScores } from '../../types/index.js';
import { logger } from '../logger.js';

export interface OrchestratorResult extends JudgeResult {
  numPasses: number;
  passStandardDeviation?: number;
  requiresHumanAudit: boolean;
}

export class JudgeOrchestrator {
  private adapter: IJudgeAdapter;

  constructor(adapter: IJudgeAdapter) {
    this.adapter = adapter;
  }

  /**
   * Enforce blind evaluation: Strip all user identifiers, usernames, or author metadata
   * as required by docs/05_ai_judging_system.md Section 7.2
   */
  prepareBlindRequest(request: JudgeRequest): JudgeRequest {
    const sanitizedMetadata = {
      title: request.metadata.title,
      story: request.metadata.story,
      exif: request.metadata.exif ? { ...request.metadata.exif } : undefined,
    };

    // Remove any accidental user identity fields in EXIF
    if (sanitizedMetadata.exif) {
      delete sanitizedMetadata.exif.artist;
      delete sanitizedMetadata.exif.copyright;
      delete sanitizedMetadata.exif.ownerName;
      delete sanitizedMetadata.exif.serialNumber;
    }

    return {
      ...request,
      metadata: sanitizedMetadata,
    };
  }

  /**
   * Execute evaluation with automated Multi-Pass Borderline Calibration (N=3)
   * as specified in docs/05_ai_judging_system.md Section 7.1
   */
  async evaluateSubmission(
    request: JudgeRequest,
    options: { forceCalibration?: boolean; borderlineThreshold?: number } = {}
  ): Promise<OrchestratorResult> {
    const { forceCalibration = false, borderlineThreshold = 75.0 } = options;
    const blindRequest = this.prepareBlindRequest(request);

    // Initial Pass (T=0.2)
    const pass1 = await this.adapter.evaluate({
      ...blindRequest,
      options: { ...blindRequest.options, temperature: 0.2 },
    });

    const isBorderline = pass1.overallScore >= borderlineThreshold;
    const shouldCalibrate = forceCalibration || request.options?.numPasses === 3 || isBorderline;

    if (!shouldCalibrate) {
      return {
        ...pass1,
        numPasses: 1,
        requiresHumanAudit: false,
      };
    }

    logger.info(
      `[JudgeOrchestrator] Triggering 3-Pass Calibration for ${request.submissionId} (Score: ${pass1.overallScore})`
    );

    // Run passes 2 and 3
    const [pass2, pass3] = await Promise.all([
      this.adapter.evaluate({
        ...blindRequest,
        options: { ...blindRequest.options, temperature: 0.3 },
      }),
      this.adapter.evaluate({
        ...blindRequest,
        options: { ...blindRequest.options, temperature: 0.35 },
      }),
    ]);

    const passes = [pass1, pass2, pass3];
    const overallScores = passes.map((p) => p.overallScore);
    const meanOverall = overallScores.reduce((acc, s) => acc + s, 0) / 3.0;

    // Compute standard deviation across passes: sigma = sqrt(sum((x - mean)^2) / (N - 1))
    const variance =
      overallScores.reduce((acc, s) => acc + Math.pow(s - meanOverall, 2), 0) / 2.0;
    const sigma = Math.sqrt(variance);

    // Average the 8 orthogonal attribute scores
    const averagedAttributes: AttributeScores = {
      composition: Math.round((pass1.attributeScores.composition + pass2.attributeScores.composition + pass3.attributeScores.composition) / 3),
      lighting: Math.round((pass1.attributeScores.lighting + pass2.attributeScores.lighting + pass3.attributeScores.lighting) / 3),
      colorHarmony: Math.round((pass1.attributeScores.colorHarmony + pass2.attributeScores.colorHarmony + pass3.attributeScores.colorHarmony) / 3),
      technicalExecution: Math.round((pass1.attributeScores.technicalExecution + pass2.attributeScores.technicalExecution + pass3.attributeScores.technicalExecution) / 3),
      subjectStory: Math.round((pass1.attributeScores.subjectStory + pass2.attributeScores.subjectStory + pass3.attributeScores.subjectStory) / 3),
      originality: Math.round((pass1.attributeScores.originality + pass2.attributeScores.originality + pass3.attributeScores.originality) / 3),
      emotionAtmosphere: Math.round((pass1.attributeScores.emotionAtmosphere + pass2.attributeScores.emotionAtmosphere + pass3.attributeScores.emotionAtmosphere) / 3),
      overallGestalt: Math.round((pass1.attributeScores.overallGestalt + pass2.attributeScores.overallGestalt + pass3.attributeScores.overallGestalt) / 3),
    };

    const averagedThemeScore =
      Math.round(((pass1.themeAdherenceScore + pass2.themeAdherenceScore + pass3.themeAdherenceScore) / 3) * 10) / 10;
    const averagedPenalty =
      Math.round(((pass1.defectDeductions.totalPenalty + pass2.defectDeductions.totalPenalty + pass3.defectDeductions.totalPenalty) / 3) * 10) / 10;

    // Synthesize calibrated total score
    const calibratedTotal = ScoringMath.calculateTotalScore(
      averagedAttributes,
      request.category.weights,
      averagedThemeScore,
      averagedPenalty
    );

    // Merge deduplicated IAACLIP composition rules
    const uniqueRules = Array.from(
      new Set([
        ...pass1.detectedCompositionRules,
        ...pass2.detectedCompositionRules,
        ...pass3.detectedCompositionRules,
      ])
    );

    // Flag for human audit if standard deviation exceeds 6.0
    const requiresHumanAudit = sigma > 6.0;

    if (requiresHumanAudit) {
      logger.warn(
        `[JudgeOrchestrator] High stochastic variance detected on ${request.submissionId} (sigma: ${sigma.toFixed(2)} > 6.0). Flagging for secondary human audit.`
      );
    }

    return {
      ...pass1,
      overallScore: calibratedTotal,
      themeAdherenceScore: averagedThemeScore,
      attributeScores: averagedAttributes,
      detectedCompositionRules: uniqueRules,
      defectDeductions: {
        totalPenalty: averagedPenalty,
        detectedDefects: pass1.defectDeductions.detectedDefects,
      },
      numPasses: 3,
      passStandardDeviation: Math.round(sigma * 100) / 100,
      requiresHumanAudit,
    };
  }
}
