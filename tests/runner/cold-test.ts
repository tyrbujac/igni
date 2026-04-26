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

import { spawnSync, spawn } from 'node:child_process';
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
  parallel: boolean;
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
  --parallel         Run providers concurrently (within-provider stays
                     sequential for rate-limit safety). 4-model panels
                     typically hit ~3 concurrent pipelines (anthropic +
                     openai + google). Speeds iteration ~3-4×. NOT recom-
                     mended for canonical ship-validation runs (Stage 0 /
                     Stage 3) — sequential default keeps request ordering
                     deterministic for dissertation reproducibility.

Provider routing (matches run.ts):
  claude-*        → anthropic   (--thinking applies)
  gpt-*, o[134]-* → openai      (--effort applies)
  gemini-*        → google      (--thinking applies)
  gemma*, ...     → ollama      (neither applies)

After all runs complete, prints a summary table: per cell transpile
status, optional grep count, cost. Sequential execution by default
(rate-limit-safe + deterministic for canonical runs). --parallel groups
models by provider and runs cross-provider concurrent, within-provider
sequential.
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
    parallel: false,
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
    else if (a === '--parallel') args.parallel = true;
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

// Sequential mode (canonical for ship-validation): per v0.13/v0.14/v0.15.0
// precedent. stdio: 'inherit' streams output live for terminal observability.
function runSequential(args: Args): void {
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
}

// Parallel mode: groups models by provider, runs cross-provider concurrent +
// within-provider sequential. Conservative w.r.t. Gemini rate limits (two
// gemini-* models in the default panel run sequentially within their group).
// Output is captured per-model and printed on each model's completion (no
// interleaving). Speeds iteration ~3-4× for the typical 4-model panel.
//
// NOTE: parallelism breaks request-completion ordering. NOT recommended for
// canonical ship-validation runs whose outputs get cited in dissertation
// methodology — sequential mode keeps the order deterministic. Use --parallel
// for iterative work (Stage 2 panels mid-design, A/B variants), sequential
// for v<X>-stage0/v<X>-stage3 ship validation.
function runOneModel(args: Args, model: string): Promise<void> {
  return new Promise((resolveP, reject) => {
    const provider = inferProviderFromModel(model);
    const runArgs = buildRunArgs(args, model);
    const startedAt = Date.now();
    console.log(`[${model}] starting (${provider})`);
    const child = spawn('npx', runArgs, { cwd: HERE });
    let buffer = '';
    child.stdout.on('data', d => { buffer += d.toString(); });
    child.stderr.on('data', d => { buffer += d.toString(); });
    child.on('close', code => {
      const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
      if (code !== 0) {
        console.error(`[${model}] FAIL (exit ${code}) after ${elapsed}s`);
        process.stderr.write(buffer);
        reject(new Error(`${model} exited ${code}`));
        return;
      }
      console.log(`[${model}] done in ${elapsed}s`);
      // Print buffered output indented for clarity. The terminal already
      // shows interleaved start/done markers so we know which output is
      // whose; the indent is a visual separator.
      for (const line of buffer.split('\n')) {
        if (line) console.log(`  ${line}`);
      }
      console.log('');
      resolveP();
    });
    child.on('error', reject);
  });
}

async function runParallel(args: Args): Promise<void> {
  // Group models by provider — within-provider stays sequential to avoid
  // hitting per-provider rate limits (especially Gemini). Cross-provider
  // groups run concurrently via Promise.all.
  const byProvider = new Map<string, string[]>();
  for (const model of args.models) {
    const provider = inferProviderFromModel(model);
    if (!byProvider.has(provider)) byProvider.set(provider, []);
    byProvider.get(provider)!.push(model);
  }
  console.log(`=== parallel mode: ${byProvider.size} provider groups, ${args.models.length} cells total ===\n`);
  for (const [provider, models] of byProvider) {
    console.log(`  ${provider}: ${models.join(', ')}`);
  }
  console.log('');

  const groupPromises = Array.from(byProvider.values()).map(async (models) => {
    for (const model of models) {
      await runOneModel(args, model);
    }
  });
  await Promise.all(groupPromises);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  console.log(`cold-test — ${args.models.length} models × prompts (${basename(args.prompts)})`);
  console.log(`  panel: ${args.models.join(', ')}`);
  console.log(`  out:   ${args.out}`);
  console.log(`  mode:  ${args.parallel ? 'parallel (per-provider grouped)' : 'sequential (canonical)'}\n`);

  if (args.parallel) {
    await runParallel(args);
  } else {
    runSequential(args);
  }

  printSummary(args);
}

main().catch(err => {
  console.error('cold-test failed:', err.message);
  process.exit(1);
});
