export enum Role {
  PARTICIPANT = 'PARTICIPANT',
  ORGANIZER = 'ORGANIZER',
  JUROR = 'JUROR',
  ADMIN = 'ADMIN',
}

export enum CompetitionStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  JUDGING = 'JUDGING',
  SHORTLISTED = 'SHORTLISTED',
  RESULTS_PUBLISHED = 'RESULTS_PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum SubmissionStatus {
  IN_QUEUE = 'IN_QUEUE',
  SCORED = 'SCORED',
  SHORTLISTED = 'SHORTLISTED',
  FLAGGED_DISQUALIFIED = 'FLAGGED_DISQUALIFIED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum PodiumRank {
  FIRST_PLACE = 'FIRST_PLACE',
  SECOND_PLACE = 'SECOND_PLACE',
  THIRD_PLACE = 'THIRD_PLACE',
  HONORABLE_MENTION = 'HONORABLE_MENTION',
}

export enum AppealStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

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
