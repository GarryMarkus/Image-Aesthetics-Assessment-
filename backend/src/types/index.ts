import {
  Role,
  CompetitionStatus,
  SubmissionStatus,
  PodiumRank,
  AppealStatus,
} from '@prisma/client';

export {
  Role,
  CompetitionStatus,
  SubmissionStatus,
  PodiumRank,
  AppealStatus,
};

export interface RubricWeights {
  composition: number;
  lighting: number;
  colorHarmony: number;
  technicalExecution: number;
  subjectStory: number;
  originality: number;
  emotionAtmosphere: number;
  overallGestalt: number;
}

export interface AttributeScores {
  composition: number;
  lighting: number;
  colorHarmony: number;
  technicalExecution: number;
  subjectStory: number;
  originality: number;
  emotionAtmosphere: number;
  overallGestalt: number;
}

export interface DefectItem {
  defectCode: string;
  penaltyPoints: number;
  description: string;
}

export interface DefectDeductions {
  totalPenalty: number;
  detectedDefects: DefectItem[];
}

export interface CritiqueContent {
  strengths: string;
  technicalAnalysis: string;
  recommendations: string;
}

export interface ForensicsSummary {
  syntheticLikelihood: number;
  isLikelyAuthenticPhoto: boolean;
  forensicNotes: string;
}

export interface ParsedExifData {
  cameraMake?: string;
  cameraModel?: string;
  lensModel?: string;
  focalLength?: number;
  aperture?: number;
  shutterSpeed?: string;
  iso?: number;
  captureTime?: Date;
  software?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
}
