import OpenAI from 'openai';

export function getOpenAI() {
  const config = useRuntimeConfig();
  const key = config.private.openaiApiKey || process.env.OPENAI_KEY;
  if (!key) throw new Error('OpenAI API key not configured');
  return new OpenAI({ apiKey: key });
}
