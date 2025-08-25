#!/usr/bin/env node
// Load .env in local environments (noop if dotenv not installed in some environments)
try {
  // eslint-disable-next-line no-eval
  await import('dotenv/config');
} catch (e) {
  // dotenv not installed — continue and rely on process.env
}
import OpenAI from 'openai';

const MODEL = 'gpt-5-mini-2025-08-07';
// Prefer explicit OPENAI_KEY, fall back to common variants
const key = process.env.OPENAI_KEY || process.env.OPENAI_API_KEY || process.env.openaiApiKey;
if (!key) {
  console.error('ERROR: OpenAI API key not found. Set environment variable OPENAI_KEY.');
  console.error('Example: OPENAI_KEY=sk-... pnpm run test-openai -- playbyplay');
  process.exit(1);
}

const client = new OpenAI({ apiKey: key });
// Determine mode from CLI args, ignore npm's `--` if present
const argv = process.argv.slice(2).filter(a => a !== '--');
const mode = argv[0] || 'playbyplay';

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception in test-openai:', err?.stack || err);
  process.exit(1);
});

async function runPlaybyplay() {
  const title = '何系の学部ですか？';
  const choices = [
    { text: '情報系', votes: 7 },
    { text: '法学', votes: 3 },
  ];
  const total = choices.reduce((s, c) => s + (c.votes || 0), 0) || 0;
  const lines = choices.map(c => `- ${c.text}: ${Math.round(((c.votes || 0) / total) * 100)}%`).join('\n');
  const prompt = `あなたは司会のリンカです。以下のアンケートのタイトルと各選択肢の割合を参照して、短く（2〜3文）日本語で実況を作ってください。主要結果を先に述べ、接戦なら「接戦」と表現してください。\nタイトル: ${title}\n${lines}`;

  console.log('--- Prompt ---');
  console.log(prompt);
  console.log('--- Response ---');

  const res = await client.responses.create({
    model: MODEL,
    input: prompt,
    text: { verbosity: 'low' },
    reasoning: { effort: 'minimal' },
  });

  const out = res.output_text ?? (res.output?.map(o => (o?.content?.map(c => c?.text ?? '').join(''))).join('\n')) ?? '(no content)';
  console.log(out);
}

async function runComment() {
  const title = '何色が好き？';
  const choiceText = '赤';
  const prompt = `あなたはマスコットキャラクターのナノすけです。アンケートのタイトル: "${title}" に対して、ユーザーが選んだ選択肢: "${choiceText}" に合わせた親しみやすい短い日本語コメント（1文）を返してください。`;

  console.log('--- Prompt ---');
  console.log(prompt);
  console.log('--- Response ---');

  const res = await client.responses.create({
    model: MODEL,
    input: prompt,
    text: { verbosity: 'low' },
    reasoning: { effort: 'minimal' },
  });

  const out = res.output_text ?? (res.output?.map(o => (o?.content?.map(c => c?.text ?? '').join(''))).join('\n')) ?? '(no content)';
  console.log(out);
}

async function main() {
  try {
    if (mode === 'comment') await runComment();
    else await runPlaybyplay();
  } catch (err) {
    console.error('OpenAI request failed:', err?.message ?? err);
    process.exit(1);
  }
}

main();
