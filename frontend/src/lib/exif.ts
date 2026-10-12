import exifr from "exifr";
import { ExifMetadata } from "@/types";

export interface ParsedExifResult {
  exif: ExifMetadata;
  hasExif: boolean;
  width?: number;
  height?: number;
}

export async function parseClientExif(file: File): Promise<ParsedExifResult> {
  try {
    const raw = await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: false, // Privacy first: strip GPS on client
    });

    if (!raw) {
      return {
        exif: {
          id: `exif_temp_${Date.now()}`,
          submissionId: "",
          cameraMake: null,
          cameraModel: null,
          lensModel: null,
          focalLengthMm: null,
          iso: null,
          apertureFNumber: null,
          shutterSpeedFraction: null,
          dateTaken: null,
        },
        hasExif: false,
      };
    }

    // Format shutter speed to standard photographic fraction (e.g. 0.0004 -> 1/2500s)
    let shutterStr: string | null = null;
    if (raw.ExposureTime) {
      if (raw.ExposureTime < 1) {
        const denom = Math.round(1 / raw.ExposureTime);
        shutterStr = `1/${denom}s`;
      } else {
        shutterStr = `${raw.ExposureTime}s`;
      }
    }

    const exif: ExifMetadata = {
      id: `exif_temp_${Date.now()}`,
      submissionId: "",
      cameraMake: raw.Make || null,
      cameraModel: raw.Model || null,
      lensModel: raw.LensModel || null,
      focalLengthMm: raw.FocalLength ? Math.round(raw.FocalLength) : null,
      iso: raw.ISO || null,
      apertureFNumber: raw.FNumber ? Number(raw.FNumber.toFixed(1)) : null,
      shutterSpeedFraction: shutterStr,
      dateTaken: raw.DateTimeOriginal ? new Date(raw.DateTimeOriginal).toISOString() : null,
    };

    const hasExif = Boolean(exif.cameraMake || exif.cameraModel || exif.apertureFNumber);

    return {
      exif,
      hasExif,
      width: raw.ExifImageWidth,
      height: raw.ExifImageHeight,
    };
  } catch (err) {
    console.warn("Client EXIF extraction skipped or failed", err);
    return {
      exif: {
        id: `exif_temp_${Date.now()}`,
        submissionId: "",
        cameraMake: null,
        cameraModel: null,
        lensModel: null,
        focalLengthMm: null,
        iso: null,
        apertureFNumber: null,
        shutterSpeedFraction: null,
        dateTaken: null,
      },
      hasExif: false,
    };
  }
}
