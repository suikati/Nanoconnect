import OpenAI from 'openai';
import { useRuntimeConfig } from '#imports';

export function getOpenAI() {
  // Prefer Nuxt runtime config on server; fall back to common env var names used by users/tests
  let key: string | undefined;
  try {
    const config = typeof useRuntimeConfig === 'function' ? useRuntimeConfig() : undefined;
    key = config?.private?.openaiApiKey || process.env.OPENAI_KEY || process.env.OPENAI_API_KEY;
  } catch (e) {
    key = process.env.OPENAI_KEY || process.env.OPENAI_API_KEY;
  }

  if (!key) throw new Error('OpenAI API key not configured. Set OPENAI_KEY or OPENAI_API_KEY or runtime config private.openaiApiKey.');
  return new OpenAI({ apiKey: key });
}
