#!/usr/bin/env tsx
// One-off: call OpenAI Responses API for gpt-5.5 with reasoning effort high.
// Mirrors the runner's output format (.md + .json) so synthesis pipeline stays uniform.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const THIS_DIR = dirname(fileURLToPath(import.meta.url));
for (const candidate of [join(THIS_DIR, '.env'), resolve('.env')]) {
  if (existsSync(candidate)) {
    try { process.loadEnvFile(candidate); } catch {}
  }
}

import OpenAI from 'openai';
import { parsePrompts } from './prompts.js';

const args = process.argv.slice(2);
function flag(name: string, def?: string): string | undefined {
  const i = args.indexOf(name);
  if (i < 0) return def;
  return args[i + 1];
}

const promptsPath = flag('--prompts');
const outDir = flag('--out');
const model = flag('--model', 'gpt-5.5')!;
const effort = (flag('--effort', 'high') ?? 'high') as 'low' | 'medium' | 'high';

if (!promptsPath || !outDir) {
  console.error('usage: --prompts <path> --out <dir> [--model gpt-5.5] [--effort high]');
  process.exit(1);
}

const content = readFileSync(promptsPath, 'utf8');
const prompts = parsePrompts(content);
if (prompts.length !== 1) {
  console.error(`expected 1 prompt, got ${prompts.length}`);
  process.exit(1);
}
const p = prompts[0];

mkdirSync(outDir, { recursive: true });

const client = new OpenAI();

console.log(`gpt-5.5 (responses API) — effort: ${effort}`);
console.log(`  prompt: ${p.title} (${p.slug})`);
console.log(`  out:    ${outDir}`);

const started = Date.now();
const stream = await client.responses.create({
  model,
  reasoning: { effort },
  input: [{ role: 'user', content: p.body }],
  stream: true,
});

let raw_output = '';
let usage: any = {};
let model_id = model;
let stop_reason = 'unknown';
let lastProgress = Date.now();

for await (const event of stream as any) {
  if (event.type === 'response.output_text.delta') {
    raw_output += event.delta ?? '';
  } else if (event.type === 'response.completed' || event.type === 'response.done') {
    const r = event.response;
    if (r) {
      usage = r.usage ?? {};
      model_id = r.model ?? model;
      stop_reason = r.status ?? 'completed';
    }
  } else if (event.type === 'response.failed' || event.type === 'response.incomplete') {
    stop_reason = event.type;
  }
  // periodic progress so the user sees we're alive
  if (Date.now() - lastProgress > 15000) {
    process.stderr.write(`  ... ${Math.round((Date.now() - started) / 1000)}s elapsed, ${raw_output.length} chars output\n`);
    lastProgress = Date.now();
  }
}
const duration_ms = Date.now() - started;

const slug = p.slug;
const baseName = `${model}_none_${slug}`;
const mdPath = join(outDir, `${baseName}.md`);
const jsonPath = join(outDir, `${baseName}.json`);

writeFileSync(mdPath, raw_output);

const meta = {
  provider: 'openai',
  api: 'responses',
  reasoning_effort: effort,
  requested_model: model,
  model_id,
  prompt_name: p.title,
  prompt_slug: p.slug,
  prompt_index: p.index,
  prompt_path: resolve(promptsPath),
  spec_path: null,
  spec_tier: 'none',
  spec_sha256: null,
  spec_words: 0,
  timestamp: new Date().toISOString(),
  duration_ms,
  stop_reason,
  usage: {
    input_tokens: usage.input_tokens ?? 0,
    output_tokens: usage.output_tokens ?? 0,
    reasoning_tokens: usage.output_tokens_details?.reasoning_tokens ?? 0,
    cache_read_tokens: usage.input_tokens_details?.cached_tokens ?? 0,
  },
  cost_usd: null,
  transpile: null,
};
writeFileSync(jsonPath, JSON.stringify(meta, null, 2));

console.log(`  in=${meta.usage.input_tokens} out=${meta.usage.output_tokens} reasoning=${meta.usage.reasoning_tokens} ${duration_ms}ms`);
console.log(`  → ${baseName}.md`);
