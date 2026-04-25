#!/usr/bin/env tsx
// Summarise a panel-output dir into a draft Stage3 / spec-critique summary.
// Reads all .md files in <panel-output-dir>, sends them + the original prompt
// to Opus 4.7 with thinking, writes a draft markdown summary that the human
// reviews and edits before promoting to docs/private/.
//
// Per the cycle (docs/cycle.md), this automates stage 8 (synthesis).
// Hand-synthesis remains the dissertation-citable form; this output is a
// starting point, not a publication artefact.
//
// Usage:
//   npx tsx summarize.ts <panel-output-dir> [options]

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE_INIT = dirname(fileURLToPath(import.meta.url));
for (const candidate of [join(HERE_INIT, '.env'), resolve('.env')]) {
  if (existsSync(candidate)) {
    try { (process as any).loadEnvFile(candidate); } catch {}
  }
}

import { AnthropicProvider } from './providers/anthropic.js';
import { computeCost } from './providers/pricing.js';

type Args = {
  outputDir: string;
  out: string | null;
  model: string;
  thinking: number;
  prompts: string | null;
};

function die(msg: string): never {
  console.error(`error: ${msg}`);
  process.exit(1);
}

function usage(): void {
  console.log(`
summarize — draft a Stage3_Summary / spec-critique summary from panel outputs

Usage:
  npx tsx summarize.ts <panel-output-dir> [options]

<panel-output-dir> is typically tests/v<X.Y.Z>-<stage>/outputs/.

Default behaviour: read all .md files, find the prompts.md alongside (one
directory up), produce a draft at <panel-output-dir>/Summary.draft.md.

Options:
  --out <file>     Write to a custom path (default: <output-dir>/Summary.draft.md)
  --model <id>     Synthesis model (default: claude-opus-4-7)
  --thinking <n>   Thinking budget tokens (default: 8000)
  --prompts <path> Override the prompts.md location

Caveats:
  - Hand-synthesis is the dissertation-citable form. This output is a
    DRAFT for review and editing.
  - The synthesis prompt biases what the LLM extracts. Worth keeping the
    prompt under version control so future-Tyr can audit how summaries
    were generated.

Cost: ~$0.05–0.15/run (one Opus thinking call).
`);
}

function parseArgs(argv: string[]): Args {
  let outputDir = '';
  const args: Args = {
    outputDir: '',
    out: null,
    model: 'claude-opus-4-7',
    thinking: 8000,
    prompts: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i] ?? die(`missing value for ${a}`);
    if (a === '--out') args.out = next();
    else if (a === '--model') args.model = next();
    else if (a === '--thinking') args.thinking = Number(next());
    else if (a === '--prompts') args.prompts = next();
    else if (a === '--help' || a === '-h') { usage(); process.exit(0); }
    else if (!a.startsWith('--') && !outputDir) outputDir = a;
    else die(`unknown arg: ${a}`);
  }
  if (!outputDir) { usage(); process.exit(1); }
  args.outputDir = resolve(outputDir);
  return args;
}

const SYNTHESIS_PROMPT_TEMPLATE = `You are synthesising N model responses to the same prompt into a structured DRAFT summary.

Below: (1) the original prompt sent to the panel, then (2) the N model responses, each delimited by a marker.

Produce a markdown summary with these sections:

1. **Convergent findings** — for each substantive issue, recommendation, or claim where ≥2 models agree, summarise it and name which models converged. Quote 1–2 sentences verbatim where a model is sharpest. If models disagree on the same point, that's signal — capture both sides rather than picking one.

2. **Single-model raises** — observations made by exactly one model. Worth recording even if not actionable now; future panels may reproduce.

3. **Suggested action items** — concrete things this synthesis suggests. Be conservative; only list items the panel's signal supports.

4. **Methodology notes** — anything about the panel itself worth flagging (e.g. one model failed transpile for unrelated reasons, model X explicitly cited prior project context, cost/token observations, output-shape variance).

Style:
- Concise prose, but preserve real evidence. Direct quotes are valuable.
- This is a DRAFT for human review. Preserve nuance and disagreements rather than resolving them.
- Match the shape of the project's existing Stage3_Summary.md and spec-critique reports — those are tone references.

---ORIGINAL PROMPT---

`;

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (!existsSync(args.outputDir)) die(`directory not found: ${args.outputDir}`);
  const mdFiles = readdirSync(args.outputDir)
    .filter(f => f.endsWith('.md'))
    .filter(f => !f.toLowerCase().includes('summary'));
  if (mdFiles.length === 0) die(`no model-response .md files found in ${args.outputDir}`);

  const promptsPath = args.prompts
    ? resolve(args.prompts)
    : join(dirname(args.outputDir), 'prompts.md');
  if (!existsSync(promptsPath)) die(`prompts file not found: ${promptsPath} (use --prompts to override)`);

  const promptsText = readFileSync(promptsPath, 'utf-8');

  let synthesisInput = SYNTHESIS_PROMPT_TEMPLATE + promptsText + '\n\n---MODEL RESPONSES---\n\n';
  for (const file of mdFiles.sort()) {
    const md = readFileSync(join(args.outputDir, file), 'utf-8');
    synthesisInput += `### Response from ${file}\n\n${md}\n\n`;
  }

  console.log(`summarize — ${mdFiles.length} responses from ${basename(args.outputDir)}`);
  console.log(`  model:    ${args.model}`);
  console.log(`  thinking: ${args.thinking}`);
  console.log(`  → calling LLM...\n`);

  const provider = new AnthropicProvider();
  const result = await provider.call({
    spec: null,
    prompt: synthesisInput,
    model: args.model,
    maxTokens: 16384,
    thinkingBudget: args.thinking,
    effort: null,
  });

  const cost = computeCost(result.model_id, result.usage);
  const costStr = cost !== null ? `$${cost.toFixed(4)}` : '(no pricing)';

  const outPath = args.out ? resolve(args.out) : join(args.outputDir, 'Summary.draft.md');
  const header = `<!-- Generated by tests/runner/summarize.ts on ${new Date().toISOString().slice(0, 10)} -->
<!-- Source: ${basename(args.outputDir)} (${mdFiles.length} model responses) -->
<!-- Synthesis: ${result.model_id}, thinking=${args.thinking}, ${costStr}, ${result.duration_ms}ms -->
<!-- DRAFT — review and edit before any external use. Hand-synthesis is the citable form. -->

`;
  writeFileSync(outPath, header + result.raw_output);

  console.log(`  done. ${result.duration_ms}ms, in=${result.usage.input_tokens} out=${result.usage.output_tokens} ${costStr}`);
  console.log(`  → ${outPath}`);
}

main().catch(err => {
  console.error(err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});
