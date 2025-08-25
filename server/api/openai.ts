import { createHash } from 'crypto';
import { getOpenAI } from '../utils/openaiClient';
import type { PlaybyplayRequest, PlaybyplayResponse, CommentRequest, CommentResponse } from '../../types/openai';

const MODEL = 'gpt-5-mini-2025-08-07';

export function buildPlaybyplayPrompt(title: string, choices: { id?: string; text: string; votes?: number }[], tone?: string) {
  const total = choices.reduce((s, c) => s + (c.votes || 0), 0) || 0;
  const lines = choices.map((c) => {
    const pct = total > 0 ? Math.round(((c.votes || 0) / total) * 100) : 0;
    return `- ${c.text}: ${pct}%`;
  });
  return `あなたは司会のリンカです。以下のアンケートのタイトルと各選択肢の割合を参照して、短く（2〜3文）日本語で実況を作ってください。主要結果を先に述べ、接戦なら「接戦」と表現してください。tone=${tone || 'neutral'}\nタイトル: ${title}\n${lines.join('\n')}`;
}

export function buildCommentPrompt(title: string, selectedText: string) {
  return `あなたはナノすけです。アンケートのタイトル: "${title}" に対して、ユーザーが選んだ選択肢 "${selectedText}" に合わせた親しみやすい短い日本語コメント（1文）を返してください。`;
}
export async function handler(event: any) {
  let body: any = await (globalThis as any).readBody?.(event) ?? event?.body;

  // If body is a JSON string (some runtimes), try to parse it
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (err) {
      const e: any = err;
      if (event?.node?.res) event.node.res.statusCode = 400;
      return { error: 'invalid_json', detail: String(e?.message || e) };
    }
  }

  // Basic validation
  if (!body || typeof body !== 'object') {
    if (event?.node?.res) event.node.res.statusCode = 400;
    return { error: 'invalid_request' };
  }

  // Distinguish request types by presence of fields
  const isComment = 'selectedChoice' in body;

  if (isComment) {
    const req = body as CommentRequest;
    // Log request body briefly for debugging (no secrets)
    try { console.debug('openai comment request', { title: req.title, selectedChoice: req.selectedChoice ? (typeof req.selectedChoice === 'string' ? req.selectedChoice.slice(0,100) : '[object]') : req.selectedChoice }); } catch (e) { /* ignore */ }
    // Treat only undefined/null as missing; accept empty string and handle below
    if (!req.title || typeof req.selectedChoice === 'undefined' || req.selectedChoice === null) {
      if (event?.node?.res) event.node.res.statusCode = 400;
      return { error: 'missing_fields' } as CommentResponse;
    }

    const selectedText = typeof req.selectedChoice === 'string' ? req.selectedChoice : req.selectedChoice.text;
    if (!selectedText || String(selectedText).trim() === '') {
      return { text: 'いいチョイスナノ！', meta: { model: 'none' } } as CommentResponse;
    }

    // Cache comment responses to reduce cost
    const commentKeyBase = JSON.stringify({ title: req.title, selectedText });
    const commentCacheKey = createHash('sha256').update(commentKeyBase).digest('hex');
    (globalThis as any).__OPENAI_CACHE = (globalThis as any).__OPENAI_CACHE || new Map<string, any>();
    const cachedComment = (globalThis as any).__OPENAI_CACHE.get(commentCacheKey);
    if (cachedComment) return cachedComment;

    const client = getOpenAI();
    const prompt = buildCommentPrompt(req.title, String(selectedText));

    try {
        const result = await client.responses.create({
          model: MODEL,
          input: prompt,
          reasoning: { effort: 'minimal' },
          text: { verbosity: 'low' },
        });

        const text = result.output_text ?? (result.output?.map((o: any) => (o?.content?.map((c: any) => c?.text ?? '').join(''))).join('\n')) ?? 'ナノすけが少し眠いナノ…';
        const out = { text, meta: { model: result.model } } as CommentResponse;

        (globalThis as any).__OPENAI_CACHE.set(commentCacheKey, out);
        setTimeout(() => (globalThis as any).__OPENAI_CACHE.delete(commentCacheKey), 60 * 1000);

        return out;
    } catch (err: any) {
      console.error('openai comment error', err?.message || err);
      if (event?.node?.res) event.node.res.statusCode = 500;
      return { error: 'openai_error', detail: String(err?.message || err) };
    }
  }

  // Playbyplay path
  const req = body as PlaybyplayRequest;
  if (!req.title || !Array.isArray(req.choices)) {
    if (event?.node?.res) event.node.res.statusCode = 400;
    return { error: 'missing_fields' } as PlaybyplayResponse;
  }

  const totalVotes = req.choices.reduce((s, c) => s + (c.votes || 0), 0);
  if (totalVotes === 0) {
    // Avoid calling OpenAI when no votes have been cast
    return { text: 'まだ投票がありません。投票結果が出たら実況します！', meta: { model: 'none' } } as PlaybyplayResponse;
  }

  // Build cache key from title + choices ids + votes
  const keyBase = JSON.stringify({ title: req.title, choices: req.choices.map(c => ({ id: c.id, votes: c.votes })) });
  const cacheKey = createHash('sha256').update(keyBase).digest('hex');

  (globalThis as any).__OPENAI_CACHE = (globalThis as any).__OPENAI_CACHE || new Map<string, any>();
  const cached = (globalThis as any).__OPENAI_CACHE.get(cacheKey);
  if (cached) return cached;

  const client = getOpenAI();
  const prompt = buildPlaybyplayPrompt(req.title, req.choices, (req as PlaybyplayRequest).tone);

  try {
      const result = await client.responses.create({
        model: MODEL,
        input: prompt,
        reasoning: { effort: 'minimal' },
        text: { verbosity: 'low' },
      });

      const text = result.output_text ?? (result.output?.map((o: any) => (o?.content?.map((c: any) => c?.text ?? '').join(''))).join('\n')) ?? '';
      const out = { text, meta: { model: result.model } } as PlaybyplayResponse;

      (globalThis as any).__OPENAI_CACHE.set(cacheKey, out);
      setTimeout(() => (globalThis as any).__OPENAI_CACHE.delete(cacheKey), 30 * 1000);

      return out;
  } catch (err: any) {
    console.error('openai error', err?.message || err);
    if (event?.node?.res) event.node.res.statusCode = 500;
    return { error: 'openai_error', detail: String(err?.message || err) };
  }
}

// Default export for Nuxt and named export `handler` is already declared above
export default handler;
