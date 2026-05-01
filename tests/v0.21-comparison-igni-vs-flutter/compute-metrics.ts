#!/usr/bin/env tsx
// Phase 4 comparison-test metrics post-processor.
//
// Walks per-cell .md + .json + .compile.json outputs, computes:
//   - prompt_tokens         — input_tokens minus cheatsheet (Flutter: full input)
//   - cheatsheet_tokens     — Igni input_tokens − matching Flutter input_tokens
//                             (delta is the cheatsheet contribution; honest
//                             accounting per design-note §"Frozen metric set")
//   - output_tokens         — usage.output_tokens
//   - output_loc            — non-blank, non-comment lines of extracted code
//   - output_words          — whitespace-split tokens of extracted code
//   - wall_clock_seconds    — duration_ms / 1000
//   - compile_success       — from compile-check.ts sidecar
//
// Emits per-cell <stem>.metrics.json + aggregate metrics.csv.

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

type Framework = 'igni' | 'flutter';

type RunJson = {
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_tokens?: number;
    cache_read_tokens?: number;
  };
  duration_ms: number;
  cost_usd: number | null;
};

type CompileSidecar = {
  compile_success: boolean;
  compile_error: string | null;
  extracted_code: boolean;
};

type Cell = {
  framework: Framework;
  model: string;
  app: string;
  stem: string;
  baseDir: string;
};

type Metrics = {
  framework: Framework;
  model: string;
  app: string;
  prompt_tokens: number;
  cheatsheet_tokens: number;
  total_input_tokens: number;
  cache_creation_tokens: number;
  cache_read_tokens: number;
  output_tokens: number;
  output_loc: number;
  output_words: number;
  wall_clock_seconds: number;
  compile_success: boolean;
  extracted_code: boolean;
  cost_usd: number | null;
};

function discoverCells(dir: string, framework: Framework): Cell[] {
  if (!existsSync(dir)) return [];
  const tier = framework === 'igni' ? 'cheatsheet' : 'none';
  const sep = `_${tier}_`;
  return readdirSync(dir)
    .filter(f => f.endsWith('.json') && !f.endsWith('.compile.json') && !f.endsWith('.metrics.json'))
    .map(f => {
      const stem = f.slice(0, -5);
      const idx = stem.indexOf(sep);
      if (idx === -1) return null;
      return {
        framework,
        model: stem.slice(0, idx),
        app: stem.slice(idx + sep.length),
        stem,
        baseDir: dir,
      };
    })
    .filter((c): c is Cell => c !== null);
}

function extractCode(md: string, framework: Framework): string | null {
  const tagPattern = framework === 'igni'
    ? /```(?:igni)\s*\n([\s\S]*?)\n```/
    : /```(?:dart)\s*\n([\s\S]*?)\n```/;
  const tagged = md.match(tagPattern);
  if (tagged && tagged[1].trim()) return tagged[1];
  const anyFenced = md.match(/```[a-zA-Z0-9_-]*\s*\n([\s\S]*?)\n```/);
  if (anyFenced && anyFenced[1].trim()) return anyFenced[1];
  const trimmed = md.trim();
  if (!trimmed) return null;
  if (framework === 'igni') {
    if (/^screen\s+[A-Z]\w*/m.test(trimmed) || /^component\s+[A-Z]\w*/m.test(trimmed) || /^shared:\s*$/m.test(trimmed)) return trimmed;
  } else {
    if (/^\s*import\s+['"]package:flutter\/material\.dart['"]/m.test(trimmed) && /void\s+main\s*\(/.test(trimmed)) return trimmed;
  }
  return null;
}

function countLoc(code: string, framework: Framework): number {
  // Non-blank, non-comment lines. Mixed code+inline-comment counts as code.
  const commentMarker = framework === 'igni' ? '#' : '//';
  return code.split('\n').filter(line => {
    const trimmed = line.trim();
    if (trimmed === '') return false;
    if (trimmed.startsWith(commentMarker)) return false;
    return true;
  }).length;
}

function countWords(code: string): number {
  return code.split(/\s+/).filter(t => t.length > 0).length;
}

// True input cost includes everything sent to the model, regardless of how
// the provider classifies it for billing. For Anthropic with prompt caching,
// the cheatsheet lands in cache_creation_tokens (first cell) or
// cache_read_tokens (subsequent cells); usage.input_tokens only counts the
// non-cached portion. The dissertation question is "how big is the input the
// model has to consume," not "what did we pay" — so sum all three for the
// total. (Cost-side accounting is reported separately via cost_usd.)
function fullInputTokens(json: RunJson): number {
  const u = json.usage;
  return u.input_tokens + (u.cache_creation_tokens ?? 0) + (u.cache_read_tokens ?? 0);
}

function computeMetrics(cells: Cell[]): Metrics[] {
  // Index Flutter cells by (model, app) for cheatsheet-token delta computation.
  const flutterIndex = new Map<string, RunJson>();
  for (const cell of cells) {
    if (cell.framework !== 'flutter') continue;
    const json: RunJson = JSON.parse(readFileSync(join(cell.baseDir, `${cell.stem}.json`), 'utf8'));
    flutterIndex.set(`${cell.model}__${cell.app}`, json);
  }

  const results: Metrics[] = [];
  for (const cell of cells) {
    const json: RunJson = JSON.parse(readFileSync(join(cell.baseDir, `${cell.stem}.json`), 'utf8'));
    const md = readFileSync(join(cell.baseDir, `${cell.stem}.md`), 'utf8');
    const compilePath = join(cell.baseDir, `${cell.stem}.compile.json`);
    const compile: CompileSidecar = existsSync(compilePath)
      ? JSON.parse(readFileSync(compilePath, 'utf8'))
      : { compile_success: false, compile_error: 'compile-check not run', extracted_code: false };

    const code = extractCode(md, cell.framework);
    const output_loc = code ? countLoc(code, cell.framework) : 0;
    const output_words = code ? countWords(code) : 0;

    const totalInput = fullInputTokens(json);
    let cheatsheetTokens = 0;
    let promptTokens = totalInput;
    if (cell.framework === 'igni') {
      const flutterMatch = flutterIndex.get(`${cell.model}__${cell.app}`);
      if (flutterMatch) {
        const flutterTotal = fullInputTokens(flutterMatch);
        cheatsheetTokens = totalInput - flutterTotal;
        promptTokens = flutterTotal;
      } else {
        // Methodology limitation: no Flutter pair → can't separate.
        // Leave cheatsheet=0, prompt=full; flag in synthesis.
        cheatsheetTokens = 0;
        promptTokens = totalInput;
      }
    }

    results.push({
      framework: cell.framework,
      model: cell.model,
      app: cell.app,
      prompt_tokens: promptTokens,
      cheatsheet_tokens: cheatsheetTokens,
      total_input_tokens: totalInput,
      cache_creation_tokens: json.usage.cache_creation_tokens ?? 0,
      cache_read_tokens: json.usage.cache_read_tokens ?? 0,
      output_tokens: json.usage.output_tokens,
      output_loc,
      output_words,
      wall_clock_seconds: json.duration_ms / 1000,
      compile_success: compile.compile_success,
      extracted_code: compile.extracted_code,
      cost_usd: json.cost_usd,
    });
  }
  return results;
}

function emitCsv(metrics: Metrics[]): string {
  const cols: (keyof Metrics)[] = [
    'framework', 'model', 'app',
    'prompt_tokens', 'cheatsheet_tokens', 'total_input_tokens',
    'cache_creation_tokens', 'cache_read_tokens',
    'output_tokens', 'output_loc', 'output_words',
    'wall_clock_seconds', 'compile_success', 'extracted_code', 'cost_usd',
  ];
  const header = cols.join(',');
  const rows = metrics
    .sort((a, b) => `${a.app}/${a.framework}/${a.model}`.localeCompare(`${b.app}/${b.framework}/${b.model}`))
    .map(m => cols.map(c => {
      const v = m[c];
      if (v === null || v === undefined) return '';
      if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(3);
      if (typeof v === 'boolean') return v ? 'true' : 'false';
      return String(v);
    }).join(','));
  return [header, ...rows].join('\n') + '\n';
}

function median(nums: number[]): number {
  if (nums.length === 0) return NaN;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function printSummary(metrics: Metrics[]): void {
  const igni = metrics.filter(m => m.framework === 'igni');
  const flutter = metrics.filter(m => m.framework === 'flutter');
  const igniOutTok = igni.map(m => m.output_tokens);
  const flutOutTok = flutter.map(m => m.output_tokens);
  const igniLoc = igni.map(m => m.output_loc);
  const flutLoc = flutter.map(m => m.output_loc);
  const igniWords = igni.map(m => m.output_words);
  const flutWords = flutter.map(m => m.output_words);
  const igniPass = igni.filter(m => m.compile_success).length;
  const flutPass = flutter.filter(m => m.compile_success).length;

  const ratio = (a: number, b: number) => b > 0 ? (a / b).toFixed(3) : 'n/a';

  console.log('\n=== aggregate ===');
  console.log(`            ${'Igni'.padEnd(10)} ${'Flutter'.padEnd(10)} ${'Igni/Flut'.padEnd(10)} bar`);
  console.log(`out_tokens  ${String(median(igniOutTok)).padEnd(10)} ${String(median(flutOutTok)).padEnd(10)} ${ratio(median(igniOutTok), median(flutOutTok)).padEnd(10)} ≤ 0.500 (B1)`);
  console.log(`out_loc     ${String(median(igniLoc)).padEnd(10)} ${String(median(flutLoc)).padEnd(10)} ${ratio(median(igniLoc), median(flutLoc)).padEnd(10)} ≤ 0.400 (B2)`);
  console.log(`out_words   ${String(median(igniWords)).padEnd(10)} ${String(median(flutWords)).padEnd(10)} ${ratio(median(igniWords), median(flutWords)).padEnd(10)} ≤ 0.500 (B3)`);
  console.log(`compile %   ${(igni.length ? igniPass / igni.length * 100 : 0).toFixed(1).padEnd(10)} ${(flutter.length ? flutPass / flutter.length * 100 : 0).toFixed(1).padEnd(10)} delta=${(igni.length && flutter.length ? (igniPass / igni.length - flutPass / flutter.length) * 100 : 0).toFixed(1)}pp ≥ -10pp (B4)`);

  // Cheatsheet amortisation (B5)
  const cheatsheetMedian = median(igni.map(m => m.cheatsheet_tokens).filter(n => n > 0));
  const flutInputMedian = median(flutter.map(m => m.prompt_tokens));
  if (cheatsheetMedian > 0 && flutInputMedian > 0) {
    // Igni amortised cost per app (over N apps) = cheatsheet/N + prompt
    // Flutter cost per app = prompt
    // Breakeven: cheatsheet/N + prompt ≤ flutter_input. But prompt ≈ flutter_input for matched cells.
    // So Igni's input cost only matches Flutter's at N → ∞. Look at total cost (input + output) breakeven instead.
    const igniOutMed = median(igniOutTok);
    const flutOutMed = median(flutOutTok);
    // Per-app total: Igni = cheatsheet/N + prompt + igniOut; Flutter = prompt + flutOut
    // Breakeven: cheatsheet/N = flutOut - igniOut
    const outDelta = flutOutMed - igniOutMed;
    if (outDelta > 0) {
      const breakeven = cheatsheetMedian / outDelta;
      console.log(`\nB5 amortisation: cheatsheet ${cheatsheetMedian} tok / output-savings-per-app ${outDelta} tok = breakeven at ${breakeven.toFixed(1)} apps`);
    } else {
      console.log(`\nB5 amortisation: Igni's output is not smaller than Flutter's median — no breakeven.`);
    }
  }
}

function main(): void {
  const igniDir = join(HERE, 'igni');
  const flutterDir = join(HERE, 'flutter');
  const cells: Cell[] = [
    ...discoverCells(igniDir, 'igni'),
    ...discoverCells(flutterDir, 'flutter'),
  ];
  if (cells.length === 0) {
    console.log('No cells found in igni/ or flutter/. Run cold-test first.');
    process.exit(0);
  }

  console.log(`compute-metrics — ${cells.length} cells\n`);
  const metrics = computeMetrics(cells);

  // Per-cell sidecar
  for (let i = 0; i < cells.length; i++) {
    const m = metrics[i];
    const cell = cells[i];
    const sidecarPath = join(cell.baseDir, `${cell.stem}.metrics.json`);
    writeFileSync(sidecarPath, JSON.stringify(m, null, 2));
  }

  // Aggregate CSV
  const csvPath = join(HERE, 'metrics.csv');
  writeFileSync(csvPath, emitCsv(metrics));
  console.log(`  → ${basename(csvPath)} (${metrics.length} rows)`);

  printSummary(metrics);
}

main();
