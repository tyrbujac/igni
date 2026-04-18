#!/usr/bin/env tsx
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const THIS_DIR_INIT = dirname(fileURLToPath(import.meta.url));
for (const candidate of [join(THIS_DIR_INIT, '.env'), resolve('.env')]) {
  if (existsSync(candidate)) {
    try { process.loadEnvFile(candidate); } catch {}
  }
}

import { parsePrompts, type Prompt } from './prompts.js';
import { transpileCheck, type TranspileResult } from './grade.js';
import { inferProvider, type Provider, type ProviderName, type ProviderResult } from './providers/types.js';
import { AnthropicProvider } from './providers/anthropic.js';
import { OpenAIProvider } from './providers/openai.js';
import { GoogleProvider } from './providers/google.js';
import { OllamaProvider } from './providers/ollama.js';
import { computeCost, MODEL_PINS } from './providers/pricing.js';

type Args = {
  spec: string | null;
  prompts: string;
  model: string;
  provider: ProviderName | null;
  out: string;
  promptIndex: number | null;
  dryRun: boolean;
  noGrade: boolean;
  maxTokens: number;
  thinkingBudget: number | null;
};

function parseArgs(argv: string[]): Args {
  const args: Partial<Args> = {
    spec: null,
    provider: null,
    promptIndex: null,
    dryRun: false,
    noGrade: false,
    maxTokens: 8192,
    thinkingBudget: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i] ?? die(`missing value for ${a}`);
    if (a === '--spec') args.spec = next();
    else if (a === '--no-spec') args.spec = null;
    else if (a === '--prompts') args.prompts = next();
    else if (a === '--model') args.model = next();
    else if (a === '--provider') args.provider = next() as ProviderName;
    else if (a === '--out') args.out = next();
    else if (a === '--prompt') args.promptIndex = Number(next());
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--no-grade') args.noGrade = true;
    else if (a === '--max-tokens') args.maxTokens = Number(next());
    else if (a === '--thinking') args.thinkingBudget = Number(next());
    else if (a === '--help' || a === '-h') { usage(); process.exit(0); }
    else die(`unknown arg: ${a}`);
  }
  if (!args.prompts || !args.out || !args.model) { usage(); process.exit(1); }
  const tb = args.thinkingBudget;
  if (tb != null && (!Number.isFinite(tb) || tb < 1024)) {
    die(`--thinking requires a number ≥ 1024 (Anthropic minimum)`);
  }
  return args as Args;
}

function usage() {
  console.log(`
igni test runner — multi-provider cold-test driver

Usage:
  tsx run.ts --prompts <path> --out <dir> --model <id> [--spec <path>] [options]

Required:
  --prompts <path>   Path to prompts markdown (## N. Title + blockquote format)
  --out <dir>        Output directory for <model>_<slug>.{md,json} pairs
  --model <id>       Model ID. Provider is inferred from the prefix.

Optional:
  --spec <path>      Path to spec file. Omit for negative-control (no spec) runs.
  --no-spec          Explicit "no spec" mode; spec_tier: "none" in the result.
  --provider <name>  Override provider inference.
                       anthropic | openai | google | ollama
  --prompt <n>       Run only prompt number n (1-indexed). Omit to run all.
  --no-grade         Skip the transpiler auto-grade step.
  --max-tokens <n>   Response max tokens (default: 8192). Auto-bumps if
                     --thinking needs headroom.
  --thinking <n>     Anthropic extended thinking budget in tokens (≥1024).
                     Suggested: 5000 default (regression), 10000 flagship runs,
                     16000+ only if stop_reason == max_tokens. Phase 1 showed
                     10k→5k cut cost ~40% with no visible code-quality loss.
                     Forces temperature=1. Other providers silently ignore.
                     Opus 4.7 context is 200k tokens by default — no flag needed.
  --dry-run          Parse prompts and print what would be sent; no API calls.

Environment:
  ANTHROPIC_API_KEY      Anthropic (Claude)
  OPENAI_API_KEY         OpenAI (GPT)
  GOOGLE_API_KEY         Google (Gemini)   — also GEMINI_API_KEY
  OLLAMA_URL             Ollama base URL    (default: http://localhost:11434)

Provider inference:
  claude-*        → anthropic
  gpt-*, o[134]-* → openai
  gemini-*        → google
  gemma*, llama*, qwen*, mistral*, phi*  → ollama
  otherwise       → pass --provider explicitly
`);
}

function die(msg: string): never {
  console.error(`error: ${msg}`);
  process.exit(1);
}

function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex');
}

function inferSpecTier(specPath: string | null): string {
  if (!specPath) return 'none';
  const name = basename(specPath).toLowerCase();
  if (name.includes('micro')) return 'micro';
  if (name.includes('cheatsheet')) return 'cheatsheet';
  return 'full';
}

function makeProvider(name: ProviderName): Provider {
  switch (name) {
    case 'anthropic': return new AnthropicProvider();
    case 'openai': return new OpenAIProvider();
    case 'google': return new GoogleProvider();
    case 'ollama': return new OllamaProvider();
  }
}

const THIS_DIR = dirname(fileURLToPath(import.meta.url));
const TRANSPILER_CLI = resolve(THIS_DIR, '../../transpiler/src/cli.ts');

async function runOne(
  provider: Provider,
  spec: string | null,
  specPath: string | null,
  specTier: string,
  prompt: Prompt,
  promptPath: string,
  model: string,
  outDir: string,
  maxTokens: number,
  thinkingBudget: number | null,
  doGrade: boolean,
): Promise<void> {
  console.log(`  [${prompt.index}] ${prompt.title} (${prompt.slug})`);
  const result: ProviderResult = await provider.call({
    spec,
    prompt: prompt.body,
    model,
    maxTokens,
    thinkingBudget,
  });

  // Pin check — if the requested alias has a declared expected model_id in
  // MODEL_PINS, fail loudly on mismatch. Protects against silent endpoint
  // swaps on preview-status models (Google) and silent checkpoint swaps on
  // OpenAI. Aliases without pins are unchecked (opt-in).
  const expectedId = MODEL_PINS[result.requested_model];
  if (expectedId && result.model_id !== expectedId) {
    die(
      `model pin mismatch: requested alias "${result.requested_model}" resolved ` +
      `to model_id "${result.model_id}" but pin expects "${expectedId}". ` +
      `Endpoint may have silently swapped. Review tests/runner/providers/pricing.ts ` +
      `MODEL_PINS and update the pin if this is an intentional upgrade, or halt ` +
      `further runs against this alias until the provider's behaviour is confirmed.`
    );
  }

  let transpile: TranspileResult | null = null;
  if (doGrade) {
    transpile = transpileCheck(result.raw_output, TRANSPILER_CLI);
  }

  const modelSlug = model.replace(/[^a-z0-9.-]+/gi, '-').toLowerCase();
  const mdPath = join(outDir, `${modelSlug}_${specTier}_${prompt.slug}.md`);
  const jsonPath = join(outDir, `${modelSlug}_${specTier}_${prompt.slug}.json`);

  const cost_usd = computeCost(result.model_id, result.usage);
  if (cost_usd === null) {
    console.warn(`      ! no pricing entry for model_id "${result.model_id}" — cost_usd will be null`);
  }

  const metadata = {
    provider: result.provider,
    requested_model: result.requested_model,
    model_id: result.model_id,
    prompt_name: prompt.title,
    prompt_slug: prompt.slug,
    prompt_index: prompt.index,
    prompt_path: promptPath,
    spec_path: specPath,
    spec_tier: specTier,
    spec_sha256: spec ? sha256(spec) : null,
    spec_words: spec ? spec.split(/\s+/).filter(Boolean).length : 0,
    timestamp: new Date().toISOString(),
    duration_ms: result.duration_ms,
    stop_reason: result.stop_reason,
    usage: result.usage,
    cost_usd,
    transpile,
  };

  writeFileSync(mdPath, result.raw_output);
  writeFileSync(jsonPath, JSON.stringify(metadata, null, 2));

  const u = result.usage;
  const cacheNote = (u.cache_read_tokens ?? 0) > 0
    ? ` (cache hit: ${u.cache_read_tokens} toks)`
    : (u.cache_creation_tokens ?? 0) > 0
      ? ` (cache write: ${u.cache_creation_tokens} toks)`
      : '';
  const gradeNote = transpile
    ? transpile.passed
      ? ` ✓ transpiled (${transpile.igni_lines}L)`
      : transpile.extracted_code
        ? ` ✗ transpile failed`
        : ` — no code block`
    : '';
  console.log(`      in=${u.input_tokens} out=${u.output_tokens}${cacheNote} ${result.duration_ms}ms${gradeNote}`);
  console.log(`      → ${basename(mdPath)}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const providerName = args.provider ?? inferProvider(args.model);

  const promptPath = resolve(args.prompts);
  const outDir = resolve(args.out);
  const specPath = args.spec ? resolve(args.spec) : null;

  if (specPath && !existsSync(specPath)) die(`spec not found: ${specPath}`);
  if (!existsSync(promptPath)) die(`prompts not found: ${promptPath}`);
  if (!args.dryRun && !existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const spec = specPath ? readFileSync(specPath, 'utf8') : null;
  const specTier = inferSpecTier(specPath);
  const promptsFile = readFileSync(promptPath, 'utf8');
  const prompts = parsePrompts(promptsFile);
  if (prompts.length === 0) die(`no prompts parsed from ${promptPath}`);

  const selected = args.promptIndex
    ? prompts.filter(p => p.index === args.promptIndex)
    : prompts;
  if (selected.length === 0) {
    die(`prompt ${args.promptIndex} not found (have ${prompts.map(p => p.index).join(', ')})`);
  }

  console.log(`igni test runner${args.dryRun ? ' (dry run)' : ''}`);
  console.log(`  provider: ${providerName}`);
  console.log(`  model: ${args.model}`);
  console.log(`  spec: ${specPath ? `${basename(specPath)} (${specTier}, ${spec!.split(/\s+/).filter(Boolean).length} words)` : 'none (negative control)'}`);
  console.log(`  prompts: ${selected.length} of ${prompts.length} (${promptPath})`);
  console.log(`  out: ${outDir}`);
  console.log(`  grade: ${args.noGrade ? 'off' : 'on (transpile check)'}`);
  if (args.thinkingBudget) {
    if (providerName === 'anthropic') {
      console.log(`  thinking: ${args.thinkingBudget} tokens (extended, temperature=1)`);
    } else if (providerName === 'google') {
      console.log(`  thinking: ${args.thinkingBudget} tokens (thinkingBudget on generationConfig)`);
    } else {
      console.log(`  thinking: ${args.thinkingBudget} tokens (ignored — ${providerName} doesn't support it here)`);
    }
  }
  console.log();

  if (args.dryRun) {
    for (const p of selected) {
      console.log(`── [${p.index}] ${p.title} (${p.slug}) ──`);
      console.log(p.body);
      console.log(`── end [${p.slug}]  ${p.body.split(/\s+/).filter(Boolean).length} words ──\n`);
    }
    return;
  }

  const provider = makeProvider(providerName);
  for (const p of selected) {
    await runOne(provider, spec, specPath, specTier, p, promptPath, args.model, outDir, args.maxTokens, args.thinkingBudget, !args.noGrade);
  }
  console.log(`\ndone.`);
}

main().catch(err => {
  console.error(err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});
