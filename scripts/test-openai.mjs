#!/usr/bin/env node
import OpenAI from 'openai';

const MODEL = 'gpt-5-mini-2025-08-07';
const key = process.env.OPENAI_KEY;
if (!key) {
  console.error('ERROR: OPENAI_KEY environment variable is not set.');
  console.error('Set it and re-run: OPENAI_KEY=your_key pnpm run test-openai -- playbyplay');
  process.exit(1);
}

const client = new OpenAI({ apiKey: key });
const mode = process.argv[2] || 'playbyplay';

async function runPlaybyplay() {
  const title = '何系の学部ですか？';
  const choices = [
    { text: '情報系', votes: 7 },
    { text: '法学', votes: 3 },
  ];
  const total = choices.reduce((s, c) => s + (c.votes || 0), 0) || 0;
  const lines = choices.map(c => `- ${c.text}: ${Math.round(((c.votes||0)/total)*100)}%`).join('\n');
  const prompt = `あなたは司会のリンカです。以下のアンケートのタイトルと各選択肢の割合を参照して、短く（2〜3文）日本語で実況を作ってください。主要結果を先に述べ、接戦なら「接戦」と表現してください。\nタイトル: ${title}\n${lines}`;

  console.log('--- Prompt ---');
  console.log(prompt);
  console.log('--- Response ---');

  const res = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 150,
    temperature: 0.6,
  });

  console.log(res.choices?.[0]?.message?.content ?? '(no content)');
}

async function runComment() {
  const title = '何色が好き？';
  const choiceText = '赤';
  const prompt = `あなたはナノすけです。アンケートのタイトル: "${title}" に対して、ユーザーが選んだ選択肢: "${choiceText}" に合わせた親しみやすい短い日本語コメント（1文）を返してください。`;

  console.log('--- Prompt ---');
  console.log(prompt);
  console.log('--- Response ---');

  const res = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 80,
    temperature: 0.8,
  });

  console.log(res.choices?.[0]?.message?.content ?? '(no content)');
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
