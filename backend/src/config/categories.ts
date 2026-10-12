import { RubricWeights } from '../types/index.js';

export interface StandardCategoryDefinition {
  code: string;
  name: string;
  description: string;
  rubricWeights: RubricWeights;
}

/**
 * 9 Standard TAD66K-Aligned Photography Competition Categories
 * Derived from Pan Zhang (2018), ArtiMuse (CVPR 2026), and TAD66K (He et al.)
 */
export const STANDARD_CATEGORIES: Record<string, StandardCategoryDefinition> = {
  GENERAL: {
    code: 'GENERAL',
    name: 'General & Open Creative',
    description: 'Balanced open competition for all genres of creative and fine-art photography.',
    rubricWeights: {
      composition: 0.20,
      lighting: 0.15,
      colorHarmony: 0.15,
      technicalExecution: 0.15,
      subjectStory: 0.15,
      originality: 0.10,
      emotionAtmosphere: 0.05,
      overallGestalt: 0.05,
    },
  },
  LANDSCAPE: {
    code: 'LANDSCAPE',
    name: 'Landscape & Nature',
    description: 'Expansive natural vistas, mountain wilderness, geological formations, and serene waterscapes.',
    rubricWeights: {
      composition: 0.25,
      lighting: 0.20,
      colorHarmony: 0.20,
      technicalExecution: 0.15,
      subjectStory: 0.05,
      originality: 0.05,
      emotionAtmosphere: 0.05,
      overallGestalt: 0.05,
    },
  },
  PORTRAIT: {
    code: 'PORTRAIT',
    name: 'Portrait & People',
    description: 'Intimate human connection, facial character, expressive gestures, and evocative studio or environmental lighting.',
    rubricWeights: {
      composition: 0.15,
      lighting: 0.20,
      colorHarmony: 0.10,
      technicalExecution: 0.20,
      subjectStory: 0.20,
      originality: 0.05,
      emotionAtmosphere: 0.10,
      overallGestalt: 0.00,
    },
  },
  STREET: {
    code: 'STREET',
    name: 'Street Photography & Candid Moments',
    description: 'Unposed, authentic decisive moments captured in public urban environments, celebrating human life and serendipity.',
    rubricWeights: {
      composition: 0.15,
      lighting: 0.10,
      colorHarmony: 0.05,
      technicalExecution: 0.05,
      subjectStory: 0.30,
      originality: 0.20,
      emotionAtmosphere: 0.15,
      overallGestalt: 0.00,
    },
  },
  MACRO: {
    code: 'MACRO',
    name: 'Macro & Micro Photography',
    description: 'Extreme close-up photography revealing minute textures, flora, insects, and optical micro-structures.',
    rubricWeights: {
      composition: 0.15,
      lighting: 0.15,
      colorHarmony: 0.15,
      technicalExecution: 0.35,
      subjectStory: 0.05,
      originality: 0.05,
      emotionAtmosphere: 0.05,
      overallGestalt: 0.05,
    },
  },
  ARCHITECTURE: {
    code: 'ARCHITECTURE',
    name: 'Architecture & Spatial Geometry',
    description: 'Structural design, leading lines, geometric convergence, modern facades, and historic built environments.',
    rubricWeights: {
      composition: 0.30,
      lighting: 0.15,
      colorHarmony: 0.10,
      technicalExecution: 0.20,
      subjectStory: 0.05,
      originality: 0.10,
      emotionAtmosphere: 0.00,
      overallGestalt: 0.10,
    },
  },
  MONOCHROME: {
    code: 'MONOCHROME',
    name: 'Fine-Art Monochrome',
    description: 'Mastery of light, shadow, zone contrast, and tonal separation in pure black and white.',
    rubricWeights: {
      composition: 0.20,
      lighting: 0.30,
      colorHarmony: 0.00,
      technicalExecution: 0.15,
      subjectStory: 0.15,
      originality: 0.10,
      emotionAtmosphere: 0.05,
      overallGestalt: 0.05,
    },
  },
  WILDLIFE: {
    code: 'WILDLIFE',
    name: 'Wildlife & Animal Behavior',
    description: 'Wild fauna in native habitats, behavioral moments, animal portraits, and environmental storytelling.',
    rubricWeights: {
      composition: 0.20,
      lighting: 0.15,
      colorHarmony: 0.10,
      technicalExecution: 0.25,
      subjectStory: 0.20,
      originality: 0.05,
      emotionAtmosphere: 0.05,
      overallGestalt: 0.00,
    },
  },
  NIGHT: {
    code: 'NIGHT',
    name: 'Night & Astrophotography',
    description: 'Celestial nightscapes, milky way galactic core, aurora borealis, and long-exposure darkroom captures.',
    rubricWeights: {
      composition: 0.20,
      lighting: 0.25,
      colorHarmony: 0.15,
      technicalExecution: 0.25,
      subjectStory: 0.05,
      originality: 0.05,
      emotionAtmosphere: 0.05,
      overallGestalt: 0.00,
    },
  },
};
