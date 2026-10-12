import { env } from '../../config/env.js';
import { IJudgeAdapter } from './judge.interface.js';
import { GeminiJudgeAdapter } from './gemini.adapter.js';
import { CustomModelJudgeAdapter } from './custom-model.adapter.js';
import { MockJudgeAdapter } from './mock.adapter.js';
import { logger } from '../logger.js';

export function createJudgeAdapter(providerOverride?: 'gemini' | 'custom_model' | 'mock'): IJudgeAdapter {
  const provider = (providerOverride || env.JUDGE_PROVIDER).toLowerCase();

  switch (provider) {
    case 'gemini': {
      if (!env.GEMINI_API_KEY) {
        logger.warn('⚠️ GEMINI_API_KEY not configured. Falling back to MockJudgeAdapter.');
        return new MockJudgeAdapter();
      }
      logger.info('🤖 Initializing GeminiJudgeAdapter with model: ' + env.GEMINI_MODEL_NAME);
      return new GeminiJudgeAdapter(env.GEMINI_API_KEY, env.GEMINI_MODEL_NAME);
    }

    case 'custom_model': {
      const endpoint = env.CUSTOM_MODEL_ENDPOINT || 'http://localhost:8000/v1/evaluate';
      logger.info(`🧠 Initializing CustomModelJudgeAdapter connecting to endpoint: ${endpoint}`);
      return new CustomModelJudgeAdapter(endpoint, env.CUSTOM_MODEL_SECRET);
    }

    case 'mock':
    default: {
      logger.info('🧪 Initializing MockJudgeAdapter for local/testing evaluation');
      return new MockJudgeAdapter();
    }
  }
}

export const judgeAdapter = createJudgeAdapter();
