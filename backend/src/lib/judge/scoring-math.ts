import { AttributeScores, RubricWeights } from '../../types/index.js';

export class ScoringMath {
  /**
   * Calculate Total Normalized Aesthetic Score (0 - 100)
   * Formula: S_total = max(0, min(100, (sum(w_k * S_k) * (S_theme / 100)) - P_defect))
   */
  static calculateTotalScore(
    attributeScores: AttributeScores,
    weights: RubricWeights,
    themeAdherenceScore: number,
    defectPenaltyPoints: number
  ): number {
    // 1. Compute weighted attribute sum
    const weightedSum =
      weights.composition * attributeScores.composition +
      weights.lighting * attributeScores.lighting +
      weights.colorHarmony * attributeScores.colorHarmony +
      weights.technicalExecution * attributeScores.technicalExecution +
      weights.subjectStory * attributeScores.subjectStory +
      weights.originality * attributeScores.originality +
      weights.emotionAtmosphere * attributeScores.emotionAtmosphere +
      weights.overallGestalt * attributeScores.overallGestalt;

    // 2. Apply theme adherence multiplier (0.0 to 1.0)
    const themeFactor = Math.max(0, Math.min(100, themeAdherenceScore)) / 100.0;
    const themeAdjustedScore = weightedSum * themeFactor;

    // 3. Deduct defect penalty points
    const penalizedScore = themeAdjustedScore - Math.max(0, defectPenaltyPoints);

    // 4. Bound to [0.0, 100.0] and round to 2 decimal places
    const finalScore = Math.max(0, Math.min(100, penalizedScore));
    return Math.round(finalScore * 100) / 100;
  }

  /**
   * Validate that rubric weights sum to approximately 1.0 (100%)
   */
  static validateWeights(weights: RubricWeights): boolean {
    const sum =
      weights.composition +
      weights.lighting +
      weights.colorHarmony +
      weights.technicalExecution +
      weights.subjectStory +
      weights.originality +
      weights.emotionAtmosphere +
      weights.overallGestalt;

    return Math.abs(sum - 1.0) < 0.001;
  }
}
