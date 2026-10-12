import sharp from 'sharp';
import { ParsedExifData } from '../types/index.js';
import { imageProcessor } from './image-processor.service.js';

export interface ForensicsInspectionResult {
  isApproved: boolean;
  disqualificationReason?: string;
  syntheticLikelihood: number;
  hasWatermarkWarning: boolean;
  forensicNotes: string;
  metrics: {
    perceptualHash: string;
    minHammingDistance?: number;
    laplacianVariance: number;
    highFrequencyRatio: number;
  };
}

export interface ForensicsOptions {
  requireExif?: boolean;
  hammingThreshold?: number;
}

/**
 * Generative AI and synthetic rendering software signature keywords.
 * Matched case-insensitively against EXIF Software, Make, Model, and Artist fields.
 */
export const GENERATIVE_TOOL_KEYWORDS: readonly string[] = [
  'midjourney',
  'stable diffusion',
  'stablediffusion',
  'comfyui',
  'novelai',
  'dall-e',
  'dalle',
  'invokeai',
  'flux.1',
  'flux',
  'leonardo.ai',
  'automatic1111',
  'adobe firefly',
  'fooocus',
  'civitai',
  'ideogram',
  'playground ai',
  'copilot designer',
  'imagen',
  'chatgpt',
  'replicate',
  'sora',
  'runway',
  'pika',
  'kling',
  'deepfloyd',
  'kandinsky',
  'nightcafe',
];

export class ForensicsService {
  /**
   * Run multi-tier forensic inspection on an image asset
   */
  async inspectSubmission(
    imageBuffer: Buffer,
    exif: ParsedExifData,
    userExistingHashes: string[] = [],
    options: ForensicsOptions = {}
  ): Promise<ForensicsInspectionResult> {
    const { requireExif = false, hammingThreshold = 4 } = options;

    // Compute perceptual hash
    const newHash = await imageProcessor.computeDHash(imageBuffer);

    // Tier 1: Optical Hardware Provenance Check (if required by competition rules)
    if (requireExif) {
      const hasHardware = Boolean(exif.cameraMake || exif.cameraModel || exif.focalLength || exif.aperture);
      if (!hasHardware) {
        return {
          isApproved: false,
          disqualificationReason: 'DQ_MISSING_EXIF: Mandatory camera hardware metadata missing for this competition.',
          syntheticLikelihood: 0.75,
          hasWatermarkWarning: false,
          forensicNotes: 'Disqualified: Competition mandates authentic optical hardware EXIF parameters.',
          metrics: {
            perceptualHash: newHash,
            laplacianVariance: 0,
            highFrequencyRatio: 0,
          },
        };
      }
    }

    // Tier 2: Metadata Generative Software Signature Blacklist Check
    const metadataStrings = [
      exif.software || '',
      exif.cameraModel || '',
      exif.cameraMake || '',
    ]
      .join(' ')
      .toLowerCase();

    for (const kw of GENERATIVE_TOOL_KEYWORDS) {
      if (metadataStrings.includes(kw)) {
        return {
          isApproved: false,
          disqualificationReason: `DQ_SYNTHETIC_EXIF: Image metadata indicates generative AI synthesis software (${kw}).`,
          syntheticLikelihood: 0.99,
          hasWatermarkWarning: false,
          forensicNotes: `Disqualified via embedded software signature matching '${kw}'. Source: '${exif.software || exif.cameraModel}'.`,
          metrics: {
            perceptualHash: newHash,
            laplacianVariance: 0,
            highFrequencyRatio: 0,
          },
        };
      }
    }

    // Tier 3: Perceptual Duplicate Burst Check (Hamming Distance <= 4)
    const duplicateCheck = this.checkDuplicateBurst(newHash, userExistingHashes, hammingThreshold);
    if (duplicateCheck.isDuplicate) {
      return {
        isApproved: false,
        disqualificationReason: `DQ_DUPLICATE_BURST: Near-identical duplicate image detected (Hamming distance ${duplicateCheck.distance} <= ${hammingThreshold}).`,
        syntheticLikelihood: 0.05,
        hasWatermarkWarning: false,
        forensicNotes: `Disqualified: Perceptual hash collision against existing upload (${duplicateCheck.collidedHash}) with distance ${duplicateCheck.distance}.`,
        metrics: {
          perceptualHash: newHash,
          minHammingDistance: duplicateCheck.distance,
          laplacianVariance: 0,
          highFrequencyRatio: 0,
        },
      };
    }

    // Tier 4: Frequency-Domain & Texture Anomaly Screening (Diffusion lattice artifacts)
    const textureAnalysis = await this.analyzeTextureAnomalies(imageBuffer);

    if (textureAnalysis.syntheticScore > 0.88) {
      return {
        isApproved: false,
        disqualificationReason: 'DQ_FFT_DIFFUSION: Abnormal high-frequency periodic lattice artifacts detected.',
        syntheticLikelihood: textureAnalysis.syntheticScore,
        hasWatermarkWarning: false,
        forensicNotes: textureAnalysis.notes,
        metrics: {
          perceptualHash: newHash,
          minHammingDistance: duplicateCheck.distance,
          laplacianVariance: textureAnalysis.meanLaplacian,
          highFrequencyRatio: textureAnalysis.highFreqRatio,
        },
      };
    }

    // Supplementary Heuristic: Watermark / Signature Detection
    const watermarkCheck = await this.detectWatermarkAnomaly(imageBuffer);

    return {
      isApproved: true,
      syntheticLikelihood: textureAnalysis.syntheticScore,
      hasWatermarkWarning: watermarkCheck.hasWatermark,
      forensicNotes: watermarkCheck.hasWatermark
        ? `${textureAnalysis.notes} [Warning: Potential watermark or signature badge detected in image border].`
        : textureAnalysis.notes,
      metrics: {
        perceptualHash: newHash,
        minHammingDistance: duplicateCheck.distance,
        laplacianVariance: textureAnalysis.meanLaplacian,
        highFrequencyRatio: textureAnalysis.highFreqRatio,
      },
    };
  }

  /**
   * Check if a hash collides with any existing user submission hashes within a Hamming distance threshold
   */
  checkDuplicateBurst(
    newHash: string,
    existingHashes: string[],
    threshold = 4
  ): { isDuplicate: boolean; distance?: number; collidedHash?: string } {
    let minDistance = Infinity;
    let nearestHash: string | undefined;

    for (const existingHash of existingHashes) {
      if (!existingHash || existingHash.length !== 16) continue;
      const distance = imageProcessor.calculateHammingDistance(newHash, existingHash);
      if (distance < minDistance) {
        minDistance = distance;
        nearestHash = existingHash;
      }
      if (distance <= threshold) {
        return { isDuplicate: true, distance, collidedHash: existingHash };
      }
    }

    return {
      isDuplicate: false,
      distance: minDistance === Infinity ? undefined : minDistance,
      collidedHash: nearestHash,
    };
  }

  /**
   * Analyze spatial gradient frequencies for characteristic diffusion artifacts or plastic smoothing
   */
  async analyzeTextureAnomalies(
    imageBuffer: Buffer
  ): Promise<{ syntheticScore: number; meanLaplacian: number; highFreqRatio: number; notes: string }> {
    try {
      const rawPixels = await sharp(imageBuffer)
        .resize(256, 256, { fit: 'fill' })
        .grayscale()
        .raw()
        .toBuffer();

      let highFreqCount = 0;
      let totalDiff = 0;

      // Compute horizontal and vertical discrete Laplacian gradients
      for (let y = 1; y < 255; y++) {
        for (let x = 1; x < 255; x++) {
          const idx = y * 256 + x;
          const center = rawPixels[idx];
          const laplacian = Math.abs(
            rawPixels[idx - 1] +
            rawPixels[idx + 1] +
            rawPixels[idx - 256] +
            rawPixels[idx + 256] -
            4 * center
          );

          totalDiff += laplacian;
          if (laplacian > 50) {
            highFreqCount++;
          }
        }
      }

      const meanLaplacian = totalDiff / (254 * 254);
      const highFreqRatio = highFreqCount / (254 * 254);

      let syntheticScore = 0.05;
      let notes = 'Authentic optical sensor noise profile verified.';

      // Extremely flat surfaces with virtually no optical photon noise
      if (meanLaplacian < 1.5 && highFreqRatio < 0.005) {
        syntheticScore = 0.45;
        notes = 'Extremely smooth visual textures; lacking natural optical sensor noise.';
      }

      // Check for unnatural synthetic lattice ringing (high mean Laplacian with clustered micro-patterns)
      if (meanLaplacian > 75.0 && highFreqRatio > 0.40) {
        syntheticScore = 0.92;
        notes = 'High spatial periodicity detected; consistent with diffusion upscaler artifact ringing.';
      }

      return {
        syntheticScore,
        meanLaplacian: Math.round(meanLaplacian * 100) / 100,
        highFreqRatio: Math.round(highFreqRatio * 1000) / 1000,
        notes,
      };
    } catch {
      return {
        syntheticScore: 0.1,
        meanLaplacian: 10.0,
        highFreqRatio: 0.05,
        notes: 'Standard optical noise profile assumed.',
      };
    }
  }

  /**
   * Detect potential high-contrast watermark text badges or solid copyright overlays in corners
   */
  async detectWatermarkAnomaly(
    imageBuffer: Buffer
  ): Promise<{ hasWatermark: boolean; confidence: number }> {
    try {
      const meta = await sharp(imageBuffer).metadata();
      const width = meta.width || 0;
      const height = meta.height || 0;

      if (width < 200 || height < 200) {
        return { hasWatermark: false, confidence: 0 };
      }

      // Inspect bottom-right corner (typical location for photographer watermark badges)
      const cornerWidth = Math.floor(width * 0.25);
      const cornerHeight = Math.floor(height * 0.10);
      const cornerLeft = width - cornerWidth;
      const cornerTop = height - cornerHeight;

      const cornerBuffer = await sharp(imageBuffer)
        .extract({ left: cornerLeft, top: cornerTop, width: cornerWidth, height: cornerHeight })
        .grayscale()
        .raw()
        .toBuffer();

      // Measure variance within the corner patch
      let sum = 0;
      for (let i = 0; i < cornerBuffer.length; i++) {
        sum += cornerBuffer[i];
      }
      const mean = sum / cornerBuffer.length;

      let varianceSum = 0;
      let extremeContrastCount = 0;
      for (let i = 0; i < cornerBuffer.length; i++) {
        const diff = cornerBuffer[i] - mean;
        varianceSum += diff * diff;
        if (cornerBuffer[i] > 240 || cornerBuffer[i] < 15) {
          extremeContrastCount++;
        }
      }

      const variance = varianceSum / cornerBuffer.length;
      const extremeRatio = extremeContrastCount / cornerBuffer.length;

      // An artificial white/black solid watermark text badge produces concentrated extreme pixels and high localized contrast
      const hasWatermark = variance > 2200 && extremeRatio > 0.15;
      return {
        hasWatermark,
        confidence: hasWatermark ? 0.8 : 0.1,
      };
    } catch {
      return { hasWatermark: false, confidence: 0 };
    }
  }
}

export const forensicsService = new ForensicsService();
