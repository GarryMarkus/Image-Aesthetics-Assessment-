import sharp from 'sharp';

export interface ProcessedDerivatives {
  originalMetadata: {
    width: number;
    height: number;
    format: string;
    sizeBytes: number;
  };
  thumbnailBuffer: Buffer;
  webBuffer: Buffer;
  aiNormalBuffer: Buffer;
  dHash: string;
}

export class ImageProcessorService {
  /**
   * Process a raw image buffer into standardized derivatives and compute perceptual dHash
   */
  async processImage(buffer: Buffer): Promise<ProcessedDerivatives> {
    const sharpOpts = { failOn: 'none' as const, limitInputPixels: 50_000_000 };
    const image = sharp(buffer, sharpOpts);
    const metadata = await image.metadata();

    const width = metadata.width || 0;
    const height = metadata.height || 0;
    const format = metadata.format || 'unknown';
    const sizeBytes = buffer.length;

    // 1. Generate 400px Thumbnail (WebP, quality 80)
    const thumbnailBuffer = await sharp(buffer, sharpOpts)
      .resize({
        width: width >= height ? 400 : undefined,
        height: height > width ? 400 : undefined,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();

    // 2. Generate 1600px Web Display (WebP, quality 85, stripped of sensitive EXIF)
    const webBuffer = await sharp(buffer, sharpOpts)
      .resize({
        width: width >= height ? 1600 : undefined,
        height: height > width ? 1600 : undefined,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();

    // 3. Generate 1024px AI Normal variant (JPEG, quality 90, sRGB)
    const aiNormalBuffer = await sharp(buffer, sharpOpts)
      .resize({
        width: width >= height ? 1024 : undefined,
        height: height > width ? 1024 : undefined,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toColorspace('srgb')
      .jpeg({ quality: 90 })
      .toBuffer();

    // 4. Compute 64-bit difference hash (dHash)
    const dHash = await this.computeDHash(buffer);

    return {
      originalMetadata: {
        width,
        height,
        format,
        sizeBytes,
      },
      thumbnailBuffer,
      webBuffer,
      aiNormalBuffer,
      dHash,
    };
  }

  /**
   * Compute 64-bit Difference Hash (dHash) via 9x8 grayscale matrix
   */
  async computeDHash(buffer: Buffer): Promise<string> {
    // Resize to 9 width x 8 height in grayscale
    const data = await sharp(buffer)
      .resize(9, 8, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer();

    let hash = BigInt(0);

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const leftPixel = data[row * 9 + col];
        const rightPixel = data[row * 9 + col + 1];

        hash = hash << BigInt(1);
        if (leftPixel > rightPixel) {
          hash = hash | BigInt(1);
        }
      }
    }

    return hash.toString(16).padStart(16, '0');
  }

  /**
   * Calculate Hamming Distance between two 64-bit hex difference hashes
   */
  calculateHammingDistance(hash1: string, hash2: string): number {
    const val1 = BigInt(`0x${hash1}`);
    const val2 = BigInt(`0x${hash2}`);

    let xor = val1 ^ val2;
    let distance = 0;

    while (xor > BigInt(0)) {
      distance += Number(xor & BigInt(1));
      xor = xor >> BigInt(1);
    }

    return distance;
  }
}

export const imageProcessor = new ImageProcessorService();
