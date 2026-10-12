import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  FRONTEND_ORIGIN: z.string().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/pixelprize?schema=public'),

  // Redis (Queue & Caching)
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Storage
  STORAGE_PROVIDER: z.enum(['r2', 's3', 'local']).default('local'),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().default('pixel-prize-media'),
  R2_PUBLIC_DOMAIN: z.string().default('http://localhost:3001/uploads'),

  // Auth
  AUTH_SECRET: z.string().default('default_pixel_prize_jwt_secret_key_32chars'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // AI Judging
  JUDGE_PROVIDER: z.enum(['gemini', 'custom_model', 'mock']).default('mock'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL_NAME: z.string().default('gemini-2.5-flash'),
  CUSTOM_MODEL_ENDPOINT: z.string().optional(),
  CUSTOM_MODEL_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables detected:', JSON.stringify(parsed.error.format(), null, 2));
  throw new Error('Environment configuration validation failed');
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = env.DATABASE_URL;
}
