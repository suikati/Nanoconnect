import { describe, it, expect } from 'vitest';
import { buildPlaybyplayPrompt, handler } from '../server/api/openai';

describe('openai API', () => {
  it('buildPlaybyplayPrompt includes percentages', () => {
    const prompt = buildPlaybyplayPrompt('好きな色は？', [
      { text: '赤', votes: 3 },
      { text: '青', votes: 1 },
    ], 'excited');

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
});
