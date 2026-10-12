import {
  AttributeScores,
  DefectDeductions,
  CritiqueContent,
  ForensicsSummary,
  RubricWeights,
} from '../../types/index.js';

export interface JudgeCategoryContext {
  code: string;
  name: string;
  description: string;
  weights: RubricWeights;
}

export interface JudgeRequest {
  submissionId: string;
  imageBuffer: Buffer;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  imageUrl: string;
  category: JudgeCategoryContext;
  metadata: {
    title: string;
    story?: string;
    exif?: Record<string, any>;
  };
  options?: {
    numPasses?: number;
    temperature?: number;
  };
}

export interface JudgeResult {
  provider: 'gemini' | 'custom_model' | 'mock';
  modelVersion: string;
  latencyMs: number;
  overallScore: number;
  themeAdherenceScore: number;
  attributeScores: AttributeScores;
  detectedCompositionRules: string[];
  defectDeductions: DefectDeductions;
  critique: CritiqueContent;
  forensicsSummary: ForensicsSummary;
  rawOutput?: Record<string, any>;
}

export interface IJudgeAdapter {
  evaluate(request: JudgeRequest): Promise<JudgeResult>;
  healthCheck(): Promise<{ isHealthy: boolean; details?: string }>;
  getProviderName(): string;
}
