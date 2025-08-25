import OpenAI from 'openai';

export function getOpenAI() {
  // useRuntimeConfig is available in Nuxt server environment; in tests fallback to process.env
  let key: string | undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = (globalThis as any).useRuntimeConfig ? (globalThis as any).useRuntimeConfig() : undefined;
    key = config?.private?.openaiApiKey || process.env.OPENAI_KEY;
  } catch (e) {
    key = process.env.OPENAI_KEY;
  }

  if (!key) throw new Error('OpenAI API key not configured');
  return new OpenAI({ apiKey: key });
}
