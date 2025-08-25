import { describe, it, expect, vi } from 'vitest';
import { buildPlaybyplayPrompt, handler } from '../server/api/openai';
import * as client from '../server/utils/openaiClient';

// Helper to mock OpenAI client
function mockOpenAI(responseText: string) {
  return {
    responses: {
      create: async () => ({ output_text: responseText, model: 'mock-model' }),
    },
  } as any;
}

describe('openai API', () => {
  it('buildPlaybyplayPrompt includes percentages', () => {
    const prompt = buildPlaybyplayPrompt('好きな色は？', [
      { text: '赤', votes: 3 },
      { text: '青', votes: 1 },
    ]);

    expect(prompt).toContain('赤');
    expect(prompt).toContain('%');
    expect(prompt).toContain('タイトル: 好きな色は？');
  });

  it('handler returns early when total votes is zero', async () => {
    const fakeEvent = { body: { title: '何系の学部ですか？', choices: [{ text: '情報系', votes: 0 }, { text: '法学', votes: 0 }] } };
    const res = await handler(fakeEvent as any);
    expect(res.text).toBeDefined();
    expect(res.text).toMatch(/まだ投票/);
  });

  it('comment path calls OpenAI and returns generated text', async () => {
    // mock getOpenAI
    const spy = vi.spyOn(client, 'getOpenAI').mockImplementation(() => mockOpenAI('いいねナノ！'));
    try {
      // clear global cache
      (globalThis as any).__OPENAI_CACHE = new Map();
      const fakeEvent = { body: { title: '何色が好き？', selectedChoice: { text: '赤' } } };
      const res = await handler(fakeEvent as any);
      expect(res.text).toBe('いいねナノ！');
    } finally {
      spy.mockRestore();
    }
  });
});
