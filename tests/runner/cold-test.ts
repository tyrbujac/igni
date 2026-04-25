#!/usr/bin/env tsx
// Multi-model panel runner — wraps run.ts to execute the same prompt set
// across N models sequentially, then prints a summary table. Used for
// stages 2 (design review), 6 (Stage 3), and 7 (post-ship spec critique)
// in the spec-iteration cycle (see docs/cycle.md).
//
// Usage:
//   npx tsx cold-test.ts --prompts <path> --out <dir> [options]
//
// Default panel: claude-opus-4-7, gpt-5.5, gemini-3.1-pro-preview,
// gemini-3.1-flash-lite-preview (matches v0.13.0 Stage 3 precedent).
//
// --thinking is routed to Anthropic + Google models; --effort to OpenAI.
// Flags inapplicable to a given model are dropped automatically.

import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, basename, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const RUN_TS = join(HERE, 'run.ts');

const DEFAULT_MODELS = [
  'claude-opus-4-7',
  'gpt-5.5',
  'gemini-3.1-pro-preview',
  'gemini-3.1-flash-lite-preview',
];

type Args = {
  prompts: string;
  out: string;
  models: string[];
  spec: string | null;
  noSpec: boolean;
  thinking: string | null;
  effort: string | null;
  maxTokens: string | null;
  noGrade: boolean;
  grep: string | null;
};

function die(msg: string): never {
  console.error(`error: ${msg}`);
  process.exit(1);
}

function usage(): void {
  console.log(`
cold-test — multi-model panel runner wrapping tests/runner/run.ts

Usage:
  npx tsx cold-test.ts --prompts <path> --out <dir> [options]

Required:
  --prompts <path>   Prompts markdown file
  --out <dir>        Output directory for results

Optional:
  --models <list>    Comma-separated model IDs. Default panel:
                     ${DEFAULT_MODELS.join(', ')}
  --spec <path>      Spec/cheatsheet file (passed to run.ts as --spec)
  --no-spec          Explicit no-spec mode (negative control)
  --thinking <n>     Token budget. Routed to Anthropic + Google only.
  --effort <bucket>  low|medium|high. Routed to OpenAI only.
  --max-tokens <n>   Output cap (default per run.ts).
  --no-grade         Skip transpile auto-grade (for prose-output prompts).
  --grep <pattern>   Regex; counts matches per output .md, prints in summary.
                     Use for adoption checks (e.g. --grep 'max_width:').

Provider routing (matches run.ts):
  claude-*        → anthropic   (--thinking applies)
  gpt-*, o[134]-* → openai      (--effort applies)
  gemini-*        → google      (--thinking applies)
  gemma*, ...     → ollama      (neither applies)

After all runs complete, prints a summary table: per cell transpile
status, optional grep count, cost. Sequential execution (rate-limit-safe).
`);
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    prompts: '',
    out: '',
    models: DEFAULT_MODELS,
    spec: null,
    noSpec: false,
    thinking: null,
    effort: null,
    maxTokens: null,
    noGrade: false,
    grep: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i] ?? die(`missing value for ${a}`);
    if (a === '--prompts') args.prompts = next();
    else if (a === '--out') args.out = next();
    else if (a === '--models') args.models = next().split(',').map(s => s.trim()).filter(Boolean);
    else if (a === '--spec') args.spec = next();
    else if (a === '--no-spec') args.noSpec = true;
    else if (a === '--thinking') args.thinking = next();
    else if (a === '--effort') args.effort = next();
    else if (a === '--max-tokens') args.maxTokens = next();
    else if (a === '--no-grade') args.noGrade = true;
    else if (a === '--grep') args.grep = next();
    else if (a === '--help' || a === '-h') { usage(); process.exit(0); }
    else die(`unknown arg: ${a}`);
  }
  if (!args.prompts || !args.out) { usage(); process.exit(1); }
  if (args.spec && args.noSpec) die('--spec and --no-spec are mutually exclusive');
  if (args.effort && !['low', 'medium', 'high'].includes(args.effort)) {
    die(`--effort must be low|medium|high, got "${args.effort}"`);
  }
  return args;
}

function inferProviderFromModel(model: string): 'anthropic' | 'openai' | 'google' | 'ollama' {
  const m = model.toLowerCase();
  if (m.startsWith('claude')) return 'anthropic';
  if (m.startsWith('gpt') || m.startsWith('o1') || m.startsWith('o3') || m.startsWith('o4')) return 'openai';
  if (m.startsWith('gemini')) return 'google';
  return 'ollama';
}

function buildRunArgs(args: Args, model: string): string[] {
  const provider = inferProviderFromModel(model);
  const runArgs = ['tsx', RUN_TS, '--model', model, '--prompts', args.prompts, '--out', args.out];
  if (args.spec) runArgs.push('--spec', args.spec);
  if (args.noSpec) runArgs.push('--no-spec');
  if (args.maxTokens) runArgs.push('--max-tokens', args.maxTokens);
  if (args.noGrade) runArgs.push('--no-grade');
  if (args.thinking && (provider === 'anthropic' || provider === 'google')) {
    runArgs.push('--thinking', args.thinking);
  }
  if (args.effort && provider === 'openai') {
    runArgs.push('--effort', args.effort);
  }
  return runArgs;
}

function printSummary(args: Args): void {
  const outDir = resolve(args.out);
  if (!existsSync(outDir)) {
    console.log('No output directory; nothing to summarise.');
    return;
  }
  const files = readdirSync(outDir).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    console.log('No JSON outputs to summarise.');
    return;
  }

  console.log('=== SUMMARY ===\n');
  const grepHeader = args.grep ? `grep `.padEnd(7) : '';
  console.log(`| ${'model_id'.padEnd(36)} | ${'prompt'.padEnd(34)} | tx | ${grepHeader}cost     |`);
  console.log(`|${'-'.repeat(38)}|${'-'.repeat(36)}|----|${args.grep ? '-'.repeat(7) : ''}----------|`);

  let totalCost = 0;
  let totalGrep = 0;
  for (const file of files.sort()) {
    const json = JSON.parse(readFileSync(join(outDir, file), 'utf-8'));
    const mdPath = join(outDir, file.replace('.json', '.md'));
    const md = existsSync(mdPath) ? readFileSync(mdPath, 'utf-8') : '';
    const tx = json.transpile?.passed === true ? '✓' : json.transpile?.passed === false ? '✗' : '—';
    let grepCell = '';
    if (args.grep) {
      const re = new RegExp(args.grep, 'g');
      const n = (md.match(re) ?? []).length;
      grepCell = `${n}`.padEnd(7);
      totalGrep += n;
    }
    const cost = json.cost_usd ?? 0;
    totalCost += cost;
    const promptName = String(json.prompt_slug ?? '').padEnd(34).slice(0, 34);
    const modelId = String(json.model_id ?? '').padEnd(36).slice(0, 36);
    console.log(`| ${modelId} | ${promptName} | ${tx}  | ${grepCell}$${cost.toFixed(4)} |`);
  }

  console.log(`\nTotal cost: $${totalCost.toFixed(4)} across ${files.length} cells`);
  if (args.grep) console.log(`Total ${args.grep} matches: ${totalGrep}`);
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  console.log(`cold-test — ${args.models.length} models × prompts (${basename(args.prompts)})`);
  console.log(`  panel: ${args.models.join(', ')}`);
  console.log(`  out:   ${args.out}\n`);

  for (let i = 0; i < args.models.length; i++) {
    const model = args.models[i];
    const provider = inferProviderFromModel(model);
    console.log(`=== [${i + 1}/${args.models.length}] ${model} (${provider}) ===`);
    const runArgs = buildRunArgs(args, model);
    const result = spawnSync('npx', runArgs, { stdio: 'inherit', cwd: HERE });
    if (result.status !== 0) {
      console.error(`\nrun.ts failed for ${model} (exit ${result.status})`);
      process.exit(result.status ?? 1);
    }
    console.log('');
  }

  printSummary(args);
}

main();
