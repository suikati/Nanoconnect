import { createHash } from 'crypto';
import { getOpenAI } from '../utils/openaiClient';
import type { PlaybyplayRequest, PlaybyplayResponse, CommentRequest, CommentResponse } from '../../types/openai';

const MODEL = 'gpt-5-nano-2025-08-07';

export function buildPlaybyplayPrompt(title: string, choices: { id?: string; text: string; votes?: number }[]) {
  const total = choices.reduce((s, c) => s + (c.votes || 0), 0) || 0;
  const lines = choices.map((c) => {
    const pct = total > 0 ? Math.round(((c.votes || 0) / total) * 100) : 0;
    return `- ${c.text}: ${pct}%`;
  });
  return `あなたは司会のリンカです。以下のアンケートタイトルと各選択肢の割合を参照し、まず主要な結果を1文で簡潔に日本語で述べてください。その後、2〜3文で盛り上げるための短い実況を作成してください。接戦の場合は「接戦」と明記してください。(例)タイトル：「何の果物が好き？」実況(出力)：「桃とレモンの接戦です！最後に勝つのは甘党か酸っぱ党か！」\nタイトル: ${title}\n${lines.join('\n')}`;
}

export function buildCommentPrompt(title: string, selectedText: string) {
  return `あなたはマスコットキャラクターのナノすけです。アンケートのタイトル: "${title}" に対して、ユーザーが選んだ選択肢: "${selectedText}" に合わせた親しみやすい短い日本語コメント（1文）を返してください。コメントの最後は「〜ナノ！」または「～ノ！」で締めてください。出力は必ず日本語の自然な文章で、内部の推論や思考過程は含めず、指定外の情報は記載しないでください。(例)タイトル：「何色が好き？」選択：「赤色」コメント(出力)：「情熱的ナノ！」`;
}
// Nuxt recommends using eventHandler()/fromNodeMiddleware() for server handlers.
// We provide both a default export wrapped with eventHandler and a named `handler` for tests.
import { eventHandler } from '#imports';

export async function handler(event: any) {
  // Read body (may be parsed object or raw string depending on runtime)
  let body: any = await (globalThis as any).readBody?.(event) ?? event?.body;

  // Debug: log raw event.body and initial body type/value for tracing 400 invalid_request
  try {
    console.debug('openai handler raw event.body:', event?.body);
    console.debug('openai handler initial body (before parse):', body, typeof body);
  } catch (e) {
    /* ignore */
  }

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
    // Try fallbacks for runtimes that expose raw request on different fields
    try {
      const maybeReq = event?.node?.req ?? event?.req ?? null;
      console.debug('openai handler attempting fallback read from event.node.req / event.req', maybeReq ? Object.keys(maybeReq) : null);
      let fallback: any = null;
      if (maybeReq) {
        fallback = maybeReq.body ?? maybeReq.rawBody ?? maybeReq._body ?? null;
      }
      console.debug('openai handler fallback raw value:', fallback, typeof fallback);
      // If fallback is not present but maybeReq is a readable stream (IncomingMessage), try to read it
      if ((!body || typeof body !== 'object') && maybeReq && typeof maybeReq.on === 'function') {
        try {
          const chunks: any[] = [];
          await new Promise<void>((resolve, reject) => {
            maybeReq.on('data', (c: any) => chunks.push(c));
            maybeReq.on('end', () => resolve());
            maybeReq.on('error', (err: any) => reject(err));
          });
          try {
            const buf = Buffer.concat(chunks.map((c: any) => (Buffer.isBuffer(c) ? c : Buffer.from(String(c)))));
            const rawStr = buf.toString('utf8');
            console.debug('openai handler read stream raw (truncated):', rawStr ? rawStr.slice(0, 1000) : rawStr);
            const parsed = JSON.parse(rawStr);
            if (parsed && typeof parsed === 'object') body = parsed;
          } catch (e) {
            /* ignore parse/read errors */
          }
        } catch (e) {
          /* ignore stream read failure */
        }
      }
      if (typeof fallback === 'string') {
        try {
          body = JSON.parse(fallback);
        } catch (e) {
          /* ignore */
        }
      } else if (fallback && typeof fallback === 'object') {
        body = fallback;
      }
    } catch (e) {
      /* ignore */
    }

    if (!body || typeof body !== 'object') {
      if (event?.node?.res) event.node.res.statusCode = 400;
      return { error: 'invalid_request' };
    }
  }

  // Distinguish request types by presence of fields
  const isComment = 'selectedChoice' in body;

  if (isComment) {
    const req = body as CommentRequest;
    // Log request body briefly for debugging (no secrets)
    try { console.debug('openai comment request', { title: req.title, selectedChoice: req.selectedChoice ? (typeof req.selectedChoice === 'string' ? req.selectedChoice.slice(0, 100) : '[object]') : req.selectedChoice }); } catch (e) { /* ignore */ }
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
  const prompt = buildPlaybyplayPrompt(req.title, req.choices);

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

// Default export wrapped with Nuxt's eventHandler to avoid implicit conversion warning
export default eventHandler(handler as any);
