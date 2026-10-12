import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env.js';
import { logger } from './logger.js';

export interface StorageService {
  getPresignedUploadUrl(key: string, mimeType: string, expiresInSeconds?: number): Promise<string>;
  uploadBuffer(key: string, buffer: Buffer, mimeType: string): Promise<string>;
  downloadBuffer(key: string): Promise<Buffer>;
  deleteObject(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}

class S3StorageService implements StorageService {
  private client: S3Client;
  private bucket: string;
  private publicDomain: string;

  constructor() {
    this.bucket = env.R2_BUCKET_NAME;
    this.publicDomain = env.R2_PUBLIC_DOMAIN;

    const endpoint = env.STORAGE_PROVIDER === 'r2' && env.R2_ACCOUNT_ID
      ? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : undefined;

    this.client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY
        ? {
            accessKeyId: env.R2_ACCESS_KEY_ID,
            secretAccessKey: env.R2_SECRET_ACCESS_KEY,
          }
        : undefined,
    });
  }

  async getPresignedUploadUrl(key: string, mimeType: string, expiresInSeconds = 900): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async uploadBuffer(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      })
    );
    return this.getPublicUrl(key);
  }

  async downloadBuffer(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
    const byteArray = await response.Body?.transformToByteArray();
    if (!byteArray) {
      throw new Error(`Empty body returned for object ${key}`);
    }
    return Buffer.from(byteArray);
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }

  getPublicUrl(key: string): string {
    return `${this.publicDomain.replace(/\/$/, '')}/${key.replace(/^\//, '')}`;
  }
}

class LocalStorageService implements StorageService {
  private uploadDir: string;
  private publicBaseUrl: string;

  constructor() {
    this.uploadDir = path.resolve(process.cwd(), 'uploads');
    this.publicBaseUrl = env.R2_PUBLIC_DOMAIN || 'http://localhost:3001/uploads';
    fs.mkdir(this.uploadDir, { recursive: true }).catch((err) =>
      logger.error('Failed to create local uploads folder', err)
    );
  }

  async getPresignedUploadUrl(key: string, _mimeType: string): Promise<string> {
    // For local dev, direct endpoint on the server
    return `${env.FRONTEND_ORIGIN}/api/mock-upload?key=${encodeURIComponent(key)}`;
  }

  async uploadBuffer(key: string, buffer: Buffer, _mimeType = 'application/octet-stream'): Promise<string> {
    const filePath = path.join(this.uploadDir, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
    return this.getPublicUrl(key);
  }

  async downloadBuffer(key: string): Promise<Buffer> {
    const filePath = path.join(this.uploadDir, key);
    return fs.readFile(filePath);
  }

  async deleteObject(key: string): Promise<void> {
    const filePath = path.join(this.uploadDir, key);
    try {
      await fs.unlink(filePath);
    } catch {
      // Ignore if file already deleted
    }
  }

  getPublicUrl(key: string): string {
    return `${this.publicBaseUrl.replace(/\/$/, '')}/${key.replace(/^\//, '')}`;
  }
}

export const storage: StorageService =
  env.STORAGE_PROVIDER === 'local' || !env.R2_ACCESS_KEY_ID
    ? new LocalStorageService()
    : new S3StorageService();
