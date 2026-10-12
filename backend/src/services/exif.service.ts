import exifr from 'exifr';
import { ParsedExifData } from '../types/index.js';
import { logger } from '../lib/logger.js';

export class ExifService {
  /**
   * Parse optical hardware EXIF metadata from raw image buffer
   */
  async parseExif(buffer: Buffer): Promise<ParsedExifData> {
    try {
      const data = await exifr.parse(buffer, {
        tiff: true,
        exif: true,
        gps: true,
        iptc: true,
      });

      if (!data) {
        return {};
      }

      // Format shutter speed (e.g. 0.00625 -> "1/160")
      let shutterSpeedFormatted: string | undefined;
      if (data.ExposureTime) {
        if (data.ExposureTime < 1) {
          shutterSpeedFormatted = `1/${Math.round(1 / data.ExposureTime)}`;
        } else {
          shutterSpeedFormatted = `${data.ExposureTime}s`;
        }
      }

      return {
        cameraMake: data.Make ? String(data.Make).trim() : undefined,
        cameraModel: data.Model ? String(data.Model).trim() : undefined,
        lensModel: data.LensModel ? String(data.LensModel).trim() : undefined,
        focalLength: typeof data.FocalLength === 'number' ? data.FocalLength : undefined,
        aperture: typeof data.FNumber === 'number' ? data.FNumber : undefined,
        shutterSpeed: shutterSpeedFormatted,
        iso: typeof data.ISO === 'number' ? data.ISO : undefined,
        captureTime: data.DateTimeOriginal instanceof Date ? data.DateTimeOriginal : undefined,
        software: data.Software ? String(data.Software).trim() : undefined,
        gpsLatitude: typeof data.latitude === 'number' ? data.latitude : undefined,
        gpsLongitude: typeof data.longitude === 'number' ? data.longitude : undefined,
      };
    } catch (error) {
      logger.warn('Failed to parse EXIF metadata from image buffer', error);
      return {};
    }
  }

  /**
   * Check if image has valid optical camera hardware provenance
   */
  hasValidHardwareMetadata(exif: ParsedExifData): boolean {
    return Boolean(exif.cameraMake || exif.cameraModel || exif.focalLength || exif.aperture);
  }
}

export const exifService = new ExifService();
